export interface ParsedDmsCoordinate { degrees: number; minutes: number; seconds: number; hemisphere: 'E' | 'W' | 'N' | 'S'; decimalDegrees: number }
export interface ParsedCoordinatePair { longitude: Omit<ParsedDmsCoordinate, 'hemisphere'> & { hemisphere: 'E' | 'W' }; latitude: Omit<ParsedDmsCoordinate, 'hemisphere'> & { hemisphere: 'N' | 'S' }; crs: 'unknown' }
export interface ClosureGrammarInput {
  isTopLevel: boolean;
  groupType: string;
  masterId: string | null;
  masterShapeId: string | null;
  masterRootName: string | null;
  fill: string | null;
  numberText: string;
  coordinateText: string;
  externalReferenceText: string;
  numberCalloutField: string;
  coordinateCalloutField: string;
  externalReferenceCalloutField: string;
  childMasterShapeIds: string[];
}
export function parseCoordinatePair(rawText: string): ParsedCoordinatePair | null;
export function evaluateClosureGrammar(input: ClosureGrammarInput): {
  matched: boolean;
  closureNumber: number | null;
  coordinates: ParsedCoordinatePair | null;
  externalReference: RegExpExecArray | null;
  checks: Record<string, boolean>;
};
