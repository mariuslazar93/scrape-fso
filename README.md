# scrape-fso
Small web scraping tool that extracts the video links from media sites that adds loads of ads and pop-ups on top of their videos.

It navigates to the cover page of a TV series or a show which contains the table of content,
traverses the DOM to find the season specified as an argument, grabs
the episodes links within the season and navigates to each of one of them to grab the title and the video source. It prints the result and writes it to a JSON file.

You can install it globally by using `npm install -g scrape-fso`

## Requirements

- Nodejs > 8

## How to use

`scrape-fso --name=SHOW_NAME --season=SEASON_NUMBER --save-to-file=SAVE_TO_FILE`

- name - the TV series name (lowercase and with dashes instead of spaces, ex: `how-i-met-your-mother`)
- season - the season number
- player-id - the id of the player iframe (default: player22)
- save-to-file - saving the results to a file or just logged them to the console, can be true|false (default: true)
- save-to-s3 - saving the resulted json file to an S3 bucket

```
scrape-fso --name=the-blacklist --season=6
```