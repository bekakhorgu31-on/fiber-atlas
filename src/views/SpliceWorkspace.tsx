import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Camera, ChevronDown, ExternalLink, ImagePlus, Printer, Search, Upload } from 'lucide-react';
import type { AssetRef, ClosurePhoto, ConnectionBankRow, ConnectionSheet, ConnectionSheetRow, Route, ViewProps } from '../domain/types';
import { connectionSheetsForNode } from '../domain/iteration22';
import reconciliationJson from '../data/iteration24-connection-reconciliation.json';
import { ITERATION24_IMPORT_DATE, ITERATION24_SOURCE_SHA256 } from '../domain/iteration24';
import { portOperationalView, portOperationalLabel } from '../domain/iteration28g';

const PHOTO_KEY = 'fiber-atlas-closure-photos-v1';
const pad = (value: number | null) => value == null ? '—' : String(value).padStart(2, '0');
const statusKa = { in_use: 'დაკავებულია / გამოიყენება', unused: 'არ გამოიყენება', reserved: 'დაჯავშნილია', unavailable: 'მიუწვდომელია', unknown: 'სტატუსი დაუდგენელია' } as const;
const companyName = (id: string) => ({ opennet: 'OpenNet', magti: 'Magti', silknet: 'Silknet', skytel: 'Skytel' }[id.toLowerCase()] ?? id);
type ChangeFilter = 'all' | 'number' | 'tube' | 'color' | 'termination' | 'unresolved' | 'changes';
const filters: Array<{ id: ChangeFilter; label: string }> = [
  { id: 'all', label: 'ყველა' }, { id: 'number', label: 'ნომერი შეიცვალა' },
  { id: 'tube', label: 'ტუბი შეიცვალა' }, { id: 'color', label: 'ჟილის ფერი შეიცვალა' },
  { id: 'termination', label: 'დასრულებული' },
  { id: 'unresolved', label: 'დაუდგენელი' }, { id: 'changes', label: 'ცვლილებები' },
];

function loadPhotos(): ClosurePhoto[] {
  try { return JSON.parse(sessionStorage.getItem(PHOTO_KEY) ?? '[]') as ClosurePhoto[]; } catch { return []; }
}
function savePhotos(photos: ClosurePhoto[]) {
  try { sessionStorage.setItem(PHOTO_KEY, JSON.stringify(photos)); } catch { /* visible session warning remains */ }
}

function identity(row: ConnectionBankRow) {
  return row.endpointType === 'cable_fiber' ? `F${pad(row.fiberNumber)}`
    : row.endpointType === 'unresolved' || row.endpointType === 'termination' ? '—' : `Port ${row.portNumber}`;
}

function ColorDot({ color, label }: { color: ConnectionBankRow['fiberColor']; label: string }) {
  return <i className="splice-color-dot" style={{ backgroundColor: color?.hex ?? '#d5dddb' }} title={`${label}: ${color?.nameKa ?? 'უცნობია'}`} />;
}

function BankCell({ row, side, selected, data }: { row: ConnectionBankRow; side: 'left' | 'right'; selected: boolean; data: ViewProps['data'] }) {
  const operational=row.portOwnerType&&row.portOwnerId&&row.portNumber?portOperationalView(data,row.portOwnerType,row.portOwnerId,row.portNumber,false):null;
  return <div className={`splice-bank-cell is-${side} port-status-${row.status}${selected ? ' is-selected' : ''}`}>
    <span className="splice-row-number">{identity(row)}</span>
    <ColorDot color={row.fiberColor} label="ჟილის ფერი" />
    <span className="splice-row-identity"><strong>{row.label}</strong><small>{row.endpointType === 'cable_fiber' ? `ტუბი ${row.tubeNumber ?? '—'} · ${row.tubeColor?.nameKa ?? 'ფერი უცნობია'} · ჟილა ${row.fiberColor?.nameKa ?? 'ფერი უცნობია'}` : statusKa[row.status]}</small></span>
    {row.organizationUseIds.length > 0 && <span className="splice-use">იყენებს: {row.organizationUseIds.map(companyName).join(', ')}</span>}
    {operational?.bindingId&&<span className="splice-use">{portOperationalLabel(operational)}</span>}
  </div>;
}

