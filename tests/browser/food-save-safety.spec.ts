import { test, expect } from '@playwright/test';
const key = 'fitcircle_food_database';
const food = { id: 'custom-synthetic', name: 'Synthetic saved food', quantity: 100, unit: 'g', calories: 100, carbs: 10, protein: 5, fat: 1 };
test('failed food edit stays open, shows an error and preserves source through reload and retry', async ({ page }) => {
  await page.goto('profile');
  await page.evaluate(({key,food}) => { localStorage.setItem(key,JSON.stringify([food])); localStorage.setItem('fitcircle_food_database_migrated','true'); },{key,food});
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key,value) { if (key === 'fitcircle_food_database' && !sessionStorage.getItem('synthetic-allow-save')) throw new DOMException('Synthetic quota failure','QuotaExceededError'); return original.call(this,key,value); };
  });
  await page.goto('food-database');
  await page.getByTestId(`button-edit-${food.id}`).click();
  await page.getByRole('dialog').locator('input').first().fill('Synthetic edited food');
  await page.getByTestId('button-save-edit').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByText('Failed to update food. Please try again.', { exact: true })).toBeVisible();
  expect(await page.evaluate(key => localStorage.getItem(key),key)).toBe(JSON.stringify([food]));
  await page.reload();
  await expect(page.getByText(food.name,{exact:true})).toBeVisible();
  await page.evaluate(() => sessionStorage.setItem('synthetic-allow-save','yes'));
  await page.getByTestId(`button-edit-${food.id}`).click();
  await page.getByRole('dialog').locator('input').first().fill('Synthetic edited food');
  await page.getByTestId('button-save-edit').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText('Synthetic edited food',{exact:true})).toBeVisible();
});
