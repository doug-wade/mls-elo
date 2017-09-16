const results = require('../data/results');

module.exports = ({match, isHome, won, verbose}) => {
  if (verbose) {
    console.info(`${JSON.stringify(match)} ${isHome} ${won}`);
  }
  let priorElo, opponentPriorElo;
  if (isHome) {
    priorElo = match.homeranking;
    opponentPriorElo = match.awayranking;
  } else {
    priorElo = match.awayranking;
    opponentPriorElo = match.homeranking;
  }
  const k = match.k;
  if (verbose) {
    console.info(`priorElo ${priorElo} opponentPriorElo ${opponentPriorElo} k ${k}`);
  }

  const eloDifference = priorElo - opponentPriorElo;
  let homeAdjustedEloDifference;
  if (isHome) {
    homeAdjustedEloDifference = eloDifference + 100;
  } else {
    homeAdjustedEloDifference = eloDifference - 100;
  }
  const x = homeAdjustedEloDifference / 200;
  const sexp = 1 / (1 + Math.pow(10, -x/2));
  if (verbose) {
    console.info(`eloDifference ${eloDifference} x ${x} sexp ${sexp}`);
  }

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
  if (verbose) {
    console.info(`sact ${sact} returning ${priorElo + (k * (sact - sexp))}`);
  }
  return priorElo + (k * (sact - sexp));
}
