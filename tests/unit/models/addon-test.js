'use strict';

const fs = require('fs-extra');
const path = require('path');
const { expect } = require('chai');
const mkTmpDirIn = require('../../../lib/utilities/mk-tmp-dir-in');

let root = process.cwd();
let tmproot = path.join(root, 'tmp');

describe.skip('models/addon.js', function () {
  let addon, project;

  describe('initialized addon', function () {
    this.timeout(40000);

    describe('generated addon', function () {
      beforeEach(function () {
        addon = project.addons.find((addon) => addon.name === 'ember-generated-with-export-addon');

        // Clear the caches
        delete addon._moduleName;
      });

      it('sets its project', function () {
        expect(addon.project.name).to.equal(project.name);
      });

      it('sets its parent', function () {
        expect(addon.parent.name).to.equal(project.name);
      });

      it('sets the root', function () {
        expect(addon.root).to.not.equal(undefined);
      });

      it('sets the pkg', function () {
        expect(addon.pkg).to.not.equal(undefined);
      });
    });

    describe('blueprintsPath', function () {
      let tmpdir;

      beforeEach(async function () {
        tmpdir = await mkTmpDirIn(tmproot);
        addon.root = tmpdir;
      });

      afterEach(function () {
        return fs.remove(tmproot);
      });

      it('returns undefined if the `blueprint` folder does not exist', function () {
        let returnedPath = addon.blueprintsPath();

        expect(returnedPath).to.equal(undefined);
      });

      it('returns blueprint path if the folder exists', function () {
        let blueprintsDir = path.join(tmpdir, 'blueprints');
        fs.mkdirSync(blueprintsDir);

        let returnedPath = addon.blueprintsPath();

        expect(returnedPath).to.equal(blueprintsDir);
      });
    });
  });
});
