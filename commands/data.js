const fs = require('fs-extra');
const https = require('https');
module.exports = (argv) => {
  const dir = `.cached`;
  if (argv.verbose) {
    console.info(`caching results html in ${dir}`);
  }
  fs.mkdirp(dir);

  for (let year = 1996; year <= 2017; year++) {
    const filename = `${dir}/${year}.html`;
    const url = `https://www.mlssoccer.com/results/${year}`;
    if (argv.verbose) {
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
