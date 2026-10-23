import { chromium } from '@playwright/test';
const browser=await chromium.launch({args:['--mute-audio'],executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844]]) {
 const p=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
 const shot=async(stage)=>{if(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error(`overflow ${stage} ${name}`); await p.screenshot({path:`docs/design/immersive-review/${stage}-${name}.png`,fullPage:true});};
 await p.goto('http://127.0.0.1:3100');await p.getByRole('button',{name:'Begin journey',exact:true}).waitFor();await shot('arrival');
 await p.getByRole('button',{name:'Begin journey',exact:true}).click();await shot('share');
 await p.getByRole('button',{name:/Try the example/}).click();await shot('suggestion');
 await p.getByRole('button',{name:'Try this practice'}).click();await shot('sort');
 await p.getByRole('button',{name:'Continue',exact:true}).click();await shot('reflect-prompt');
 await p.getByRole('button',{name:'Continue',exact:true}).click();await shot('action-prompt');
 await p.getByRole('button',{name:'Continue',exact:true}).click();await shot('quiet');
 await p.getByRole('button',{name:'Skip quiet and reflect'}).click();await shot('reflection');
 await p.getByRole('button',{name:'Keep private & continue'}).click();await shot('finish');await p.close();
}await browser.close();
