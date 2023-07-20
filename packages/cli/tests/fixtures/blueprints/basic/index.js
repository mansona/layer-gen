'use strict';

const Blueprint = require('layer-gen-blueprint');

module.exports = class BasicBlueprint extends Blueprint {
  description = 'A basic blueprint';
  beforeInstall(options, locals){
      return Promise.resolve().then(function(){
          locals.replacementTest = 'TESTY';
      });
  }
}
