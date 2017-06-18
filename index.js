#!/usr/bin/env node
const dataCommand = require('./commands/data');
const createCommand = require('./commands/create');
const importCommand = require('./commands/import');

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
  .option('verbose', {
    alias: 'v',
    default: false
  })
  .help()
  .argv
