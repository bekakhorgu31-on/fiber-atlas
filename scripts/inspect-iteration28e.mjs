import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
const raw=JSON.parse(gunzipSync(readFileSync('migration/iteration27/run-a/tsageri-alpana-tvishi.raw.json.gz')));
const shapes=raw.pages[0].shapes;
const hist=new Map();
for(const s of shapes){const c=s.effective_style?.LineColor?.rgb??'?';const p=s.effective_style?.LinePattern?.value??'?';const key=`${c}|${p}`;hist.set(key,(hist.get(key)??0)+1)}
console.log('shapes',shapes.length,'style hist',JSON.stringify([...hist].sort((a,b)=>b[1]-a[1]).slice(0,45)));
const colors=['#0000ff','#0000cc','#000099','#00b050','#00ff00','#ff0000','#ff0000'];
const pick=shapes.filter(s=>['#0000ff','#0000cc','#00b050','#00ff00','#ff0000','#ff0000'].includes(s.effective_style?.LineColor?.rgb?.toLowerCase()));
console.log('colored samples',JSON.stringify(pick.slice(0,35).map(s=>({id:s.id,root:s.root_shape_id,parent:s.parent_id,master:s.master_id,name:s.attributes?.Name,oneD:s.attributes?.OneD,text:s.text,style:s.effective_style?.LineColor,pat:s.effective_style?.LinePattern,weight:s.effective_style?.LineWeight,geometry:s.geometry,cells:s.cells?.filter(c=>['BeginX','BeginY','EndX','EndY','LineColor','LinePattern','LineWeight'].includes(c.N))})),null,2).slice(0,14000));
