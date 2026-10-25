import { expect, test } from '@playwright/test'

test('la pantalla de acceso responde', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'SIGAT · Durazno' })).toBeVisible()
  await expect(page.getByLabel('Correo institucional')).toBeVisible()
})
