/** Explicit offline local study. Never called by page load. No paid providers. */
import {musicComparisonPlan} from '../src/domain/music-lab';
import {modelAvailability,musicCatalog} from '../src/infrastructure/music-lab-runtime';
import {startMusicJob,getMusicJob} from '../src/infrastructure/music-lab-jobs';
const ready=(await modelAvailability()).filter(m=>m.ready).map(m=>m.model);
for(const request of musicComparisonPlan(30)){
 if(!ready.includes(request.model)){console.log('PENDING',request.model,request.style,request.seed);continue;}
 if((await musicCatalog()).some(s=>JSON.stringify(s.request)===JSON.stringify(request))){console.log('EXISTING',request.model,request.style,request.seed);continue;}
 const job=await startMusicJob(request);console.log('START',job.id,request,flush());
 while(getMusicJob(job.id)?.phase==='running')await new Promise(r=>setTimeout(r,1000));
 const final=getMusicJob(job.id)!;console.log('RESULT',JSON.stringify(final));if(final.phase!=='done')throw Error(final.message);
}
function flush(){return new Date().toISOString();}
