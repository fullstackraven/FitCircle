import {test,expect} from '@playwright/test';
test.use({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
test('live theme changes update the root paint and browser metadata without reload',async({page})=>{
 await page.goto('display');const navigation=await page.evaluate(()=>performance.timeOrigin);
 await page.evaluate(()=>{(window as any).originalThemeMeta=document.querySelector('meta[name="theme-color"]');});
 for(const [mode,color,rgb] of [['Light','#f8fafc','rgb(248, 250, 252)'],['Dark','#0f172a','rgb(15, 23, 42)'],['Light','#f8fafc','rgb(248, 250, 252)']]){
  await page.getByRole('group',{name:'Appearance',exact:true}).getByText(mode,{exact:true}).click();
  await expect(page.locator('meta[name="theme-color"]')).toHaveCount(1);await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content',color);
  expect(await page.evaluate(()=>getComputedStyle(document.documentElement).backgroundColor)).toBe(rgb);
  expect(await page.evaluate(()=>performance.timeOrigin)).toBe(navigation);
 }
 expect(await page.evaluate(()=>document.querySelector('meta[name="theme-color"]')!==(window as any).originalThemeMeta)).toBe(true);
 await page.getByRole('group',{name:'Appearance',exact:true}).getByText('System',{exact:true}).click();
 await page.emulateMedia({colorScheme:'dark'});await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content','#0f172a');
 await page.emulateMedia({colorScheme:'light'});await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content','#f8fafc');
});
for(const route of ['./','routines','calendar','wellness','reminders'])test(`touch dashboard opening on ${route} focuses the menu, retaining keyboard navigation`,async({page})=>{
 await page.goto(route);await page.getByRole('button',{name:'Open Menu',exact:true}).tap();
 const dialog=page.getByRole('dialog',{name:'Navigation Menu'});await expect(dialog).toBeFocused();
 const profile=dialog.getByRole('button',{name:/My Fitness Profile/});await expect(profile).not.toBeFocused();
 await page.keyboard.press('Tab');await expect(profile).toBeFocused();
 expect(await profile.evaluate(el=>el.matches(':focus-visible'))).toBe(true);
 await page.keyboard.press('Escape');await expect(dialog).toBeHidden();await expect(page.getByRole('button',{name:'Open Menu',exact:true})).toBeFocused();
});
