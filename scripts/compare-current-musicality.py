import json,pathlib,csv,hashlib,numpy as np,soundfile as sf,pretty_midi
R=pathlib.Path(__file__).resolve().parents[1]/'docs/research-runs/2026-10-29-current-musicality';plan=json.loads((R/'study-plan.json').read_text());study=json.loads((R/'study-results.json').read_text());old=json.loads((R/'transcription-manifest.json').read_text());new=json.loads((R/'study-transcription-manifest.json').read_text());inventory=json.loads((R/'inventory.json').read_text());rows=[]
for case in plan['rows']:
 for arm in ['A','B','C']:
  if arm=='A':
   t=next(x for x in old['results'] if x['id']==case['baselineId']);m=json.loads(pathlib.Path(next(x['record'] for x in inventory['records'] if x['id']==case['baselineId'])).read_text())['metrics'];source=t['source'];key=case['baselineId']
  else:
   t=next(x for x in new['results'] if x['id']==case['baselineId']+'-'+arm);result=next(x for x in study['completed'] if x['baselineId']==case['baselineId'] and x['arm']==arm);m=result['metrics'];source=result['source'];key=t['id']
  midipath=R/('transcriptions' if arm=='A' else 'study-transcriptions')/(key+'-inferred.mid');midi=pretty_midi.PrettyMIDI(str(midipath));notes=[n for i in midi.instruments for n in i.notes];assert len(notes)==t['noteCount'] and all(0<=n.start<n.end<=t['durationSeconds']+.15 for n in notes)
  rows.append({'concept':case['concept'],'baselineId':case['baselineId'],'palette':case['request']['style'],'arm':arm,'noteCountInferred':t['noteCount'],'semitoneOverlapInferred':t['inferredSemitoneOverlapFraction'],'aggregateChromaAgreement':t['audioVsMidiChromaCosine'],'keyConfidenceHeuristic':m.get('keyConfidence'),'bpmEstimate':m.get('estimatedBpm'),'tempoConfidenceHeuristic':m.get('tempoConfidence'),'loudnessRangeLu':m.get('loudnessRange'),'matchedLufs':m['matchedLufs'],'matchedTruePeakDb':m['matchedTruePeakDb'],'clippedFractionSource':m['clippedFraction'],'pcmSha256':m['pcmSha256'],'sourceSha256':hashlib.sha256(pathlib.Path(source).read_bytes()).hexdigest(),'humanPreference':None})
(R/'study-comparison.json').write_text(json.dumps({'rows':rows,'all18DistinctPcm':len(set(r['pcmSha256'] for r in rows))==18,'studyMidiRoundTripPassed':len(new['results']),'winner':None,'interpretation':'Descriptive acoustic/transcription estimates only. No clinical, pleasantness, progression or exact-note quality is established.'},indent=2)+'\n')
with (R/'study-comparison.csv').open('w') as f:w=csv.DictWriter(f,fieldnames=rows[0]);w.writeheader();w.writerows(rows)
print('Study medians (not quality scores):')
for arm in ['A','B','C']:
 a=[r for r in rows if r['arm']==arm];print(arm,{k:float(np.median([r[k] for r in a if r[k] is not None])) for k in ['noteCountInferred','semitoneOverlapInferred','aggregateChromaAgreement','keyConfidenceHeuristic','matchedLufs','matchedTruePeakDb']})
# Independent source spectrum check around terminal low-note detections.
edge=[]
for r in old['results']:
 audio,sr=sf.read(r['source'],always_2d=True);mono=audio.mean(axis=1);parts=[]
 for start,end in [(-1,-.5),(-.5,0)]:
  seg=mono[int((len(mono)/sr+start)*sr):None if end==0 else int((len(mono)/sr+end)*sr)];spectrum=np.abs(np.fft.rfft(seg*np.hanning(len(seg))))**2;freq=np.fft.rfftfreq(len(seg),1/sr);total=spectrum[(freq>=20)&(freq<=10000)].sum();low=spectrum[(freq>=24)&(freq<=36)].sum();parts.append(float(low/(total+1e-20)))
 edge.append({'id':r['id'],'seconds':r['durationSeconds'],'terminalMidi22Detected':any(n['midiPitch']==22 and n['start']>r['durationSeconds']-.6 for n in r['notes']),'previousHalfSecond24to36HzEnergyShare':parts[0],'finalHalfSecond24to36HzEnergyShare':parts[1]})
(R/'terminal-low-frequency-check.json').write_text(json.dumps({'rows':edge,'interpretation':'Source spectrum check only; low band can be rumble or padding/AMT artifacts, not proof of a played bass note. No hearing claim.'},indent=2)+'\n')
# Confirm every original is byte-identical after all study work.
assert all(hashlib.sha256(pathlib.Path(r['source']).read_bytes()).hexdigest()==r['sourceSha256'] for r in inventory['records'])
print({'originalHashesUnchanged':49,'newStudyMidiValid':12,'allStudyPcmDistinct':len(set(r['pcmSha256'] for r in rows))})
