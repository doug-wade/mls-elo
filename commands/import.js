const cheerio = require('cheerio');
const db = require('sqlite');
const fs = require('fs-extra');
const safeGet = require ('safe-get');
const competitions = require('../data/competitions');
const teams = require('../data/teams');
const valuations = require('../data/valuations');

module.exports = async (argv) => {
  const {dbPath, directory, verbose} = argv;

  if (verbose) {
    console.info(`getting connection to database ${dbPath}`);
  }
  await db.open(dbPath, { Promise });

  const teamsStatement = `INSERT INTO teams (teamname, abbreviation, location) VALUES ${
    teams.reduce((acc, val) => `${acc} ("${val.name}", "${val.abbreviation}", "${val.location}"),`, '').slice(0, -1)
  }`;
  const competitionsStatement = `INSERT INTO competitions (competitionname, k, m) VALUES ${
    competitions.reduce((acc, val) => `${acc} ("${val.name}", ${val.k}, ${val.m}),`, '').slice(0, -1)
  }`;
  if (verbose) {
    console.log(teamsStatement);
    console.log(competitionsStatement);
  }
  await Promise.all([
    db.run(competitionsStatement),
    db.run(teamsStatement),
  ]);
  for (let year = 1996; year <= 2017; year++) {
    console.log(`reading files from ${directory}/${year}.html`);
    const $ = cheerio.load(await fs.readFile(`${directory}/${year}.html`));
    $('#center_content > div.ct_wrapper > div.results-map > div.scroll-container > table > tbody > tr').each((i, row) => {
      if (i === 0) {
        return;
      }
      const th = $(`#center_content > div.ct_wrapper > div.results-map > table > tbody > tr:nth-child(${i+1}) > th`);
      const abbreviation = th[0].children[0].data;
      const team = teams.reduce((team, acc) => team.abbreviation === abbreviation ? team : acc, []);
      console.log(`${abbreviation} ${team.name}`);
      row.children.forEach(child => {
        const dateStr = safeGet(child, 'children[3].children[1].children[3].children[1].children[0].data');
        const opponent = safeGet(child, 'children[3].children[1].children[3].children[3].children[0].data');
        const scoreline = safeGet(child, 'children[3].children[1].children[3].children[5].children[0].data');
        const date = (new Date(`${dateStr} ${year}`)).getTime();

        if (date && opponent && scoreline) {
          console.log(`${date}, ${team.name} ${opponent}, ${scoreline}`);
          const [goals, opponentGoals] = scoreline.split('-');
          if (opponent.includes('at ')) {
            const location = opponent.replace('at ', '');
            db.run(`INSERT INTO matches (hometeam, awayteam, matchcompetition, homegoals, awaygoals, date) VALUES (
              (SELECT teamid FROM teams where location = "${location}"),
              (SELECT teamid FROM teams where abbreviation = "${abbreviation}"),
              (SELECT competitionid FROM competitions where competitionname = "${competitions[3].name}"),
              ${goals},
              ${opponentGoals},
              ${date}
            )`);
          }
        }
      });
    });
  }

  const valuationPromises = [];
  Object.keys(valuations).forEach(year => {
    valuations[year].forEach(team => {
      const insertStatement = `INSERT INTO valuations (valuationteamid, value, revenue, income, year) VALUES (
        (SELECT teamid FROM teams where teamname = "${team.teamname}"),
        ${team.value},
        ${team.revenue},
        ${team.income},
        ${year}
      )`;
      if (verbose) {
        console.log(insertStatement);
      }
      valuationPromises.push(db.run(insertStatement));
    });
  });
  await Promise.all(valuationPromises);
};
