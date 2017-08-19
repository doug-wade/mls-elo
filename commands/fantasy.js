const db = require('sqlite');
const fs = require('fs-extra');
const path = require('path');
const untildify = require('untildify');

module.exports = async (argv) => {
  const {directory, player, date, dbPath, verbose} = argv;
  if (verbose) {
    console.info(`using database at ${dbPath} to calculate points for ${player} on ${date}`);
  }

  await db.open(dbPath, { Promise });

  const data = await db.get(`
    select *
    from outfieldPlayerMatchLog
    inner join players
    on players.playerid = outfieldPlayerMatchLog.playerid
    inner join matches
    on matches.matchid = outfieldPlayerMatchLog.matchid
    where players.name = '${player}'
    and matches.date = ${(new Date(date)).getTime()}
  `);

  // From https://fantasy.mlssoccer.com/a/help
  let points = 0;
  if (data.minutes >= 60) {
    points += 2;
  } else if (['Started', 'Subbed on '].includes(data.appearance)) {
    points += 1;
  }

  if (['Defender', 'Goalkeeper', 'Defender/Midfielder', 'Midfielder/Defender'].includes(data.postition)) {
    points += (data.goals * 6);
  } else {
    points += (data.goals * 5);
  }

  points += (data.assists * 3);

  // TODO: Add clean sheets and goals conceded (#18)

  // TODO: Add penalties (#19)

  // TODO: Add own goals (#20)

  points -= (data.yellows);
  points -= (3 * data.reds);

  // TODO: Passing accuracy

  points += Math.floor(data.shots/4);
  points += Math.floor(data.foulsssuffered/4);

  console.log(`${player} scored ${points} fantasy points`);
}
