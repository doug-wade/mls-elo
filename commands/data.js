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
}
