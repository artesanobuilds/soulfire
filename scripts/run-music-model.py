"""First-party bounded adapter. Model execution is opt-in via local runtime config.
No auto-install, downloads, credentials, microphone, browser UI or public sharing.
Input: validated structured job JSON on stdin; output: measured execution JSON.
"""
from pathlib import Path
import sys,json,time,os,contextlib,subprocess,resource
job=json.loads(sys.stdin.buffer.read(20000));runtime=job['runtime'];request=job['request']
assert request['model'] in ('ace','stable') and 30<=request['seconds']<=90 and 0<=request['seed']<=2147483647
assert runtime['executionApproved'] is True
root=Path(runtime['root']).resolve();out=Path(job['output']).resolve();out.parent.mkdir(parents=True,exist_ok=True)
os.chdir(root)
assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()==runtime['codeRevision'],'Runtime source revision changed'
assert subprocess.run(['git','diff','--quiet'],cwd=root).returncode==0,'Runtime tracked source changed'
if request['model']=='ace':
 assert json.loads((Path(runtime['checkpointDir'])/'soulfire-weights.json').read_text())['revision']==runtime['weightsRevision']
 for code in (root/'acestep/models/turbo').glob('*.py'):
  assert code.read_bytes()==(Path(runtime['checkpointDir'])/'acestep-v15-turbo'/code.name).read_bytes(),'Checkpoint code differs from approved source'
os.environ['HF_HUB_OFFLINE']='1';os.environ['TRANSFORMERS_OFFLINE']='1';os.environ['HF_HUB_DISABLE_IMPLICIT_TOKEN']='1';os.environ['TOKENIZERS_PARALLELISM']='false';os.environ['ACESTEP_CHECKPOINTS_DIR']=runtime['checkpointDir']
started=time.perf_counter();load=0;inference=0;accelerator=None
with contextlib.redirect_stdout(sys.stderr):
 import mlx.core as mx
 mx.set_memory_limit(32*1024**3)
 if request['model']=='ace':
  sys.path.insert(0,str(root))
  from acestep.handler import AceStepHandler
  from acestep.llm_inference import LLMHandler
  from acestep.inference import GenerationParams,GenerationConfig,generate_music
  handler=AceStepHandler();status,ok=handler.initialize_service(project_root=str(root),config_path='acestep-v15-turbo',device='mps',use_mlx_dit=True,use_flash_attention=False,compile_model=False)
  assert ok,status
  assert handler.use_mlx_dit,'MLX was requested but not active'
  load=time.perf_counter()-started
  params=GenerationParams(caption=job['prompt'],lyrics='[Instrumental]',instrumental=True,bpm=None if request['style']=='ambient' else 64,duration=request['seconds'],seed=request['seed'],inference_steps=8,guidance_scale=1.0,enable_normalization=False,thinking=False,use_cot_metas=False,use_cot_caption=False,use_cot_language=False)
  config=GenerationConfig(batch_size=1,use_random_seed=False,seeds=[request['seed']],audio_format='wav')
  stamp=time.perf_counter();result=generate_music(handler,LLMHandler(),params,config,save_dir=str(out.parent/'model-output'));mx.synchronize();inference=time.perf_counter()-stamp
  assert result.success,result.error
  import soundfile as sf
  data,sr=sf.read(result.audios[0]['path'],dtype='float32',always_2d=True)
  sf.write(out,data,sr,subtype='FLOAT')
  import shutil
  shutil.rmtree(out.parent/'model-output')
 else:
  assert runtime['termsAccepted'] is True,'Explicit model terms approval is required'
  # Use official MLX CLI without --play, Gradio or sharing. Offline mode forbids fallback downloads.
  script=root/'scripts/sa3_mlx.py';stamp=time.perf_counter()
  subprocess.run([sys.executable,str(script),'--prompt',job['prompt'],'--dit','sm-music','--decoder','same-s','--steps','8','--cfg','1.0','--seed',str(request['seed']),'--seconds',str(request['seconds']),'--out',str(out)],cwd=root,check=True)
  inference=time.perf_counter()-stamp
  # CLI combines loading and inference. Do not invent a phase split or child accelerator peak.
 try:accelerator=int(mx.get_peak_memory()) if request['model']=='ace' else None
 except Exception:accelerator=None
assert out.exists() and out.stat().st_size>44
print(json.dumps({'latencySeconds':time.perf_counter()-started,'loadSeconds':load,'inferenceSeconds':inference,'peakRssBytes':resource.getrusage(resource.RUSAGE_SELF).ru_maxrss if request['model']=='ace' else None,'peakAcceleratorBytes':accelerator}))
