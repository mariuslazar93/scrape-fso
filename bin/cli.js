#!/usr/bin/env node

const args = require('args-parser')(process.argv);
const lib = require('../src/index');
const fs = require('fs');
const logger = require('debug')('scrape-fso');
logger.enabled = true;


const options = {
  saveToFile: true,
  linksFileName: 'links.json',
  episodesFileName: 'episodes.json',
};

if (!args.cover) {
  console.log('You need to provide a cover page. Use --cover=XXX');
  process.exit();
}

if (!args.season) {
  console.log('You need to provide a season. Use --season=XXX');
  process.exit();
}

if (args['save-to-file'] === 'false') {
  options.saveToFile = false;
}

const coverPage = args.cover || 'http://www.filmeserialeonline.org/seriale/the-blacklist/';
const seasonNumber = `${args.season}` || '5';
const videoIframeWrapperSelector = '#player22';

logger('Your args: \n', args);
logger('Processing cover page:', coverPage);
logger('Processing season:', seasonNumber);

Promise.resolve()
  .then(() => lib.getLinks(coverPage, seasonNumber))
  .then((links) => {
    logger('got links:\n', links);
    if (options.saveToFile) {
      fs.writeFileSync(options.linksFileName, JSON.stringify(links, null, 2));
    }

    return lib.scrape(links, videoIframeWrapperSelector);
  })
  .then((episodes) => {
    logger('episodes: ', episodes);
    if (options.saveToFile) {
      fs.writeFileSync(options.episodesFileName, JSON.stringify(episodes, null, 2));
    }
  })
  .catch((error) => {
    logger('error: ', error);
  });