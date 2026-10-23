// Explicit opt-in only: one synthetic, non-personal paid request through the local app.
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
if (!process.argv.includes('--allow-one-paid-request')) throw new Error('Explicit --allow-one-paid-request is required.');
const browser=await chromium.launch({headless:true,args:['--mute-audio'],executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
const calls=[];const directProvider=[];
const prompt='Synthetic test only: a fictional person is preparing a two-minute talk about paper airplanes tomorrow. Suggest a short plain-language practice separating useful preparation from uncontrollable audience reactions.';
page.on('request',r=>{if(r.url().includes('/api/companion'))calls.push(r.postDataJSON());if(r.url().startsWith('https://api.openai.com/'))directProvider.push(r.url());});
const began=Date.now();
try {
 await page.goto('http://127.0.0.1:3100');
 const readiness=await page.request.get('http://127.0.0.1:3100/api/status');
 assert.equal((await readiness.json()).configured,true);
 await page.getByRole('button',{name:'Begin journey',exact:true}).click();
 await page.getByText('Make this space yours',{exact:true}).click();
 await page.getByLabel('Language that feels right').selectOption('plain');
 await page.getByLabel('What’s weighing on you today?').fill(prompt);
 const responsePromise=page.waitForResponse(r=>r.url().endsWith('/api/companion')&&r.request().method()==='POST',{timeout:60000});
 await page.getByRole('button',{name:'Find a practice',exact:true}).click();
 const response=await responsePromise;
 const data=await response.json();
 assert.equal(calls.length,1);
 assert.equal(directProvider.length,0,'The browser must never call the provider directly.');
 if(response.status()!==200){
  const result={success:false,httpStatus:response.status(),requests:calls.length,elapsedMs:Date.now()-began,error:typeof data.error==='string'?data.error:'No safe app error available'};
  mkdirSync('docs/implementation/evidence',{recursive:true});
  writeFileSync('docs/implementation/evidence/live-openai-smoke.json',JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result));process.exitCode=1;
 } else {
  assert.equal(data.provenance.source,'OpenAI Responses');
  assert.match(data.provenance.responseId,/^resp_[a-zA-Z0-9]+$/);
  assert.match(data.provenance.model,/^gpt-[a-zA-Z0-9._-]+$/);
  assert.equal(data.reply.kind,'practice');
  assert.ok(data.reply.exercise.blocks.length>0);
  assert.match(JSON.stringify(data.reply.exercise),/paper|airplane/i);
  await page.getByRole('button',{name:'Try this practice',exact:true}).click();
  await page.getByText('YOUR PERSONALIZED PRACTICE',{exact:true}).waitFor();
  assert.equal(await page.getByText('EXAMPLE · EDITABLE PRACTICE',{exact:true}).count(),0);
  mkdirSync('docs/design/live-ai-review',{recursive:true});
  await page.screenshot({path:'docs/design/live-ai-review/real-synthetic-practice-desktop.png',fullPage:true});
  const result={success:true,source:data.provenance.source,model:data.provenance.model,responseId:data.provenance.responseId,httpStatus:response.status(),requests:calls.length,browserDirectProviderCalls:directProvider.length,elapsedMs:Date.now()-began,syntheticPrompt:prompt,reply:data.reply,renderedPersonalizedPractice:true,physicalMicrophoneTested:false};
  writeFileSync('docs/implementation/evidence/live-openai-smoke.json',JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({success:true,model:result.model,responseId:result.responseId,requests:result.requests,elapsedMs:result.elapsedMs,renderedPersonalizedPractice:true}));
 }
} finally {await browser.close();}
