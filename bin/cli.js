#!/usr/bin/env node
require('dotenv').load({ silet: true });
const args = require('args-parser')(process.argv);

const s3 = require('../src/utils/s3-utils');
const fs = require('fs');
const logger = require('debug')('scrape-fso');

const options = {
  saveToFile: true,
  uploadToS3: false,
  debug: false,
};

const config = {
  debug: false,
};

if (!args.name) {
  console.log('You need to provide a TV show name. Use --name=XXX');
  process.exit();
}

if (args['save-to-file'] === 'false') {
  options.saveToFile = false;
}

if (args['upload-to-s3'] === 'true') {
  options.uploadToS3 = true;
}

if (args['logging'] === 'true') {
  config.logging = true;
  logger.enabled = true;
}

if (args.season && args.season !== 'all') {
  options.seasonNumber = args.season;
}

const showName = args.name
  .toLocaleLowerCase()
  .trim()
  .replace(/\s+/g, '-');

logger('Your options: \n', args);
logger('Season number:', options.seasonNumber || 'all');

const lib = require('../src/index')(config);

Promise.resolve()
  .then(() => lib.scrapeShow(showName, options.seasonNumber))
  .then((showData) => {
    let fileKey = `${showName}.json`;
    const fileContent = JSON.stringify(showData, null, 2);

    if (options.saveToFile) {
      fs.writeFileSync(fileKey, fileContent);
    }

    if (options.uploadToS3) {
      fileKey = `shows/${fileKey}`;
      return s3.upload(fileKey, fileContent);
    }
  })
  .catch((error) => console.log('Something went wrong: \n', error));
