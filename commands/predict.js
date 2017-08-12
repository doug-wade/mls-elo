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
  if (!_[1]) {
    console.log(`Predicting from now until ${_[0]}`);
    await predictMatchesByDate(_[0]);
  } else {
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

    await predictMatchByName(hometeam, awayteam);
  }
}

async function predictMatchesByDate(date) {
  const results = await db.all(`
    WITH currentelo AS (
      SELECT *
      FROM rankings
      INNER JOIN (
        SELECT max(date) as maxDate, rankingteamid as teamid
        FROM rankings
        GROUP BY teamid
      ) as dates
      ON dates.teamid = rankings.rankingteamid
      AND dates.maxDate = rankings.date
    )
    SELECT
      awayteam.teamname as awayName,
      away.elo as awayElo,
      hometeam.teamname as homeName,
      home.elo as homeElo
    FROM matches
    INNER JOIN currentelo as away
    ON away.rankingteamid = matches.awayteam
    INNER JOIN currentelo as home
    on home.rankingteamid = matches.hometeam
    INNER JOIN teams AS awayteam
    ON awayteam.teamid = matches.awayteam
    INNER JOIN teams AS hometeam
    ON hometeam.teamid = matches.hometeam
    WHERE matches.date <= ${(new Date(date)).getTime()}
    AND matches.date >= ${(new Date()).getTime()}
  `);

  results.forEach(result => predictMatch({
    homeElo: result.homeElo,
    homeName: result.homeName,
    awayElo: result.awayElo,
    awayName: result.awayName
  }));
}

async function predictMatchByName(hometeam, awayteam) {
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

  predictMatch({
    homeName: homeTeamStanding.teamname,
    homeElo: homeTeamStanding.elo,
    awayName: awayTeamStanding.teamname,
    awayElo: awayTeamStanding.elo
  });
}

function predictMatch({homeElo, awayElo, homeName, awayName}) {
  if ((homeElo + 100) > awayElo) {
    console.log(`I predict ${homeName} will win.`);
  } else {
    console.log(`I predict ${awayName} will win.`)
  }
}
