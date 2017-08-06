const fs = require('fs-extra');
const https = require('https');

module.exports = (argv) => {
  const {directory, verbose} = argv;
  if (verbose) {
    console.info(`caching results html in ${directory}`);
  }
  fs.mkdirp(directory);

  for (let year = 1996; year <= 2017; year++) {
    const filename = `${directory}/${year}.html`;
    const url = `https://www.mlssoccer.com/results/${year}`;
    if (verbose) {
      console.info(`fetching year ${year} from url ${url} and writing to ${filename}`);
    }

    const stream = fs.createWriteStream(filename);
    https.get(url, (res) => {
      res.on('data', (d) => {
        stream.write(d);
      });
    });
  }

  // The pages end condition is manually maintained, and comes from the url param
  // page found when clicking the "last" button on https://www.mlssoccer.com/players
  for (let page = 0; page <= 20; page++) {
    const playerListPageFilename = `players-page-${page}.html`;
    const playerListPageUrl = `https://www.mlssoccer.com/players?page=${page}`;
    if (verbose) {
      console.info(`fetching player list page ${page} from url ${playerListPageUrl} and writing to ${playerListPageFilename}`);
    }

    const stream = fs.createWriteStream(playerListPageFilename);
    https.get(playerListPageUrl, (res) => {
      res.on('data', (d) => {
        stream.write(d);
      });

      res.on('end', () => {
        importPlayers(playerListPageFilename);
      });
    });
  }
}

function importPlayers(filename) {
  console.log(`importing players from ${filename}`);
}
