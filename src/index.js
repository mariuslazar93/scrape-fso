const request = require('request');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const logger = require('debug')('scrape-fso');
logger.enabled = true;


const getLinks = (coverPage, seasonNumber) => {
  return new Promise((resolve, reject) => {
    request(coverPage, function (error, response, html) {
      if (!error && response.statusCode == 200) {
        const $ = cheerio.load(html);

        const episodesLinks = [];
        $('#seasons .se-t').each(function(i, elem){
          if ($(this).text() === seasonNumber) {
            logger('Found season %s', seasonNumber);
            $(this).parent()
              .parent()
              .find('.episodiotitle')
              .each(function(i, elem) {
                const a = $(this).find('a');
                episodesLinks.push(a.attr('href'));
              });
          }
        });

        resolve(episodesLinks);
      } else {
        reject(error);
      }
    });
  });
};

async function scrape(links, videoIframeWrapperSelector) {
  // create browser instace and fake user agent
  const browser = await puppeteer.launch({
    args: [
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ],
  });

  const results = await scrapeSerialPages(browser, links, videoIframeWrapperSelector);
  await browser.close();
  return results;
};

// scrape the pages in series so that we don't get blocked
async function scrapeSerialPages(browser, links, videoIframeWrapperSelector) {
  return links.reduce(async (acc, link) => {
    const data = await acc;

    try {
      const scrapeData = await scrapePage(browser, link, videoIframeWrapperSelector);
      if (scrapeData) {
        data.push(scrapeData);
      } else {
        throw 'No data';
      }
    } catch(error) {
      logger('error getting %s:', link, error);
      data.push({ success: false, link });
    }

    return data;
  }, Promise.resolve([]));
}

// Scrape the page and get the video url embeded in the iframe
async function scrapePage(browser, url, videoIframeWrapperSelector) {
  logger('scrape page:', url);

  const page = await browser.newPage();
  logger('created a new page');

  await page.goto(url, {waitUntil: 'domcontentloaded'});
  logger('navigated to url');

  // wait for the element to be present
  await page.waitForSelector(videoIframeWrapperSelector, { visible: false, timeout: 60000 });
  logger('found video wrapper element');

  const result = await page.evaluate((videoWrapperSelector) => {
    const title = document.title;
    const rapidVideoWrapper = document.querySelector(videoWrapperSelector);
    if (!rapidVideoWrapper) {
      throw new Error('No rapid video wrapper');
    }
    const videoSrc = rapidVideoWrapper.querySelector('iframe').src;

    return {
      title,
      videoSrc
    };
  }, videoIframeWrapperSelector);

  await page.close();
  return result;
}

module.exports = {
  getLinks,
  scrape,
};