const AWS = require('aws-sdk');

AWS.config.update({
  region: 'eu-west-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const s3 = new AWS.S3({
  apiVersion: '2006-03-01',
});

/**
 * Upload a file to the s3 bucket set on the config.
 *
 * @param {string} filePath
 * The path of a file
 *
 * @return {Promise}
 * Resolve with the uploaded file data
 */
const upload = (fileName, fileContent, contentType = 'application/json') => new Promise((resolve, reject) => {
  const params = {
    Key: fileName,
    Body: fileContent,
    Bucket: process.env.BUCKET_NAME,
    ContentType: contentType,
  };

  s3.putObject(params, (err, data) => {
    if (err) {
      console.log(`Error uploading ${fileName}`);
      return reject(err);
    }

    console.log(`${fileName} uploaded successfully!`);
    return resolve(data);
  });
});

module.exports = {
  upload,
};