import puppeteer, { Browser, Page } from "puppeteer";
import { IScraper, ScrapeResult, ScrapedMedia } from "./types";
import { config } from "../config";
import { forceGC, logMemoryUsage, isMemoryLow } from "../utils/memory";

/**
 * Puppeteer Scraper - Headless Chrome for JavaScript-heavy sites
 * Optimized for low memory usage (1GB RAM constraint)
 */
export class PuppeteerScraper implements IScraper {
  private timeout: number;
  private browser: Browser | null = null;
  private pageCount: number = 0;
  private readonly MAX_PAGES_BEFORE_RESTART = 10; // Restart browser after N pages to prevent memory leaks

  constructor() {
    this.timeout = config.scraper.timeout;
  }

  /**
   * Scrape a URL for images and videos using headless Chrome
   */
  async scrape(url: string): Promise<ScrapeResult> {
    let page: Page | null = null;

    try {
      console.log(`[Puppeteer] Scraping: ${url}`);

      // Check memory before scraping
      if (isMemoryLow(350)) {
        console.log("[Puppeteer] Memory low, triggering GC before scrape");
        forceGC();
        logMemoryUsage("Puppeteer Pre-scrape");
      }

      // Launch browser (or reuse existing)
      const browser = await this.getBrowser();
      page = await browser.newPage();

      // Set viewport to reduce memory usage
      await page.setViewport({ width: 1280, height: 720 });

      // Disable unnecessary resources to save bandwidth and memory
      if (config.puppeteer.disableImages) {
        await page.setRequestInterception(true);
        page.on("request", (request) => {
          // Only block images during navigation, not the ones we want to extract
          const resourceType = request.resourceType();
          if (resourceType === "stylesheet" || resourceType === "font") {
            request.abort();
          } else {
            request.continue();
          }
        });
      }

      // Navigate to page
      await page.goto(url, {
        waitUntil: "networkidle2",
        timeout: this.timeout,
      });

      // Wait for any lazy-loaded content
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Extract media URLs
      const media = await page.evaluate(() => {
        const results: Array<{
          mediaUrl: string;
          type: "image" | "video";
          title?: string;
        }> = [];

        // Extract images
        document.querySelectorAll("img").forEach((img) => {
          const src =
            img.src ||
            img.getAttribute("data-src") ||
            img.getAttribute("data-lazy");
          if (src && src.startsWith("http")) {
            results.push({
              mediaUrl: src,
              type: "image",
              title: img.alt || img.title || undefined,
            });
          }

          // Check srcset
          const srcset = img.getAttribute("srcset");
          if (srcset) {
            srcset.split(",").forEach((entry) => {
              const url = entry.trim().split(" ")[0];
              if (url && url.startsWith("http")) {
                results.push({
                  mediaUrl: url,
                  type: "image",
                  title: img.alt || img.title || undefined,
                });
              }
            });
          }
        });

        // Extract videos
        document.querySelectorAll("video").forEach((video) => {
          const src = video.src;
          if (src && src.startsWith("http")) {
            results.push({
              mediaUrl: src,
              type: "video",
              title: video.title || undefined,
            });
          }

          // Check source elements
          video.querySelectorAll("source").forEach((source) => {
            const src = source.src;
            if (src && src.startsWith("http")) {
              results.push({
                mediaUrl: src,
                type: "video",
                title: video.title || undefined,
              });
            }
          });
        });

        // Extract from meta tags
        document.querySelectorAll('meta[property^="og:"]').forEach((meta) => {
          const property = meta.getAttribute("property");
          const content = meta.getAttribute("content");

          if (content && content.startsWith("http")) {
            if (property === "og:image") {
              results.push({
                mediaUrl: content,
                type: "image",
                title: "Open Graph Image",
              });
            } else if (property === "og:video") {
              results.push({
                mediaUrl: content,
                type: "video",
                title: "Open Graph Video",
              });
            }
          }
        });

        return results;
      });

      // Filter and deduplicate
      const uniqueMedia = this.filterAndDeduplicate(media);

      console.log(
        `[Puppeteer] Found ${uniqueMedia.length} media items from ${url}`
      );

      // Close page to free memory
      await page.close();
      this.pageCount++;

      // Restart browser periodically to prevent memory leaks
      if (this.pageCount >= this.MAX_PAGES_BEFORE_RESTART) {
        console.log(
          `[Puppeteer] Restarting browser after ${this.pageCount} pages`
        );
        await this.restartBrowser();
      }

      return {
        url,
        success: true,
        media: uniqueMedia,
        scraperUsed: "puppeteer",
      };
    } catch (error: any) {
      console.error(`[Puppeteer] Error scraping ${url}:`, error.message);

      // Ensure page is closed
      if (page) {
        await page.close().catch(() => {});
      }

      // Force GC on errors to clean up any leaked resources
      forceGC();

      return {
        url,
        success: false,
        media: [],
        error: error.message,
        scraperUsed: "puppeteer",
      };
    }
  }

  /**
   * Restart browser to free memory
   */
  private async restartBrowser(): Promise<void> {
    await this.close();
    this.pageCount = 0;
    forceGC();
    logMemoryUsage("Puppeteer after restart");
  }

  /**
   * Get or create browser instance
   */
  private async getBrowser(): Promise<Browser> {
    if (!this.browser || !this.browser.isConnected()) {
      console.log("[Puppeteer] Launching browser...");

      this.browser = await puppeteer.launch({
        headless: config.puppeteer.headless,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage", // Overcome limited resource problems
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
          "--single-process", // Important for low memory
        ],
      });

      console.log("[Puppeteer] Browser launched");
    }

    return this.browser;
  }

  /**
   * Close browser and free resources
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log("[Puppeteer] Browser closed");
    }
  }

  /**
   * Filter invalid URLs and remove duplicates
   */
  private filterAndDeduplicate(media: ScrapedMedia[]): ScrapedMedia[] {
    const seen = new Set<string>();
    return media.filter((item) => {
      // Filter out invalid URLs
      if (!this.isValidMediaUrl(item.mediaUrl)) {
        return false;
      }

      // Remove duplicates
      if (seen.has(item.mediaUrl)) {
        return false;
      }

      seen.add(item.mediaUrl);
      return true;
    });
  }

  /**
   * Validate media URL
   */
  private isValidMediaUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);

      // Filter out data URLs
      if (urlObj.protocol === "data:") {
        return false;
      }

      // Filter out tracking/analytics domains
      const blockedDomains = [
        "google-analytics.com",
        "doubleclick.net",
        "facebook.com/tr",
      ];
      if (blockedDomains.some((domain) => urlObj.hostname.includes(domain))) {
        return false;
      }

      // Filter out small images (tracking pixels)
      const pathname = urlObj.pathname.toLowerCase();
      if (pathname.includes("1x1") || pathname.includes("pixel")) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }
}
