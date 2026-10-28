"""Explicitly rebuild comparison renders without regenerating source audio."""
import json,subprocess,sys
from pathlib import Path
base=Path(sys.argv[1]);app=Path(__file__).resolve().parents[1]
for file in sorted((base/'samples').glob('*/sample.json')):
 data=json.loads(file.read_text());p=subprocess.run([sys.executable,str(app/'scripts/measure-music.py')],input=json.dumps({'folder':str(file.parent),'app':str(app),'ffmpeg':'/usr/local/bin/ffmpeg'}),capture_output=True,text=True,check=True)
 data['metrics']=json.loads(p.stdout.strip().splitlines()[-1]);temp=file.with_suffix('.tmp');temp.write_text(json.dumps(data,indent=2));temp.replace(file);print(data['request'],data['metrics']['matchedLufs'],flush=True)
