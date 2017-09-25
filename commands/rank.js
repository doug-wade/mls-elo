const db = require('sqlite');
const fs = require('fs-extra');
const trueskill = require('trueskill');
const teams = require('../data/teams');
const updateElo = require('../lib/updateElo');
const getStartDate = require('../lib/getStartDate');

module.exports = async (argv) => {
  const {dbPath, verbose} = argv;
  if (verbose) {
    console.info(`using db in ${dbPath}`);
  }

  await db.open(dbPath, { Promise });

  const startDate = getStartDate();
  const startElo = 1300;
  const startTrueskillSigma = 25 / 3;
  const startTrueskillMu = 25;
  if (verbose) {
    console.info(`seeding table with start elo ${startElo} and trueskill sigma: ${startTrueskillSigma} mu: ${startTrueskillMu} on date ${startDate}`);
  }
  await Promise.all(teams.map(team => db.run(`
    INSERT INTO rankings (rankingteamid, elo, trueskillsigma, trueskillmu, date) VALUES (
      (SELECT teamid FROM teams WHERE teams.abbreviation = "${team.abbreviation}"),
      ${startElo},
      ${startTrueskillSigma},
      ${startTrueskillMu},
      ${startDate}
    )
  `)));
  const matches = await db.all(`
    select
      competitions.k,
      hometeam,
      awayteam,
      homegoals,
      awaygoals,
      matches.date as date
    from matches
    inner join competitions on competitions.competitionid = matches.matchcompetition
    where matches.homegoals is not null
    order by date ASC
  `);
  if (verbose) {
    console.info(`processing ${matches.length} matches`);
  }
  for (const match of matches) {
    const awayranking = await db.get(`
      select
        rankings.elo,
        rankings.trueskillmu,
        rankings.trueskillsigma,
        rankings.date
      from rankings
      inner join (
        select
          max(date) as date,
          max.rankingteamid
        from rankings as max
        where max.rankingteamid = ${match.awayteam}
        group by max.rankingteamid
      ) as maxranking
      on rankings.rankingteamid = ${match.awayteam}
      and rankings.date = maxranking.date
    `);
    const homeranking = await db.get(`
      select
        rankings.elo,
        rankings.trueskillmu,
        rankings.trueskillsigma,
        rankings.date
      from rankings
      inner join (
        select
          max(date) as date,
          max.rankingteamid
        from rankings as max
        where max.rankingteamid = ${match.hometeam}
        group by max.rankingteamid
      ) as maxranking
      on rankings.rankingteamid = ${match.hometeam}
      and rankings.date = maxranking.date
    `);
    match.homeranking = homeranking.elo;
    match.awayranking = awayranking.elo;
    let homeElo, awayElo, homeTrueskill, awayTrueskill;
    if (match.homegoals < match.awaygoals) {
      homeElo = updateElo({
        verbose,
        match,
        won: false,
        isHome: true
      });
      awayElo = updateElo({
        verbose,
        match,
        won: true,
        isHome: false
      });
      homeTrueskill = {
        skill: [homeranking.trueskillmu, homeranking.trueskillsigma],
        rank: 2,
      };
      awayTrueskill = {
        skill: [awayranking.trueskillmu, awayranking.trueskillsigma],
        rank: 1,
      };
    } else if (match.homegoals === match.awaygoals) {
      homeElo = updateElo({
        verbose,
        match,
        won: false,
        isHome: true
      });
      awayElo = updateElo({
        verbose,
        match,
        won: false,
        isHome: false
      });
      homeTrueskill = {
        skill: [homeranking.trueskillmu, homeranking.trueskillsigma],
        rank: 2,
      };
      awayTrueskill = {
        skill: [awayranking.trueskillmu, awayranking.trueskillsigma],
        rank: 2,
      };
    } else {
      homeElo = updateElo({
        verbose,
        match,
        won: true,
        isHome: true
      });
      awayElo = updateElo({
        verbose,
        match,
        won: false,
        isHome: false
      });
      homeTrueskill = {
        skill: [homeranking.trueskillmu, homeranking.trueskillsigma],
        rank: 1,
      };
      awayTrueskill = {
        skill: [awayranking.trueskillmu, awayranking.trueskillsigma],
        rank: 2,
      };
    }
    trueskill.AdjustPlayers([homeTrueskill, awayTrueskill]);
    await Promise.all([db.run(`
        INSERT INTO rankings (elo, trueskillsigma, trueskillmu, date, rankingteamid) VALUES (
          ${homeElo},
          ${homeTrueskill.skill[1]},
          ${homeTrueskill.skill[0]},
          ${match.date},
          ${match.hometeam}
        )
      `),
      db.run(`
        INSERT INTO rankings (elo, trueskillsigma, trueskillmu, date, rankingteamid) VALUES (
          ${awayElo},
          ${homeTrueskill.skill[1]},
          ${homeTrueskill.skill[0]},
          ${match.date},
          ${match.awayteam}
        )
      `)
    ]);
    if (verbose) {
      console.info(`finished processing ${match.hometeam} vs ${match.awayteam} on ${match.date}`);
    }
  }
}
