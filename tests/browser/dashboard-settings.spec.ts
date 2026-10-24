import { test, expect } from '@playwright/test';
import { textContrast } from '../fixtures/appearance-contrast';
import { seedAppearance } from '../fixtures/appearance-pages';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
const FITCIRCLE_URL = 'https://fullstackraven.github.io/FitCircle/';
const require = createRequire(import.meta.url);
const { BinaryBitmap, HybridBinarizer, RGBLuminanceSource, QRCodeReader } = require('@zxing/library') as typeof import('@zxing/library');
const { PNG } = require('../../node_modules/playwright-core/lib/utilsBundle.js');
const review = 'docs/review/dashboard-settings-revamp';
test.use({viewport:{width:390,height:844},timezoneId:'America/New_York'});
async function seed(page: import('@playwright/test').Page, mode='dark') {
  await seedAppearance(page);
  await page.evaluate(mode=>localStorage.setItem('fitcircle_appearance',mode),mode);
  await page.goto('./');
}
async function fitnessBytes(page: import('@playwright/test').Page) {
  return page.evaluate(()=>Object.fromEntries(['workout-tracker-data','fitcircle_profile','fitcircle_reminders'].map(k=>[k,localStorage.getItem(k)])));
}
for(const width of [390,320]) for(const mode of ['dark','light']) {
  test(`${mode} ${width}: dashboard, new destinations, QR and legal scrolling preserve records`, async({page})=>{
    test.setTimeout(90000);
    await page.setViewportSize({width,height:844}); await seed(page,mode); const before=await fitnessBytes(page);
    await page.getByRole('button',{name:'Open Menu',exact:true}).click();
    const sheet=page.getByRole('dialog',{name:'Navigation Menu'});
    fs.mkdirSync(`${review}/${mode}-${width}`,{recursive:true});
    await page.screenshot({path:`${review}/${mode}-${width}/dashboard.png`,animations:'disabled'});
    const names=await sheet.locator('nav button').allTextContents();
    expect(names[0]).toContain('My Fitness Profile');expect(names.slice(1)).toEqual(['Account Data','Display','Share','About']);
    await sheet.getByRole('button',{name:'About',exact:true}).click(); await expect(sheet).toBeHidden();
    await page.getByRole('button',{name:'Privacy Policy',exact:true}).click();
    await expect(page.getByRole('heading',{name:'Privacy Policy',exact:true})).toBeVisible();
    await page.getByRole('link',{name:'FitCircle support on GitHub'}).scrollIntoViewIfNeeded();
    expect(await page.locator('.app-content').evaluate(el=>el.scrollTop)).toBeGreaterThan(300);
    await page.getByRole('button',{name:'Back',exact:true}).click();await expect(page.getByRole('heading',{name:'About',exact:true})).toBeVisible();
    await page.getByRole('button',{name:'Back',exact:true}).click();await expect(sheet).toBeVisible();
    await sheet.getByRole('button',{name:'Close',exact:true}).click();
    fs.mkdirSync(`${review}/${mode}-${width}`,{recursive:true});
    for(const route of ['account-data','display','share','about','about/terms','about/privacy','about/licenses']) {
      await page.goto(route); await expect(page.locator('html')).toHaveAttribute('data-appearance',mode);
      await expect(page.locator('#fitcircle-startup')).toHaveCount(0); await page.evaluate(()=>document.fonts.ready);
      if(route==='account-data') {await expect(page.getByRole('heading',{name:'Complete Data Backup'})).toBeVisible();await expect(page.getByRole('heading',{name:'Danger Zone'})).toBeVisible();await expect(page.getByRole('heading',{name:'Appearance',exact:true})).toHaveCount(0);}
      if(route==='display') {await expect(page.getByRole('radio',{name:mode==='dark'?'Dark':'Light',exact:true})).toBeChecked();await expect(page.getByRole('heading',{name:'Complete Data Backup'})).toHaveCount(0);}
      if(route==='share') {
        await expect(page.getByRole('link',{name:FITCIRCLE_URL,exact:true})).toHaveAttribute('href',FITCIRCLE_URL);
        const image=PNG.sync.read(await page.getByTestId('share-qr').screenshot());
        const rgb=new Int32Array(image.width*image.height);for(let i=0;i<rgb.length;i++)rgb[i]=(image.data[i*4]<<16)|(image.data[i*4+1]<<8)|image.data[i*4+2];
        expect(new QRCodeReader().decode(new BinaryBitmap(new HybridBinarizer(new RGBLuminanceSource(rgb,image.width,image.height)))).getText()).toBe(FITCIRCLE_URL);
      }
      if(route==='about/licenses') {await expect(page.locator('details').first()).toBeVisible();await page.locator('details').first().locator('summary').click();}
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      if(mode==='light') { const contrast=await textContrast(page); expect(contrast.failures,route).toEqual([]); fs.writeFileSync(`${review}/${mode}-${width}/${route.replaceAll('/','-')}-contrast.json`,JSON.stringify(contrast,null,2)); }
      await page.screenshot({path:`${review}/${mode}-${width}/${route.replaceAll('/','-')}.png`,animations:'disabled'});
      const last = route==='account-data' ? page.getByRole('button',{name:'Erase All Data',exact:true})
        : route==='display' ? page.getByRole('group',{name:'Appearance',exact:true}).getByText('System',{exact:true})
        : route==='about/licenses' ? page.locator('details').last().locator('summary')
        : route.startsWith('about/') ? page.getByRole('link',{name:'FitCircle support on GitHub'}) : null;
      if(last) { await last.scrollIntoViewIfNeeded(); const bounds=await last.boundingBox(); const dock=await page.locator('.app-dock').boundingBox(); expect(bounds!.y+bounds!.height).toBeLessThanOrEqual(dock!.y); }

    }
    await page.goto('about');const built=fs.readFileSync('dist/index.html','utf8');expect(built).toContain('assets/index-');
    await expect(page.getByTestId('about-version')).toHaveText(`${JSON.parse(fs.readFileSync('package.json','utf8')).version} (${execFileSync('git',['rev-parse','--short=8','HEAD'],{encoding:'utf8'}).trim()})`);
    expect(await fitnessBytes(page)).toEqual(before);
  });
}

