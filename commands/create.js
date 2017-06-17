const db = require('sqlite');
const fs = require('fs-extra');

module.exports = (argv) => {
  const {directory, filename, verbose} = argv;
  if (verbose) {
    console.info(`caching results html in ${directory}`);
  }
  fs.mkdirp(directory);

  const fp = `./${directory}/${filename}`;
  if (verbose) {
    console.info(`creating db in ${fp}`);
  }

  Promise.resolve()
    // First, open the database
    .then(() => db.open(fp, { Promise }))
    // Then drop and create the tables
    .then(async () => {
      await Promise.all([
        db.run(`DROP TABLE IF EXISTS teams`),
        db.run(`DROP TABLE IF EXISTS matches`),
        db.run(`DROP TABLE IF EXISTS competitions`),
      ]);
      await Promise.all([
        db.run(`CREATE TABLE teams (
          teamid INTEGER PRIMARY KEY AUTOINCREMENT,
          teamname TEXT
        )`),
        db.run(`CREATE TABLE competitions (
          competitionid INTEGER PRIMARY KEY AUTOINCREMENT,
          competitionname TEXT
        )`),
        db.run(`CREATE TABLE matches (
          matchid INTEGER PRIMARY KEY AUTOINCREMENT,
          hometeam INTEGER,
          awayteam INTEGER,
          matchcompetition INTEGER,
          homegoals INTEGER,
          awaygoals INTEGER,
          FOREIGN KEY(hometeam) REFERENCES teams(teamid),
          FOREIGN KEY(awayteam) REFERENCES teams(teamid),
          FOREIGN KEY(matchcompetition) REFERENCES competitions(competitionid)
        )`),
      ]);
    })
    .catch(err => console.error(err.stack));
}
