import subprocess,json
from pathlib import Path
source=Path(__file__).resolve().parents[1]/'assets/audio-originals'
tracks=[]
for i,name in enumerate(['quiet_ember_01_0a26730f.m4a','quiet_ember_02_185fb3aa.m4a'],1):
 p=source/name
 duration=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(p)],text=True))
 tail=duration-4
 graph=f'[0:a]asplit=3[h][m][t];[h]atrim=0:4,asetpts=PTS-STARTPTS[head];[m]atrim=4:{tail},asetpts=PTS-STARTPTS[mid];[t]atrim=start={tail},asetpts=PTS-STARTPTS[tail];[tail][head]acrossfade=d=4:c1=qsin:c2=qsin[seam];[mid][seam]concat=n=2:v=0:a=1[out]'
 out=f'public/audio/quiet-ember-{i:02d}-loop.m4a'
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(p),'-filter_complex',graph,'-map','[out]','-c:a','aac','-b:a','160k','-ar','48000','-movflags','+faststart',out],check=True)
 tracks.append({'id':f'quiet-ember-{i:02d}','title':f'Quiet Ember {i:02d}','src':'/'+out.removeprefix('public/'),'sourceDuration':duration,'crossfadeSeconds':4})
Path('public/ambient.json').write_text(json.dumps({'tracks':tracks},indent=2)+'\n')
print(json.dumps(tracks,indent=2))
