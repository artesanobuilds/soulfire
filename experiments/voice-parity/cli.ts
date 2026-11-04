import {resolve} from 'node:path';
import {preparePilot,executePilot} from './pilot';
async function main(){
  const [command,first,second,third]=process.argv.slice(2);
  if(command==='prepare'&&first&&second){const plan=preparePilot(resolve(first),resolve(second));console.log(JSON.stringify({state:'prepared-no-provider-calls',units:plan.runs.length,reservation_usd:4.8,ceiling_usd:5}));}
  else if(command==='execute'&&first&&second&&third){await executePilot(resolve(first),resolve(second),resolve(third));console.log('Execution ended. Inspect ledger, STOPPED.json and records; no parity conclusion.');}
  else throw Error('Usage: pilot.ts prepare STUDY NEW_DIRECTORY | execute PILOT AUTHORIZATION_JSON KOKORO_HOME');
}
await main();
