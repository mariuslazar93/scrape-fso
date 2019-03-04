# scrape-fso

Web scrapping CLI that extracts the video links from a specified TV SHOW avoiding loads of ads and pop-ups.

The end result of the cli is to create a file with all the video links from every season of a TV Show and upload the file to an S3 bucket or save it on the disk.

Probably more useful if you run it locally. You can do this by:

- cloning the repo
- installing the dependencies `npm i`
- running the CLI with logging enabled `node bin/cli.js --name=the-blacklist --logging=true`

If you want to run it globally, you can do this by:

- install the cli globally using `npm install -g scrape-fso`
- run it with `scrape-fso --name=the-blacklist`

## Requirements

- Nodejs > 8

## How to use

`scrape-fso --name=SHOW_NAME --season=SEASON_NUMBER|all --logging=true|false`

- name - the TV series name (lowercase and with dashes instead of spaces, ex: `how-i-met-your-mother`)
- season (Optional) - the season number. It will default to `all` seasons if not specified.
- save-to-file (Optional) - saving the results to a file like `season-name.json` (default: true)
- save-to-s3 (Optional) - saving the resulted json file to an S3 bucket (defualt: false)
- logging (Optional) - enable lots of logging (default: false)

In order to save to an S3 bucket (path where it will be saved is `/shows/${show-name}.json`), you need to provide the following ENV variables:

```
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
BUCKET_NAME=xxx
```

You can update the scrape timeout by updating the `process.env.SCRAPE_TIMEOUT` ENV variable. If this timeout is long
enough, it will give you enough time to pass the recaptcha challanges before the script continue to scrape the rest of the pages.

## Examples

```
scrape-fso --name=the-blacklist --season=6 --logging=true
```

```
scrape-fso --name=the-blacklist --season=all
```
