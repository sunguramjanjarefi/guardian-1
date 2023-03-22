#!/usr/bin/env node

import { Command } from 'commander';

/**
 * Main function of the guardian-cli
 * Runs the commander program and parses the arguments passed to the cli
 * All the commands are defined here
 * create, use, list, list-remote, build, clean, start, stop, destroy
 * create: clones the guardian repository and creates a new project
 * use: uses a specific version of guardian
 * list: lists all local guardian versions
 * list-remote: lists all remote guardian versions
 * build: builds the current guardian project
 * clean: cleans the artifacts of the current guardian project
 * start: starts guardian application
 * stop: stops guardian application
 * destroy: destroys the current guardian project
 * @returns {void}
 */
function main() {
  const program = new Command();

  program.option('-v, --version', 'output the current version', () => {
    console.log('0.0.1');
  });

  program.command('create')
    .description('create a new guardian project')

  program.command('use <version>')
    .description('use a specific version of guardian')

  program.command('list')
    .description('list all local guardian versions')

  program.command('list-remote')
    .description('list all remote guardian versions')

  program.command('build')
    .description('build the current guardian project')
    .option('-d --docker', 'build the project in a docker container')
    .option('-n --npm', 'use npm to install dependencies')
    .option('-y --yarn', 'use yarn to install dependencies')

  program.command('clean')
    .description('clean the artifacts of the current guardian project')
    .option('-d --docker', 'clean docker images')
    .option('-n --node', 'clean node modules and dists')

  program.command('start')
    .description('start guardian application')
    .option('-d --docker', 'start guardian using docker')
    .option('-p --pm2', 'start guardian using pm2')

  program.command('stop')
    .description('stop guardian application')
    .option('-d --docker', 'stop guardian using docker')
    .option('-p --pm2', 'stop guardian using pm2')

  program.command('destroy')
    .description('destroy the current guardian project')
    .option('-d --docker', 'destroy docker images')
    .option('-p --pm2', 'destroy node modules and dists')

  program.parse();
}

main();