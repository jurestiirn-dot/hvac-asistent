import { test, expect } from '@playwright/test'

test('home and lessons open', async ({ page }) => {
  await page.goto('http://localhost:5173')
  await expect(page.locator('text=Lekcije')).toHaveCount(1)
  await page.click('text=Lekcije')
  await expect(page).toHaveURL(/lessons/)
  await expect(page.locator('text=Filtracija Zraka in Koncept Kaskade')).toBeVisible()
})
