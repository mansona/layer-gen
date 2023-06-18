module.exports = {
  setupTestHooks: require('./helpers/setup'),
  emberNew: require('./ember-new'),
  emberGenerate: require('./ember-generate'),
  emberDestroy: require('./ember-destroy'),
  emberGenerateDestroy: require('./ember-generate-destroy'),
  modifyPackages: require('./modify-packages'),
  setupPodConfig: require('./setup-pod-config'),
};
