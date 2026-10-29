"""Offline inferred MIDI review aids, never original scores or clinical/music-quality labels."""
import json, pathlib, hashlib, time, contextlib, sys, shutil, argparse
import numpy as np
import soundfile as sf
import librosa
import basic_pitch
from basic_pitch.inference import Model, predict
ROOT=pathlib.Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();group=parser.add_mutually_exclusive_group();group.add_argument('--study',action='store_true');group.add_argument('--catalogue',action='store_true');args=parser.parse_args()
OUT=ROOT/('docs/research-runs/2026-10-29-current-listening-feedback' if args.catalogue else 'docs/research-runs/2026-10-29-current-musicality')
INVENTORY=json.loads((OUT/('catalogue-inventory.json' if args.catalogue else 'study-inventory.json' if args.study else 'inventory.json')).read_text())
DEST=OUT/('catalogue-transcriptions' if args.catalogue else 'study-transcriptions' if args.study else 'transcriptions');DEST.mkdir(exist_ok=True)
MANIFEST=OUT/('catalogue-transcription-manifest.json' if args.catalogue else 'study-transcription-manifest.json' if args.study else 'transcription-manifest.json')
MODEL=next(pathlib.Path(basic_pitch.__file__).parent.rglob('nmp.onnx'))
model=Model(MODEL)
assert model.model_type==Model.MODEL_TYPES.ONNX
# Limit CPU inference to leave the user's running application responsive.
import onnxruntime as ort
opts=ort.SessionOptions();opts.intra_op_num_threads=2;opts.inter_op_num_threads=1
model.model=ort.InferenceSession(str(MODEL),sess_options=opts,providers=['CPUExecutionProvider'])
report={'tool':'Spotify Basic Pitch 0.4.0 / bundled ICASSP 2022 ONNX CPU','modelSha256':hashlib.sha256(MODEL.read_bytes()).hexdigest(),'source':'https://github.com/spotify/basic-pitch','settings':{'onsetThreshold':0.5,'frameThreshold':0.3,'minimumNoteLengthMs':127.7,'midiTempo':120},'limitations':['Inferred mixed-polyphonic notes, not original score or separated instrument parts.','MIDI 120 BPM is a transport grid, not a measured musical tempo; note timing is absolute seconds.','Detector amplitudes are uncalibrated activation values, not probabilities.','Chord/key/interval flags can be caused by overtones, reverb and transcription errors; not automatic bad-music scores.','No human listening validation has been completed.'],'results':[],'failures':[]}
def save(): MANIFEST.write_text(json.dumps(report,indent=2)+'\n')
def transcribe(source,dest):
 with contextlib.redirect_stdout(sys.stderr):
  outputs,midi,events=predict(source,model_or_model_path=model,midi_tempo=120)
 midi.write(str(dest))
 return outputs,midi,events
# Known synthetic polyphony verifies functioning and rough pitch coverage; not an AMT accuracy benchmark.
fixture=OUT/'synthetic-validation.wav';sr=22050;t=np.arange(sr*6)/sr;y=np.zeros_like(t)
for note in [60,64,67]:
 f=440*2**((note-69)/12);y+=.08*(np.sin(2*np.pi*f*t)+.3*np.sin(4*np.pi*f*t))*np.minimum(1,t/.03)*np.minimum(1,(6-t)/.2)
