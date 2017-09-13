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
    console.info(`Predicting from now until ${_[0]}`);
    await predictMatchesByDate(_[0], verbose);
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

    await predictMatchByName(hometeam, awayteam, verbose);
  }
}

async function predictMatchesByDate(date, verbose) {
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
      home.elo as homeElo,
      matches.date as matchDate
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

  results.forEach(result => predictMatch(result, verbose));
}

async function predictMatchByName(hometeam, awayteam, verbose) {
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
  }, verbose);
}

function predictMatch({matchDate, homeElo, awayElo, homeName, awayName}, verbose) {
  const probability = 1 / (10 ** (-1 * (homeElo + 100 - awayElo)/400) + 1)
  const homeWinProbability = 1 / (Math.pow(10, (-1 * ((homeElo + 100) - awayElo)/400)) + 1);
  const awayWinProbability = 1 / (Math.pow(10, (-1 * (awayElo - homeElo)/400)) + 1);
  const formattedDate = (new Date(matchDate)).toLocaleDateString();

  if (verbose) {
    console.info(`\n${formattedDate}:
      ${homeName} (${Math.round(homeElo)}) ${Math.round(homeWinProbability * 100)}% to win
      ${awayName} (${Math.round(awayElo)}) ${Math.round(awayWinProbability * 100)}% to win`);
  }
  if (homeWinProbability > awayWinProbability) {
    console.info(`I predict ${homeName} will win vs ${awayName} on ${formattedDate} (${Math.round(homeWinProbability * 100)}% to win).`)
  } else if (homeWinProbability < awayWinProbability) {
    console.info(`I predict ${awayName} will win at ${homeName} on ${formattedDate} (${Math.round(awayWinProbability * 100)}% to win).`)
  } else {
    console.info(`I predict ${homeName} will draw vs ${awayName} on ${formattedDate}`);
  }
}