function ConnectionStroke({ row, selected }: { row: ConnectionSheetRow; selected: boolean }) {
  return <div className={`splice-connection is-${row.state}${selected ? ' is-selected' : ''}`} aria-label={`${row.left.label} to ${row.right.label}`}>
    {row.state !== 'termination' && <svg viewBox="0 0 180 34" preserveAspectRatio="none" aria-hidden="true"><line x1="0" y1="17" x2="180" y2="17" /></svg>}
    <span>{row.state === 'termination' ? 'მთავრდება' : row.state === 'unresolved' ? 'დაუზუსტებელი' : row.numberChanged ? `${pad(row.left.fiberNumber ?? row.left.portNumber)} → ${pad(row.right.fiberNumber ?? row.right.portNumber)}` : 'ზუსტი'}</span>
  </div>;
}

function SheetHeader({ bank }: { bank: ConnectionSheet['leftBank'] }) {
  return <header className="splice-bank-header"><strong>{bank.title}</strong><span>{bank.subtitle}</span>{bank.legacyCableId && <small>Legacy C{bank.legacyCableId}</small>}<small>Visio: {bank.sourceLabel ?? 'წყაროში ცალკე წარწერა არ არის'}</small></header>;
}

function focusMatches(row: ConnectionSheetRow, focus?: string) {
  if (!focus) return false;
  if (row.id === focus) return true;
  const [kind, id, value] = focus.split(':');
  const number = Number(value);
  if (kind === 'fiber') return [row.left, row.right].some(side => side.segmentId === id && side.fiberNumber === number);
  if (kind === 'port') return [row.left, row.right].some(side => side.portOwnerId === id && side.portNumber === number);
  return false;
}

function PhotoPanel({ closureId }: { closureId: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<ClosurePhoto[]>(loadPhotos);
  const closurePhotos = photos.filter(item => item.closureId === closureId);
  const addFiles = (files: FileList | null) => {
    if (!files?.length) return;
    [...files].forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = () => setPhotos(current => {
        const next: ClosurePhoto[] = [...current, {
          id: `PHOTO-${closureId}-${Date.now()}-${index}`, closureId, imageUrl: String(reader.result), capturedDate: null,
          caption: file.name, angleType: 'overview', note: '', isPrimary: !current.some(item => item.closureId === closureId), storageMode: 'session',
        }];
        savePhotos(next); return next;
      });
      reader.readAsDataURL(file);
    });
  };
  const makePrimary = (id: string) => setPhotos(current => {
    const next = current.map(item => item.closureId === closureId ? { ...item, isPrimary: item.id === id } : item);
    savePhotos(next); return next;
  });
  return <details className="splice-photo-panel"><summary><span><Camera size={16} /> ქუროს ფოტოები</span><ChevronDown size={16} /></summary><div>
    <p className="session-warning">ფოტოები მხოლოდ ამ ბრაუზერის სესიაში ინახება და მუდმივ ბაზაში არ გადაიცემა.</p>
    <input ref={input} hidden type="file" accept="image/*" multiple onChange={event => addFiles(event.target.files)} />
    <button className="button secondary" type="button" onClick={() => input.current?.click()}><ImagePlus size={16} /> ფოტოს დამატება</button>
    {closurePhotos.length > 0 && <div className="closure-photo-grid">{closurePhotos.map(photo => <figure className={photo.isPrimary ? 'is-primary' : ''} key={photo.id}><img src={photo.imageUrl} alt={photo.caption || `SC${closureId}`} /><figcaption><strong>{photo.caption || 'ქუროს ფოტო'}</strong><button type="button" disabled={photo.isPrimary} onClick={() => makePrimary(photo.id)}>{photo.isPrimary ? 'მთავარი ფოტო' : 'მთავარ ფოტოდ მონიშვნა'}</button></figcaption></figure>)}</div>}
  </div></details>;
}

