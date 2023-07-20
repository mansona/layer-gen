'use strict';

const path = require('path');
const { emberGenerate, emberNew, setupTestHooks } = require('layer-gen-blueprint-test-helpers');

const { expect } = require('chai');
const { dir } = require('chai-files');
const emberBlueprintPath = require('../../helpers/ember-blueprint-path');

describe('Acceptance: ember generate and destroy lib', function () {
  setupTestHooks(this, {
    cliPath: path.resolve(`${__dirname}/../../..`),
  });

  it('lib foo', async function () {
    let args = ['lib', 'foo', '-b', emberBlueprintPath('lib')];

    await emberNew();
    await emberGenerate(args);

    expect(dir('lib')).to.exist;
  });
});
