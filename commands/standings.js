const db = require('sqlite');
const fs = require('fs-extra');
const teams = require('../data/teams');
const results = require('../data/results');

module.exports = async (argv) => {
  const {dbPath, verbose, elo, trueskill} = argv;
  if (verbose) {
    console.info(`using db in ${dbPath}`);
  }

  await db.open(dbPath, { Promise });

  const dateResult = await db.get(`
    SELECT max(date) as date
    FROM rankings
  `);
  const standingsDate = new Date(dateResult.date);

  if (elo) {
    const eloStandings = await db.all(`
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

    console.log(`ELO Standings as of ${standingsDate.toLocaleDateString()}\n`);
    eloStandings.forEach((standing, i) => {
      console.log(`${i + 1}.) ${standing.teamname} (${Math.round(standing.elo)})`);
    });
  }

  if (trueskill) {
    const trueskillStandings = await db.all(`
      SELECT teamname, trueskillmu
      FROM rankings
      INNER JOIN teams on teams.teamid = rankings.rankingteamid
      WHERE date = (
        SELECT max(date)
        FROM rankings
        WHERE rankings.rankingteamid = teams.teamid
      )
      AND teams.dissolved IS NULL
      ORDER BY trueskillmu DESC
    `);

    console.log(`\n\nTrueSkill Standings as of ${standingsDate.toLocaleDateString()}\n`);
    trueskillStandings.forEach((standing, i) => {
      console.log(`${i + 1}.) ${standing.teamname} (${standing.trueskillmu})`);
    });
  }
}
