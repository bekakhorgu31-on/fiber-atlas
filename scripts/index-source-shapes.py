"""Create a streamable derived Shape index; preserve raw extraction unchanged."""
import argparse,gzip,json
from pathlib import Path
parser=argparse.ArgumentParser();parser.add_argument('raw',type=Path);parser.add_argument('output',type=Path);args=parser.parse_args()
with gzip.open(args.raw,'rt',encoding='utf8') as stream:raw=json.load(stream)
count=0
with args.output.open('w',encoding='utf8') as output:
 for page in raw['pages']:
  for shape in page['shapes']:
   count+=1
   if count>50000:raise ValueError('Shape index exceeds the staged-import limit of 50,000')
   output.write(json.dumps({'page_id':str(page['id']),'shape_id':str(shape['id']),'payload':shape},ensure_ascii=False,separators=(',',':'))+'\n')
