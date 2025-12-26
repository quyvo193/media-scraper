/**
 * Scraper types and interfaces
 */

export interface ScrapedMedia {
  mediaUrl: string;
  type: 'image' | 'video';
  title?: string;
}

export interface ScrapeResult {
  url: string;
  success: boolean;
  media: ScrapedMedia[];
  error?: string;
  scraperUsed: 'cheerio' | 'puppeteer';
}

export interface IScraper {
  scrape(url: string): Promise<ScrapeResult>;
}
