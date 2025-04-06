import traceback  # For detailed error logging
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.firefox.service import Service as FirefoxService
from selenium.webdriver.edge.service import Service as EdgeService
from webdriver_manager.chrome import ChromeDriverManager
from webdriver_manager.firefox import GeckoDriverManager
from webdriver_manager.microsoft import EdgeChromiumDriverManager
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.firefox.options import Options as FirefoxOptions
from selenium.webdriver.edge.options import Options as EdgeOptions
from bs4 import BeautifulSoup
import requests

def get_driver(browser="chrome"):
    """Returns a Selenium WebDriver instance based on the chosen browser."""
    try:
        if browser.lower() == "chrome":
            options = ChromeOptions()
            options.add_argument("--headless")
            options.add_argument("--disable-gpu")
            options.add_argument("--no-sandbox")
            service = ChromeService(ChromeDriverManager().install())
            driver = webdriver.Chrome(service=service, options=options)

        elif browser.lower() == "firefox":
            options = FirefoxOptions()
            options.add_argument("--headless")
            service = FirefoxService(GeckoDriverManager().install())
            driver = webdriver.Firefox(service=service, options=options)

        elif browser.lower() == "edge":
            options = EdgeOptions()
            options.add_argument("--headless")
            service = EdgeService(EdgeChromiumDriverManager().install())
            driver = webdriver.Edge(service=service, options=options)

        else:
            raise ValueError("Unsupported browser. Use 'chrome', 'firefox', or 'edge'.")
        
        return driver

    except Exception as e:
        print(f"[ERROR] WebDriver initialization failed: {e}")
        print(traceback.format_exc())  # Show full traceback for debugging
        return None  # Return None if driver setup fails

def crawl_url(url, browser="chrome"):
    """Crawls a webpage using BeautifulSoup for static content and Selenium for dynamic content."""
    soup, selenium_soup = None, None
    
    # Try fetching with requests (for static content)
    try:
        response = requests.get(url, timeout=10, headers={"User-Agent": "Mozilla/5.0"})
        response.raise_for_status()  # Raises HTTPError if status is 4xx/5xx
        soup = BeautifulSoup(response.text, "html.parser")
        print(response)
    except Exception as e:
        print(f"[ERROR] Static crawling failed for {url}: {e}")
        print(traceback.format_exc())  # Show full traceback

    # Initialize Selenium WebDriver
    driver = get_driver(browser)
    
    if driver:
        try:
            driver.get(url)
            selenium_page = driver.page_source
            selenium_soup = BeautifulSoup(selenium_page, "html.parser")
        except Exception as e:
            print(f"[ERROR] Dynamic crawling failed for {url}: {e}")
            print(traceback.format_exc())  # Show full traceback
        finally:
            driver.quit()  # Ensure WebDriver is closed after crawling

    return soup, selenium_soup

