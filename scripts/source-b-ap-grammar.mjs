export const AP_GRAMMAR = 'source-b-purple-ap-block/1';
/** Shape Data and three corresponding graphical callouts, never an endpoint-number whitelist. */
export function evaluateAPGrammar(candidate) {
  const { group, children, properties } = candidate;
  const number = Number(properties.Row_1), capacity = Number(properties.Row_3), place = properties.Row_2?.trim();
  const checks = {
    group: group.parent_id == null && group.attributes?.Type === 'Group',
    purple: group.effective_style?.FillForegnd?.rgb?.toLowerCase() === '#cc99ff' && String(group.effective_style?.FillPattern?.value) === '1',
    number: Number.isInteger(number) && number > 0,
    capacity: Number.isInteger(capacity) && capacity > 0,
    place: !!place && !/^\d+$/.test(place),
    callouts: children.length === 3 && ['Row_1','Row_2','Row_3'].every(key => children.filter(c => c.text?.trim() === properties[key]?.trim() && c.callout === properties[key]).length === 1),
  };
  return { matched: Object.values(checks).every(Boolean), number, capacity, place, checks };
}
export function uniqueAlignment(observed, candidates, xTolerance, yTolerance) {
  const ranked = candidates.map(c => ({ ...c, dx: c.x-observed.x, dy: c.y-observed.y })).filter(c => Math.abs(c.dx) <= xTolerance && Math.abs(c.dy) <= yTolerance);
  return { certified: ranked.length === 1, selected: ranked.length === 1 ? ranked[0] : null, candidates: ranked };
}
