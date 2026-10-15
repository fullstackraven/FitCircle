import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { captureViewportGeometry } from './viewport-probe.mjs';
const base = process.env.REVIEW_BASE_URL || 'http://127.0.0.1:4175/FitCircle/';
const strategies = [
  { name: 'A: existing dvh', css: '' },
  { name: 'B: fixed inset', css: '.app-shell{inset:0;height:auto}' },
  { name: 'C: document scroll (experiment only)', documentScroll: true, css: 'html,body{height:auto;min-height:100%}.app-shell{position:relative;inset:auto;height:auto;min-height:100dvh;display:block}.app-header{position:sticky;top:0}.app-content{overflow:visible;min-height:0}' },
  ...['vh','svh','lvh'].map(unit => ({ name: `D: 100${unit}`, css: `.app-shell{height:100${unit}}` })),
  { name: 'D: WebKit fill available', support: '-webkit-fill-available', css: '.app-shell{height:-webkit-fill-available}' },
  { name: 'E: standalone signal / existing metadata', standalone: true, css: '' },
  { name: 'E: standalone signal / no status tag (not installation emulation)', standalone: true, removeStatus: true, css: '' },
];
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined });
const results = [];
try {
 for (const strategy of strategies) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.addInitScript(({ standalone }) => {
    const nativeMatch = window.matchMedia.bind(window);
    window.matchMedia = query => { const result = nativeMatch(query); if (standalone && query === '(display-mode: standalone)') Object.defineProperty(result, 'matches', { value: true }); return result; };
    if (standalone) Object.defineProperty(navigator, 'standalone', { value: true, configurable: true });
    document.addEventListener('DOMContentLoaded', () => {
      document.documentElement.style.setProperty('--safe-top','59px'); document.documentElement.style.setProperty('--safe-bottom','34px');
    });
    const routines = Object.fromEntries(Array.from({length:8},(_,i)=>[`r${i}`,{id:`r${i}`,name:`Experiment ${i}`,selectedDays:[0,1,2,3,4,5,6],createdAt:'2026-01-01T12:00:00Z'}]));
    localStorage.setItem('workout-tracker-data',JSON.stringify({workouts:{},routines,dailyLogs:{},journalEntries:{}}));
  }, { standalone: Boolean(strategy.standalone) });
  if (strategy.removeStatus) await page.route('**/*', async route => {
    if (route.request().resourceType() !== 'document') return route.continue();
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace(/<meta name="apple-mobile-web-app-status-bar-style"[^>]*>/,'') });
  });
  await page.goto(new URL('wellness',base).href); await page.getByTestId('card-supplements').waitFor();
  if (strategy.support && !await page.evaluate(value => CSS.supports('height',value), strategy.support)) {
    results.push({ name:strategy.name,supported:false }); await context.close();continue;
  }
  if (strategy.css) await page.addStyleTag({ content: strategy.css });
  const geometry = await page.evaluate(captureViewportGeometry);
  const navBefore = await page.locator('.app-dock').boundingBox();
  await page.getByTestId('card-supplements').evaluate((el, documentScroll) => {
    const delta = el.getBoundingClientRect().top - (innerHeight - 40);
    if(documentScroll) window.scrollBy(0,delta); else document.querySelector('main').scrollTop += delta;
  }, Boolean(strategy.documentScroll));
  const intersectionBottom = await page.getByTestId('card-supplements').evaluate(el=>new Promise(resolve=>{
    const observer=new IntersectionObserver(([entry])=>{observer.disconnect();resolve(entry.intersectionRect.bottom)});observer.observe(el);
  }));
  await page.evaluate(documentScroll => {
    if(documentScroll) window.scrollTo(0,document.scrollingElement.scrollHeight);
    else document.querySelector('main').scrollTop=document.querySelector('main').scrollHeight;
  }, Boolean(strategy.documentScroll));
  const lastLogs = await page.getByTestId('card-supplements').boundingBox();
  const header = await page.getByRole('button',{name:'Open Menu'}).boundingBox();
  const navAfter = await page.locator('.app-dock').boundingBox();
  await page.evaluate(documentScroll => {
    if(documentScroll) window.scrollTo(0,(document.scrollingElement.scrollHeight-innerHeight)/2);
    else document.querySelector('main').scrollTop=document.querySelector('main').scrollHeight/2;
  }, Boolean(strategy.documentScroll));
  await page.getByRole('button',{name:'Open Menu'}).click();
  const sheet = page.getByRole('dialog',{name:'Navigation Menu'});
  await sheet.evaluate(el=>Promise.all(el.getAnimations().map(a=>a.finished.catch(()=>{}))));
  const close = await sheet.getByRole('button',{name:'Close',exact:true}).boundingBox();
  const ownerBefore=await page.evaluate(doc=>doc?scrollY:document.querySelector('main').scrollTop,Boolean(strategy.documentScroll));
  await page.mouse.move(380,450);await page.mouse.wheel(0,150);
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const ownerAfter=await page.evaluate(doc=>doc?scrollY:document.querySelector('main').scrollTop,Boolean(strategy.documentScroll));
  await sheet.getByRole('button',{name:'Close',exact:true}).click();await sheet.waitFor({state:'hidden'});
  await page.getByRole('button',{name:'Routines',exact:true}).click();await page.getByTestId('routine-header-r7').waitFor();
  const routeScroll=await page.evaluate(doc=>doc?scrollY:document.querySelector('main').scrollTop,Boolean(strategy.documentScroll));
  await page.evaluate(doc=>{if(doc)scrollTo(0,document.scrollingElement.scrollHeight);else document.querySelector('main').scrollTop=document.querySelector('main').scrollHeight},Boolean(strategy.documentScroll));
  const lastRoutine = await page.getByTestId('routine-header-r7').locator('..').boundingBox();
  const dock = await page.locator('.app-dock').boundingBox();
  results.push({name:strategy.name,supported:true,geometry,intersectionBottom,
    lastLogsClearsDock:lastLogs.y+lastLogs.height<=navAfter.y,lastRoutineClearsDock:lastRoutine.y+lastRoutine.height<=dock.y,
    dockStable:JSON.stringify(navBefore)===JSON.stringify(navAfter),headerControlTop:header.y,closeControlTop:close.y,
    backgroundWheelLocked:ownerBefore===ownerAfter,routeStartsAtTop:routeScroll===0,routeScroll});
  await context.close();
 }
} finally { await browser.close(); }
const output={ note:'Isolated Chromium experiments. Standalone signal is simulated, not an iOS host or installation. No production CSS is changed by this runner.',results };
if(process.argv[2]) await writeFile(process.argv[2],JSON.stringify(output,null,2));
console.log(JSON.stringify(results.map(({name,geometry,intersectionBottom,...r})=>({name,...r,mainBottom:geometry?.elements['.app-content']?.rect.bottom,shellBottom:geometry?.elements['.app-shell']?.rect.bottom,intersectionBottom})),null,2));
