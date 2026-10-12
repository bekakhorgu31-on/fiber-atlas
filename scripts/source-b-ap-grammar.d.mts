export const AP_GRAMMAR:string;
export function evaluateAPGrammar(candidate:any): {matched:boolean;number:number;capacity:number;place:string;checks:Record<string,boolean>};
export function uniqueAlignment(observed:{x:number;y:number},candidates:any[],xTolerance:number,yTolerance:number):{certified:boolean;selected:any;candidates:any[]};
