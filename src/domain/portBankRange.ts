type BankPort={id:string;number:number};
type BankBinding={portNumber:number;fiberNumber:number;segmentId:string};
type BankRangeInput={ports:BankPort[];fiberCount:number;fibers:Array<{number:number}>;bindings:BankBinding[];segmentId:string;anchorId:string;restorePortIds?:string[]};
type BankRangePlan={ready:true;rows:Array<{portId:string;portNumber:number;fiberNumber:number|null}>;mappedCount:number;untouchedCount:number;clearedCount:number}|{ready:false;reason:string};

/** Structural bounds only. Source identity and optical endpoint validation remain server/domain checks. */
export function planPortBankRange(input:BankRangeInput):BankRangePlan{
 const {fiberCount,segmentId,bindings}=input,ports=[...input.ports].sort((a,b)=>a.number-b.number),fibers=[...input.fibers].sort((a,b)=>a.number-b.number);
 const no=(reason:string):BankRangePlan=>({ready:false,reason});
 if(!ports.length||ports.length>256||new Set(ports.map(p=>p.id)).size!==ports.length||ports.some((p,i)=>p.number!==i+1))return no('AP ბანკის სრული, უნიკალური 1–N პორტების ნუმერაცია ვერ დადასტურდა.');
 if(!Number.isInteger(fiberCount)||fiberCount<1||fiberCount>ports.length||fibers.length!==fiberCount||fibers.some((f,i)=>f.number!==i+1))return no('კაბელს უნდა ჰქონდეს სრული, უნიკალური 1–N ჟილები და მათი რაოდენობა არ უნდა აღემატებოდეს AP პორტების რაოდენობას.');
 if(bindings.some(b=>!ports.some(p=>p.number===b.portNumber))||ports.some(p=>bindings.filter(b=>b.portNumber===p.number).length>1))return no('ბანკში არაერთმნიშვნელოვანი ან უცნობი პორტის მიბმაა. გამოიყენეთ ინდივიდუალური შესწორება.');
 if(bindings.some(b=>b.segmentId===segmentId&&(!Number.isInteger(b.fiberNumber)||b.fiberNumber<1||b.fiberNumber>fiberCount)))return no('არჩეული კაბელის არსებული მიბმა მის ჟილების დიაპაზონს სცდება.');
 const affected=new Set(ports.filter(p=>p.number<=fiberCount||bindings.some(b=>b.segmentId===segmentId&&b.portNumber===p.number)).map(p=>p.id));
 if(input.restorePortIds){
   const restoring=new Set(input.restorePortIds);
   if(restoring.size!==input.restorePortIds.length||input.restorePortIds.some(id=>!ports.some(p=>p.id===id))||[...affected].some(id=>!restoring.has(id)))return no('შენახული Remap ჯგუფი მიმდინარე ბანკს არ შეესაბამება.');
   for(const id of restoring)affected.add(id);
 }
 if(!affected.has(input.anchorId))return no('არჩეული პორტი კაბელის Remap დიაპაზონის გარეთაა. გახსენით ამ კაბელის 1–N პორტებიდან ერთ-ერთი.');
 if(bindings.some(b=>affected.has(ports.find(p=>p.number===b.portNumber)!.id)&&b.segmentId!==segmentId))return no('შესაცვლელ პორტზე სხვა კაბელია მიბმული. Remap ვერ ჩაანაცვლებს მას.');
 const rows=ports.filter(p=>affected.has(p.id)).map(p=>({portId:p.id,portNumber:p.number,fiberNumber:p.number<=fiberCount?p.number:null}));
 return {ready:true,rows,mappedCount:fiberCount,untouchedCount:ports.length-rows.length,clearedCount:rows.length-fiberCount};
}
