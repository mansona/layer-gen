import { execa, execaNode } from 'execa';
import compareFixture from 'compare-fixture';

describe("local blueprint", function() {
  it("can execute a blueprint found locally", async function() {
    await execa('npm', ['i'], {
      cwd: './test/fixtures/local-blueprint',
    });

    await execaNode('../../../bin/gen.mjs', ['basic', 'entity'], {
      cwd: './test/fixtures/local-blueprint',
      stdio: 'inherit'
    });

    compareFixture('./test/fixtures/local-blueprint/app-expected', './test/fixtures/local-blueprint/app');
  })
})
