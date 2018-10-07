# scrape-fso
Small web scraping tool that extracts the video links from media sites that adds loads of ads and pop-ups on top of their videos.

It navigates to the cover page of a TV series|show which contains the table of content,
traverses the DOM to find the season specified as an argument, grabs
the episodes links within the season and navigates to each of one of them to grab the title and the video source.

You can install it globally by using `npm install -g scrape-fso`

## Requirements

- Nodejs > 8

## How to use

`scrape-fso --cover=COVER_URL --season=SEASON_NUMBER --save-to-file=SAVE_TO_FILE`

- COVER_URL - the url to the cover page where is the table of contents
- SEASON_NUMBER - the season number
- SAVE_TO_FILE - saving the results to a file or not, can be true|false

