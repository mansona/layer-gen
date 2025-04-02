import { packageUp } from 'package-up';
import { readFile } from 'node:fs/promises';

import { createRequire } from 'node:module';
import { join } from 'node:path/posix';
import { dirname, resolve } from 'node:path';


const require = createRequire(import.meta.url);

export default async function blueprintSearch() {
  const packageLocation = await packageUp();

  const blueprints = new Map();

  const pkgJson = JSON.parse(await readFile(packageLocation, 'utf8'));

  for (let key in {...pkgJson.dependencies , ...pkgJson.devDependencies }) {
    try {
      const depLocation = require.resolve(join(key), {
        paths: [process.cwd()]
      });
      const depPackageLocation = await packageUp({ cwd: dirname(depLocation)});
      const depJson = JSON.parse(await readFile(depPackageLocation, 'utf8'));

      for (let blueprintName in depJson.blueprints) {
        try {
          blueprints.set(blueprintName, resolve(dirname(depPackageLocation), depJson.blueprints[blueprintName]));

        } catch (err) {
          console.log(err);
        }
      }
    } catch {
      // just continue if we can't resolve the package - nothing we can do here
    }
  }

  return blueprints;
}