/** Explicit real reproducibility repeat, without changing prompt or configuration. */
import {startMusicJob,getMusicJob} from '../src/infrastructure/music-lab-jobs';
const job=await startMusicJob({model:'ace',style:'piano',seed:101,seconds:30});console.log('START',job.id);
while(getMusicJob(job.id)?.phase==='running')await new Promise(r=>setTimeout(r,1000));
const final=getMusicJob(job.id)!;console.log(JSON.stringify(final));if(final.phase!=='done')throw Error(final.message);