def analyze_issues(soup, selenium_soup):
    """Analyzes the page for SEO and UI/UX issues and returns a list of issue IDs."""
    issues = []

    # --- EXISTING CHECKS ---
    
    # 1️⃣ Missing meta description (SEO)
    if soup and not soup.find("meta", attrs={"name": "description"}):
        issues.append(1)

    # 2️⃣ Page contains inline styles (UI/UX)
    if selenium_soup and selenium_soup.find_all(style=True):
        issues.append(2)

    # 3️⃣ Missing H1 tag (SEO)
    if soup and not soup.find("h1"):
        issues.append(3)

    # 4️⃣ Broken images (UI/UX)
    if selenium_soup:
        broken_images = [img["src"] for img in selenium_soup.find_all("img") if not img.get("src") or img["src"] == "#"]
        if broken_images:
            issues.append(4)

    # --- NEWLY ADDED CHECKS ---
    
    # 5️⃣ Missing viewport meta tag (SEO)
    if soup and not soup.find("meta", attrs={"name": "viewport"}):
        issues.append(5)

    # 6️⃣ Broken external links (SEO)
    if selenium_soup:
        broken_links = [a["href"] for a in selenium_soup.find_all("a", href=True) if "http" in a["href"] and not requests.get(a["href"]).ok]
        if broken_links:
            issues.append(6)

    # 7️⃣ Large images (SEO)
    if selenium_soup:
        large_images = [img["src"] for img in selenium_soup.find_all("img") if img.get("src") and "data:image" not in img["src"]]
        if len(large_images) > 5:
            issues.append(7)

    # 8️⃣ Readability & long paragraphs (SEO)
    if soup:
        long_paragraphs = [p.text for p in soup.find_all("p") if len(p.text.split()) > 150]
        if long_paragraphs:
            issues.append(8)

    # 9️⃣ Duplicate headings (SEO)
    if soup:
        headings = [h.text.strip() for h in soup.find_all(["h1", "h2", "h3"]) if h.text.strip()]
        if len(headings) > len(set(headings)):
            issues.append(9)

    # 🔟 Canonical tag presence (SEO)
    if soup and not soup.find("link", attrs={"rel": "canonical"}):
        issues.append(10)

    # 1️⃣1️⃣ Too many external scripts (SEO)
    if selenium_soup:
        external_scripts = [script["src"] for script in selenium_soup.find_all("script", src=True)]
        if len(external_scripts) > 10:
            issues.append(11)

    # 1️⃣2️⃣ Excessive inline CSS (SEO)
    if selenium_soup and selenium_soup.find_all(style=True):
        issues.append(12)

    # 1️⃣3️⃣ Excessive redirects (SEO)
    try:
        response = requests.get(soup.base.get("href", ""), allow_redirects=True)
        if len(response.history) > 5:
            issues.append(13)
    except:
        pass

    # 1️⃣4️⃣ Sitemap.xml availability (SEO)
    try:
        sitemap_url = soup.base.get("href", "") + "/sitemap.xml"
        response = requests.get(sitemap_url)
        if response.status_code != 200:
            issues.append(14)
    except:
        pass

    # 1️⃣5️⃣ Structured data presence (SEO)
    if soup and not soup.find("script", attrs={"type": "application/ld+json"}):
        issues.append(15)

    # 1️⃣6️⃣ Keyword usage in content (SEO)
    if soup:
        body_text = soup.get_text().lower()
        keywords = ["SEO", "marketing", "content", "optimization"]
        keyword_count = sum(body_text.count(keyword) for keyword in keywords)
        if keyword_count < 3:
            issues.append(16)

    # 1️⃣7️⃣ Empty links & buttons (UI/UX)
    if selenium_soup:
        empty_links = [a for a in selenium_soup.find_all("a") if not a.text.strip()]
        empty_buttons = [btn for btn in selenium_soup.find_all("button") if not btn.text.strip()]
        if empty_links or empty_buttons:
            issues.append(17)

    # 1️⃣8️⃣ Button accessibility (UI/UX)
    if selenium_soup:
        inaccessible_buttons = [
            btn for btn in selenium_soup.find_all("button")
            if "aria-label" not in btn.attrs and "title" not in btn.attrs
        ]
        if inaccessible_buttons:
            issues.append(18)

    # 1️⃣9️⃣ Low contrast images (UI/UX)
    if selenium_soup:
        low_contrast_images = [
            img for img in selenium_soup.find_all("img")
            if img.get("alt", "").lower() in ["low contrast", "unreadable"]
        ]
        if low_contrast_images:
            issues.append(19)

    # 2️⃣0️⃣ No alt text for images (UI/UX)
    if selenium_soup:
        images_without_alt = [img for img in selenium_soup.find_all("img") if not img.get("alt")]
        if images_without_alt:
            issues.append(20)

    # 2️⃣1️⃣ Too many pop-ups (UI/UX)
    if selenium_soup:
        popups = selenium_soup.find_all(lambda tag: tag.name in ["div", "iframe"] and "popup" in tag.get("class", ""))
        if len(popups) > 3:
            issues.append(21)

    return issues  # Return all issue IDs

