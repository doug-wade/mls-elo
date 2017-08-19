#!/usr/bin/env node
const backupCommand = require('./commands/backup');
const dataCommand = require('./commands/data');
const createCommand = require('./commands/create');
const importCommand = require('./commands/import');
const rankCommand = require('./commands/rank');
const standingsCommand = require('./commands/standings');
const predictCommand = require('./commands/predict');
const queryCommand = require('./commands/query');

process.on('unhandledRejection', (reason) => {
    console.error('Reason: ' + reason);
});

const yargs = require('yargs') // eslint-disable-line
  .command('create', 'create the database', (yargs) => {
    yargs.option('dbPath', {
      describe: 'database to create',
      default: '.cached/database.sqlite'
    })
  }, createCommand)
  .command('data', 'cache data', (yargs) => {
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
  .command('rank', 'rank teams', (yargs) => {
    yargs.option('dbPath', {
      describe: 'database to get results from and write ranks to',
      default: '.cached/database.sqlite'
    })
  }, rankCommand)
  .command('standings', 'get current standings', (yargs) => {
    yargs.option('dbPath', {
      describe: 'database to get standings from',
      default: '.cached/database.sqlite'
    })
    .option('elo', {
      describe: 'whether to show the elo rankings',
      default: true
    })
    .option('trueskill', {
      describe: 'whether to show the trueskill rankings',
      default: false
    })
  }, standingsCommand)
  .command('predict', 'predict a single match', (yargs) => {
    yargs.option('dbPath', {
      describe: 'database to predict from',
      default: '.cached/database.sqlite'
    })
  }, predictCommand)
  .command('backup', 'backup the database', (yargs) => {
    yargs.option('dbPath', {
      describe: 'location of database to backup',
      default: '.cached/database.sqlite'
    })
    .option('to', {
      describe: 'to where to backup the database',
      default: '~/Documents/database.sqlite'
    })
  }, backupCommand)
  .command('query', 'run an arbitrary query against the database', (yargs) => {
    yargs.option('dbPath', {
      describe: 'location of database to query',
      default: '.cached/database.sqlite'
    })
    .option('query', {
      describe: 'the query to run'
    })
    .demandOption('query', 'please provide a query to run')
  }, queryCommand)
  .command('')
  .option('verbose', {
    alias: 'v',
    default: false
  })
  .help()
  .argv
