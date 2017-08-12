const db = require('sqlite');
const fs = require('fs-extra');
const trueskill = require('trueskill');
const teams = require('../data/teams');
const results = require('../data/results');

module.exports = async (argv) => {
  const {dbPath, verbose} = argv;
  if (verbose) {
    console.info(`using db in ${dbPath}`);
  }

  await db.open(dbPath, { Promise });

  const startDate = new Date('December 11, 1973').getTime();
  const startElo = 1300;
  const startTrueskillSigma = 25 / 3;
  const startTrueskillMu = 25;
  console.log(`seeding table with start elo ${startElo} and trueskill sigma: ${startTrueskillSigma} mu: ${startTrueskillMu} on date ${startDate}`);
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
  console.log(`processing ${matches.length} matches`);
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
        match,
        won: false,
        isHome: true
      });
      awayElo = updateElo({
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
        match,
        won: false,
        isHome: true
      });
      awayElo = updateElo({
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
        match,
        won: true,
        isHome: true
      });
      awayElo = updateElo({
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
    console.log(`finished processing ${match.hometeam} vs ${match.awayteam} on ${match.date}`);
  }
}

function updateElo({match, isHome, won}) {
  console.log(`${JSON.stringify(match)} ${isHome} ${won}`);
  let priorElo, opponentPriorElo;
  if (isHome) {
    priorElo = match.homeranking;
    opponentPriorElo = match.awayranking;
  } else {
    priorElo = match.awayranking;
    opponentPriorElo = match.homeranking;
  }
  const k = match.k;
  console.log(`priorElo ${priorElo} opponentPriorElo ${opponentPriorElo} k ${k}`);

  const eloDifference = priorElo - opponentPriorElo;
  let homeAdjustedEloDifference;
  if (isHome) {
    homeAdjustedEloDifference = eloDifference + 100;
  } else {
    homeAdjustedEloDifference = eloDifference - 100;
  }
  const x = homeAdjustedEloDifference / 200;
  const sexp = 1 / (1 + Math.pow(10, -x/2));
  console.log(`eloDifference ${eloDifference} x ${x} sexp ${sexp}`);

  let sact;
  if (won) {
    let losingGoals = isHome ? match.awaygoals : match.homegoals;
    if (losingGoals > 5) {
      losingGoals = 5;
    }
    let goalDifferential = Math.abs(match.homegoals - match.awaygoals);
    if (goalDifferential > 6) {
      goalDifferential = 6;
    }
    sact = (1 - (results[losingGoals][goalDifferential] * .01));
  } else {
    let losingGoals = isHome ? match.homegoals : match.awaygoals;
    if (losingGoals > 5) {
      losingGoals = 5;
    }
    let goalDifferential = Math.abs(match.homegoals - match.awaygoals);
    if (goalDifferential > 6) {
      goalDifferential = 6;
    }
    sact = (results[losingGoals][goalDifferential] * .01);
  }
  console.log(`sact ${sact} returning ${priorElo + (k * (sact - sexp))}`);
  return priorElo + (k * (sact - sexp));
}
