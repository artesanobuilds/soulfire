"""Resumable two-candidate-per-concept production outside the active catalogue."""
import json,pathlib,subprocess,os,time,signal,threading,shutil,sys,argparse
ROOT=pathlib.Path(__file__).resolve().parents[1];REPORT=ROOT/'docs/research-runs/2026-10-29-current-listening-feedback';plan=json.loads((REPORT/'rebuild-plan.json').read_text());DATA=pathlib.Path.home()/'Library/Application Support/soulfire/music-lab';runtime=json.loads((DATA/'runtime.json').read_text())['ace'];stage=DATA/'catalogue-staging'/plan['version'];stage.mkdir(parents=True,exist_ok=True)
parser=argparse.ArgumentParser();parser.add_argument('--limit',type=int,default=72);args=parser.parse_args();assert 1<=args.limit<=72
reportfile=REPORT/'rebuild-progress.json';report=json.loads(reportfile.read_text()) if reportfile.exists() else {'version':plan['version'],'completed':[],'failures':[],'startedAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())}
def persist():reportfile.write_text(json.dumps(report,indent=2)+'\n')
completed={x['id'] for x in report['completed']};remaining=[r for r in plan['rows'] if r['id'] not in completed][:args.limit];active=None

def stop(*args):
 if active and active.poll() is None:os.killpg(active.pid,signal.SIGTERM)
 persist();raise SystemExit(130)
signal.signal(signal.SIGINT,stop);signal.signal(signal.SIGTERM,stop)
env=os.environ.copy();env.update(HF_HOME=str(DATA/'offline-cache'),HF_HUB_OFFLINE='1',TRANSFORMERS_OFFLINE='1',HF_HUB_DISABLE_IMPLICIT_TOKEN='1',TOKENIZERS_PARALLELISM='false',OMP_NUM_THREADS='8',PYTHONDONTWRITEBYTECODE='1')
analysis=str(pathlib.Path.home()/'Coding/AI-native/tts/venv/bin/python')
for offset in range(0,len(remaining),12):
 rows=remaining[offset:offset+12]
 used=sum(p.stat().st_size for root in [DATA,ROOT.parent/'current-musicality-audio-study',ROOT.parent/'current-musicality-audition'] for p in root.rglob('*') if p.is_file())
 assert used+len(rows)*65*1024**2<6*1024**3,'Six GiB result budget would be exceeded';assert shutil.disk_usage(DATA).free>50*1024**3
 log=open('/tmp/current-catalogue-model-batch.log','a');active=subprocess.Popen([runtime['python'],str(ROOT/'scripts/run-current-model-batch.py')],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=log,text=True,start_new_session=True,env=env)
 timer=threading.Timer(480,lambda p=active:os.killpg(p.pid,signal.SIGKILL) if p.poll() is None else None);timer.start();active.stdin.write(json.dumps({'runtime':runtime,'rows':rows,'stage':str(stage)}));active.stdin.close()
 try:
  for line in active.stdout:
   result=json.loads(line);row=next(r for r in rows if r['id']==result['id']);folder=stage/row['id']
   try:
    if result.get('error'):raise RuntimeError(result['error'])
    def command(script,input):
     p=subprocess.run([runtime['python'] if script=='current_audio_finish.py' else analysis,str(ROOT/'scripts'/script)],input=json.dumps(input),capture_output=True,text=True,timeout=120);assert p.returncode==0,p.stderr[-1500:];return json.loads(p.stdout)
    prep=command('current_audio_finish.py',{'folder':str(folder),'requestedSeconds':60,'style':row['request']['style']});prep['catalogueVersion']=plan['version']
    metrics=command('measure-music.py',{'folder':str(folder),'currentOnly':True,'app':str(ROOT),'ffmpeg':'/usr/local/bin/ffmpeg'})
    issues=[]
    if abs(metrics['matchedLufs']+21)>.3 or metrics['matchedTruePeakDb']>-2.5:issues.append('loudness/peak')
    if metrics['clippedFraction']>.001:issues.append('source clipping')
    if prep['last100msRmsDbfs']>-50:issues.append('ending release')
    if metrics['onsetRate']>8:issues.append('excessive transients')
    sample={'id':row['id'],'currentOnly':True,'request':row['request'],'modelVersion':'acestep-v15-turbo / MLX / listener-informed / stereo','codeRevision':runtime['codeRevision'],'weightsRevision':runtime['weightsRevision'],'createdAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),**{k:v for k,v in result.items() if k not in ['id']},'preparation':prep,'metrics':metrics}
    (folder/'sample.json').write_text(json.dumps(sample,indent=2)+'\n')
    # Prefer a usable full phrase with less corrective processing; not an inferred musical-quality score.
    penalty=prep['tailRemovedSeconds']+(3 if prep['terminalDropSeconds'] is not None else 0)+max(0,metrics['onsetRate']-2)*.1
    report['completed'].append({'id':row['id'],'conceptId':row['conceptId'],'name':row['name'],'candidate':row['candidate'],'folder':str(folder),'profile':row['composition']['profile'],'shift':row['composition']['shift'],'playableSeconds':metrics['duration'],'preparation':prep,'metrics':metrics,'technicalIssues':issues,'boundaryPenalty':penalty,'humanAudition':False});print(json.dumps({'completed':len(report['completed']),'of':72,'name':row['name'],'candidate':row['candidate'],'seconds':round(metrics['duration'],2),'issues':issues}),flush=True)
   except Exception as e:report['failures'].append({'id':row['id'],'conceptId':row['conceptId'],'error':str(e)});print(json.dumps(report['failures'][-1]),flush=True)
   persist()
  code=active.wait(timeout=15)
  if code:print('Batch exited '+str(code),flush=True)
 finally:
  timer.cancel()
  if active.poll() is None:os.killpg(active.pid,signal.SIGTERM)
  active=None;log.close()
persist();print(json.dumps({'completed':len(report['completed']),'failedAttempts':len(report['failures'])}),flush=True)
