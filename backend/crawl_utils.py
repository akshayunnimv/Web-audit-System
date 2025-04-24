import traceback  
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
from selenium.webdriver.common.by import By  
import requests
import re
from colormath.color_objects import sRGBColor
from colormath.color_conversions import convert_color
from urllib.parse import urlparse 



def get_driver(browser="firefox"):
    """Returns a Selenium WebDriver instance based on the chosen browser."""
    try:
        if browser.lower() == "chrome":
            options = ChromeOptions()
            options.add_argument("--headless=new")
            options.add_argument("--disable-gpu")
            options.add_argument("--no-sandbox")
            service = ChromeService(executable_path=ChromeDriverManager().install())
            driver = webdriver.Chrome(service=service, options=options)

        elif browser.lower() == "firefox":
            options = FirefoxOptions()
            options.add_argument("--headless")
            service = FirefoxService(executable_path=GeckoDriverManager().install())
            driver = webdriver.Firefox(service=service, options=options)

        elif browser.lower() == "edge":
            options = EdgeOptions()
            options.add_argument("--headless=new")
            service = EdgeService(executable_path=EdgeChromiumDriverManager().install())
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
    global fetched_url 
    fetched_url=url
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

    
    # 5️⃣ Missing viewport meta tag (SEO)
    if soup and not soup.find("meta", attrs={"name": "viewport"}):
        issues.append(5)

    # 6️⃣ Broken external links (SEO)
    if selenium_soup:
        broken_links = [a["href"] for a in selenium_soup.find_all("a", href=True) if "http" in a["href"] and not requests.get(a["href"]).ok]
        if broken_links:
            issues.append(6)

    # 7️⃣ Large images (UI/UX)
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

    # 1️⃣2️⃣ Missing Title Tag (SEO)
    if soup and not soup.find("title"):
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
    # 2️⃣2️⃣ Missing robots.txt (SEO)
    
    try:
        base_url = ""

    # Try to get base URL from <base> tag
        if soup and soup.base and soup.base.get("href"):
            base_url = soup.base.get("href").strip()

    # Fallback to og:url meta tag if <base> is not found
        elif selenium_soup:
            og_url_tag = selenium_soup.find("meta", attrs={"property": "og:url"})
            if og_url_tag and og_url_tag.get("content"):
                base_url = og_url_tag["content"].strip()

    # Proceed to check robots.txt only if base_url was found
        if base_url:
            robots_url = f"{base_url.rstrip('/')}/robots.txt"
            response = requests.get(robots_url, timeout=5)
            if response.status_code != 200:
                issues.append(22)
    except Exception as e:
        print(f"Error checking robots.txt: {e}")
        issues.append(22) 


    # 2️⃣3️⃣Low-contrast text (UI/UX - Accessibility)
 

    def hex_to_rgb(hex_str):
        """Convert #rrggbb to RGB tuple"""
        hex_str = hex_str.lstrip('#')
        return tuple(int(hex_str[i:i+2], 16) for i in (0, 2, 4))

    def get_luminance(r, g, b):
        """Calculate relative luminance (WCAG formula)"""
        r, g, b = [x/255.0 for x in (r, g, b)]
        r = r/12.92 if r <= 0.03928 else ((r+0.055)/1.055)**2.4
        g = g/12.92 if g <= 0.03928 else ((g+0.055)/1.055)**2.4
        b = b/12.92 if b <= 0.03928 else ((b+0.055)/1.055)**2.4
        return 0.2126 * r + 0.7152 * g + 0.0722 * b

    if selenium_soup:
        low_contrast_elements = []
    
        for element in selenium_soup.find_all(style=True):
            style = element.get("style", "")
        
        # Extract colors
            bg_match = re.search(r'background-color:\s*(#[0-9a-fA-F]{6}|rgba?\([^)]+\))', style)
            text_match = re.search(r'color:\s*(#[0-9a-fA-F]{6}|rgba?\([^)]+\))', style)
        
            if bg_match and text_match:
                try:
                    bg_color = bg_match.group(1)
                    text_color = text_match.group(1)
                
                # Convert to RGB
                    if bg_color.startswith('#') and text_color.startswith('#'):
                        bg_rgb = hex_to_rgb(bg_color)
                        text_rgb = hex_to_rgb(text_color)
                    
                    # Calculate contrast ratio
                        L1 = get_luminance(*bg_rgb) + 0.05
                        L2 = get_luminance(*text_rgb) + 0.05
                        contrast = max(L1, L2) / min(L1, L2)
                    
                        if contrast < 4.5:  # WCAG AA threshold
                            low_contrast_elements.append({
                                "text": element.text[:50] + "...",
                                "contrast": round(contrast, 1)
                            })
                except:
                    continue
    
        if low_contrast_elements:
            issues.append(23)
    
    # 2️⃣4️⃣ Responsiveness issues (UI/UX)
    if selenium_soup:
        responsiveness_problems = False

    # Check for non-responsive viewport meta tag
        viewport_meta = selenium_soup.find("meta", attrs={"name": "viewport"})
        if not viewport_meta or "width=device-width" not in viewport_meta.get("content", ""):
            responsiveness_problems = True

    # Check for fixed-width containers
        fixed_width_elements = selenium_soup.find_all(
            style=lambda value: value and "width:" in value and "px" in value
        )
        if len(fixed_width_elements) > 3:
            responsiveness_problems = True

    #  Check for mobile-unfriendly tap targets (too small)
        small_tap_targets = selenium_soup.find_all(
            lambda tag: tag.name in ["a", "button"] and (
                int(tag.get("style", "").split("width:")[1].split("px")[0]) < 40
                if "width:" in tag.get("style", "") else False
            )
        )
        if small_tap_targets:
            responsiveness_problems = True

        if responsiveness_problems:
            issues.append(24)
    # 2️⃣5️⃣ Slow page speed (SEO)
    if selenium_soup:
        try:
        # Get the page load time using Selenium
            driver = get_driver()
            if driver:
                driver.get(fetched_url)  # You might need to pass URL here or store it earlier
                load_time = driver.execute_script(
                "   return performance.timing.loadEventEnd - performance.timing.navigationStart;"
                ) / 1000  # Convert to seconds
                driver.quit()
            
            # Consider a page slow if it takes more than 3 seconds to load
                if load_time > 3:
                 issues.append(25)
        except Exception as e:
            print(f"[WARNING] Could not measure page speed: {e}")
    # 2️⃣6️⃣ HTTPS security issues (SEO/Security)
    if selenium_soup:
        try:
            security_issue = False
            driver = get_driver()  # Get a new driver instance if needed
        
            if driver:
                driver.get(fetched_url)  # Ensure we've navigated to the page
            
                # 1. Check if page is HTTPS
                current_url = driver.current_url
                if not current_url.startswith('https://'):
                    security_issue = True
            
                # 2. Check for mixed content warnings
                mixed_content = driver.execute_script("""
                    return window.performance.getEntries().some(entry => 
                        (entry.initiatorType === 'img' || 
                        entry.initiatorType === 'script' ||
                        entry.initiatorType === 'stylesheet') && 
                        entry.name.startsWith('http://')
                    );
                """)
            
            # 3. Check for insecure form actions
                insecure_forms = driver.execute_script("""
                    return Array.from(document.forms).some(form => 
                        form.action && form.action.startsWith('http://')
                    );
                """)
            
                if mixed_content or insecure_forms:
                    security_issue = True
            
                if security_issue:
                    issues.append(26)
                
        except Exception as e:
            print(f"[WARNING] Could not check security issues: {e}")
        finally:
            if driver:
                driver.quit()  # Ensure driver is properly closed
                
    # 2️⃣7️⃣ Thin content (SEO)
    if selenium_soup:
        try:
            driver = get_driver()
            if driver:
                driver.get(fetched_url)  # Ensure we're on the right page
            
                # Get visible text from main content areas
                main_content = driver.execute_script(r"""
                    const selectors = ['main', 'article', '.main-content', '#content', 'body'];
                    let content = '';
                
                    for (const selector of selectors) {
                        const element = document.querySelector(selector);
                        if (element) {
                            // Create a clean clone without non-content elements
                            const clone = element.cloneNode(true);
                            clone.querySelectorAll('script, style, nav, footer, iframe, noscript, svg').forEach(el => el.remove());
                        
                            // Get text content and clean it up
                            let text = clone.textContent
                                .replace(/\s+/g, ' ')      // Collapse whitespace
                                .replace(/[\u200B-\u200D\uFEFF]/g, '')  // Remove zero-width spaces
                                .trim();
                            
                            if (text.length > 0) {
                                content += ' ' + text;
                            }
                        }
                    }
                    return content.trim();
                """)
            
            # Count words (more accurate counting)
                if main_content:
                    word_count = len([word for word in main_content.split() if len(word) > 2])  # Ignore very short "words"
                
                # Consider content thin if under 300 words (adjustable threshold)
                    if word_count < 300:
                        issues.append(27)
                    
        except Exception as e:
            print(f"[WARNING] Could not check content thickness: {e}")
        finally:
            if driver:
                driver.quit()
    # 2️⃣8️⃣ Orphan pages (SEO)
    if selenium_soup:
        try:
            driver = get_driver()
            if driver:
                driver.get(fetched_url)  # Ensure we're on the right page
            
                # Get current page URL (cleaned)
                current_url = driver.current_url.split('#')[0].split('?')[0]
            
                # Check if any other pages link to this one
                is_orphan = driver.execute_script("""
                    try {
                        const currentPath = new URL(arguments[0]).pathname;
                        const allLinks = Array.from(document.querySelectorAll('a[href]'));
                    
                        // Check if any link points to our current page (excluding hidden/navigation links)
                        const hasInternalLink = allLinks.some(link => {
                            try {
                                const linkUrl = new URL(link.href, location.origin);
                                const isSamePage = linkUrl.pathname === currentPath;
                                const isSameOrigin = linkUrl.origin === location.origin;
                                const isVisible = !link.closest('[aria-hidden="true"], .hidden, [style*="display: none"]');
                            
                                return isSamePage && isSameOrigin && isVisible;
                            } catch(e) {
                                return false;
                            }
                        });
                    
                        return !hasInternalLink;
                    } catch(e) {
                        return false;
                    }
                """, current_url)
            
                if is_orphan:
                    issues.append(28)
                
        except Exception as e:
            print(f"[WARNING] Could not check for orphan pages: {e}")
        finally:
            if driver:
                driver.quit()
    # 2️⃣9️⃣ Non-descriptive URLs (SEO)
    if selenium_soup:
        try:
            driver = get_driver()
            if driver:
                driver.get(fetched_url)  # Ensure we're on the right page
            
                current_url = driver.current_url.lower()
                url_path = urlparse(current_url).path  # Extract just the path portion
            
                problematic_patterns = [
                    r'\d{5,}',                      # Long number sequences
                    r'[a-f0-9]{8}-[a-f0-9]{4}-',     # UUIDs (version 1-5)
                    r'(session|user)id=[a-z0-9]+',    # Session IDs
                    r'\?.*=\d+(&|$)',                # Numeric URL parameters
                    r'/(cgi-bin|api|v[0-9]+|admin)/',# Technical/backend paths
                    r'\.(php|asp|aspx|jsp)\?',       # Dynamic file extensions
                    r'[^a-z0-9/-]',                  # Non-alphanumeric chars
                    r'/([^/]+?)\1+/',                # Repeated segments
                    r'/(utm|source|ref)=[^&]+',      # Tracking parameters
                    r'/\d+/[^/]+$',                  # Number-segment URLs
                    r'/(index|default|main)\.[a-z]+$' # Default filenames
                ]
            
            # Additional quality checks
                url_quality_issues = 0
            
            # 1. Check against problematic patterns
                if any(re.search(pattern, url_path) for pattern in problematic_patterns):
                    url_quality_issues += 1
                
            # 2. Check URL length (more than 100 chars is problematic)
                if len(url_path) > 100:
                    url_quality_issues += 1
                
            # 3. Check for meaningful words (at least 3 words in path)
                meaningful_words = [word for word in re.findall(r'[a-z]+', url_path) if len(word) > 3]
                if len(meaningful_words) < 3:
                    url_quality_issues += 1
                
            # 4. Check directory depth (more than 4 levels is deep)
                if url_path.count('/') > 4:
                    url_quality_issues += 1
                
            # Flag if multiple issues found (adjust threshold as needed)
                if url_quality_issues >= 2:
                    issues.append(29)
                
        except Exception as e:
            print(f"[WARNING] Could not analyze URL structure: {e}")
        finally:
            if driver:
             driver.quit()
    
    # 3️⃣0️⃣ Large DOM size (Performance)
    if selenium_soup:
        try:
            driver = get_driver()
            if driver:
                driver.get(fetched_url)  # Ensure we're on the right page
            
                # Get comprehensive DOM metrics
                dom_stats = driver.execute_script("""
                    const serializeDOM = () => {
                        const serializer = new XMLSerializer();
                        let size = 0;
                        try {
                            size = serializer.serializeToString(document).length;
                        } catch(e) {
                            // Fallback for large documents
                            size = Array.from(document.querySelectorAll('*'))
                                .reduce((acc, node) => acc + (node.outerHTML || '').length, 0);
                        }
                        return size;
                    };
                
                    return {
                        nodeCount: document.querySelectorAll('*').length,
                        depth: maxNodeDepth(document.documentElement),
                        approxSizeKB: serializeDOM() / 1024,
                        iframeCount: document.querySelectorAll('iframe').length,
                        svgCount: document.querySelectorAll('svg').length
                    };
                
                    function maxNodeDepth(node, currentDepth = 0) {
                        if (!node.children || node.children.length === 0) return currentDepth;
                        return Math.max(...Array.from(node.children).map(
                            child => maxNodeDepth(child, currentDepth + 1)
                        ));
                    }
                """)
            
            # Check multiple performance thresholds
                if (dom_stats['nodeCount'] > 1500 or        # Total nodes > 1500
                    dom_stats['approxSizeKB'] > 800 or       # DOM size > 800KB
                    dom_stats['depth'] > 15 or               # Nesting depth > 15
                    dom_stats['iframeCount'] > 5 or          # Too many iframes
                    dom_stats['svgCount'] > 20):             # Excessive SVG elements
                    issues.append(30)
                
        except Exception as e:
            print(f"[WARNING] Could not analyze DOM size: {e}")
        finally:
            if driver:
                driver.quit()
    # 3️⃣1️⃣ Auto-playing media (Accessibility/UX)
    if selenium_soup:
        try:
            driver = get_driver()
            if driver:
                driver.get(fetched_url)  # Ensure we're on the right page
            
                autoplay_count = driver.execute_script("""
                    // Detect all potential auto-playing media elements
                    const mediaElements = Array.from(document.querySelectorAll(`
                        video[autoplay], 
                        audio[autoplay], 
                        [autoplay]:not([autoplay="false"]),
                        iframe[src*="youtube.com/embed/"],
                        iframe[src*="vimeo.com"],
                        iframe[src*="dailymotion.com"],
                        object[data*=".swf"],
                        embed[src*=".swf"]
                    `));
                
                    // Filter for actually playing media
                    return mediaElements.filter(el => {
                        // Check iframes (YouTube/Vimeo/DailyMotion)
                        if (el.tagName === 'IFRAME') {
                            try {
                                return el.src.includes('autoplay=1') || 
                                    el.src.includes('autoplay=true');
                            } catch {
                                return false;
                            }
                        }
                    
                        // Check Flash objects
                        if (el.tagName === 'OBJECT' || el.tagName === 'EMBED') {
                            return true; // Assume auto-playing for Flash
                        }
                    
                        // Check HTML5 media elements
                        if (el.tagName === 'VIDEO' || el.tagName === 'AUDIO') {
                            return !el.paused || 
                                (el.readyState > 0 && !el.ended) ||
                                el.muted; // Include muted autoplay
                        }
                    
                        return true;
                    }).length;
                """)
            
                if autoplay_count > 0:
                    issues.append(31)
                
        except Exception as e:
            print(f"[WARNING] Could not check for auto-playing media: {e}")
        finally:
            if driver:
                driver.quit()
    
    # 3️⃣2️⃣ Keyboard trap (Accessibility)
    if selenium_soup:
        try:
            driver = get_driver()
            if driver:
                driver.get(fetched_url)  # Ensure we're on the right page
            
                has_keyboard_trap = driver.execute_script("""
                    // Get all focusable elements in DOM order
                    const getFocusables = () => {
                        const focusables = Array.from(document.querySelectorAll(`
                            a[href], button, input, select, textarea,
                            [tabindex]:not([tabindex="-1"])
                        `)).filter(el => {
                            return !el.disabled && 
                                getComputedStyle(el).visibility !== 'hidden' &&
                                    el.offsetParent !== null;
                        });
                    
                        // Sort by tabindex and DOM order
                        return focusables.sort((a, b) => {
                            const aIndex = parseInt(a.tabIndex) || 0;
                            const bIndex = parseInt(b.tabIndex) || 0;
                            if (aIndex !== bIndex) return aIndex - bIndex;
                            return (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1;
                        });
                    };
                
                    const focusables = getFocusables();
                    if (focusables.length === 0) return false;
                
                    // Test keyboard navigation
                    const originalFocus = document.activeElement;
                    const trappedElements = new Set();
                    let currentFocus = null;
                
                    try {
                        // Start from first focusable or body
                        focusables[0].focus();
                    
                        // Tab through focusable elements (2 full cycles)
                        for (let cycle = 0; cycle < 2; cycle++) {
                            for (let i = 0; i < focusables.length; i++) {
                                document.dispatchEvent(new KeyboardEvent('keydown', {
                                    key: 'Tab',
                                    keyCode: 9,
                                    bubbles: true
                                }));
                            
                                currentFocus = document.activeElement;
                                if (!currentFocus || currentFocus === document.body) break;
                            
                                // Check if we're stuck on same element
                                if (trappedElements.has(currentFocus)) {
                                    return true;
                                }
                                trappedElements.add(currentFocus);
                            }
                        }
                    
                        // Check if we can escape modal/dialog
                        if (currentFocus && currentFocus.closest('[role="dialog"]')) {
                            const closeButtons = Array.from(currentFocus.querySelectorAll(`
                                [aria-label*="close" i],
                                [title*="close" i],
                                button:contains("Close")
                            `)).filter(b => b.tabIndex >= 0);
                        
                            if (closeButtons.length === 0) return true;
                        }
                    
                        return false;
                    } finally {
                        originalFocus?.focus(); // Restore original focus
                    }
                """)
            
                if has_keyboard_trap:
                    issues.append(32)
                
        except Exception as e:
            print(f"[WARNING] Could not check for keyboard traps: {e}")
        finally:
            if driver:
                driver.quit()
    
    # 3️⃣3️⃣ Render-blocking resources (Performance)
    if selenium_soup:
        try:
            driver = get_driver()
            if driver:
                driver.get(fetched_url)  # Ensure we're on the right page
            
                blocking_resources = driver.execute_script(r"""
                    // Get all render-blocking resources
                    const resources = window.performance.getEntriesByType('resource');
                    const docDomain = location.hostname;
                
                    const isBlocking = (res) => {
                        // Blocking CSS (without media="print" or disabled)
                        if (res.initiatorType === 'link' && 
                            res.name.match(/\.css($|\?)/i)) {
                            const link = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
                                .find(l => l.href === res.name);
                            return !(link && 
                                    (link.media === 'print' || 
                                    link.disabled ||
                                    link.getAttribute('data-optimized')));
                        }
                    
                        // Blocking JS (without defer/async/module)
                        if (res.initiatorType === 'script') {
                            const script = Array.from(document.querySelectorAll('script[src]'))
                                .find(s => s.src === res.name);
                            return script && 
                                !script.defer && 
                                !script.async && 
                                !script.type.includes('module') &&
                                !script.hasAttribute('data-noblock');
                        }
                    
                        // Blocking fonts (without preload)
                        if (res.initiatorType === 'css' && 
                            res.name.match(/\.(woff2?|ttf|eot|otf)($|\?)/i)) {
                            return !Array.from(document.querySelectorAll('link[rel="preload"]'))
                                .some(link => link.href === res.name && link.as === 'font');
                        }
                    
                        return false;
                    };
                
                    return resources.filter(res => {
                        // Only check same-domain resources (3rd party might be CDNs)
                        try {
                            const url = new URL(res.name);
                            if (!url.hostname.endsWith(docDomain)) return false;
                        } catch(e) {
                            return false;
                        }
                    
                        return isBlocking(res) && 
                            res.duration > 50; // Ignore very fast loads
                    }).map(res => ({
                        url: res.name,
                        type: res.initiatorType,
                        duration: res.duration,
                        size: res.transferSize
                    }));
                """)
            
            # Calculate blocking score
                if blocking_resources:
                    try:
                        score = sum(
                        min(float(res.get('duration', 0)) / 100, 3) *  # Duration penalty (up to 3x)
                        (1 if str(res.get('type', '')).lower() == 'link' else 1.5) *  # CSS vs JS weight
                        (1 if int(res.get('size', 0)) < 10240 else 2)  # Size penalty
                        for res in blocking_resources
                        if isinstance(res, dict) and  # Ensure it's a dictionary
                        'duration' in res and  # Must have duration
                        'type' in res and  # Must have type
                        'size' in res  # Must have size
                        )
        
                        if score > 5:  # Threshold based on comprehensive scoring
                            issues.append(33)
            
                    except (TypeError, ValueError, KeyError) as e:
                         print(f"[WARNING] Error calculating blocking resources score: {e}")
                            # Fallback to simple count if scoring fails
                            
                    if len(blocking_resources) > 3:
                        issues.append(33)
                    
        except Exception as e:
            print(f"[WARNING] Could not check render-blocking resources: {e}")
        finally:
            if driver:
                driver.quit()
  
   
    return issues  # Return all issue IDs


