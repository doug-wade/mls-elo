const db = require('sqlite');
const fs = require('fs-extra');
const path = require('path');
const untildify = require('untildify');
const calculateFantasyPoints = require('../lib/calculateFantasyPoints');

module.exports = async (argv) => {
  const {directory, player, date, dbPath, verbose, all, from, to} = argv;
  if (verbose) {
    console.info(`using database at ${dbPath} to calculate points for ${player} on ${date}`);
  }

  await db.open(dbPath, { Promise });

  if (player === 'all') {
    console.log('printing all fantasy point totals in order');
    const outfielders = await db.all(`
      select *
      from outfieldPlayerMatchLog
      inner join players
      on players.playerid = outfieldPlayerMatchLog.playerid
      inner join matches
      on matches.matchid = outfieldPlayerMatchLog.matchid
      ${date ?
        'where matches.date = ' + (new Date(date)).getTime() :
        'where matches.date BETWEEN ' + (new Date(from)).getTime() + ' AND ' + (new Date(to)).getTime()}
      ${player !== 'all' ?
        'and players.name = "' + player + '"':
        ''}
    `);

    const goalkeepers = await db.all(`
      select *
      from outfieldPlayerMatchLog
      inner join players
      on players.playerid = outfieldPlayerMatchLog.playerid
      inner join matches
      on matches.matchid = outfieldPlayerMatchLog.matchid
      ${date ?
        'where matches.date = ' + (new Date(date)).getTime() :
        'where matches.date BETWEEN ' + (new Date(from)).getTime() + ' AND ' + (new Date(to)).getTime()}
    `);

    const data = outfielders.concat(goalkeepers);

    let i = 0;
    const result = data.map(datum => {
      if (verbose) {
        console.log(`${JSON.stringify(datum)}`);
      }
      return { points: calculateFantasyPoints(datum), player: datum.name };
    }).reduce((acc, elem) => {
      if (verbose) {
        console.log(`elem: ${JSON.stringify(elem)}`);
      }
      if (!acc[elem.points]) {
        acc[elem.points] = []
      }
      acc[elem.points].push(elem);
      return acc;
    }, {});

    Object.keys(result).map(v => +v).sort((a, b) => {
      return a - b;
    }).reduce((acc, elem) => {
      if (verbose) {
        console.log(`elem: ${JSON.stringify(elem)}`);
      }
      if (acc >= 0) {
        acc.push(elem);
      } else {
        acc.unshift(elem);
      }
      return acc;
    }, []).forEach((index) => {
      const playerArr = result[index];
      if (verbose) {
        console.log(`playerArr: ${JSON.stringify(playerArr)}`);
      }
      playerArr.forEach(({ points, player}, j) => {
        console.log(`${i + 1}.) ${player} scored ${points} fantasy points`);
      });
      i += playerArr.length;
    });
    return;
  }

  const {position} = await db.get(`
    select *
    from players
    where players.name = "${player}"
  `);
  let data
  if (position === 'Goalkeeper') {
    data = await db.get(`
      select *
      from goalkeeperMatchLog
      inner join players
      on players.playerid = goalkeeperMatchLog.playerid
      inner join matches
      on matches.matchid = goalkeeperMatchLog.matchid
      ${date ?
        'where matches.date = ' + (new Date(date)).getTime() :
        'where matches.date BETWEEN ' + (new Date(from)).getTime() + ' AND ' + (new Date(to)).getTime()}
        and players.name = "${player}"
    `);
  } else {
    data = await db.get(`
      select *
      from outfieldPlayerMatchLog
      inner join players
      on players.playerid = outfieldPlayerMatchLog.playerid
      inner join matches
      on matches.matchid = outfieldPlayerMatchLog.matchid
      ${date ?
        'where matches.date = ' + (new Date(date)).getTime() :
        'where matches.date BETWEEN ' + (new Date(from)).getTime() + ' AND ' + (new Date(to)).getTime()}
        and players.name = "${player}"
    `);
  }
  const points = calculateFantasyPoints(data);
  console.log(`${data.name} scored ${points} fantasy points`);
}