for(const route of ['', 'routines', 'calendar', 'wellness', 'reminders']) test(`${route || 'home'} dashboard destinations return to their own sheet`,async({page})=>{
  await seed(page);
  await page.goto(route||'./');await page.getByRole('button',{name:'Open Menu',exact:true}).click();
  const sheet=page.getByRole('dialog',{name:'Navigation Menu'});
  for(const destination of ['My Fitness Profile','Account Data','Display','Share','About']) {
    await sheet.getByRole('button',{name:destination==='My Fitness Profile'?/My Fitness Profile/:destination,exact:destination!=='My Fitness Profile'}).click();
    await expect(sheet).toBeHidden();await page.getByRole('button',{name:'Back',exact:true}).click();await expect(sheet).toBeVisible();
    expect(new URL(page.url()).pathname).toBe(`/FitCircle/${route}`);
  }
  await sheet.getByRole('button',{name:'Close',exact:true}).click();
});

test('Account Data retains export, rejected/cancelled restore and erase confirmation',async({page})=>{
  await seed(page);const before=await fitnessBytes(page);await page.goto('account-data');
  const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'Download Complete Backup',exact:true}).click();
  const download=await downloaded;const backup=JSON.parse(fs.readFileSync((await download.path())!,'utf8'));expect(backup.localStorage['workout-tracker-data']).toBe(before['workout-tracker-data']);
  await page.locator('input[type=file]').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{')});
  await expect(page.getByText(/Import failed:/)).toBeVisible();
  page.once('dialog',d=>d.dismiss());await page.locator('input[type=file]').setInputFiles({name:'valid.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});await expect(page.getByText('Restore cancelled.')).toBeVisible();
  await page.getByRole('button',{name:'Erase All Data',exact:true}).click();await expect(page.getByRole('button',{name:'Yes, Erase Everything',exact:true})).toBeVisible();await page.getByRole('button',{name:'Cancel',exact:true}).click();
  expect(await fitnessBytes(page)).toEqual(before);
  await page.evaluate(()=>localStorage.setItem('fitcircle_profile',JSON.stringify({primaryObjective:'Changed synthetic objective'})));
  page.once('dialog',d=>d.accept());await page.locator('input[type=file]').setInputFiles({name:'restore.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});
  await page.waitForURL('**/FitCircle/');expect(await fitnessBytes(page)).toEqual(before);
});

test('Display moves live appearance and Controls without new preference storage',async({page})=>{
  await seed(page);const before=await fitnessBytes(page);await page.goto('display');
  for(const name of ['Hide Quote of the Day',"Hide Today's Totals",'Hide Recent Activity'])await page.getByRole('button',{name,exact:true}).click();
  await page.getByRole('group',{name:'Appearance',exact:true}).getByText('Light',{exact:true}).click();await expect(page.locator('html')).toHaveAttribute('data-appearance','light');
  await page.reload();await expect(page.getByRole('radio',{name:'Light',exact:true})).toBeChecked();
  await page.getByRole('group',{name:'Appearance',exact:true}).getByText('System',{exact:true}).click();await page.emulateMedia({colorScheme:'dark'});await expect(page.locator('html')).toHaveAttribute('data-appearance','dark');await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).toHaveAttribute('data-appearance','light');
  await page.goto('./');await expect(page.getByText('Success is not final, failure is not fatal: it is the courage to continue that counts.')).toHaveCount(0);
  await page.goto('display');for(const name of ['Hide Quote of the Day',"Hide Today's Totals",'Hide Recent Activity'])await expect(page.getByRole('button',{name,exact:true})).toHaveAttribute('aria-pressed','true');
  expect(await fitnessBytes(page)).toEqual(before);
});

test('Share handles copy/share success, failures, cancellation, fallback and offline reload',async({page,context})=>{
  await seed(page);
  await page.addInitScript(()=>{
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async(value:string)=>{(window as any).copied=value;}}});
    Object.defineProperty(navigator,'share',{configurable:true,value:async(data:unknown)=>{(window as any).shared=data;}});
  });
  await page.goto('share');await page.getByRole('button',{name:'Copy Link',exact:true}).click();await expect(page.getByRole('status')).toHaveText('Link copied.');expect(await page.evaluate(()=>(window as any).copied)).toBe(FITCIRCLE_URL);
  await page.getByRole('button',{name:'Share',exact:true}).click();await expect(page.getByRole('status')).toHaveText('Share completed.');expect(await page.evaluate(()=>(window as any).shared.url)).toBe(FITCIRCLE_URL);
  await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw new Error('denied');}}});});await page.getByRole('button',{name:'Copy Link',exact:true}).click();await expect(page.getByRole('status')).toContainText('Could not copy');
  await page.evaluate(()=>{Object.defineProperty(navigator,'share',{value:async()=>{throw new DOMException('Cancelled','AbortError');}});});await page.getByRole('button',{name:'Share',exact:true}).click();await expect(page.getByRole('status')).toBeEmpty();
  await page.evaluate(()=>{Object.defineProperty(navigator,'share',{value:async()=>{throw new Error('failed');}});});await page.getByRole('button',{name:'Share',exact:true}).click();await expect(page.getByRole('status')).toContainText('Could not share');
  await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);await page.reload();await expect(page.getByTestId('share-qr')).toBeVisible();await page.getByRole('button',{name:'Copy Link',exact:true}).click();await expect(page.getByRole('status')).toHaveText('Link copied.');await page.goto('about/licenses');await expect(page.locator('details').first()).toBeVisible();
});

