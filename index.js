#!/usr/bin/env node
const data = require('./commands/data');
const create = require('./commands/create');

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
  }, create)
  .command('data', 'cache data', (yargs) => {
    yargs.option('directory', {
      describe: 'directory to cache data in',
      default: '.cached'
    })
  }, data)
  .option('verbose', {
    alias: 'v',
    default: false
  })
  .help()
  .argv
