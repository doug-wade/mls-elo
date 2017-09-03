const db = require('sqlite');
const fs = require('fs-extra');
const path = require('path');
const untildify = require('untildify');

module.exports = async (argv) => {
  const {directory, player, date, dbPath, verbose, all, from, to} = argv;
  if (verbose) {
    console.info(`using database at ${dbPath} to calculate points for ${player} on ${date}`);
  }

  await db.open(dbPath, { Promise });

  const query = `
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
  `;

  if (verbose) {
    console.log(query);
  }

  let data;
  if (player === 'all') {
    console.log('printing all fantasy point totals in order');
    data = await db.all(query);

    let i = 0;
    const result = data.map(datum => {
      if (verbose) {
        console.log(`${JSON.stringify(datum)}`);
      }
      return { points: calculatePoints(datum), player: datum.name };
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

  } else {
    data = await db.get(query);
    const points = calculatePoints(data);
    console.log(`${data.name} scored ${points} fantasy points`);
  }
}

function calculatePoints({ appearance, assists, foulsssuffered, goals, minutes, data, position, reds, shots, yellows }) {
  // From https://fantasy.mlssoccer.com/a/help
  let points = 0;
  if (minutes >= 60) {
    points += 2;
  } else if (['Started', 'Subbed on '].includes(appearance)) {
    points += 1;
  }

  if (['Defender', 'Goalkeeper', 'Defender/Midfielder', 'Midfielder/Defender'].includes(position)) {
    points += (goals * 6);
  } else {
    points += (goals * 5);
  }

  points += (assists * 3);

  // TODO: Add clean sheets and goals conceded (#18)

  // TODO: Add penalties (#19)

  // TODO: Add own goals (#20)

  points -= (yellows);
  points -= (3 * reds);

  // TODO: Passing accuracy

  points += Math.floor(shots / 4);
  points += Math.floor(foulsssuffered / 4);

  return points;
}
