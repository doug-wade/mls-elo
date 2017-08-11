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

  const teamsStatement = `INSERT INTO teams (teamname, abbreviation, location, start, end, founded, dissolved) VALUES ${
    teams.reduce((acc, val) => `${acc} ("${val.name}", "${val.abbreviation}", "${val.location}", ${val.start}, ${val.end}, ${(new Date(val.founded)).getTime()}, ${val.dissolved ? (new Date(val.dissolved)).getTime() : val.dissolved}),`, '').slice(0, -1)
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
    if (verbose) {
      console.log(`reading files from ${directory}/${year}.html`);
    }
    const $ = cheerio.load(await fs.readFile(`${directory}/${year}.html`));
    $('#center_content > div.ct_wrapper > div.results-map > div.scroll-container > table > tbody > tr').each((i, row) => {
      if (i === 0) {
        return;
      }
      const th = $(`#center_content > div.ct_wrapper > div.results-map > table > tbody > tr:nth-child(${i+1}) > th`);
      const abbreviation = th[0].children[0].data;
      const team = teams.reduce((team, acc) => team.abbreviation === abbreviation ? team : acc, []);
      if (verbose) {
        console.log(`${abbreviation} ${team.name}`);
      }
      row.children.forEach(async child => {
        if (!(child.children)) {
          return;
        }
        let dateStr = safeGet(child, 'children[3].children[1].children[3].children[1].children[0].data');
        let opponent = safeGet(child, 'children[3].children[1].children[3].children[3].children[0].data');
        let scoreline = safeGet(child, 'children[3].children[1].children[3].children[5].children[0].data');
        let date = (new Date(`${dateStr} ${year}`)).getTime();

        if (date && opponent && scoreline) {
          if (verbose) {
            console.log(`played: ${date}, ${team.name} ${opponent}, ${scoreline}`);
          }
          const [goals, opponentGoals] = scoreline.split('-');
          if (opponent.includes('at ')) {
            const location = opponent.replace('at ', '');
            const q = `
              SELECT matchid
              FROM matches
              WHERE hometeam = (SELECT teamid FROM teams where location = "${location}")
              AND awayteam = (SELECT teamid FROM teams where abbreviation = "${abbreviation}")
              AND date = ${date}
              AND matchcompetition = (SELECT competitionid FROM competitions where competitionname = "${competitions[3].name}");
            `;
            const results = await db.get(q);
            if (results && results.matchid) {
              if (verbose) {
                console.log(`Updating existing match with id ${matchid}`);
              }
              db.run(`
                UPDATE matches
                SET homegoals = ${goals}, awaygoals = ${opponentGoals}
                WHERE matchs.matchid = ${results.matchid}
              )`);
            } else {
              db.run(`
                INSERT INTO matches (hometeam, awayteam, matchcompetition, homegoals, awaygoals, date) VALUES (
                (SELECT teamid FROM teams where location = "${location}"),
                (SELECT teamid FROM teams where abbreviation = "${abbreviation}"),
                (SELECT competitionid FROM competitions where competitionname = "${competitions[3].name}"),
                ${goals},
                ${opponentGoals},
                ${date}
              )`);
            }
          }
        } else {
          dateStr = safeGet(child, 'children[3].children[3].children[1].children[0].data');
          opponent = safeGet(child, 'children[3].children[3].children[3].children[0].data');
          scoreline = safeGet(child, 'children[3].children[3].children[5].children[0].data');
          date = (new Date(`${dateStr} ${year}`)).getTime();

          if (verbose) {
            console.log(`scheduled: ${date} ${opponent} ${year} ${scoreline}`);
          }

          if (opponent.includes('at ')) {
            const location = opponent.replace('at ', '');
            db.run(`
              INSERT INTO matches (hometeam, awayteam, matchcompetition, date)
              VALUES (
                (SELECT teamid FROM teams where location = "${location}"),
                (SELECT teamid FROM teams where abbreviation = "${abbreviation}"),
                (SELECT competitionid FROM competitions where competitionname = "${competitions[3].name}"),
                ${date}
              )
            `);
          }
        }
      });
    });
  }

  const valuationPromises = [];
  Object.keys(valuations).forEach(year => {
    valuations[year].forEach(team => {
      const insertStatement = `
        INSERT INTO valuations (valuationteamid, value, revenue, income, year)
        VALUES (
          (SELECT teamid FROM teams where teamname = "${team.teamname}"),
          ${team.value},
          ${team.revenue},
          ${team.income},
          ${year}
        );
      `;
      if (verbose) {
        console.log(insertStatement);
      }
      valuationPromises.push(db.run(insertStatement));
    });
  });
  await Promise.all(valuationPromises);
};
