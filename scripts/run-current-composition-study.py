"""Bounded offline matched-seed study; does not replace or publish app catalogue audio."""
import pathlib,json,subprocess,os,time,hashlib,shutil,signal
ROOT=pathlib.Path(__file__).resolve().parents[1]
REPORT=ROOT/'docs/research-runs/2026-10-29-current-musicality'
AUDIO=ROOT.parent/'current-musicality-audio-study'
DATA=pathlib.Path.home()/'Library/Application Support/soulfire/music-lab'
plan=json.loads((REPORT/'study-plan.json').read_text());runtime=json.loads((DATA/'runtime.json').read_text())['ace']
raw=REPORT/'raw';raw.mkdir(exist_ok=True)
original=(ROOT/'scripts/run-music-model.py').read_text();assert 'shift=1.0' in original
(raw/'adapter-baseline.py').write_text(original)
(raw/'adapter-shift3.py').write_text(original.replace('shift=1.0','shift=3.0').replace("'shift':1,","'shift':3,"))
env=os.environ.copy();env.update(HF_HUB_OFFLINE='1',TRANSFORMERS_OFFLINE='1',HF_HUB_DISABLE_IMPLICIT_TOKEN='1',HF_HOME=str(DATA/'offline-cache'),TOKENIZERS_PARALLELISM='false',OMP_NUM_THREADS='8',PYTHONDONTWRITEBYTECODE='1')
report={'startedAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'budgetGiB':2,'preservedAllOriginals':True,'subjectiveWinner':None,'completed':[],'failures':[],'adapterBaselineSha256':hashlib.sha256(original.encode()).hexdigest()}
def persist(): (REPORT/'study-results.json').write_text(json.dumps(report,indent=2)+'\n')
active=None
def stop(*args):
 if active and active.poll() is None:os.killpg(active.pid,signal.SIGTERM)
 persist();raise SystemExit(130)
signal.signal(signal.SIGINT,stop);signal.signal(signal.SIGTERM,stop)
def command(argv,job,timeout):
 global active
 active=subprocess.Popen(argv,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,env=env,start_new_session=True,text=True)
 try:out,err=active.communicate(json.dumps(job),timeout=timeout)
 except subprocess.TimeoutExpired:
  os.killpg(active.pid,signal.SIGKILL);active.communicate();raise RuntimeError('Owned study child timed out')
 if active.returncode:raise RuntimeError(err[-2000:])
 active=None;return json.loads(out)
for row in plan['rows']:
 for arm in ['B','C']:
  folder=AUDIO/(row['baselineId']+'-'+arm);folder.mkdir(parents=True,exist_ok=True)
  prior=folder/'review.json'
  if prior.exists():report['completed'].append(json.loads(prior.read_text()));persist();continue
  started=time.monotonic()
  try:
   used=sum(p.stat().st_size for root in [DATA,AUDIO] for p in root.rglob('*') if p.is_file())
   if used+40*1024**2>2*1024**3:raise RuntimeError('2GiB combined result budget would be exceeded')
   if shutil.disk_usage(AUDIO).free<50*1024**3:raise RuntimeError('50GiB free disk floor')
   job={'runtime':runtime,'request':row['request'],'prompt':row['musicalCaption'],'output':str(folder/'source.wav')}
   timing=command([runtime['python'],str(raw/('adapter-baseline.py' if arm=='B' else 'adapter-shift3.py'))],job,180)
   measured=command([str(pathlib.Path.home()/'Coding/AI-native/tts/venv/bin/python'),str(ROOT/'scripts/measure-music.py')],{'folder':str(folder),'currentOnly':True,'app':str(ROOT),'ffmpeg':'/usr/local/bin/ffmpeg'},120)
   shutil.rmtree(folder/'model-output',ignore_errors=True)
   issues=[]
   if abs(measured['matchedLufs']+21)>.3:issues.append('loudness')
   if measured['matchedTruePeakDb']>-2.5:issues.append('true peak')
   if measured['clippedFraction']>.001:issues.append('source clipping')
   result={'baselineId':row['baselineId'],'concept':row['concept'],'arm':arm,'caption':row['musicalCaption'],'request':row['request'],'timing':timing,'metrics':measured,'source':str(folder/'source.wav'),'bed':str(folder/'bed.wav'),'sourceSha256':hashlib.sha256((folder/'source.wav').read_bytes()).hexdigest(),'elapsedSeconds':round(time.monotonic()-started,2),'technicalIssues':issues,'humanAudition':False,'promotion':'review-only, originals unchanged'}
   prior.write_text(json.dumps(result,indent=2)+'\n');report['completed'].append(result);print(json.dumps({'completed':len(report['completed']),'arm':arm,'concept':row['concept'],'issues':issues}),flush=True)
  except Exception as e:report['failures'].append({'baselineId':row['baselineId'],'arm':arm,'error':str(e)});print(json.dumps(report['failures'][-1]),flush=True)
  persist()
print(json.dumps({'complete':len(report['completed']),'failed':len(report['failures'])}),flush=True)
