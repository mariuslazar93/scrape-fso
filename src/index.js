const request = require('request');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const logger = require('debug')('scrape-fso');

const IFRAME_SELECTORS = ['#player22', '#player21', '#player23'];

async function scrapeShow(name, seasonNumber) {
  const coverPage = `http://www.filmeserialeonline.org/seriale/${name}/`;
  const seasonsToScrape = await getSeasonsWithEpisodesLinks(coverPage, seasonNumber);
  logger('\n got seasonsToScrape: \n', seasonsToScrape);

  const seasonsWithEpisodes = await Promise.all(
    seasonsToScrape.map(async (season) => {
      const episodes = await getEpisodesDataFromLinks(season.links);
      return {
        ...season,
        episodes,
      };
    })
  );

  logger('\n got seasonsWithEpisodes: \n', seasonsWithEpisodes);

  const show = {
    name,
    displayName: name.replace(/-/g, ' ').toUpperCase(),
    seasons: seasonsWithEpisodes,
  };

  return show;
}

function getSeasonsWithEpisodesLinks(coverPage, seasonNumber) {
  logger('getting links for cover page:', coverPage);
  return new Promise((resolve, reject) => {
    request(coverPage, function(error, response, html) {
      if (!error && response.statusCode == 200) {
        const $ = cheerio.load(html);

        const seasons = [];

        $('#seasons .se-t').each(function() {
          const seasonId = $(this).text();
          logger('Found season %s', seasonId);

          if (!seasonNumber) {
            // Save all the seasons
            const seasonData = getSeasonData(seasonId, $, this);
            seasons.push(seasonData);
          } else if (seasonId == seasonNumber) {
            // Save just the specified season
            const seasonData = getSeasonData(seasonId, $, this);
            seasons.push(seasonData);
          }
        });

        resolve(seasons);
      } else {
        reject(error);
      }
    });
  });
}

function getSeasonData(seasonId, $, context) {
  const links = [];

  $(context)
    .parent()
    .parent()
    .find('.episodiotitle')
    .each(function() {
      const a = $(this).find('a');
      links.push(a.attr('href'));
    });

  return {
    id: seasonId,
    name: `Season ${seasonId}`,
    links,
  };
}

async function getEpisodesDataFromLinks(links) {
  // create browser instace and fake user agent
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36',
    ],
  });

  const episodesData = await links.reduce(async (acc, link, index) => {
    const data = await acc;

    try {
      const scrapeData = await scrapePage(browser, link);
      if (scrapeData) {
        scrapeData.title = `Episode ${index + 1}: ${scrapeData.title}`;
        data.push(scrapeData);
      } else {
        throw 'No data';
      }
    } catch (error) {
      logger('error getting %s:', link, error);
      data.push({ success: false, link });
    }

    return data;
  }, Promise.resolve([]));

  await browser.close();
  return episodesData;
}

// Scrape the page and get the video url embeded in the iframe
async function scrapePage(browser, url, videoIframeWrapperSelector = '#player22') {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  logger('navigated to url', url);

  // wait for the element to be present or try a different iframe id
  try {
    await page.waitForSelector(videoIframeWrapperSelector, {
      visible: false,
      timeout: process.env.SCRAPE_TIMEOUT || 10000,
    });
  } catch (error) {
    await page.close();
    const indexOfIframeSelector = IFRAME_SELECTORS.indexOf(videoIframeWrapperSelector);
    if (indexOfIframeSelector !== IFRAME_SELECTORS.length - 1) {
      const nextVideoIframeSelector = IFRAME_SELECTORS[indexOfIframeSelector + 1];
      logger(
        'iframe %s was not found, trying %s',
        videoIframeWrapperSelector,
        nextVideoIframeSelector
      );

      return await scrapePage(browser, url, nextVideoIframeSelector);
    } else {
      throw new Error('No iframe was found with the existing selectors');
    }
  }

  logger('found video wrapper element with id', videoIframeWrapperSelector);

  const result = await page.evaluate((videoWrapperSelector) => {
    const title = document.title;
    const videoWrapper = document.querySelector(videoWrapperSelector);
    const videoSrc = videoWrapper.querySelector('iframe').src;
    return {
      success: true,
      title,
      videoSrc,
    };
  }, videoIframeWrapperSelector);

  await page.close();
  return result;
}

module.exports = (config) => {
  if (config.logging) {
    logger.enabled = true;
  }

  return {
    scrapeShow,
  };
};
