'use client';
import {useState} from 'react';
type Result={reply:{message:string};audio:{mime:string;base64:string}|null;audioError:string|null};
export default function ReasonedVoiceExperiment(){
 const [text,setText]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[result,setResult]=useState<Result|null>(null);
 async function transcribe(file:File){
  setBusy(true);setError('');setResult(null);
  try{const form=new FormData();form.set('audio',file);const r=await fetch('/api/transcribe',{method:'POST',body:form});const data=await r.json();if(!r.ok)throw Error(data.error||'Transcription failed.');setText(data.text);}catch(e){setError(e instanceof Error?e.message:'Transcription failed.');}finally{setBusy(false);}
 }
 async function ask(){
  setBusy(true);setError('');setResult(null);
  try{const r=await fetch('/api/experimental/reasoned-voice',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,language:'plain'})});const data=await r.json();if(!r.ok)throw Error(data.error||'Reply failed.');setResult(data);}catch(e){setError(e instanceof Error?e.message:'Reply failed.');}finally{setBusy(false);}
 }
 return <main style={{maxWidth:640,margin:'4rem auto',padding:24}}>
  <p>Voice reply experiment</p><h1>A reply you can read and hear</h1>
  <p>Write your question, or upload a recording for transcription. Review the words before asking. The audio reads the same reply shown below.</p>
  <label>Transcribe a recording<input aria-label="Transcribe a recording" type="file" accept="audio/wav,audio/webm,audio/mp4,audio/ogg" disabled={busy} onChange={e=>{const file=e.target.files?.[0];if(file)void transcribe(file);}} /></label>
  <p>Recordings are sent to the configured transcription service. Speech playback is generated locally.</p>
  <form onSubmit={e=>{e.preventDefault();void ask();}}>
   <label htmlFor="question">Your question</label><textarea id="question" value={text} onChange={e=>setText(e.target.value)} maxLength={3000} rows={6} style={{display:'block',width:'100%',margin:'1rem 0'}} disabled={busy}/>
   <button disabled={busy||!text.trim()}>{busy?'Working…':'Ask and prepare speech'}</button>
  </form>
  {error&&<p role="alert">{error}</p>}
  {result&&<section aria-label="Your reply"><h2>Your reply</h2><p style={{whiteSpace:'pre-wrap'}}>{result.reply.message}</p>
   {result.audio&&<audio aria-label="Play the exact reply" controls src={`data:${result.audio.mime};base64,${result.audio.base64}`}/>}
   {result.audioError&&<p role="status">{result.audioError}</p>}
  </section>}
 </main>;
}