sf.write(fixture,y,sr)
_,_,events=transcribe(fixture,DEST/'synthetic-validation-inferred.mid')
pitches=sorted(set(int(e[2]) for e in events));report['syntheticValidation']={'knownPitches':[60,64,67],'inferredPitches':pitches,'targetPitchCoverage':len(set(pitches)&{60,64,67})/3,'notGeneralAccuracy':True}
fixture.unlink();save()
seen={}
for row in INVENTORY['records']:
 started=time.monotonic();id=row['id'];target=DEST/(id+'-inferred.mid');metadata=DEST/(id+'-analysis.json')
 try:
  if metadata.exists() and target.exists():
   prior=json.loads(metadata.read_text())
   if prior['sourceSha256']==row['sourceSha256']:
    report['results'].append(prior);seen[row['pcmSha256']]=prior;save();continue
  if row['pcmSha256'] in seen:
   prior=seen[row['pcmSha256']];shutil.copyfile(DEST/(prior['id']+'-inferred.mid'),target)
   result={**prior,'id':id,'source':row['source'],'sourceSha256':row['sourceSha256'],'category':row['category'],'reusedIdenticalPcmFrom':prior['id']}
  else:
   outputs,midi,events=transcribe(pathlib.Path(row['source']),target)
   notes=[{'start':round(float(e[0]),5),'end':round(float(e[1]),5),'midiPitch':int(e[2]),'activation':round(float(e[3]),5)} for e in events]
   audio,sr=sf.read(row['source'],always_2d=True);mono=audio.mean(axis=1);duration=len(mono)/sr
   mono=librosa.resample(mono,orig_sr=sr,target_sr=22050)
   spectrum=np.abs(librosa.stft(mono,n_fft=4096,hop_length=1024));chroma=librosa.feature.chroma_stft(S=spectrum**2,sr=22050,n_fft=4096)
   # Independent audio-derived coarse chord candidates. Unknown when template margin is weak.
   chords=[];framesPerWindow=round(2*22050/1024)
   for start in range(0,chroma.shape[1],framesPerWindow):
    c=chroma[:,start:start+framesPerWindow].mean(axis=1);c/=np.linalg.norm(c)+1e-12;scores=[]
    for quality,intervals in [('major',[0,4,7]),('minor',[0,3,7])]:
     for root in range(12):
      template=np.zeros(12);template[(root+np.array(intervals))%12]=1/np.sqrt(3);scores.append((float(c@template),root,quality))
    scores.sort(reverse=True);margin=scores[0][0]-scores[1][0]
    chords.append({'startSeconds':round(start*1024/22050,2),'rootPitchClass':scores[0][1] if margin>=.07 else None,'quality':scores[0][2] if margin>=.07 else 'unknown','templateMargin':round(margin,4)})
   grid=np.arange(.1,duration,.2);clash=activeFrames=0
   for t in grid:
    pcs={n['midiPitch']%12 for n in notes if n['start']<=t<n['end']}
    if pcs:
     activeFrames+=1;clash+=int(any((p+1)%12 in pcs for p in pcs))
   synth=midi.synthesize(fs=22050);n=min(len(synth),len(mono));synthChroma=librosa.feature.chroma_stft(y=synth[:n],sr=22050,n_fft=4096,hop_length=1024).mean(axis=1) if n else np.zeros(12);originalChroma=chroma.mean(axis=1)
   similarity=float(np.dot(synthChroma,originalChroma)/(np.linalg.norm(synthChroma)*np.linalg.norm(originalChroma)+1e-12))
   sourceRecord=json.loads(pathlib.Path(row['record']).read_text());metrics=sourceRecord['metrics']
   result={'id':id,'category':row['category'],'conceptId':row['conceptId'],'source':row['source'],'sourceSha256':row['sourceSha256'],'pcmSha256':row['pcmSha256'],'durationSeconds':duration,'noteCount':len(notes),'pitchRange':[min((n['midiPitch'] for n in notes),default=None),max((n['midiPitch'] for n in notes),default=None)],'uncalibratedMeanActivation':float(np.mean([n['activation'] for n in notes])) if notes else 0,'inferredSemitoneOverlapFraction':clash/max(1,activeFrames),'audioVsMidiChromaCosine':similarity,'validationMeaning':'Aggregate pitch-class overlap only; not exact-note/voice correctness. Harmonic overtones can inflate agreement.','sourceKeyEstimate':metrics.get('estimatedKey'),'sourceKeyConfidence':metrics.get('keyConfidence'),'sourceBpmEstimate':metrics.get('estimatedBpm'),'sourceTempoConfidence':metrics.get('tempoConfidence'),'coarseAudioChordCandidates':chords,'notes':notes,'status':'inferred-review-aid' if notes else 'unsupported-no-reliable-notes','humanValidated':False,'elapsedSeconds':round(time.monotonic()-started,2)}
  metadata.write_text(json.dumps(result,indent=2)+'\n');report['results'].append(result);seen[row['pcmSha256']]=result
  print(json.dumps({'completed':len(report['results']),'total':len(INVENTORY['records']),'id':id,'notes':result['noteCount']}),flush=True)
 except Exception as e:
  report['failures'].append({'id':id,'error':str(e),'status':'unsupported-or-failed'});print(json.dumps(report['failures'][-1]),flush=True)
 save()
print(json.dumps({'complete':len(report['results']),'failed':len(report['failures'])}),flush=True)
