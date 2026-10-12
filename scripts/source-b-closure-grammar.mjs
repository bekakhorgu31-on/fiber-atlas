export function parseCoordinatePair(rawText) {
  const dms = String.raw`(\d{1,3})\s*°\s*(\d{1,2})\s*['’′]\s*(\d{1,2}(?:\.\d+)?)\s*[\"”″]?\s*([EeWwNnSs])`;
  const match = new RegExp(`^\\s*${dms}\\s+${dms}\\s*$`).exec(rawText);
  if (!match) return null;
  const component = (degreesText, minutesText, secondsText, hemisphereText, allowed) => {
    const degrees = Number(degreesText), minutes = Number(minutesText), seconds = Number(secondsText), hemisphere = hemisphereText.toUpperCase();
    if (!allowed.includes(hemisphere) || minutes >= 60 || seconds >= 60) return null;
    const magnitude = degrees + minutes / 60 + seconds / 3600;
    const signed = hemisphere === 'W' || hemisphere === 'S' ? -magnitude : magnitude;
    const max = hemisphere === 'E' || hemisphere === 'W' ? 180 : 90;
    if (degrees > max || signed < -max || signed > max) return null;
    return { degrees, minutes, seconds, hemisphere, decimalDegrees: signed };
  };
  const longitude = component(match[1], match[2], match[3], match[4], ['E', 'W']);
  const latitude = component(match[5], match[6], match[7], match[8], ['N', 'S']);
  return longitude && latitude ? { longitude, latitude, crs: 'unknown' } : null;
}

export function evaluateClosureGrammar(input) {
  const closureNumber = /^\s*\d+\s*$/.test(input.numberText) ? Number(input.numberText.trim()) : null;
  const coordinates = parseCoordinatePair(input.coordinateText);
  const externalReference = /^\s*(GJS|GIS)\s*[-–]\s*([A-Za-z0-9._-]+)\s*$/.exec(input.externalReferenceText);
  const shapeDataBound = input.numberCalloutField === input.numberText
    && input.coordinateCalloutField === input.coordinateText
    && input.externalReferenceCalloutField === input.externalReferenceText;
  const expected = ['6', '7', '8'];
  const childSet = input.childMasterShapeIds;
  const checks = {
    topLevelGroup: input.isTopLevel && input.groupType === 'Group',
    ownerConfirmedMaster: input.masterId === '23' && input.masterShapeId === '5' && input.masterRootName === 'ქურო',
    greyBlockFill: input.fill?.toLowerCase() === '#bfbfbf',
    ownNumberProperty: closureNumber !== null,
    ownCoordinateProperty: !!coordinates,
    ownExternalReferenceProperty: !!externalReference,
    masterBoundNumberCoordinateAndReferenceLabels: shapeDataBound,
    completeExpectedChildSet: childSet.length === 3 && expected.every(id => childSet.includes(id)),
  };
  return { matched: Object.values(checks).every(Boolean), closureNumber, coordinates, externalReference, checks };
}
