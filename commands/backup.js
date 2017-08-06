const db = require('sqlite');
const fs = require('fs-extra');
const path = require('path');
const untildify = require('untildify');

module.exports = async (argv) => {
  const {directory, to, dbPath, verbose} = argv;
  if (verbose) {
    console.info(`backing up database ${dbPath} to ${to}`);
  }

  fs.mkdirp(untildify(path.basename(to)));
  fs.copy(untildify(dbPath), untildify(to));
}
