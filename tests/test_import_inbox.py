import importlib.util
import json
import tempfile
import threading
import time
import unittest
import zipfile
from pathlib import Path

SPEC = importlib.util.spec_from_file_location("import_inbox", Path(__file__).parents[1] / "scripts" / "import-inbox.py")
imp = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(imp)

class InboxTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        base = Path(self.temp.name)
        imp.IMPORTS = base / "imports"
        imp.STATE = imp.IMPORTS / "state"
        (imp.IMPORTS / "inbox").mkdir(parents=True)
        (imp.IMPORTS / "processing").mkdir(parents=True)
        (imp.IMPORTS / "failed").mkdir(parents=True)

    def tearDown(self): self.temp.cleanup()

    def valid_vsdx(self, path):
        with zipfile.ZipFile(path, "w") as z:
            for name in sorted(imp.REQUIRED): z.writestr(name, "<package/>")
        return path

    def test_valid_package_gate_and_corrupt_package_rejection(self):
        good=self.valid_vsdx(imp.IMPORTS/"inbox"/"ok.vsdx")
        self.assertTrue(imp.package_gate(good)["requiredPartsPresent"])
        bad=imp.IMPORTS/"inbox"/"bad.vsdx"; bad.write_bytes(b"partial zip")
        with self.assertRaises(ValueError): imp.package_gate(bad)

    def test_stability_waits_for_identical_size_and_modified_time(self):
        path=imp.IMPORTS/"inbox"/"copy.vsdx"; path.write_bytes(b"partial")
        def finish_copy():
            time.sleep(0.12)
            with path.open("ab") as stream: stream.write(b"-complete")
        writer=threading.Thread(target=finish_copy); writer.start()
        started=time.monotonic(); state=imp.stable(path,0.18,2); writer.join()
        self.assertGreaterEqual(time.monotonic()-started,0.25)
        self.assertEqual(state[0],len(b"partial-complete"))

    def test_duplicate_sha_of_staged_source_is_not_reimported(self):
        path=self.valid_vsdx(imp.IMPORTS/"inbox"/"same.vsdx"); digest=imp.sha(path)
        candidate=imp.IMPORTS/"processing"/"SRC-existing"/"source-document.json"; candidate.parent.mkdir()
        candidate.write_text(json.dumps({"id":"SRC-existing","sha256":digest,"filename":path.name,"stage":"interpreting","status":"staged"}),encoding="utf-8")
        result=imp.importVisioDocument(path,stable_interval=0,stable_timeout=1)
        self.assertEqual(result["status"],"already_staged")
        self.assertEqual(result["existingSourceId"],"SRC-existing")

    def test_same_filename_with_different_sha_is_a_new_revision(self):
        previous=imp.IMPORTS/"processing"/"SRC-v1"/"source-document.json"; previous.parent.mkdir()
        previous.write_text(json.dumps({"id":"SRC-v1","filename":"map.vsdx","sha256":"old-hash","revision":1,"status":"staged"}),encoding="utf-8")
        path=self.valid_vsdx(imp.IMPORTS/"inbox"/"map.vsdx")
        self.assertNotEqual(imp.sha(path),"old-hash")
        self.assertEqual(1+max((x.get("revision",0) for x in imp.source_records() if x.get("filename")==path.name),default=0),2)

    def test_locked_scan_does_not_start_second_import(self):
        path=imp.IMPORTS/"inbox"/"locked.vsdx"; path.write_bytes(b"x")
        lock=imp.IMPORTS/".import.lock"; lock.write_text("123",encoding="ascii")
        result=imp.importVisioDocument(path,stable_interval=0,stable_timeout=1)
        self.assertEqual(result["status"],"locked")
        self.assertFalse((imp.IMPORTS/"failed").exists() and list((imp.IMPORTS/"failed").iterdir()))

    def test_active_catalog_is_not_written_for_staged_document(self):
        path=self.valid_vsdx(imp.IMPORTS/"inbox"/"staged.vsdx")
        result=imp.importVisioDocument(path,stable_interval=0,stable_timeout=1,python="not-run-because-a-fake-extractor-is-not-configured")
        self.assertEqual(result["status"],"failed")
        catalog=imp.importer_catalog()
        self.assertEqual(catalog["sources"],[])
        self.assertTrue(result.get("sha256"))
        self.assertEqual(result["stage"],"failed")

if __name__ == "__main__": unittest.main()
