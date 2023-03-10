#!/usr/bin/env node

import minimist from 'minimist'
import merge from 'lodash.merge';
import generateFromBlueprint from '../lib/generateFromBlueprint.mjs';

const argv = minimist(process.argv.slice(2));

// TODO figure out what it means to "merge blueprint options"
// lib/utilities/merge-blueprint-options.js
// and do that I guess

let blueprintName = argv._[0];

if (!blueprintName) {
    console.error('You must provide a blueprint name');
    process.exit(1);
}

let taskArgs = {
    args: argv._,
};


// let taskOptions = merge(taskArgs, commandOptions || {});

// if (this.project.initializeAddons) {
//     this.project.initializeAddons();
// }


await generateFromBlueprint(argv);


// this.runTask('GenerateFromBlueprint', taskOptions);
