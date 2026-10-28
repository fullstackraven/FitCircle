import type {Page} from '@playwright/test';

/** Explicit non-action surfaces retain their own interaction geometry. */
export async function pillGeometry(page: Page) {
  return page.evaluate(() => {
    const failures: unknown[] = [];
    for (const el of document.querySelectorAll<HTMLElement>('button, select, [role="combobox"], input[type="search"], input[aria-label*="search" i], input[placeholder*="search" i], .fc-search-group')) {
      if (!el.checkVisibility() || el.closest('[aria-hidden="true"]')) continue;
      if (el.matches('.dock-tab, .food-scan-action, [data-testid="button-create-custom-food"], [role="checkbox"], [role="switch"], .settings-toggle, [data-control-geometry]')) continue;
      const css = getComputedStyle(el), rect = el.getBoundingClientRect();
      const radius = css.borderTopLeftRadius.includes('%') ? Math.min(rect.width,rect.height)*parseFloat(css.borderTopLeftRadius)/100 : parseFloat(css.borderTopLeftRadius);
      const name = el.getAttribute('aria-label') || el.title || el.textContent?.trim().slice(0,70);
      if (radius < Math.min(rect.width,rect.height)/2 - .5) failures.push({name,kind:'not-pill',radius,width:rect.width,height:rect.height,className:el.className});
      if (el.classList.contains('fc-icon-button') && Math.abs(rect.width-rect.height) > 1) failures.push({name,kind:'not-circle',width:rect.width,height:rect.height});
    }
    return failures;
  });
}
