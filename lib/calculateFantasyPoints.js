module.exports = function calculatePoints(record) {
  if (record.position === 'Goalkeeper') {
    return calculatePointsForGoalkeeper(record);
  }
  const { appearance, assists, foulsssuffered, goals, minutes, position, reds, shots, yellows } = record;
  // From https://fantasy.mlssoccer.com/a/help
  let points = 0;
  if (minutes >= 60) {
    points += 2;
  } else if (['Started', 'Subbed on '].includes(appearance)) {
    points += 1;
  }

  if (['Defender', 'Defender/Midfielder', 'Midfielder/Defender'].includes(position)) {
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

function calculatePointsForGoalkeeper({
  appearance, minutes, goalsfor, goalsagainst, shotsongoal, saves,
  penaltykicksagainst, penaltykickgoals, penaltykicksaves
}) {
  let points = 0;
  if (minutes >= 60) {
    points += 2;
  } else if (['Started', 'Subbed on '].includes(appearance)) {
    points += 1;
  }

  points += (goalsfor * 6);

  if (goalsagainst === 0 && minutes >= 60) {
    points += 5
  }

  points += penaltykicksaves * 5;

  points += (Math.floor(goalsagainst * -0.5));

  points += (Math.floor(saves/3));

  return points;
}
