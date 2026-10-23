import {chromium} from '@playwright/test';
import {readFileSync,writeFileSync} from 'node:fs';
const browser=await chromium.launch({headless:true,args:['--mute-audio'],executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const images=[];
for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
 const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
 const shot=async(stage)=>{
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error(`overflow ${name} ${stage}`);
  const path=`docs/design/intro-controls-review/${stage}-${name}.png`;
  await page.screenshot({path,fullPage:true});images.push({stage,name,path});
 };
 await page.goto('http://127.0.0.1:3100');await page.getByRole('button',{name:'Play introduction',exact:true}).waitFor();await shot('first-visit');
 await page.getByRole('button',{name:'Begin journey',exact:true}).click();await page.reload();
 await page.getByRole('heading',{name:'Welcome back.'}).waitFor();await shot('return-without-playback');
 await page.getByRole('button',{name:'Play introduction',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('audio[data-intro]')?.currentTime>.1);
 await page.getByRole('button',{name:'Pause introduction',exact:true}).click();await shot('captions');
 await page.reload();await page.getByRole('button',{name:'Replay introduction',exact:true}).waitFor();await shot('return-after-playback');
 await page.close();
}
await browser.close();
const body=images.map(({stage,name,path})=>`<section><h2>${stage} · ${name}</h2><img alt="${stage} ${name}" src="data:image/png;base64,${readFileSync(path).toString('base64')}"></section>`).join('');
writeFileSync('docs/design/intro-controls-review/index.html',`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>soulfire · introduction controls</title><style>body{font:17px/1.6 system-ui;background:#f5f2e7;color:#254a3e;margin:32px}main{max-width:1300px;margin:auto}img{max-width:100%;height:auto;border-radius:16px}section{margin:36px 0}h1,h2{font-family:Georgia}</style><main><h1>soulfire · introduction controls</h1><p>Actual isolated Mac Chrome captures from the authoritative project at /Users/miguelalvarado/Coding/soulfire. First visit and returns without playback show Play introduction beside Begin journey. Only actual playback enables Replay introduction. No visible transcript panel; captions remain optional. All images are embedded.</p>${body}</main></html>`);
