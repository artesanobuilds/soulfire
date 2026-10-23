import {chromium} from '@playwright/test';
const browser=await chromium.launch({headless:true,args:['--mute-audio'],executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
 const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
 const shot=async(stage)=>{if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error(`overflow ${name} ${stage}`);await page.screenshot({path:`docs/design/arrival-review/${stage}-${name}.png`,fullPage:true});};
 await page.goto('http://127.0.0.1:3100');await page.getByRole('button',{name:'Play introduction',exact:true}).waitFor();await shot('first-visit');
 await page.getByRole('button',{name:'Play introduction',exact:true}).click();await page.getByRole('button',{name:'Pause introduction',exact:true}).click();await shot('narration');
 await page.getByRole('button',{name:'Begin journey',exact:true}).click();await shot('first-prompt');
 await page.getByRole('button',{name:/Try the example/}).click();await page.getByRole('button',{name:'Try this practice'}).click();
 await page.getByText('Save and return later',{exact:true}).click();await page.getByRole('checkbox',{name:'Keep this practice on this device'}).check();
 await page.reload();await page.getByRole('heading',{name:'Welcome back.'}).waitFor();await shot('returning');
 await page.close();
}
await browser.close();
