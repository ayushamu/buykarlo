import { test, expect } from '@playwright/test';

test.describe('BuyKarlo 2.0 Mobile UI Layout Tests', () => {
  test('should load the home page and verify marketplace header elements', async ({ page }) => {
    // Navigate to local marketplace root
    await page.goto('/');

    // Verify page title contains BuyKarlo
    await expect(page).toHaveTitle(/BuyKarlo/);

    // Verify main brand header logo/text is visible
    const brandHeader = page.locator('text=BuyKarlo').first();
    await expect(brandHeader).toBeVisible();

    // Wait for the hero section to confirm full page hydration.
    // "Trusted student marketplace for AMU" is inside the rendered hero body, NOT the navbar.
    await expect(page.locator('body')).toContainText(/Trusted student marketplace/i);
  });

  test('should display categories section correctly', async ({ page }) => {
    await page.goto('/');

    // Wait for the category buttons to actually render — proves hydration & content load done.
    // Both mobile pills and desktop sidebar render category buttons; wait for any "All Items" button.
    // Timeout is set high (40s) to handle cold BrowserStack tunnel + Supabase round-trip latency.
    await page.locator('button', { hasText: 'All Items' }).first().waitFor({ state: 'attached', timeout: 40000 });

    // Verify core category names are present in the page
    await expect(page.locator('body')).toContainText(/Electronics/i);
    await expect(page.locator('body')).toContainText(/Books/i);

    // Verify a visible category button exists using raw JS.
    // page.evaluate() bypasses the BrowserStack SDK's known issue where locator visibility
    // filters are silently dropped on real device Playwright proxying.
    // "All Items" is always the first rendered category and never filtered out.
    const isAllItemsVisible = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const allItemsBtns = buttons.filter(btn =>
        (btn.textContent ?? '').trim().includes('All Items')
      );
      return allItemsBtns.some(btn => {
        const rect = btn.getBoundingClientRect();
        const style = getComputedStyle(btn);
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          style.display !== 'none' &&
          style.visibility !== 'hidden'
        );
      });
    });
    expect(isAllItemsVisible).toBe(true);
  });

  test('should render mobile layout navigation on smaller viewports', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    // In mobile layout, MobileNav is rendered as a fixed container with links
    const mobileNavBar = page.locator('nav').filter({ hasText: /Home/i }).or(page.locator('nav').filter({ hasText: /Explore/i }));
    await expect(mobileNavBar.first()).toBeVisible();

    // Check for mobile navigation labels
    const homeTab = page.locator('nav').locator('text=Home').first();
    const exploreTab = page.locator('nav').locator('text=Explore').first();
    await expect(homeTab).toBeVisible();
    await expect(exploreTab).toBeVisible();
  });

  test('should keep product detail mobile layout inside viewport and above bottom nav', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.locator('a[href^="/item/"]').first().waitFor({ state: 'attached', timeout: 40000 }).catch(() => {});

    const productHref = await page.evaluate(() => {
      const link = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="/item/"]'))
        .find((anchor) => anchor.offsetWidth > 0 && anchor.offsetHeight > 0);
      return link?.getAttribute('href') ?? null;
    });

    test.skip(!productHref, 'No live product listing was available to verify the detail page.');

    await page.goto(productHref!);
    await page.getByRole('button', { name: /chat with seller/i }).first().waitFor({ state: 'visible', timeout: 40000 });

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));

    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth);

    const chatButton = page.getByRole('button', { name: /chat with seller/i }).first();
    const offerButton = page.getByRole('button', { name: /make an offer/i }).first();

    await expect(chatButton).toBeVisible();
    await expect(offerButton).toBeVisible();
    await offerButton.scrollIntoViewIfNeeded();

    const actionsClearBottomNav = await page.evaluate(() => {
      const nav = Array.from(document.querySelectorAll<HTMLElement>('nav'))
        .find((element) => {
          const style = getComputedStyle(element);
          return style.position === 'fixed' && /home/i.test(element.textContent ?? '');
        });
      const chat = Array.from(document.querySelectorAll('button'))
        .find((button) => /chat with seller/i.test(button.textContent ?? ''));
      const offer = Array.from(document.querySelectorAll('button'))
        .find((button) => /make an offer/i.test(button.textContent ?? ''));

      if (!nav || !chat || !offer) return false;

      const navRect = nav.getBoundingClientRect();
      const chatRect = chat.getBoundingClientRect();
      const offerRect = offer.getBoundingClientRect();

      return chatRect.bottom <= navRect.top && offerRect.bottom <= navRect.top;
    });

    expect(actionsClearBottomNav).toBe(true);
  });
});
