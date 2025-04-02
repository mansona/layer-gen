import { program } from 'commander';
import Blueprint from '@ember/blueprint-model';
import blueprintSearch from '../lib/blueprint-search.js';
import prompts from 'prompts';

program
  .description('generate entity from bluerpint')
  .argument('<blueprint name>')
  .argument('<entity name>');

program.parse();

const options = program.opts();

const [blueprintName, entityName] = program.args;

const blueprints = await blueprintSearch();

if (blueprints.has(blueprintName)) {
  const blueprintInstance = Blueprint.lookup(blueprints.get(blueprintName));
  blueprintInstance.install({
    entity: {
      name: entityName,
    },
    target: '.',
    project: {
      name: () => entityName,
      config: () => ({}),
      isEmberCLIAddon: () => false,
      
    },
    ui: { 
      writeLine: console.log, 
      write: (item) => process.stdout.write(item.toString()),
      async prompt(options) {
        return prompts.prompt({
          type: 'select',
          name: 'answer',
          message: options.message,
          choices: options.choices.map(c => ({value: c.value, title: c.name}))
        })
    } }
  });
}


// console.log(program.args, options);