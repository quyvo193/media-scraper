import * as cheerio from 'cheerio';
import axios from 'axios';
import { URL } from 'url';
import { IScraper, ScrapeResult, ScrapedMedia } from './types';
import { config } from '../config';

/**
 * Cheerio Scraper - Lightweight HTML parser
 * Best for static websites and server-side rendered pages
 */
export class CheerioScraper implements IScraper {
  private timeout: number;

  constructor() {
    this.timeout = config.scraper.timeout;
  }

  /**
   * Scrape a URL for images and videos
   */
  async scrape(url: string): Promise<ScrapeResult> {
    try {
      console.log(`[Cheerio] Scraping: ${url}`);

      // Fetch HTML
      const response = await axios.get(url, {
        timeout: this.timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MediaScraperBot/1.0)',
        },
        maxRedirects: 5,
      });

      const html = response.data;
      const $ = cheerio.load(html);
      const media: ScrapedMedia[] = [];

      // Extract images
      $('img').each((_, element) => {
        const src = $(element).attr('src') || $(element).attr('data-src');
        if (src) {
          const absoluteUrl = this.makeAbsoluteUrl(src, url);
          if (absoluteUrl && this.isValidMediaUrl(absoluteUrl)) {
            media.push({
              mediaUrl: absoluteUrl,
              type: 'image',
              title: $(element).attr('alt') || $(element).attr('title'),
            });
          }
        }

        // Check srcset for responsive images
        const srcset = $(element).attr('srcset');
        if (srcset) {
          const urls = this.parseSrcset(srcset, url);
          urls.forEach((mediaUrl) => {
            if (this.isValidMediaUrl(mediaUrl)) {
              media.push({
                mediaUrl,
                type: 'image',
                title: $(element).attr('alt') || $(element).attr('title'),
              });
            }
          });
        }
      });

      // Extract videos
      $('video').each((_, element) => {
        const src = $(element).attr('src');
        if (src) {
          const absoluteUrl = this.makeAbsoluteUrl(src, url);
          if (absoluteUrl && this.isValidMediaUrl(absoluteUrl)) {
            media.push({
              mediaUrl: absoluteUrl,
              type: 'video',
              title: $(element).attr('title'),
            });
          }
        }

        // Check source elements
        $(element)
          .find('source')
          .each((_, source) => {
            const src = $(source).attr('src');
            if (src) {
              const absoluteUrl = this.makeAbsoluteUrl(src, url);
              if (absoluteUrl && this.isValidMediaUrl(absoluteUrl)) {
                media.push({
                  mediaUrl: absoluteUrl,
                  type: 'video',
                  title: $(element).attr('title'),
                });
              }
            }
          });
      });

      // Extract from og:image and og:video meta tags
      $('meta[property^="og:"]').each((_, element) => {
        const property = $(element).attr('property');
        const content = $(element).attr('content');

        if (content) {
          if (property === 'og:image') {
            const absoluteUrl = this.makeAbsoluteUrl(content, url);
            if (absoluteUrl && this.isValidMediaUrl(absoluteUrl)) {
              media.push({
                mediaUrl: absoluteUrl,
                type: 'image',
                title: 'Open Graph Image',
              });
            }
          } else if (property === 'og:video') {
            const absoluteUrl = this.makeAbsoluteUrl(content, url);
            if (absoluteUrl && this.isValidMediaUrl(absoluteUrl)) {
              media.push({
                mediaUrl: absoluteUrl,
                type: 'video',
                title: 'Open Graph Video',
              });
            }
          }
        }
      });

      // Remove duplicates
      const uniqueMedia = this.removeDuplicates(media);

      console.log(`[Cheerio] Found ${uniqueMedia.length} media items from ${url}`);

      return {
        url,
        success: true,
        media: uniqueMedia,
        scraperUsed: 'cheerio',
      };
    } catch (error: any) {
      console.error(`[Cheerio] Error scraping ${url}:`, error.message);

      return {
        url,
        success: false,
        media: [],
        error: error.message,
        scraperUsed: 'cheerio',
      };
    }
  }

  /**
   * Convert relative URL to absolute URL
   */
  private makeAbsoluteUrl(relativeUrl: string, baseUrl: string): string | null {
    try {
      // Already absolute
      if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
        return relativeUrl;
      }

      // Protocol-relative URL
      if (relativeUrl.startsWith('//')) {
        const baseUrlObj = new URL(baseUrl);
        return `${baseUrlObj.protocol}${relativeUrl}`;
      }

      // Relative URL
      return new URL(relativeUrl, baseUrl).href;
    } catch (error) {
      return null;
    }
  }

  /**
   * Parse srcset attribute
   */
  private parseSrcset(srcset: string, baseUrl: string): string[] {
    const urls: string[] = [];

    srcset.split(',').forEach((entry) => {
      const url = entry.trim().split(' ')[0];
      if (url) {
        const absoluteUrl = this.makeAbsoluteUrl(url, baseUrl);
        if (absoluteUrl) {
          urls.push(absoluteUrl);
        }
      }
    });

    return urls;
  }

  /**
   * Validate media URL (filter out tracking pixels, icons, etc.)
   */
  private isValidMediaUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);

      // Filter out data URLs
      if (urlObj.protocol === 'data:') {
        return false;
      }

      // Filter out common tracking/analytics domains
      const blockedDomains = ['google-analytics.com', 'doubleclick.net', 'facebook.com/tr'];
      if (blockedDomains.some((domain) => urlObj.hostname.includes(domain))) {
        return false;
      }

      // Filter out small images (likely icons or tracking pixels)
      const pathname = urlObj.pathname.toLowerCase();
      if (pathname.includes('1x1') || pathname.includes('pixel')) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Remove duplicate media items
   */
  private removeDuplicates(media: ScrapedMedia[]): ScrapedMedia[] {
    const seen = new Set<string>();
    return media.filter((item) => {
      if (seen.has(item.mediaUrl)) {
        return false;
      }
      seen.add(item.mediaUrl);
      return true;
    });
  }
}
