import { expect, type Page } from '@playwright/test';

/** Display intentionally reloads on a changed preference; wait for that navigation. */
export async function selectDisplayAppearance(page: Page, name: string) {
  const selected = await page.getByRole('radio', { name, exact: true }).isChecked();
  const click = () => page.getByRole('group', { name: 'Appearance', exact: true }).getByText(name, { exact: true }).click();
  if (selected) await click();
  else await Promise.all([page.waitForEvent('load'), click()]);
  await expect(page.getByRole('heading', { name: 'Display', exact: true })).toBeVisible();
  await expect(page.getByRole('radio', { name, exact: true })).toBeChecked();
}
