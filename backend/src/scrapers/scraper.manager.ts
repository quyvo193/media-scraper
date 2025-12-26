import { CheerioScraper } from './cheerio.scraper';
import { PuppeteerScraper } from './puppeteer.scraper';
import { ScrapeResult } from './types';

/**
 * Scraper Manager
 * Intelligently chooses between Cheerio and Puppeteer scrapers
 * Strategy: Try Cheerio first (fast), fallback to Puppeteer if needed
 */
export class ScraperManager {
  private cheerioScraper: CheerioScraper;
  private puppeteerScraper: PuppeteerScraper;

  constructor() {
    this.cheerioScraper = new CheerioScraper();
    this.puppeteerScraper = new PuppeteerScraper();
  }

  /**
   * Scrape a URL with intelligent scraper selection
   * 1. Try Cheerio first (fast, low memory)
   * 2. If Cheerio finds < 3 media items, try Puppeteer (likely CSR site)
   * 3. Return best result
   */
  async scrape(url: string): Promise<ScrapeResult> {
    console.log(`[ScraperManager] Starting scrape for: ${url}`);

    // Try Cheerio first (lightweight and fast)
    const cheerioResult = await this.cheerioScraper.scrape(url);

    // If Cheerio was successful and found media, use it
    if (cheerioResult.success && cheerioResult.media.length >= 3) {
      console.log(
        `[ScraperManager] Cheerio successful with ${cheerioResult.media.length} items`
      );
      return cheerioResult;
    }

    // If Cheerio found some media but not much, might be a CSR site
    // Try Puppeteer as fallback
    console.log(
      `[ScraperManager] Cheerio found ${cheerioResult.media.length} items, trying Puppeteer...`
    );

    try {
      const puppeteerResult = await this.puppeteerScraper.scrape(url);

      // If Puppeteer found more media, use it
      if (puppeteerResult.success && puppeteerResult.media.length > cheerioResult.media.length) {
        console.log(
          `[ScraperManager] Puppeteer found more media (${puppeteerResult.media.length} vs ${cheerioResult.media.length})`
        );
        return puppeteerResult;
      }

      // Otherwise, use Cheerio result
      console.log(
        `[ScraperManager] Using Cheerio result (${cheerioResult.media.length} items)`
      );
      return cheerioResult;
    } catch (error: any) {
      console.error('[ScraperManager] Puppeteer fallback failed:', error.message);

      // Return Cheerio result even if it found nothing
      return cheerioResult;
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.puppeteerScraper.close();
    console.log('[ScraperManager] Cleanup completed');
  }
}

// Export singleton instance
export const scraperManager = new ScraperManager();
