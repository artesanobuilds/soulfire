"""Bounded warm-runtime batch for authorized local catalogue rebuilding, no new model/config."""
import os,sys,json,time,subprocess,contextlib,hashlib,shutil,gc
from pathlib import Path
job=json.loads(sys.stdin.buffer.read(40000));runtime=job['runtime'];rows=job['rows'];assert 1<=len(rows)<=12 and runtime['executionApproved'] is True
root=Path(runtime['root']).resolve();stage=Path(job['stage']).resolve();os.chdir(root);sys.path.insert(0,str(root))
assert subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()==runtime['codeRevision'];assert subprocess.run(['git','diff','--quiet']).returncode==0
assert json.loads((Path(runtime['checkpointDir'])/'soulfire-weights.json').read_text())['revision']==runtime['weightsRevision']
for code in (root/'acestep/models/turbo').glob('*.py'):assert code.read_bytes()==(Path(runtime['checkpointDir'])/'acestep-v15-turbo'/code.name).read_bytes()
os.environ.update(HF_HUB_OFFLINE='1',TRANSFORMERS_OFFLINE='1',HF_HUB_DISABLE_IMPLICIT_TOKEN='1',HF_HUB_DISABLE_TELEMETRY='1',TOKENIZERS_PARALLELISM='false',ACESTEP_CHECKPOINTS_DIR=runtime['checkpointDir'])
pending=[]
for row in rows:
 folder=stage/row['id'];raw=folder/'raw-source.wav';meta=folder/'raw-generation.json'
 if raw.exists():
  if meta.exists():result=json.loads(meta.read_text())
  else:
   result={'id':row['id'],'loadSeconds':None,'inferenceSeconds':None,'latencySeconds':None,'peakRssBytes':None,'peakAcceleratorBytes':None,'generationSettings':{'steps':8,'guidanceScale':1,'thinking':False,**row['composition']}}
   meta.write_text(json.dumps(result,indent=2)+'\n')
  print(json.dumps(result),flush=True)
 else:pending.append(row)
if not pending:raise SystemExit(0)
rows=pending
started=time.perf_counter()
with contextlib.redirect_stdout(sys.stderr):
 import mlx.core as mx;mx.set_memory_limit(32*1024**3)
 from acestep.handler import AceStepHandler
 from acestep.llm_inference import LLMHandler
 from acestep.inference import GenerationParams,GenerationConfig,generate_music
 import soundfile as sf
 handler=AceStepHandler();status,ok=handler.initialize_service(project_root=str(root),config_path='acestep-v15-turbo',device='mps',use_mlx_dit=True,use_flash_attention=False,compile_model=False);assert ok and handler.use_mlx_dit,status
 lm=LLMHandler()
load=time.perf_counter()-started
for batch_index,row in enumerate(rows):
 try:
  import uuid;assert str(uuid.UUID(row['id']))==row['id'];req=row['request'];recipe=row['composition'];assert req['model']=='ace' and req['seconds']==60 and recipe['shift'] in [1,3] and len(recipe['caption'])<1600
  folder=stage/row['id'];folder.mkdir(parents=True,exist_ok=True);stamp=time.perf_counter()
  with contextlib.redirect_stdout(sys.stderr):
   params=GenerationParams(caption=recipe['caption'],lyrics='[Instrumental]',instrumental=True,bpm=recipe['requestedBpm'],keyscale=recipe['requestedKey'],timesignature=recipe['requestedTimeSignature'],duration=req['seconds'],seed=req['seed'],shift=float(recipe['shift']),inference_steps=8,guidance_scale=1.0,enable_normalization=False,thinking=False,use_cot_metas=False,use_cot_caption=False,use_cot_language=False)
   result=generate_music(handler,lm,params,GenerationConfig(batch_size=1,use_random_seed=False,seeds=[req['seed']],audio_format='wav'),save_dir=str(folder/'model-output'));mx.synchronize();assert result.success,result.error;inference=time.perf_counter()-stamp
   data,sr=sf.read(result.audios[0]['path'],dtype='float32',always_2d=True);sf.write(folder/'raw-source.wav',data,sr,subtype='FLOAT');shutil.rmtree(folder/'model-output');gc.collect();mx.clear_cache()
  result={'id':row['id'],'loadSeconds':load if batch_index==0 else 0,'inferenceSeconds':inference,'latencySeconds':(load if batch_index==0 else 0)+time.perf_counter()-stamp,'peakRssBytes':None,'peakAcceleratorBytes':int(mx.get_peak_memory()),'generationSettings':{'steps':8,'guidanceScale':1,'thinking':False,**recipe}}; (folder/'raw-generation.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result),flush=True)
 except Exception as e:print(json.dumps({'id':row['id'],'error':str(e)}),flush=True)
