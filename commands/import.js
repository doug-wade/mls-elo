const cheerio = require('cheerio');
const db = require('sqlite');
const fs = require('fs-extra');
const safeGet = require ('safe-get');

const ccl = require('../data/ccl');
const competitions = require('../data/competitions');
const teams = require('../data/teams');
const valuations = require('../data/valuations');
const getBirthdateFromAgeString = require('../lib/getBirthdateFromAgeString');
const heightToInches = require('../lib/heightToInches');
const calculateFantasyPoints = require('../lib/calculateFantasyPoints');

module.exports = async (argv) => {
  const {dbPath, directory, verbose} = argv;

  if (verbose) {
    console.info(`getting connection to database ${dbPath}`);
  }
  await db.open(dbPath, { Promise });
  await loadCheckedInData(verbose);
  await loadFormData(verbose, directory);
  await loadPlayerData(verbose);
};

async function loadCheckedInData(verbose) {
  const teamsStatement = `INSERT INTO teams (teamname, abbreviation, location, start, end, founded, dissolved) VALUES ${
    teams.reduce((acc, val) => `${acc} ("${val.name}", "${val.abbreviation}", "${val.location}", ${val.start}, ${val.end}, ${(new Date(val.founded)).getTime()}, ${val.dissolved ? (new Date(val.dissolved)).getTime() : val.dissolved}),`, '').slice(0, -1)
  }`;
  const competitionsStatement = `INSERT INTO competitions (competitionname, k, m) VALUES ${
    competitions.reduce((acc, val) => `${acc} ("${val.name}", ${val.k}, ${val.m}),`, '').slice(0, -1)
  }`;
  if (verbose) {
    console.info(teamsStatement);
    console.info(competitionsStatement);
  }
  await Promise.all([
    db.run(competitionsStatement),
    db.run(teamsStatement),
  ]);

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
        console.info(insertStatement);
      }
      valuationPromises.push(db.run(insertStatement));
    });
  });
  await Promise.all(valuationPromises);

  await Promise.all(ccl.map(cclmatch => {
    const insertQuery = `
      INSERT INTO matches (hometeam, awayteam, matchcompetition, homegoals, awaygoals, date) VALUES (
      (SELECT teamid FROM teams where abbreviation = "${cclmatch.home}"),
      (SELECT teamid FROM teams where abbreviation = "${cclmatch.away}"),
      (SELECT competitionid FROM competitions where competitionname = "${competitions[5].name}"),
      ${cclmatch.homeGoals},
      ${cclmatch.awayGoals},
      ${cclmatch.date}
    )`;
    console.log(insertQuery);
    return db.run(insertQuery);
  }));
}

