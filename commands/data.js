const cheerio = require('cheerio');
const fs = require('fs-extra');
const https = require('https');
const StringWritableStream = require('../lib/StringWritableStream');
const path = require('path');

module.exports = async (argv) => {
  const {directory, verbose} = argv;
  if (verbose) {
    console.info(`caching results html in ${directory}`);
  }
  await fs.mkdirp(path.resolve(`./${directory}/players/`));
  await fetchFormPages(verbose, directory);
  const playerIndexPages = await fetchPlayerIndexPages(verbose);

  for (let indexPage of playerIndexPages) {
    const $ = cheerio.load(indexPage);
    const playerDivs = $('#center_content > div.ct_wrapper > div:nth-child(6) > ul > li.row');

    const playerPageData = [];
    playerDivs.each((i, div) => {
      const name = div.children[2].children[0].children[0].children[0].data;
      const href = div.children[2].children[0].children[0].attribs.href;
      playerPageData.push({
        href,
        name,
        url: `https://www.mlssoccer.com${href}`,
        normalizedName: name.toLowerCase().replace(' ', '-')
      });
    });

    for (let data of playerPageData) {
      const filename = path.resolve(`./.cached/players/${data.normalizedName}.html`);
      const stream = fs.createWriteStream(filename);
      if (verbose) {
        console.info(`fetching player ${data.name} from url ${data.url} and writing to ${filename}`);
      }

      await getPage({url: data.url, stream});
    }
  }
}

function getPage({url, stream}) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      res.on('data', (d) => {
        stream.write(d);
      });
      res.on('end', () => {
        stream.end(null);
        resolve(stream);
      });
      res.on('error', (err) => {
        reject(err);
      });
    });
  });
}

async function fetchFormPages(verbose, directory) {
  for (let year = 1996; year <= 2017; year++) {
    const filename = `${directory}/${year}.html`;
    const url = `https://www.mlssoccer.com/results/${year}`;
    if (verbose) {
      console.info(`fetching year ${year} from url ${url} and writing to ${filename}`);
    }
    const stream = fs.createWriteStream(filename);

    await getPage({url, stream});
  }
}

async function fetchPlayerIndexPages(verbose) {
  const playerIndexPagePromises = [];
  for (let page = 0; page < 21; page++) {
    const url = `https://www.mlssoccer.com/players?page=${page}`;
    if (verbose) {
      console.info(`fetching player index page ${page} from url ${url}`);
    }
    const stream = new StringWritableStream();

    playerIndexPagePromises.push(getPage({url, stream}));
  }
  const playerIndexPageBuffers = await Promise.all(playerIndexPagePromises);
  return playerIndexPageBuffers.map(p => p.toString());
}