test('unsupported Web Share keeps a usable copy fallback',async({page})=>{
  await page.addInitScript(()=>{Object.defineProperty(navigator,'share',{value:undefined});Object.defineProperty(navigator,'clipboard',{value:undefined});document.execCommand=()=>false;});
  await page.goto('share');await expect(page.getByRole('button',{name:'Share',exact:true})).toHaveCount(0);await page.getByRole('button',{name:'Copy Link',exact:true}).click();await expect(page.getByRole('status')).toContainText('Could not copy');
});


test('new nested legal routes recover through the existing Pages 404 and retain their parent',async({page})=>{
  await page.emulateMedia({colorScheme:'light'});
  await page.goto('profile');await page.evaluate(()=>localStorage.setItem('fitcircle_appearance','system'));
  await page.route('**/FitCircle/about/privacy?from=dashboard&returnTo=%2Freminders',async route=>{
    const response=await route.fetch({url:'http://127.0.0.1:4173/FitCircle/404.html'});
    await route.fulfill({response,status:404});
  },{times:1});
  await page.goto('about/privacy?from=dashboard&returnTo=%2Freminders');
  await expect(page.getByRole('heading',{name:'Privacy Policy',exact:true})).toBeVisible();await expect(page.locator('html')).toHaveAttribute('data-appearance','light');
  await page.getByRole('button',{name:'Back',exact:true}).click();await expect(page.getByRole('heading',{name:'About',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Back',exact:true}).click();await expect(page.getByRole('dialog',{name:'Navigation Menu'})).toBeVisible();expect(new URL(page.url()).pathname).toBe('/FitCircle/reminders');
});


test('profile summary reuses saved name and objective, while the existing profile retains personal goals and links',async({page})=>{
  await seed(page);await page.evaluate(()=>{
    localStorage.setItem('fitcircle_username','Synthetic Robin');localStorage.setItem('fitcircle_fitness_goal','Run a comfortable 5 km');
    const profile=JSON.parse(localStorage.getItem('fitcircle_profile')!);profile.primaryObjective='Build strength';localStorage.setItem('fitcircle_profile',JSON.stringify(profile));
  });
  const before=await fitnessBytes(page);await page.getByRole('button',{name:'Open Menu',exact:true}).click();const card=page.getByRole('button',{name:/My Fitness Profile/});
  await expect(card).toContainText('Synthetic Robin');await expect(card).toContainText('Build strength');await card.click();await expect(page.getByText('Run a comfortable 5 km',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Edit Profile',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Edit Fitness Goals',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Body Measurements',exact:false})).toBeVisible();await expect(page.getByRole('button',{name:'View Workout Statistics',exact:true})).toBeVisible();
  expect(await fitnessBytes(page)).toEqual(before);
});

test('Display keeps Force Refresh errors visible and usable when offline',async({page,context})=>{
  await seed(page);await page.goto('display');await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);await page.getByRole('button',{name:'Force Refresh App',exact:true}).click();
  await expect(page.getByRole('status')).toContainText('You are offline. Reconnect before checking for app updates.');await expect(page.getByRole('button',{name:'Force Refresh App',exact:true})).toBeEnabled();expect(new URL(page.url()).pathname).toBe('/FitCircle/display');
});


test('Display keyboard appearance selection and legacy clipboard fallback remain accessible',async({page})=>{
  await page.goto('display');const dark=page.getByRole('radio',{name:'Dark',exact:true});await dark.focus();await dark.press('ArrowRight');await expect(page.getByRole('radio',{name:'System',exact:true})).toBeChecked();
  await page.addInitScript(()=>{Object.defineProperty(navigator,'clipboard',{value:undefined});document.execCommand=()=>{(window as any).copied=document.querySelector('textarea')?.value;return true;};});
  await page.goto('share');await page.getByRole('button',{name:'Copy Link',exact:true}).click();await expect(page.getByRole('status')).toHaveText('Link copied.');expect(await page.evaluate(()=>(window as any).copied)).toBe(FITCIRCLE_URL);await expect(page.locator('textarea')).toHaveCount(0);
});


test('profile recovery keeps the originating dashboard and preserves malformed records',async({page})=>{
  await seed(page);await page.evaluate(()=>localStorage.setItem('fitcircle_profile','{'));
  await page.goto('profile?from=dashboard&returnTo=%2Froutines');await page.getByRole('button',{name:'Open Account Data',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Account Data',exact:true})).toBeVisible();await page.getByRole('button',{name:'Back',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Navigation Menu'})).toBeVisible();expect(new URL(page.url()).pathname).toBe('/FitCircle/routines');expect(await page.evaluate(()=>localStorage.getItem('fitcircle_profile'))).toBe('{');
});
