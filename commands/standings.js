const db = require('sqlite');
const fs = require('fs-extra');
const teams = require('../data/teams');
const results = require('../data/results');

module.exports = async (argv) => {
  const {dbPath, verbose} = argv;
  if (verbose) {
    console.info(`using db in ${dbPath}`);
  }

  await db.open(dbPath, { Promise });

  const dateResult = await db.get(`
    SELECT max(date) as date
    FROM rankings
  `);
  const standingsDate = new Date(dateResult.date);

  const standings = await db.all(`
    SELECT teamname, elo
    FROM rankings
    INNER JOIN teams on teams.teamid = rankings.rankingteamid
    WHERE date = (
      SELECT max(date)
      FROM rankings
      WHERE rankings.rankingteamid = teams.teamid
    )
    AND teams.dissolved IS NULL
    ORDER BY elo DESC
  `);

  console.log(`Standings as of ${standingsDate.toLocaleDateString()}\n`);
  standings.forEach((standing, i) => {
    console.log(`${i + 1}.) ${standing.teamname} (${Math.round(standing.elo)})`);
  });
}
