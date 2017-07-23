#!/usr/bin/env node
const dataCommand = require('./commands/data');
const createCommand = require('./commands/create');
const importCommand = require('./commands/import');
const rankCommand = require('./commands/rank');
const standingsCommand = require('./commands/standings');
const predictCommand = require('./commands/predict');

process.on('unhandledRejection', (reason) => {
    console.log('Reason: ' + reason);
});

const yargs = require('yargs') // eslint-disable-line
  .command('create', 'cache data', (yargs) => {
    yargs.option('directory', {
      describe: 'directory to cache data in',
      default: '.cached'
    })
    .option('filename', {
      describe: 'file to use as the database file',
      default: 'database.sqlite'
    })
  }, createCommand)
  .command('data', 'create the database', (yargs) => {
    yargs.option('directory', {
      describe: 'directory to cache data in',
      default: '.cached'
    })
  }, dataCommand)
  .command('import', 'import data', (yargs) => {
    yargs.option('dbPath', {
      describe: 'database to import the data into',
      default: '.cached/database.sqlite'
    })
    .option('directory', {
      describe: 'directory the data is found in',
      default: '.cached'
    })
  }, importCommand)
  .command('rank', 'import teams', (yargs) => {
    yargs.option('dbPath', {
      describe: 'database to read team data from and write elo rankings to',
      default: '.cached/database.sqlite'
    })
  }, rankCommand)
  .command('standings', 'get current standings', (yargs) => {
    yargs.option('dbPath', {
      describe: 'database to read team data from and write elo rankings to',
      default: '.cached/database.sqlite'
    })
  }, standingsCommand)
  .command('predict', 'predict a single match', (yargs) => {
    yargs.option('dbPath', {
      describe: 'database to read team data from and write elo rankings to',
      default: '.cached/database.sqlite'
    })
  }, predictCommand)
  .option('verbose', {
    alias: 'v',
    default: false
  })
  .help()
  .argv
