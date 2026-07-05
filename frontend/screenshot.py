import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1280, "height": 2000})
        await page.goto('file:///home/oligami/.gemini/antigravity-cli/brain/96a0278d-82bb-40a4-8b50-d411d0bd43ed/lh-report.html')
        await page.wait_for_timeout(2000)
        await page.screenshot(path='/home/oligami/.gemini/antigravity-cli/brain/96a0278d-82bb-40a4-8b50-d411d0bd43ed/lighthouse_screenshot.png', full_page=True)
        await browser.close()

asyncio.run(main())
