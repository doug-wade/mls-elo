const db = require('sqlite');
const fs = require('fs-extra');

module.exports = async (argv) => {
  const {directory, filename, verbose} = argv;
  if (verbose) {
    console.info(`caching results html in ${directory}`);
  }
  fs.mkdirp(directory);

  const fp = `./${directory}/${filename}`;
  if (verbose) {
    console.info(`creating db in ${fp}`);
  }

  await db.open(fp, { Promise });
  await Promise.all([
    db.run(`DROP TABLE IF EXISTS teams`),
    db.run(`DROP TABLE IF EXISTS matches`),
    db.run(`DROP TABLE IF EXISTS competitions`),
    db.run(`DROP TABLE IF EXISTS rankings`),
    db.run(`DROP TABLE IF EXISTS valuations`),
  ]);
  await Promise.all([
    db.run(`CREATE TABLE teams (
      teamid INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      teamname TEXT NOT NULL,
      location TEXT NOT NULL,
      abbreviation TEXT NOT NULL
    )`),
    db.run(`CREATE TABLE competitions (
      competitionid INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      competitionname TEXT NOT NULL,
      k INTEGER NOT NULL,
      m INTEGER NOT NULL
    )`),
    db.run(`CREATE TABLE valuations (
      valuationid INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      valuationteamid INTEGER NOT NULL,
      year INTEGER NOT NULL,
      value REAL NOT NULL,
      revenue REAL NOT NULL,
      income REAL NOT NULL,
      FOREIGN KEY(valuationteamid) REFERENCES teams(teamid)
    );`).then(() => db.run(`CREATE UNIQUE INDEX idx_uniquevaluations ON valuations(valuationteamid, year);`)),
    db.run(`CREATE TABLE matches (
      matchid INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      hometeam INTEGER NOT NULL,
      awayteam INTEGER NOT NULL,
      matchcompetition INTEGER NOT NULL,
      homegoals INTEGER NOT NULL,
      awaygoals INTEGER NOT NULL,
      date INTEGER NOT NULL,
      FOREIGN KEY(hometeam) REFERENCES teams(teamid),
      FOREIGN KEY(awayteam) REFERENCES teams(teamid),
      FOREIGN KEY(matchcompetition) REFERENCES competitions(competitionid)
    );`).then(() => db.run(`CREATE UNIQUE INDEX idx_uniquematches ON matches(hometeam, awayteam, date);`)),
    db.run(`CREATE TABLE rankings (
      rankingteamid INTEGER NOT NULL,
      elo INTEGER NOT NULL,
      date INTEGER NOT NULL,
      FOREIGN KEY(rankingteamid) REFERENCES teams(teamid)
    );`).then(() => db.run(`CREATE UNIQUE INDEX idx_uniquerankings ON rankings(rankingteamid, date);`)),
  ]);
}
