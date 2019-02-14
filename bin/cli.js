#!/usr/bin/env node
require('dotenv').load({ silet: true });
const args = require('args-parser')(process.argv);
const lib = require('../src/index');
const s3 = require('../src/utils/s3-utils');
const fs = require('fs');
const logger = require('debug')('scrape-fso');
logger.enabled = true;


const options = {
  saveToFile: true,
  uploadToS3: false,
  linksFileName: 'links.json',
  episodesFileName: 'episodes.json',
};

if (!args.name) {
  console.log('You need to provide a TV series name. Use --name=XXX');
  process.exit();
}

if (!args.season) {
  console.log('You need to provide a season. Use --season=XXX');
  process.exit();
}

if (args['save-to-file'] === 'false') {
  options.saveToFile = false;
}

if (args['upload-to-s3'] === 'true') {
  options.uploadToS3 = true;
}

const coverPage = `http://www.filmeserialeonline.org/seriale/${args.name}/`;
const seasonNumber = args.season;
const videoIframeWrapperSelector = args['player-id'] ? `#${args['player-id']}` : '#player22';

logger('Your options: \n', args);
logger('Cover page:', coverPage);
logger('Season number:', seasonNumber);
logger('Player id:', videoIframeWrapperSelector);

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

    if (options.uploadToS3) {
      const fileKey = args.name.toLocaleLowerCase().trim().replace(/\s+/g, '-');
      return s3.upload(`${fileKey}.json`, JSON.stringify(episodes, null, 2));
    }
  })
  .catch((error) => {
    logger('error: ', error);
  });