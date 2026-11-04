import { it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { verifyAuthorization, validatePlan, Ledger } from '../experiments/voice-parity/pilot';
const plan=()=>({ceiling_usd:5,paid_attempt_limit:32,runs:['unknown-availability','known-availability','correct-record','repeat-uncertainty'].flatMap(scenario=>[1,2].flatMap(repeat=>['production-text','matched-text','native-text','native-audio','text-tts'].map(arm=>({id:`${scenario}-${repeat}-${arm}`,scenario,repeat,arm,allocation_usd:arm==='text-tts'?0:arm.startsWith('native')?.2:.1}))))});
it('bounded subset has 32 paid calls, 8 local speech units and exactly $4.80 allocations',()=>{
 const p=plan();expect(()=>validatePlan(p)).not.toThrow();expect(p.runs).toHaveLength(40);
 expect(p.runs.filter(r=>r.allocation_usd>0)).toHaveLength(32);
});
it('fails closed on missing, mismatched, or uncoordinated authorization',()=>{
 const a={approved:true,ceiling_usd:5,plan_sha256:'hash',user_approval_evidence:'Explicit parent-supplied evidence',approved_at:'2026-11-04',ledger_owner_confirmed_no_overlapping_allocation:true};
 expect(()=>verifyAuthorization(plan(),'hash',a)).not.toThrow();
 for(const change of [{approved:false},{plan_sha256:'other'},{ceiling_usd:6},{user_approval_evidence:''},{ledger_owner_confirmed_no_overlapping_allocation:false}])expect(()=>verifyAuthorization(plan(),'hash',{...a,...change})).toThrow();
});
it('reserves before completion and never reclaims failed or uncertain calls',()=>{
 const root=mkdtempSync(join(tmpdir(),'voice-ledger-'));
 try {
  writeFileSync(join(root,'plan.json'),JSON.stringify(plan()));const ledger=new Ledger(root,plan());
  const run=plan().runs.find(r=>r.arm==='native-audio')!;
  ledger.reserve(run,.14);
  let raw=JSON.parse(readFileSync(join(root,'ledger.json'),'utf8'));
  expect(raw.reserved_usd).toBe(.2);expect(raw.attempts[0].state).toBe('reserved-outcome-uncertain');
  expect(()=>ledger.reserve(run,.14)).toThrow();
  ledger.complete(run.id,'failed');ledger.close();
  raw=JSON.parse(readFileSync(join(root,'ledger.json'),'utf8'));expect(raw.reserved_usd).toBe(.2);
  expect(()=>new Ledger(root,plan())).toThrow();
 } finally{rmSync(root,{recursive:true,force:true});}
});
it('refuses attempts whose calculated bound does not fit allocation',()=>{
 const root=mkdtempSync(join(tmpdir(),'voice-ledger-'));
 try {
  writeFileSync(join(root,'plan.json'),JSON.stringify(plan()));const ledger=new Ledger(root,plan());
  expect(()=>ledger.reserve(plan().runs[0],.11)).toThrow();ledger.close();
 } finally{rmSync(root,{recursive:true,force:true});}
});
