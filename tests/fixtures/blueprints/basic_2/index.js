const Blueprint = require('../../../../lib/models/blueprint');

module.exports = class BasicBlueprint2 extends Blueprint {
  description = 'Another basic blueprint';

  filesToRemove = ['file-to-remove.txt'];
};
