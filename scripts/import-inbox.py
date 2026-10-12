#!/usr/bin/env python3
"""Stable, SHA-first local VSDX inbox importer; never promotes an unreviewed topology."""
from __future__ import annotations
import argparse, datetime as dt, gzip, hashlib, json, os, shutil, subprocess, sys, time, uuid, zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IMPORTS = ROOT / "imports"
STATE = IMPORTS / "state"
VERSION = "fiber-atlas-inbox-importer/1"
EXTRACTOR = ROOT / "scripts" / "extract-vsdx.py"
ITERATION27_INTERPRETER = ROOT / "scripts" / "interpret-iteration27-source.py"
STAGES = ["queued", "reading", "extracting", "certifying", "interpreting", "reconciling", "ready", "failed"]
REQUIRED = {"[Content_Types].xml", "_rels/.rels", "visio/document.xml", "visio/_rels/document.xml.rels", "visio/pages/pages.xml"}

def now(): return dt.datetime.now(dt.timezone.utc).isoformat()
def sha(path: Path) -> str:
    h=hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda:f.read(1024*1024), b""): h.update(chunk)
    return h.hexdigest()
def atomic_json(path: Path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp=path.with_suffix(path.suffix+".tmp")
    tmp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    os.replace(tmp,path)
def set_stage(record, stage):
    record["stage"]=stage
    record.setdefault("stageHistory",[]).append({"stage":stage,"at":now()})
    atomic_json(STATE/"jobs"/(record["id"]+".json"),record)
def stable(path: Path, interval: float, timeout: float):
    deadline=time.monotonic()+timeout; prior=None; stable_since=None
    while time.monotonic() < deadline:
        try:
            st=path.stat(); current=(st.st_size,st.st_mtime_ns)
        except FileNotFoundError:
            current=None
        if current and current[0]>0:
            if current==prior:
                stable_since=stable_since or time.monotonic()
                if time.monotonic()-stable_since >= interval: return current
            else: prior=current; stable_since=None
        time.sleep(min(max(interval/3,0.1),0.5))
    raise TimeoutError(f"File did not stabilize before timeout: {path}")
def package_gate(path: Path):
    try:
        with zipfile.ZipFile(path) as z:
            bad=z.testzip()
            names=set(z.namelist())
            missing=sorted(REQUIRED-names)
            if bad: raise ValueError(f"Corrupt ZIP member: {bad}")
            if missing: raise ValueError(f"Required VSDX parts missing: {', '.join(missing)}")
            return {"zipValid":True,"requiredPartsPresent":True,"packageParts":len(names)}
    except (zipfile.BadZipFile, OSError) as exc: raise ValueError(f"Not a readable VSDX package: {exc}") from exc
def importer_catalog():
    path=STATE/"catalog.json"
    if not path.exists(): return {"schemaVersion":1,"sources":[]}
    return json.loads(path.read_text(encoding="utf-8"))
def source_records():
    records=list(importer_catalog()["sources"])
    for folder in ("processing","processed","archive"):
        for item in (IMPORTS/folder).glob("*/source-document.json"):
            try: records.append(json.loads(item.read_text(encoding="utf-8")))
            except (OSError,json.JSONDecodeError): continue
    return records
def known_sha(sha256: str):
    records=source_records()
    match=next((x for x in records if x.get("sha256")==sha256),None)
    if match: return match
    return None
def importVisioDocument(path: Path, *, stable_interval=1.0, stable_timeout=60.0, python=sys.executable):
    path=path.resolve(); IMPORTS.mkdir(parents=True,exist_ok=True); STATE.mkdir(parents=True,exist_ok=True)
    record={"id":"SRC-"+uuid.uuid4().hex,"filename":path.name,"absolutePath":str(path),"stage":"queued","stageHistory":[],"startedAt":now(),"importerVersion":VERSION,"status":"staged"}
    lock=IMPORTS/".import.lock"
    try: fd=os.open(lock,os.O_CREAT|os.O_EXCL|os.O_WRONLY)
    except FileExistsError:
        return {**record,"stage":"queued","status":"locked","error":"Another inbox scan/import is active."}
    try:
        os.write(fd,str(os.getpid()).encode()); os.close(fd); fd=None
        set_stage(record,"queued"); set_stage(record,"reading"); stable(path,stable_interval,stable_timeout)
        record.update({"sizeBytes":path.stat().st_size,"modifiedAt":dt.datetime.fromtimestamp(path.stat().st_mtime,dt.timezone.utc).isoformat(),"sha256":sha(path)})
        existing=known_sha(record["sha256"])
        if existing:
            staged=existing.get("stage")!="ready"
            record["status"]="already_staged" if staged else "already_imported"
            set_stage(record,"interpreting" if staged else "ready")
            record["existingSourceId"]=existing["id"]
            atomic_json(STATE/"jobs"/(record["id"]+".json"),record)
            return record
        catalog=importer_catalog()
        package=package_gate(path); record.update(package)
        revision=1+max((x.get("revision",0) for x in source_records() if x.get("filename")==path.name),default=0)
        record["revision"]=revision
        work=IMPORTS/"processing"/record["id"]; work.mkdir(parents=True,exist_ok=False)
        staged_source=work/path.name; shutil.copy2(path,staged_source)
        if sha(staged_source)!=record["sha256"]: raise ValueError("Source changed while being staged; retry after copy completes.")
        set_stage(record,"extracting")
        a=work/"run-a.raw.json.gz"; b=work/"run-b.raw.json.gz"
        summaries=[]
        for label,out in (("run-a",a),("run-b",b)):
            summary=work/f"{label}.summary.json"
            subprocess.run([python,str(EXTRACTOR),str(staged_source),str(out),"--summary",str(summary)],check=True,cwd=ROOT,capture_output=True,text=True)
            summaries.append(json.loads(summary.read_text(encoding="utf-8")))
        ah=sha(a); bh=sha(b)
        set_stage(record,"certifying")
        if ah!=bh: raise ValueError("Deterministic extraction gate failed: independent raw outputs differ.")
        s=summaries[0]["summary"]
        gates={"zipPackage":True,"extractorCompletedTwice":True,"deterministicRawOutput":True,"connectIntegrity":s.get("connect_rows_dangling")==0,"effectiveStylesResolved":s.get("unresolved_effective_colors")==0,"semanticInterpretation":False,"canonicalReconciliation":False}
        record.update({"rawArtifactSha256":ah,"summary":summaries[0],"certification":{"statement":"CERTIFIED FOR SOURCE PACKAGE AND GENERIC EXTRACTION; DOMAIN INTERPRETATION NOT YET CERTIFIED","gates":gates,"criticalLimitations":["Document-specific semantic interpretation and transition validation must pass before active network promotion."]},"status":"staged"})
        set_stage(record,"interpreting")
        # Select a source grammar only from explicit source evidence; names never establish source identity.
        probe=json.loads(gzip.open(a,"rt",encoding="utf-8").read())
        text_values={(shape.get("text") or "").strip() for page in probe.get("pages",[]) for shape in page.get("shapes",[])}
        if "169-206-216-48" in text_values and "ლენტეხი-ხელედის მიმართულება" in text_values:
            interpretation=work/"source-interpretation.json"
            subprocess.run([python,str(ITERATION27_INTERPRETER),str(a),str(interpretation)],check=True,cwd=ROOT,capture_output=True,text=True)
            parsed=json.loads(interpretation.read_text(encoding="utf-8"))
            record.update({"sourceGrammar":parsed["sourceGrammar"],"interpretationArtifact":str(interpretation),"interpretationSha256":sha(interpretation),"interpretationSummary":{"cableLabelCandidates":len(parsed["cableLabels"]),"directionEvidence":len(parsed["directionEvidence"]),"overlapCandidateStates":{k:v["state"] for k,v in parsed["overlapCandidates"].items()},"nodeLocalTransitions":parsed["fiberTopology"]["nodeLocalTransitions"]}})
            record["certification"]["gates"]["sourceCandidateInterpretation"] = True
            record["certification"]["gates"]["semanticInterpretation"] = False
            record["certification"]["criticalLimitations"].append("Source labels/overlap candidates were extracted, but document-specific construction, Ports, and local Fiber transitions remain uncertified.")
            record["certification"]["statement"] = "GENERIC EXTRACTION CERTIFIED; SOURCE CANDIDATE INTERPRETATION COMPLETE; SEMANTIC CERTIFICATION WITHHELD"
        # Keep candidate artifacts available for interpretation. It is deliberately not added to the active source catalog.
        candidate=IMPORTS/"processing"/record["id"]/"source-document.json"
        atomic_json(candidate,record)
        return record
    except Exception as exc:
        record.update({"status":"failed","error":str(exc),"failedAt":now()}); set_stage(record,"failed")
        fail=IMPORTS/"failed"/record["id"]; fail.mkdir(parents=True,exist_ok=True)
        if 'work' in locals() and work.exists():
            artifact_dir=fail/"artifacts"; shutil.move(str(work),str(artifact_dir))
        atomic_json(fail/"result.json",record)
        return record
    finally:
        if 'fd' in locals() and fd is not None: os.close(fd)
        try: lock.unlink()
        except FileNotFoundError: pass
def scanInbox(*,stable_interval=1.0,stable_timeout=60.0,python=sys.executable):
    inbox=IMPORTS/"inbox"; inbox.mkdir(parents=True,exist_ok=True)
    return [importVisioDocument(p,stable_interval=stable_interval,stable_timeout=stable_timeout,python=python) for p in sorted(inbox.glob("*.vsdx"),key=lambda p:p.name.casefold())]
def main():
    ap=argparse.ArgumentParser(); ap.add_argument("--watch",action="store_true"); ap.add_argument("--interval",type=float,default=3); ap.add_argument("--stable-seconds",type=float,default=1); ap.add_argument("--timeout",type=float,default=60); ap.add_argument("--python",default=sys.executable); args=ap.parse_args()
    while True:
        result=scanInbox(stable_interval=args.stable_seconds,stable_timeout=args.timeout,python=args.python)
        print(json.dumps(result,ensure_ascii=False,indent=2),flush=True)
        if not args.watch: break
        time.sleep(args.interval)
if __name__=="__main__": main()
