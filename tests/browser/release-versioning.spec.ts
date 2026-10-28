import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import {appVersionLabel} from '../../client/src/lib/application-version';
const metadata=()=>JSON.parse(fs.readFileSync('dist/build-info.json','utf8'));
test.use({viewport:{width:390,height:844}});
for(const mode of ['dark','light'])test(`About and release history ${mode}`,async({page})=>{
 await page.goto('profile');await page.evaluate(mode=>{
  localStorage.setItem('fitcircle_appearance',mode);
  localStorage.setItem('workout-tracker-data',JSON.stringify({workouts:{x:{id:'x',name:'Unchanged workout',color:'green',dailyGoal:20,setsGoal:2,count:0}},dailyLogs:{},journalEntries:{},routines:{},lastDate:new Date().toLocaleDateString('en-CA')}));
 },mode);
 await page.goto('about');const before=await page.evaluate(()=>localStorage.getItem('workout-tracker-data'));
 await expect(page.getByTestId('about-version')).toHaveText(appVersionLabel(metadata()));await expect(page.getByTestId('about-build')).toHaveText(metadata().commit.slice(0,8));
 await expect(page.getByRole('button',{name:'Privacy Policy'})).toBeVisible();
 await page.screenshot({path:`docs/review/automatic-versioning/${mode}-about.png`,animations:'disabled'});
 await page.getByRole('button',{name:'View Release History'}).click();await expect(page.getByRole('heading',{name:'Release History',exact:true})).toBeVisible();
 await page.screenshot({path:`docs/review/automatic-versioning/${mode}-history.png`,animations:'disabled'});
 await page.getByRole('heading',{name:'FitCircle 2.0.0',exact:true}).scrollIntoViewIfNeeded();await expect(page.getByRole('heading',{name:'FitCircle 2.0.0',exact:true})).toBeInViewport();
 await page.setViewportSize({width:320,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByRole('button',{name:'Back',exact:true}).click();await expect(page.getByRole('heading',{name:'About',exact:true})).toBeVisible();
 expect(await page.evaluate(()=>localStorage.getItem('workout-tracker-data'))).toBe(before);
});
test('offline About and bundled history retain loaded metadata and Force Refresh keeps offline feedback',async({page,context})=>{
 await page.goto('about');await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
 await context.setOffline(true);await page.reload();await expect(page.getByTestId('about-version')).toHaveText(appVersionLabel(metadata()));
 await page.getByRole('button',{name:'View Release History'}).click();await expect(page.getByRole('heading',{name:'FitCircle 2.0.0',exact:true})).toBeAttached();
 await page.goto('display');await page.getByRole('button',{name:'Refresh FitCircle',exact:true}).click();await expect(page.getByRole('status')).toContainText('You are offline');
});
test('development preview identifies itself without claiming publication',async({page})=>{
 await page.goto('http://127.0.0.1:4184/FitCircle/about');await expect(page.getByTestId('about-version')).toHaveText('Development');await expect(page.getByTestId('about-released')).toHaveText('Not published');
});
test('matching publication receipt resolves only the running candidate and persists offline',async({page,context})=>{
 const build=metadata();
 const record={tag_name:`v${build.version}`,target_commitish:build.commit,published_at:'2026-10-27T16:00:00Z',body:'Synthetic verified publication for UI review',id:'deployment-123',version:build.version,commit:build.commit,buildId:build.buildId,artifactDigest:'c'.repeat(64),runId:'123',deploymentId:'123',releasedAt:'2026-10-27T16:00:00Z',changes:[{id:'test',pr:null,summary:'Synthetic verified publication for UI review',labels:['release:minor']}],previousId:'historical',historical:false};
 await page.route('https://api.github.com/repos/fullstackraven/FitCircle/releases/tags/**',route=>route.fulfill({json:record}));
 await page.goto('about');
 if(build.buildId){
  await expect(page.getByTestId('about-version')).toHaveText(build.version);await expect(page.getByTestId('about-released')).toHaveText('Oct 27, 2026');
  await page.screenshot({path:'docs/review/automatic-versioning/published-about-synthetic.png',animations:'disabled'});
 }else{await expect(page.getByTestId('about-version')).toHaveText('Development');await expect(page.getByTestId('about-released')).toHaveText('Not published');}
 await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
 await context.setOffline(true);await page.reload();await expect(page.getByTestId('about-version')).toHaveText(build.buildId?build.version:'Development');
});
