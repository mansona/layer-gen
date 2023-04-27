import execa from 'execa';
// eslint-disable-next-line n/no-unpublished-import
import compareFixture from 'compare-fixture';

const { node: execaNode } = execa;

describe('local blueprint', function () {
  it('can execute a blueprint found locally', async function () {
    await execa('npm', ['i'], {
      cwd: './test/fixtures/local-blueprint',
    });

    await execaNode('../../../bin/gen', ['g', 'basic', 'entity'], {
      cwd: './test/fixtures/local-blueprint',
      stdio: 'inherit',
    });

    compareFixture('./test/fixtures/local-blueprint/app-expected', './test/fixtures/local-blueprint/app');
  });
});
