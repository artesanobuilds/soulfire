import { chromium } from '@playwright/test';
const b = await chromium.launch({args:['--mute-audio'],executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
for (const [name,width,height] of [['desktop',1440,1000],['mobile',390,844]]) {
 const p=await b.newPage({viewport:{width,height},reducedMotion:'reduce'});
 await p.goto('http://127.0.0.1:3100'); await p.getByText('AI is not connected',{exact:false}).waitFor();
 const shot=async(label)=>{if(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw new Error(`Overflow ${name} ${label}`);await p.screenshot({path:`docs/design/zen-review/${label}-${name}.png`,fullPage:true});};
 await shot('after'); await p.getByRole('button',{name:/Try the example/}).click(); await shot('suggestion');await p.getByRole('button',{name:'Try this practice'}).click();await shot('practice');await p.getByRole('button',{name:'Continue',exact:true}).click();await shot('quiet');await p.getByRole('button',{name:'Skip quiet and reflect'}).click();await shot('reflection');await p.getByRole('button',{name:'Keep private & continue'}).click();await shot('action');await p.close();
}await b.close();
