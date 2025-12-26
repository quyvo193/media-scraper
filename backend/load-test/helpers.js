/**
 * Artillery Helper Functions
 * Generates realistic test data for load testing
 */

// SSR Sites - Server-Side Rendered (easier to scrape, no JS needed)
const SSR_URLS = [
  // Image-heavy sites
  "https://unsplash.com/s/photos/nature",
  "https://unsplash.com/s/photos/city",
  "https://unsplash.com/s/photos/animals",
  "https://www.pexels.com/search/nature/",
  "https://www.pexels.com/search/technology/",
  "https://www.pexels.com/search/people/",
  "https://pixabay.com/images/search/landscape/",
  "https://pixabay.com/images/search/abstract/",
  "https://commons.wikimedia.org/wiki/Main_Page",
  "https://www.nasa.gov/multimedia/imagegallery/index.html",
  "https://www.bbc.com/news",
  "https://www.reuters.com/pictures/",
  "https://www.nationalgeographic.com/photography/",
  "https://www.smithsonianmag.com/photos/",
  "https://www.flickr.com/explore",
  // Video-heavy sites
  "https://www.pexels.com/videos/",
  "https://pixabay.com/videos/",
  "https://coverr.co/",
  "https://www.videvo.net/free-stock-video/",
  "https://mixkit.co/free-stock-video/",
];

// CSR Sites - Client-Side Rendered (need Puppeteer/JS rendering)
const CSR_URLS = [
  // Image-heavy CSR sites
  "https://www.pinterest.com/search/pins/?q=photography",
  "https://www.pinterest.com/search/pins/?q=art",
  "https://www.pinterest.com/search/pins/?q=design",
  "https://imgur.com/t/photography",
  "https://imgur.com/t/nature",
  "https://imgur.com/t/art",
  "https://500px.com/popular",
  "https://www.behance.net/search/projects?field=photography",
  "https://dribbble.com/shots/popular",
  "https://www.deviantart.com/popular/all-time/",
  "https://www.artstation.com/?sort_by=trending",
  // Video/GIF CSR sites
  "https://giphy.com/trending-gifs",
  "https://giphy.com/search/funny",
  "https://tenor.com/trending",
  "https://www.reddit.com/r/videos/",
  "https://www.reddit.com/r/pics/",
  "https://www.reddit.com/r/gifs/",
  "https://9gag.com/trending",
  "https://www.tumblr.com/explore/trending",
  "https://coub.com/explore",
];

// Combined list for random selection
const SAMPLE_URLS = [...SSR_URLS, ...CSR_URLS];

/**
 * Generate random URLs for scraping requests
 * Each request contains 1-5 URLs to simulate realistic usage
 * Mix of SSR and CSR sites with images and videos
 */
function generateUrls(userContext, events, done) {
  // Random number of URLs per request (1-5)
  const urlCount = Math.floor(Math.random() * 5) + 1;
  const urls = [];

  for (let i = 0; i < urlCount; i++) {
    // Randomly select from all available URLs
    const url = SAMPLE_URLS[Math.floor(Math.random() * SAMPLE_URLS.length)];
    urls.push(url);
  }

  userContext.vars.urls = urls;
  return done();
}

/**
 * Generate only SSR URLs (for Cheerio-only testing)
 */
function generateSsrUrls(userContext, events, done) {
  const urlCount = Math.floor(Math.random() * 5) + 1;
  const urls = [];

  for (let i = 0; i < urlCount; i++) {
    const url = SSR_URLS[Math.floor(Math.random() * SSR_URLS.length)];
    urls.push(url);
  }

  userContext.vars.urls = urls;
  return done();
}

/**
 * Generate only CSR URLs (for Puppeteer testing)
 */
function generateCsrUrls(userContext, events, done) {
  const urlCount = Math.floor(Math.random() * 5) + 1;
  const urls = [];

  for (let i = 0; i < urlCount; i++) {
    const url = CSR_URLS[Math.floor(Math.random() * CSR_URLS.length)];
    urls.push(url);
  }

  userContext.vars.urls = urls;
  return done();
}

/**
 * Log request timing for analysis
 */
function logTiming(requestParams, response, context, ee, next) {
  console.log(
    `[Load Test] Job ${context.vars.jobId} created in ${response.timings.phases.total}ms`
  );
  return next();
}

/**
 * Validate response structure
 */
function validateResponse(requestParams, response, context, ee, next) {
  if (response.statusCode !== 201) {
    console.error(`[Load Test] Unexpected status: ${response.statusCode}`);
    ee.emit("error", `Unexpected status code: ${response.statusCode}`);
  }
  return next();
}

module.exports = {
  generateUrls,
  generateSsrUrls,
  generateCsrUrls,
  logTiming,
  validateResponse,
  // Export URL lists for direct access if needed
  SSR_URLS,
  CSR_URLS,
  SAMPLE_URLS,
};
