const db = require('sqlite');
const fs = require('fs-extra');
const path = require('path');

module.exports = async (argv) => {
  const {dbPath, query, name, file, verbose} = argv;

  if (verbose) {
    console.info(`getting connection to database ${dbPath}`);
  }
  await db.open(dbPath, { Promise });

  let toRun;
  if (query) {
    toRun = query;
  } else if (name) {
    toRun = (await fs.readFile(path.normalize(`${__dirname}/../queries/${name}.sql`))).toString();
  } else {
    throw new Error('Must provide one of: --name, --query');
  }

  const result = await db.all(toRun);
  if (file) {
    await fs.writeFile(file, JSON.stringify(result));
    console.info(`Write ${file}`);
  } else {
    console.info(result);
  }
}
