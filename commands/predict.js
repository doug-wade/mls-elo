const db = require('sqlite');
const fs = require('fs-extra');
const teams = require('../data/teams');
const results = require('../data/results');

module.exports = async (argv) => {
  const {dbPath, verbose, _} = argv;
  if (verbose) {
    console.info(`using db in ${dbPath}`);
  }

  await db.open(dbPath, { Promise });

  // pop the command name
  _.shift();
  let hometeam, awayteam;
  if (_[1] === 'at') {
    hometeam = _[2];
    awayteam = _[0];
  } else if (_[1] === 'vs') {
    hometeam = _[0];
    awayteam = _[2];
  } else {
    throw new Error(`Unrecognized conjunction ${_[1]}; please use "at" or "vs"`);
  }

  const homeTeamStanding = await db.get(`
    SELECT teamname, elo
    FROM rankings
    INNER JOIN teams on teams.teamid = rankings.rankingteamid
    WHERE date = (
      SELECT max(date)
      FROM rankings
      WHERE rankings.rankingteamid = teams.teamid
    )
    AND (teams.abbreviation = "${hometeam}" OR teams.teamname = "${hometeam}")
    ORDER BY elo DESC
  `);

  const awayTeamStanding = await db.get(`
    SELECT teamname, elo
    FROM rankings
    INNER JOIN teams on teams.teamid = rankings.rankingteamid
    WHERE date = (
      SELECT max(date)
      FROM rankings
      WHERE rankings.rankingteamid = teams.teamid
    )
    AND (teams.abbreviation = "${awayteam}" OR teams.teamname = "${awayteam}")
    ORDER BY elo DESC
  `);

  if ((homeTeamStanding.elo + 100) > awayTeamStanding.elo) {
    console.log(`I predict ${homeTeamStanding.teamname} will win.`);
  } else {
    console.log(`I predict ${awayTeamStanding.teamname} will win.`)
  }
}
