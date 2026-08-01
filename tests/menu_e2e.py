from playwright.sync_api import sync_playwright

BASE = "http://localhost:3001"
PAGES = {
    "热点雷达": ("热点雷达", "#radar"),
    "智能创作": ("智能创作", "#create"),
    "内容资产": ("内容资产", "#assets"),
    "发布中心": ("发布中心", "#publish"),
    "工作台设置": ("工作台设置", "#settings"),
    "今日脉搏": ("早上好，今天有什么值得写？", "#dashboard"),
}

with sync_playwright() as p:
    print("e2e: launch", flush=True)
    browser = p.chromium.launch(headless=True, executable_path="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    errors = []
    page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
    page.goto(BASE, wait_until="networkidle")
    print("e2e: loaded", flush=True)
    for label, (heading, fragment) in PAGES.items():
        page.get_by_role("button", name=label).click()
        assert page.locator("h1").inner_text() == heading
        assert page.url.endswith(fragment)
        print(f"e2e: {label} ok", flush=True)
    page.reload(wait_until="networkidle")
    assert page.locator("h1").inner_text() == "早上好，今天有什么值得写？"
    page.get_by_role("button", name="搜索热点").click()
    assert page.locator("h1").inner_text() == "热点雷达"
    page.get_by_role("button", name="查看通知").click()
    assert page.locator(".toast").is_visible()
    assert page.evaluate("document.documentElement.scrollWidth === document.documentElement.clientWidth")
    assert not errors, f"browser console errors: {errors}"
    mobile = browser.new_page(viewport={"width": 390, "height": 844})
    mobile.goto(BASE, wait_until="networkidle")
    for label, (heading, _) in PAGES.items():
        mobile.get_by_role("button", name="设置" if label == "工作台设置" else label).click()
        assert mobile.locator("h1").inner_text() == heading
        assert mobile.evaluate("document.documentElement.scrollWidth === document.documentElement.clientWidth")
    assert mobile.locator("aside").evaluate("el => getComputedStyle(el).position") == "fixed"
    mobile.close()
    print("e2e: mobile navigation ok", flush=True)
    browser.close()
    print("e2e: all checks passed", flush=True)