export function SpliceWorkspace({ data, navigate, nodeKind, nodeId, relationshipId, focus }: ViewProps & { nodeKind: 'closure' | 'aggregation' | 'ap' | 'network_node'; nodeId: string; relationshipId?: string; focus?: string }) {
  const node = { kind: nodeKind, id: nodeId } as AssetRef;
  const sheets = connectionSheetsForNode(data, node);
  const initialSheet = sheets.find(item => item.id === relationshipId) ?? sheets.find(item => item.rows.some(row => focusMatches(row, focus))) ?? sheets[0];
  const [sheetId, setSheetId] = useState(initialSheet?.id ?? '');
  const sheet = sheets.find(item => item.id === sheetId) ?? initialSheet;
  const initialRow = sheet?.rows.find(row => focusMatches(row, focus));
  const [selectedId, setSelectedId] = useState(initialRow?.id ?? sheet?.rows[0]?.id ?? '');
  const [query, setQuery] = useState('');
  const [changeFilter, setChangeFilter] = useState<ChangeFilter>('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [showAllRelationships, setShowAllRelationships] = useState(false);
  const defaultGroup = sheet && Math.max(sheet.leftBank.capacity, sheet.rightBank.capacity) > 48 ? Math.floor(((initialRow?.left.fiberNumber ?? initialRow?.left.portNumber ?? 1) - 1) / 12) + 1 : 0;
  const [group, setGroup] = useState(defaultGroup);
  useEffect(() => {
    if (!sheet) return;
    const found = sheet.rows.find(row => focusMatches(row, focus));
    setSelectedId(found?.id ?? sheet.rows[0]?.id ?? '');
    setGroup(Math.max(sheet.leftBank.capacity, sheet.rightBank.capacity) > 48 ? Math.floor((((found?.left.fiberNumber ?? found?.left.portNumber) ?? 1) - 1) / 12) + 1 : 0);
  }, [sheet?.id, focus]);
  const visibleRows = useMemo(() => sheet?.rows.filter(row => {
    const leftNumber = row.left.fiberNumber ?? row.left.portNumber ?? 0;
    const groupMatch = group === 0 || leftNumber >= (group - 1) * 12 + 1 && leftNumber <= group * 12;
    const text = `${row.left.label} ${row.right.label} ${row.left.tubeNumber ?? ''} ${row.right.tubeNumber ?? ''}`.toLowerCase();
    const filterMatch = changeFilter === 'all'
      || changeFilter === 'number' && row.numberChanged
      || changeFilter === 'tube' && row.tubeChanged
      || changeFilter === 'color' && row.fiberColorChanged
      || changeFilter === 'termination' && row.state === 'termination'
      || changeFilter === 'unresolved' && (row.state === 'unresolved' || row.state === 'unmapped')
      || changeFilter === 'changes' && (row.numberChanged || row.tubeChanged || row.fiberColorChanged);
    const useIds = [...row.left.organizationUseIds, ...row.right.organizationUseIds];
    const companyMatch = companyFilter === 'all' || useIds.includes(companyFilter);
    return groupMatch && filterMatch && companyMatch && (!query.trim() || text.includes(query.trim().toLowerCase()));
  }) ?? [], [sheet, group, query, changeFilter, companyFilter]);
  const selected = sheet?.rows.find(row => row.id === selectedId) ?? visibleRows[0];
  if (!sheet) return <section className="splice-workspace"><button className="button secondary" onClick={() => history.back()}><ArrowLeft size={16} /> უკან</button><div className="empty-state"><h1>შეერთებების სქემა არ მოიძებნა</h1><p>ამ კვანძზე ზუსტი ლოკალური კავშირი მიმდინარე წყაროში არ არის.</p></div></section>;
  const maxCapacity = Math.max(sheet.leftBank.capacity, sheet.rightBank.capacity);
  const groups = Array.from({ length: Math.ceil(maxCapacity / 12) }, (_, index) => index + 1);
  const reconciliationNode = nodeKind === 'closure' || nodeKind === 'network_node' ? `SC${data.networkNodes?.find(item => item.id === nodeId)?.closureEvidence?.closureNumber ?? nodeId}` : nodeKind === 'aggregation' && nodeId === '5' ? 'AGG5' : nodeKind === 'ap' ? `AP${nodeId}` : 'LENTEKHI';
  const reconciliations = (reconciliationJson as { relationships: Array<{ nodeId: string; leftLegacySegmentId: string; rightLegacySegmentId: string; capacity: number; exact: number; intentionalTerminations: number; unresolved: number; otherRelationship: number; sourceConflicts: number; reconciled: boolean }> }).relationships.filter(item => item.nodeId === reconciliationNode);
  const openJourney = () => {
    const [focusKind,focusCable,focusNumber] = (focus ?? '').split(':');
    const sides = selected ? [selected.left,selected.right] : [];
    const leg = sides.find(side=>focusKind==='fiber' && side.segmentId===focusCable && side.fiberNumber===Number(focusNumber)) ?? sides.find(side=>side.segmentId && side.fiberNumber!=null);
    if (leg?.segmentId && leg.fiberNumber != null) navigate({view:'route',id:data.cableRoutes?.[0]?.id ?? sheet.routeId ?? '',selection:`fiber:${leg.segmentId}:${leg.fiberNumber}`});
  };  return <section className="splice-workspace">
    <div className="splice-titlebar"><button className="button secondary" type="button" onClick={() => navigate({ view: 'route', id: sheet.routeId ?? 'ROUTE-TSAGERI-LENTEKHI', selection: `${nodeKind}:${nodeId}` })}><ArrowLeft size={16} /> მარშრუტზე დაბრუნება</button><div><span>საინჟინრო რეჟიმი</span><h1>შეერთებების სქემა · {sheet.nodeLabel}</h1><p>ზუსტი ლოკალური კავშირები წყაროს გეომეტრიიდან</p></div><button className="button secondary" type="button" onClick={() => window.print()}><Printer size={16} /> ბეჭდვა / PDF</button></div>
    <nav className="splice-relationship-tabs" aria-label="კავშირების წყვილი"><button className={showAllRelationships ? 'is-active' : ''} type="button" onClick={() => setShowAllRelationships(true)}>ყველა შეერთება<small>{sheets.length} ურთიერთობა · {sheets.reduce((sum, item) => sum + item.rows.length, 0)} ჩანაწერი</small></button>{sheets.map(item => <button className={!showAllRelationships && item.id === sheet.id ? 'is-active' : ''} type="button" key={item.id} onClick={() => { setShowAllRelationships(false); setSheetId(item.id); navigate({ view: 'splice', nodeKind, nodeId, relationshipId: item.id }); }}>{item.relationshipLabel}<small>{item.rows.filter(row => row.state === 'exact').length} ზუსტი · {item.rows.filter(row => row.state === 'termination').length} დასრულებული · {item.rows.filter(row => row.state === 'unresolved').length} დაუზუსტებელი</small></button>)}</nav>
    {showAllRelationships && <section className="splice-completeness"><h2>კავშირების სისრულე</h2><table><thead><tr><th>ურთიერთობა</th><th>პოზიცია</th><th>ზუსტი</th><th>დასრულება</th><th>სხვა კავშირი</th><th>დაუდგენელი</th><th>კონფლიქტი</th></tr></thead><tbody>{reconciliations.length > 0 ? reconciliations.map(item => <tr key={`${item.leftLegacySegmentId}-${item.rightLegacySegmentId}`}><td>C{item.leftLegacySegmentId} ↔ C{item.rightLegacySegmentId}</td><td>{item.capacity}</td><td>{item.exact}</td><td>{item.intentionalTerminations}</td><td>{item.otherRelationship}</td><td>{item.unresolved}</td><td>{item.sourceConflicts}</td></tr>) : sheets.map(item => <tr key={item.id}><td>{item.relationshipLabel}</td><td>{Math.max(item.leftBank.capacity, item.rightBank.capacity)}</td><td>{item.rows.filter(row => row.state === 'exact').length}</td><td>0</td><td>—</td><td>{item.rows.filter(row => row.state !== 'exact').length}</td><td>0</td></tr>)}</tbody></table><p>თითოეული ჩანაწერის წყაროს საფუძველი ჩანს კონკრეტული ურთიერთობის გახსნისას.</p></section>}
    {!showAllRelationships && <><div className="splice-toolbar"><label><Search size={15} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="ჟილა ან პორტი…" /></label><select aria-label="ტუბი ან ჟილების ჯგუფი" value={group} onChange={event => setGroup(Number(event.target.value))}><option value={0}>ყველა ტუბი / ჯგუფი</option>{groups.map(value => <option value={value} key={value}>ტუბი / ჯგუფი {value} · {(value - 1) * 12 + 1}–{Math.min(value * 12, maxCapacity)}</option>)}</select><select aria-label="კომპანიის ფილტრი" value={companyFilter} onChange={event => setCompanyFilter(event.target.value)}><option value="all">ყველა კომპანია</option>{data.organizations.filter(org => (data.networkUseAssignments ?? []).some(use => use.organizationId === org.id)).map(org => <option value={org.id} key={org.id}>{org.name}</option>)}</select><span>{visibleRows.length} ჩანაწერი · {sheet.rows.filter(row => row.state === 'termination').length} დასრულებული · {sheet.rows.filter(row => row.state === 'unresolved').length} დაუზუსტებელი</span></div>
    <div className="splice-change-filters" aria-label="ცვლილების ფილტრი">{filters.map(item => <button type="button" className={changeFilter === item.id ? 'is-active' : ''} key={item.id} onClick={() => setChangeFilter(item.id)}>{item.label}</button>)}</div>
    <div className="splice-sheet" aria-label={`${sheet.nodeLabel} ${sheet.relationshipLabel}`}>
      <SheetHeader bank={sheet.leftBank} /><div className="splice-canvas-header">კავშირის მდგომარეობა<small>ხაზი ფერს არ იმეორებს</small></div><SheetHeader bank={sheet.rightBank} />
      {visibleRows.map(row => <button className={`splice-sheet-row${row.id === selected?.id ? ' is-selected' : ''}`} type="button" key={row.id} onClick={() => setSelectedId(row.id)}><BankCell data={data} row={row.left} side="left" selected={row.id === selected?.id} /><ConnectionStroke row={row} selected={row.id === selected?.id} /><BankCell data={data} row={row.right} side="right" selected={row.id === selected?.id} /></button>)}
      {!visibleRows.length && <div className="splice-no-rows">ამ ფილტრში კავშირი არ მოიძებნა.</div>}
    </div>
    <div className="splice-legend"><span className="is-exact">━ ზუსტი გადასვლა</span><span className="is-termination">● ცნობილი დასრულება</span><span className="is-unresolved">┄ დაუზუსტებელი გაგრძელება</span><span className="is-selected">━ არჩეული კავშირი</span></div>
    {selected && <aside className="splice-selection"><div><span>არჩეული კავშირი</span><h2>{selected.left.label} → {selected.right.label}</h2><p>{selected.evidenceLabel}</p><small className="source-fidelity-badge">წყაროს საფუძველი · {selected.evidenceLabel.toLowerCase().includes('owner') ? 'მფლობელის დადასტურება + წყარო' : selected.portTopologyBindingId ? 'წყაროს გეომეტრია / მარკერების გასწორება' : 'XML Connect / წყაროს გეომეტრია'}</small></div><dl><div><dt>ნომერი</dt><dd>{selected.numberChanged ? 'იცვლება' : 'უცვლელია'}</dd></div><div><dt>ტუბი</dt><dd>{selected.tubeChanged ? 'იცვლება' : 'უცვლელია'}</dd></div><div><dt>ჟილის ფერი</dt><dd>{selected.fiberColorChanged ? 'იცვლება' : 'უცვლელია'}</dd></div><div><dt>სტატუსი</dt><dd>{selected.state === 'exact' ? 'ზუსტი' : selected.state === 'termination' ? 'SC225-ზე მთავრდება' : 'დაუზუსტებელი'}</dd></div></dl>{(selected.left.segmentId || selected.right.segmentId) && <button className="button" type="button" onClick={openJourney}><ExternalLink size={16} /> სრული გზის ნახვა</button>}</aside>}
    </>}
    {nodeKind === 'closure' && <PhotoPanel closureId={nodeId} />}
    <details className="splice-source"><summary><Upload size={15} /> წყარო და შენიშვნები</summary><p>{sheet.source.file} · {sheet.source.page} · {sheet.source.shapeIds.join(', ')}</p>{sheet.source.shapeIds[0] && <button className="button secondary" type="button" onClick={() => navigate({ view: 'import', shapeId: sheet.source.shapeIds[0] })}>წყაროს მტკიცებულება · Shape {sheet.source.shapeIds[0]}</button>}{sheet.notes.map(note => <p key={note}>{note}</p>)}</details>
    <footer className="splice-print-meta">გენერაცია: {ITERATION24_IMPORT_DATE} · წყარო: Tsageri-Lentekhi 2025.vsdx · SHA-256 {ITERATION24_SOURCE_SHA256.slice(0, 12)}</footer>
  </section>;
}


