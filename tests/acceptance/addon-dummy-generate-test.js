'use strict';

const ember = require('../helpers/ember');
const fs = require('fs-extra');
const path = require('path');
let root = process.cwd();
let tmproot = path.join(root, 'tmp');
const Blueprint = require('../../lib/models/blueprint');
const BlueprintNpmTask = require('ember-cli-internal-test-helpers/lib/helpers/disable-npm-on-blueprint');
const mkTmpDirIn = require('../../lib/utilities/mk-tmp-dir-in');

const chai = require('../chai');
let expect = chai.expect;
let file = chai.file;

describe('Acceptance: ember generate in-addon-dummy', function () {
  this.timeout(20000);

  before(function () {
    BlueprintNpmTask.disableNPM(Blueprint);
  });

  after(function () {
    BlueprintNpmTask.restoreNPM(Blueprint);
  });

  beforeEach(async function () {
    let tmpdir = await mkTmpDirIn(tmproot);
    process.chdir(tmpdir);
  });

  afterEach(function () {
    process.chdir(root);
    return fs.remove(tmproot);
  });

  function initAddon() {
    return ember(['addon', 'my-addon', '--skip-npm', '--skip-bower']).then(addJSHint);
  }

  function addJSHint() {
    let pkg = fs.readJsonSync('package.json');
    pkg.devDependencies['ember-cli-jshint'] = '*';
    fs.writeJsonSync('package.json', pkg);
  }

  function generateInAddon(args) {
    let generateArgs = ['generate'].concat(args);

    return initAddon().then(function () {
      return ember(generateArgs);
    });
  }

  it('dummy blueprint foo', async function () {
    await generateInAddon(['blueprint', 'foo', '--dummy']);

    expect(file('blueprints/foo/index.js')).to.contain(
      'module.exports = {\n' +
        "  description: ''\n" +
        '\n' +
        '  // locals(options) {\n' +
        '  //   // Return custom template variables here.\n' +
        '  //   return {\n' +
        '  //     foo: options.entity.options.foo\n' +
        '  //   };\n' +
        '  // }\n' +
        '\n' +
        '  // afterInstall(options) {\n' +
        '  //   // Perform extra work here.\n' +
        '  // }\n' +
        '};'
    );
  });

  it('dummy blueprint foo/bar', async function () {
    await generateInAddon(['blueprint', 'foo/bar', '--dummy']);

    expect(file('blueprints/foo/bar/index.js')).to.contain(
      'module.exports = {\n' +
        "  description: ''\n" +
        '\n' +
        '  // locals(options) {\n' +
        '  //   // Return custom template variables here.\n' +
        '  //   return {\n' +
        '  //     foo: options.entity.options.foo\n' +
        '  //   };\n' +
        '  // }\n' +
        '\n' +
        '  // afterInstall(options) {\n' +
        '  //   // Perform extra work here.\n' +
        '  // }\n' +
        '};'
    );
  });

  it('dummy http-mock foo', async function () {
    await generateInAddon(['http-mock', 'foo', '--dummy']);

    expect(file('server/index.js')).to.contain('mocks.forEach(route => route(app));');

    expect(file('server/mocks/foo.js')).to.contain(
      'module.exports = function(app) {\n' +
        "  const express = require('express');\n" +
        '  let fooRouter = express.Router();\n' +
        '\n' +
        "  fooRouter.get('/', function(req, res) {\n" +
        '    res.send({\n' +
        "      'foo': []\n" +
        '    });\n' +
        '  });\n' +
        '\n' +
        "  fooRouter.post('/', function(req, res) {\n" +
        '    res.status(201).end();\n' +
        '  });\n' +
        '\n' +
        "  fooRouter.get('/:id', function(req, res) {\n" +
        '    res.send({\n' +
        "      'foo': {\n" +
        '        id: req.params.id\n' +
        '      }\n' +
        '    });\n' +
        '  });\n' +
        '\n' +
        "  fooRouter.put('/:id', function(req, res) {\n" +
        '    res.send({\n' +
        "      'foo': {\n" +
        '        id: req.params.id\n' +
        '      }\n' +
        '    });\n' +
        '  });\n' +
        '\n' +
        "  fooRouter.delete('/:id', function(req, res) {\n" +
        '    res.status(204).end();\n' +
        '  });\n' +
        '\n' +
        '  // The POST and PUT call will not contain a request body\n' +
        '  // because the body-parser is not included by default.\n' +
        '  // To use req.body, run:\n' +
        '\n' +
        '  //    npm install --save-dev body-parser\n' +
        '\n' +
        '  // After installing, you need to `use` the body-parser for\n' +
        '  // this mock uncommenting the following line:\n' +
        '  //\n' +
        "  //app.use('/api/foo', require('body-parser').json());\n" +
        "  app.use('/api/foo', fooRouter);\n" +
        '};\n'
    );

    expect(file('server/.jshintrc')).to.contain('{\n  "node": true\n}');
  });

  it('dummy http-mock foo-bar', async function () {
    await generateInAddon(['http-mock', 'foo-bar', '--dummy']);

    expect(file('server/index.js')).to.contain('mocks.forEach(route => route(app));');

    expect(file('server/mocks/foo-bar.js')).to.contain(
      'module.exports = function(app) {\n' +
        "  const express = require('express');\n" +
        '  let fooBarRouter = express.Router();\n' +
        '\n' +
        "  fooBarRouter.get('/', function(req, res) {\n" +
        '    res.send({\n' +
        "      'foo-bar': []\n" +
        '    });\n' +
        '  });\n' +
        '\n' +
        "  fooBarRouter.post('/', function(req, res) {\n" +
        '    res.status(201).end();\n' +
        '  });\n' +
        '\n' +
        "  fooBarRouter.get('/:id', function(req, res) {\n" +
        '    res.send({\n' +
        "      'foo-bar': {\n" +
        '        id: req.params.id\n' +
        '      }\n' +
        '    });\n' +
        '  });\n' +
        '\n' +
        "  fooBarRouter.put('/:id', function(req, res) {\n" +
        '    res.send({\n' +
        "      'foo-bar': {\n" +
        '        id: req.params.id\n' +
        '      }\n' +
        '    });\n' +
        '  });\n' +
        '\n' +
        "  fooBarRouter.delete('/:id', function(req, res) {\n" +
        '    res.status(204).end();\n' +
        '  });\n' +
        '\n' +
        '  // The POST and PUT call will not contain a request body\n' +
        '  // because the body-parser is not included by default.\n' +
        '  // To use req.body, run:\n' +
        '\n' +
        '  //    npm install --save-dev body-parser\n' +
        '\n' +
        '  // After installing, you need to `use` the body-parser for\n' +
        '  // this mock uncommenting the following line:\n' +
        '  //\n' +
        "  //app.use('/api/foo-bar', require('body-parser').json());\n" +
        "  app.use('/api/foo-bar', fooBarRouter);\n" +
        '};\n'
    );

    expect(file('server/.jshintrc')).to.contain('{\n  "node": true\n}');
  });

  it('dummy http-proxy foo', async function () {
    await generateInAddon(['http-proxy', 'foo', 'http://localhost:5000', '--dummy']);

    expect(file('server/index.js')).to.contain('proxies.forEach(route => route(app));');

    expect(file('server/proxies/foo.js')).to.contain(
      "const proxyPath = '/foo';\n" +
        '\n' +
        'module.exports = function(app) {\n' +
        '  // For options, see:\n' +
        '  // https://github.com/nodejitsu/node-http-proxy\n' +
        "  let proxy = require('http-proxy').createProxyServer({});\n" +
        '\n' +
        "  proxy.on('error', function(err, req) {\n" +
        '    console.error(err, req.url);\n' +
        '  });\n' +
        '\n' +
        '  app.use(proxyPath, function(req, res, next){\n' +
        '    // include root path in proxied request\n' +
        "    req.url = proxyPath + '/' + req.url;\n" +
        "    proxy.web(req, res, { target: 'http://localhost:5000' });\n" +
        '  });\n' +
        '};'
    );

    expect(file('server/.jshintrc')).to.contain('{\n  "node": true\n}');
  });

  it('dummy server', async function () {
    await generateInAddon(['server', '--dummy']);
    expect(file('server/index.js')).to.exist;
  });

  // ember addon foo --lang
  // -------------------------------
  // Good: Correct Usage
  it('ember addon foo --lang=(valid code): no message + set `lang` in index.html', async function () {
    await ember(['addon', 'foo', '--skip-npm', '--skip-bower', '--skip-git', '--lang=en-US']);
    expect(file('tests/dummy/app/index.html')).to.contain('<html lang="en-US">');
  });

  // Edge Case: both valid code AND programming language abbreviation, possible misuse
  it('ember addon foo --lang=(valid code + programming language abbreviation): emit warning + set `lang` in index.html', async function () {
    await ember(['addon', 'foo', '--skip-npm', '--skip-bower', '--skip-git', '--lang=css']);
    expect(file('tests/dummy/app/index.html')).to.contain('<html lang="css">');
  });

  // Misuse: possibly an attempt to set app programming language
  it('ember addon foo --lang=(programming language): emit warning + do not set `lang` in index.html', async function () {
    await ember(['addon', 'foo', '--skip-npm', '--skip-bower', '--skip-git', '--lang=JavaScript']);
    expect(file('tests/dummy/app/index.html')).to.contain('<html>');
  });

  // Misuse: possibly an attempt to set app programming language
  it('ember addon foo --lang=(programming language abbreviation): emit warning + do not set `lang` in index.html', async function () {
    await ember(['addon', 'foo', '--skip-npm', '--skip-bower', '--skip-git', '--lang=JS']);
    expect(file('tests/dummy/app/index.html')).to.contain('<html>');
  });

  // Misuse: possibly an attempt to set app programming language
  it('ember addon foo --lang=(programming language file extension): emit warning + do not set `lang` in index.html', async function () {
    await ember(['addon', 'foo', '--skip-npm', '--skip-bower', '--skip-git', '--lang=.js']);
    expect(file('tests/dummy/app/index.html')).to.contain('<html>');
  });

  // Misuse: Invalid Country Code
  it('ember addon foo --lang=(invalid code): emit warning + do not set `lang` in index.html', async function () {
    await ember(['addon', 'foo', '--skip-npm', '--skip-bower', '--skip-git', '--lang=en-UK']);
    expect(file('tests/dummy/app/index.html')).to.contain('<html>');
  });
});
