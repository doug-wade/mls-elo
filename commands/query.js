const db = require('sqlite');

module.exports = async (argv) => {
  const {dbPath, query, verbose} = argv;

  if (verbose) {
    console.info(`getting connection to database ${dbPath}`);
  }
  await db.open(dbPath, { Promise });

  const result = await db.all(query);
  console.log(result);
}
