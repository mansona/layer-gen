/* eslint-disable n/no-unpublished-import */
import execa from 'execa';
import { expect } from 'chai';
import compareFixture from 'compare-fixture';

const { node: execaNode } = execa;

describe('dependency blueprint', function () {
  it('can execute a blueprint found via dependency', async function () {
    await execa('npm', ['i'], {
      cwd: './test/fixtures/dependency-blueprint',
    });

    await execaNode('../../../bin/gen', ['g', 'basic', 'entity'], {
      cwd: './test/fixtures/dependency-blueprint',
      stdio: 'inherit',
    });

    compareFixture('./test/fixtures/dependency-blueprint/app-expected', './test/fixtures/dependency-blueprint/app');
  });

  it('cant execute blueprints that arent exposed via layer-gen package.json key', async function () {
    await execa('npm', ['i'], {
      cwd: './test/fixtures/dependency-blueprint',
    });

    try {
      await execaNode('../../../bin/gen', ['g', 'route', 'entity'], {
        cwd: './test/fixtures/dependency-blueprint',
      });
    } catch (err) {
      const { stderr } = err;
      expect(stderr).to.equal('Unknown blueprint: route\n');
    }
  });

  it('can execute blueprints that are exposed via layer-gen package.json key', async function () {
    await execa('npm', ['i'], {
      cwd: './test/fixtures/deep-dependency-blueprint',
    });

    await execaNode('../../../bin/gen', ['g', 'basic', 'entity'], {
      cwd: './test/fixtures/deep-dependency-blueprint',
    });

    compareFixture(
      './test/fixtures/deep-dependency-blueprint/app-expected',
      './test/fixtures/deep-dependency-blueprint/app'
    );
  });
});