async function loadFormData(verbose, directory) {
  for (let year = 1996; year <= 2017; year++) {
    if (verbose) {
      console.info(`reading files from ${directory}/${year}.html`);
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
        console.info(`${abbreviation} ${team.name}`);
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
            console.info(`played: ${date}, ${team.name} ${opponent}, ${scoreline}`);
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
                console.info(`Updating existing match with id ${matchid}`);
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
            console.info(`scheduled: ${date} ${opponent} ${year} ${scoreline}`);
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
}

async function loadPlayerData(verbose) {
  const playerFiles = await fs.readdir('.cached/players');
  let playerid;
  for (let playerFile of playerFiles) {
    const $ = cheerio.load(await fs.readFile(`.cached/players/${playerFile}`));
    const titleOverlay = $('div.title_overlay');
    const playerInfo = $('div.player_info_alternate');
    const hometown =  playerInfo.find('.hometown').length > 0
      ? playerInfo.find('.hometown')[0].children[1].data.replace('\n', '')
      : null;
    const birthplace = playerInfo.find('.hometown').length > 1
      ? playerInfo.find('.hometown')[1].children[1].data.replace('\n', '')
      : null;
    const twitter = playerInfo.find('.twitter_handle').length > 0
      ? playerInfo.find('.twitter_handle')[0].children[0].children[0].data
      : null;
    const weight = playerInfo.find('.stat').length > 1
      ? playerInfo.find('.stat')[1].children[0].data
      : null;
    const jersey = titleOverlay.find('.jersey_container') && titleOverlay.find('.jersey_container').length > 0
      ? titleOverlay.find('.jersey_container')[0].children[0].children[0].data
      : null;
    const height = playerInfo.find('.stat') && playerInfo.find('.stat').length > 0
      ? heightToInches(playerInfo.find('.stat')[0].children[0].data)
      : null;
    const position = titleOverlay.find('.position') && titleOverlay.find('.position').length > 0
      ? titleOverlay.find('.position')[0].children[0].data
      : null;
    const insertQuery = `
      INSERT INTO players (name, realname, height, weight, hometown, birthdate, birthplace, twitter, position, jersey)
      VALUES (
        "${titleOverlay.find('.title')[0].children[0].data}",
        "${playerInfo.find('.name')[0].children[1].data.replace('\n', '')}",
        ${height},
        ${weight},
        "${hometown}",
        ${getBirthdateFromAgeString(playerInfo.find('.age')[0].children[1].data)},
        "${birthplace}",
        "${twitter}",
        "${position}",
        ${jersey}
      );
      `;
      const selectQuery = `
      SELECT playerid
      FROM players
      WHERE birthplace = "${birthplace}"
      AND twitter = "${twitter}"
      AND name = "${titleOverlay.find('.title')[0].children[0].data}";
    `;
    if (verbose) {
      console.info(insertQuery);
      console.info(selectQuery);
    }
    await db.run(insertQuery);
    playerid = await db.get(selectQuery);

    // insert match stats
    $('div.gamelog_tables > table.no-more-tables > tbody > tr').each(async (i, row) => {
      const result = safeGet(row, 'children[2].children[0].data');
      const scorelineStr = safeGet(row, 'children[1].children[0].data');
      const dateStr = safeGet(row, 'children[0].children[0].data');
      const [awayteam, hometeam] = scorelineStr.split('@');
      const date = (new Date(dateStr)).getTime();
      const query = `
        SELECT matchid
        FROM matches
        WHERE date = ${date}
        AND hometeam = (SELECT teamid FROM teams WHERE abbreviation = "${hometeam.trim()}")
        AND awayteam = (SELECT teamid FROM teams WHERE abbreviation = "${awayteam.trim()}")`;
      let matchid = await db.get(query);
      if (!matchid) {
        // Player data includes MLS Cup statisitics, meaning we can extract mls
        // cup matches from them!
        if (date < 0) {
          debugger;
        }
        let [awaygoals, homegoals] = (result.split(' ')[1]).split('-');
        if (homegoals.includes('(')) {
          /// It's a tie.  Add the penalties to the total goals to make rankings work
          homegoals = homegoals.replace(')', '+');
          homegoals = homegoals.replace('(', '');
          homegoals = eval(homegoals);

          awaygoals = awaygoals.replace(')', '');
          awaygoals = awaygoals.replace('(', '+');
          awaygoals = eval(awaygoals);
        }
        db.run(`
          INSERT INTO matches (hometeam, awayteam, matchcompetition, homegoals, awaygoals, date)
          VALUES (
            (SELECT teamid FROM teams where abbreviation = "${hometeam.trim()}"),
            (SELECT teamid FROM teams where abbreviation = "${awayteam.trim()}"),
            (SELECT competitionid FROM competitions where competitionname = "${competitions[4].name}"),
            ${homegoals},
            ${awaygoals},
            ${date}
          )
        `);
        matchid = await db.get(query);
      }
      if (verbose) {
        console.info(`Processing player id ${JSON.stringify(playerid)} for match id ${JSON.stringify(matchid)}`);
      }
      if (position.includes('Goalkeeper')) {
        const appearance = safeGet(row, 'children[3].children[0].data');
        const minutes = safeGet(row, 'children[4].children[0].data');
        const goalsfor = safeGet(row, 'children[5].children[0].data');
        const goalsagainst = safeGet(row, 'children[6].children[0].data');
        const shotsongoal = safeGet(row, 'children[7].children[0].data');
        const saves = safeGet(row, 'children[8].children[0].data');
        const penaltykicksagainst = safeGet(row, 'children[9].children[0].data');
        const penaltykickgoals = safeGet(row, 'children[10].children[0].data');
        const penaltykicksaves = safeGet(row, 'children[11].children[0].data');
        const fantasypoints = calculateFantasyPoints({appearance, minutes, goalsfor, goalsagainst, shotsongoal, saves, penaltykicksagainst, penaltykickgoals, penaltykicksaves});
        db.run(`
          INSERT INTO goalkeeperMatchLog (playerid, matchid, result, appearance, minutes, goalsfor, goalsagainst, shotsongoal, saves, penaltykicksagainst, penaltykickgoals, penaltykicksaves, fantasypoints)
          VALUES (
            ${playerid.playerid},
            ${matchid.matchid},
            "${result}",
            "${appearance}",
            ${minutes},
            ${goalsfor},
            ${goalsagainst},
            ${shotsongoal},
            ${saves},
            ${penaltykicksagainst},
            ${penaltykickgoals},
            ${penaltykicksaves},
            ${fantasypoints}
          )
        `);
      } else {
        const appearance = safeGet(row, 'children[3].children[0].data');
        const minutes = safeGet(row, 'children[4].children[0].data');
        const goals = safeGet(row, 'children[5].children[0].data');
        const assists = safeGet(row, 'children[6].children[0].data');
        const shots = safeGet(row, 'children[7].children[0].data')
        const shotsongoal = safeGet(row, 'children[8].children[0].data');
        const foulscommitted = safeGet(row, 'children[9].children[0].data');
        const foulsssuffered = safeGet(row, 'children[10].children[0].data');
        const yellows = safeGet(row, 'children[11].children[0].data');
        const reds = safeGet(row, 'children[12].children[0].data');
        const fantasypoints = calculateFantasyPoints({appearance, minutes, goals, assists, shots, shotsongoal, foulscommitted, foulsssuffered, yellows, reds});
        db.run(`
          INSERT INTO outfieldPlayerMatchLog (playerid, matchid, result, appearance, minutes, goals, assists, shots, shotsongoal, foulscommitted, foulsssuffered, yellows, reds, fantasypoints)
          VALUES (
            ${playerid.playerid},
            ${matchid.matchid},
            "${result}",
            "${appearance}",
            ${minutes},
            ${goals},
            ${assists},
            ${shots},
            ${shotsongoal},
            ${foulscommitted},
            ${foulsssuffered},
            ${yellows},
            ${reds},
            ${fantasypoints}
          )
        `);
      }
    });
  }
}
