#!/usr/bin/env node
const data = require('./commands/data');
const yargs = require('yargs') // eslint-disable-line
  .command('data', 'cache data', (yargs) => {
    yargs.option('port', {
      describe: 'port to bind on',
      default: 5000
    })
  }, data)
  .option('verbose', {
    alias: 'v',
    default: false
  })
  .help()
  .argv
