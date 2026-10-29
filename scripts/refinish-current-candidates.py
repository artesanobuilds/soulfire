"""Finish existing raw candidates again, without any model inference; preserve draft evidence."""
import pathlib,json,subprocess,shutil
from current_audio_finish import finish
ROOT=pathlib.Path(__file__).resolve().parents[1];R=ROOT/'docs/research-runs/2026-10-29-current-listening-feedback';p=R/'rebuild-progress.json';x=json.loads(p.read_text());analysis=str(pathlib.Path.home()/'Coding/AI-native/tts/venv/bin/python');changes=[]
for row in x['completed']:
 folder=pathlib.Path(row['folder']);old=json.loads((folder/'sample.json').read_text());prep=finish(folder/'raw-source.wav',folder/'source.wav',60,row['profile'].split('-')[0]);prep['catalogueVersion']=x['version']
 changed=prep['masterSha256']!=old['metrics']['sha256']
 if changed:
  backup=R/'draft-master-v1'/row['id'];backup.mkdir(parents=True,exist_ok=True)
  for f in ['sample.json','preparation.json']:
   # The original preparation is also retained in the prior sample record.
   if f=='sample.json':shutil.copyfile(folder/f,backup/f)
  oldprep=old['preparation'];(backup/'preparation.json').write_text(json.dumps(oldprep,indent=2)+'\n')
  for suffix in ['-analysis.json','-inferred.mid']:
   source=R/'catalogue-transcriptions'/(row['id']+suffix)
   if source.exists():shutil.copyfile(source,backup/source.name)
  command=subprocess.run([analysis,str(ROOT/'scripts/measure-music.py')],input=json.dumps({'folder':str(folder),'currentOnly':True,'app':str(ROOT),'ffmpeg':'/usr/local/bin/ffmpeg'}),capture_output=True,text=True,timeout=120);assert command.returncode==0,command.stderr
  metrics=json.loads(command.stdout);changes.append({'id':row['id'],'name':row['name'],'beforeMasterSha256':old['metrics']['sha256'],'afterMasterSha256':metrics['sha256'],'beforeSeconds':old['metrics']['duration'],'afterSeconds':metrics['duration']})
 else:metrics=old['metrics']
 old['preparation']=prep;old['metrics']=metrics;(folder/'sample.json').write_text(json.dumps(old,indent=2)+'\n');row['preparation']=prep;row['metrics']=metrics;row['playableSeconds']=metrics['duration'];row['boundaryPenalty']=prep['tailRemovedSeconds']+(3 if prep['terminalDropSeconds'] is not None else 0)+max(0,metrics['onsetRate']-2)*.1
p.write_text(json.dumps(x,indent=2)+'\n');(R/'release-refinement.json').write_text(json.dumps({'changed':changes,'noRegeneration':True,'rawSourcesUnchanged':True,'reason':'Post-fade low-activity tails rechecked before first catalogue publication'},indent=2)+'\n');print({'mastersRefined':len(changes),'modelCalls':0})
