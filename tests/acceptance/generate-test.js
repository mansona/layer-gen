'use strict';

var Promise          = require('../../lib/ext/promise');
var assertFile       = require('ember-cli-internal-test-helpers/lib/helpers/assert-file');
var assertFileEquals = require('ember-cli-internal-test-helpers/lib/helpers/assert-file-equals');
var conf             = require('ember-cli-internal-test-helpers/lib/helpers/conf');
var ember            = require('../helpers/ember');
var fs               = require('fs-extra');
var outputFile       = Promise.denodeify(fs.outputFile);
var path             = require('path');
var remove           = Promise.denodeify(fs.remove);
var replaceFile      = require('ember-cli-internal-test-helpers/lib/helpers/file-utils').replaceFile;
var root             = process.cwd();
var tmproot          = path.join(root, 'tmp');
var Blueprint        = require('../../lib/models/blueprint');
var BlueprintNpmTask = require('ember-cli-internal-test-helpers/lib/helpers/disable-npm-on-blueprint');
var expect           = require('chai').expect;
var MockUI             = require('../helpers/mock-ui');
var mkTmpDirIn       = require('../../lib/utilities/mk-tmp-dir-in');

describe('Acceptance: ember generate', function() {
  this.timeout(20000);

  var tmpdir;

  before(function() {
    BlueprintNpmTask.disableNPM(Blueprint);
    conf.setup();
  });

  after(function() {
    BlueprintNpmTask.restoreNPM(Blueprint);
    conf.restore();
  });

  beforeEach(function() {
    return mkTmpDirIn(tmproot).then(function(dir) {
      tmpdir = dir;
      process.chdir(tmpdir);
    });
  });

  afterEach(function() {
    process.chdir(root);
    return remove(tmproot);
  });

  function initApp() {
    return ember([
      'init',
      '--name=my-app',
      '--skip-npm',
      '--skip-bower'
    ]);
  }

  function generate(args) {
    var generateArgs = ['generate'].concat(args);

    return initApp().then(function() {
      return ember(generateArgs);
    });
  }

  it('component x-foo', function() {
    return generate(['component', 'x-foo']).then(function() {
      assertFile('app/components/x-foo.js', {
        contains: [
          "import Ember from 'ember';",
          "export default Ember.Component.extend({",
          "});"
        ]
      });
      assertFile('app/templates/components/x-foo.hbs', {
        contains: "{{yield}}"
      });
      assertFile('tests/integration/components/x-foo-test.js', {
        contains: [
          "import { moduleForComponent, test } from 'ember-qunit';",
          "import hbs from 'htmlbars-inline-precompile';",
          "moduleForComponent('x-foo'",
          "integration: true",
          "{{x-foo}}",
          "{{#x-foo}}"
        ]
      });
    });
  });

  it('component foo/x-foo', function() {
    return generate(['component', 'foo/x-foo']).then(function() {
      assertFile('app/components/foo/x-foo.js', {
        contains: [
          "import Ember from 'ember';",
          "export default Ember.Component.extend({",
          "});"
        ]
      });
      assertFile('app/templates/components/foo/x-foo.hbs', {
        contains: "{{yield}}"
      });
      assertFile('tests/integration/components/foo/x-foo-test.js', {
        contains: [
          "import { moduleForComponent, test } from 'ember-qunit';",
          "import hbs from 'htmlbars-inline-precompile';",
          "moduleForComponent('foo/x-foo'",
          "integration: true",
          "{{foo/x-foo}}",
          "{{#foo/x-foo}}"
        ]
      });
    });
  });

  it('component x-foo ignores --path option', function() {
    return generate(['component', 'x-foo', '--path', 'foo']).then(function() {
      assertFile('app/components/x-foo.js', {
        contains: [
          "import Ember from 'ember';",
          "export default Ember.Component.extend({",
          "});"
        ]
      });
      assertFile('app/templates/components/x-foo.hbs', {
        contains: "{{yield}}"
      });
      assertFile('tests/integration/components/x-foo-test.js', {
        contains: [
          "import { moduleForComponent, test } from 'ember-qunit';",
          "import hbs from 'htmlbars-inline-precompile';",
          "moduleForComponent('x-foo'",
          "integration: true",
          "{{x-foo}}",
          "{{#x-foo}}"
        ]
      });
    });
  });

  it('blueprint foo', function() {
    return generate(['blueprint', 'foo']).then(function() {
      assertFile('blueprints/foo/index.js', {
        contains: "module.exports = {\n" +
                  "  description: ''\n" +
                  "\n" +
                  "  // locals: function(options) {\n" +
                  "  //   // Return custom template variables here.\n" +
                  "  //   return {\n" +
                  "  //     foo: options.entity.options.foo\n" +
                  "  //   };\n" +
                  "  // }\n" +
                  "\n" +
                  "  // afterInstall: function(options) {\n" +
                  "  //   // Perform extra work here.\n" +
                  "  // }\n" +
                  "};"
      });
    });
  });

  it('blueprint foo/bar', function() {
    return generate(['blueprint', 'foo/bar']).then(function() {
      assertFile('blueprints/foo/bar/index.js', {
        contains: "module.exports = {\n" +
                  "  description: ''\n" +
                  "\n" +
                  "  // locals: function(options) {\n" +
                  "  //   // Return custom template variables here.\n" +
                  "  //   return {\n" +
                  "  //     foo: options.entity.options.foo\n" +
                  "  //   };\n" +
                  "  // }\n" +
                  "\n" +
                  "  // afterInstall: function(options) {\n" +
                  "  //   // Perform extra work here.\n" +
                  "  // }\n" +
                  "};"
      });
    });
  });

  it('http-mock foo', function() {
    return generate(['http-mock', 'foo']).then(function() {
      assertFile('server/index.js', {
        contains:"mocks.forEach(function(route) { route(app); });"
      });
      assertFile('server/mocks/foo.js', {
        contains: "module.exports = function(app) {\n" +
                  "  var express = require('express');\n" +
                  "  var fooRouter = express.Router();\n" +
                  "\n" +
                  "  fooRouter.get('/', function(req, res) {\n" +
                  "    res.send({\n" +
                  "      'foo': []\n" +
                  "    });\n" +
                  "  });\n" +
                  "\n" +
                  "  fooRouter.post('/', function(req, res) {\n" +
                  "    res.status(201).end();\n" +
                  "  });\n" +
                  "\n" +
                  "  fooRouter.get('/:id', function(req, res) {\n" +
                  "    res.send({\n" +
                  "      'foo': {\n" +
                  "        id: req.params.id\n" +
                  "      }\n" +
                  "    });\n" +
                  "  });\n" +
                  "\n" +
                  "  fooRouter.put('/:id', function(req, res) {\n" +
                  "    res.send({\n" +
                  "      'foo': {\n" +
                  "        id: req.params.id\n" +
                  "      }\n" +
                  "    });\n" +
                  "  });\n" +
                  "\n" +
                  "  fooRouter.delete('/:id', function(req, res) {\n" +
                  "    res.status(204).end();\n" +
                  "  });\n" +
                  "\n" +
                  "  // The POST and PUT call will not contain a request body\n" +
                  "  // because the body-parser is not included by default.\n" +
                  "  // To use req.body, run:\n" +
                  "\n" +
                  "  //    npm install --save-dev body-parser\n" +
                  "\n" +
                  "  // After installing, you need to `use` the body-parser for\n" +
                  "  // this mock uncommenting the following line:\n" +
                  "  //\n" +
                  "  //app.use('/api/foo', require('body-parser').json());\n" +
                  "  app.use('/api/foo', fooRouter);\n" +
                  "};"
      });
      assertFile('server/.jshintrc', {
        contains: '{\n  "node": true\n}'
      });
    });
  });

  it('http-mock foo-bar', function() {
    return generate(['http-mock', 'foo-bar']).then(function() {
      assertFile('server/index.js', {
        contains: "mocks.forEach(function(route) { route(app); });"
      });
      assertFile('server/mocks/foo-bar.js', {
        contains: "module.exports = function(app) {\n" +
                  "  var express = require('express');\n" +
                  "  var fooBarRouter = express.Router();\n" +
                  "\n" +
                  "  fooBarRouter.get('/', function(req, res) {\n" +
                  "    res.send({\n" +
                  "      'foo-bar': []\n" +
                  "    });\n" +
                  "  });\n" +
                  "\n" +
                  "  fooBarRouter.post('/', function(req, res) {\n" +
                  "    res.status(201).end();\n" +
                  "  });\n" +
                  "\n" +
                  "  fooBarRouter.get('/:id', function(req, res) {\n" +
                  "    res.send({\n" +
                  "      'foo-bar': {\n" +
                  "        id: req.params.id\n" +
                  "      }\n" +
                  "    });\n" +
                  "  });\n" +
                  "\n" +
                  "  fooBarRouter.put('/:id', function(req, res) {\n" +
                  "    res.send({\n" +
                  "      'foo-bar': {\n" +
                  "        id: req.params.id\n" +
                  "      }\n" +
                  "    });\n" +
                  "  });\n" +
                  "\n" +
                  "  fooBarRouter.delete('/:id', function(req, res) {\n" +
                  "    res.status(204).end();\n" +
                  "  });\n" +
                  "\n" +
                  "  // The POST and PUT call will not contain a request body\n" +
                  "  // because the body-parser is not included by default.\n" +
                  "  // To use req.body, run:\n" +
                  "\n" +
                  "  //    npm install --save-dev body-parser\n" +
                  "\n" +
                  "  // After installing, you need to `use` the body-parser for\n" +
                  "  // this mock uncommenting the following line:\n" +
                  "  //\n" +
                  "  //app.use('/api/foo-bar', require('body-parser').json());\n" +
                  "  app.use('/api/foo-bar', fooBarRouter);\n" +
                  "};"
      });
      assertFile('server/.jshintrc', {
        contains: '{\n  "node": true\n}'
      });
    });
  });

  it('http-proxy foo', function() {
    return generate(['http-proxy', 'foo', 'http://localhost:5000']).then(function() {
      assertFile('server/index.js', {
        contains: "proxies.forEach(function(route) { route(app); });"
      });
      assertFile('server/proxies/foo.js', {
        contains: "var proxyPath = '/foo';\n" +
                  "\n" +
                  "module.exports = function(app) {\n" +
                  "  // For options, see:\n" +
                  "  // https://github.com/nodejitsu/node-http-proxy\n" +
                  "  var proxy = require('http-proxy').createProxyServer({});\n" +
                  "\n" +
                  "  proxy.on('error', function(err, req) {\n" +
                  "    console.error(err, req.url);\n" +
                  "  });\n" +
                  "\n" +
                  "  app.use(proxyPath, function(req, res, next){\n" +
                  "    // include root path in proxied request\n" +
                  "    req.url = proxyPath + '/' + req.url;\n" +
                  "    proxy.web(req, res, { target: 'http://localhost:5000' });\n" +
                  "  });\n" +
                  "};"
      });
      assertFile('server/.jshintrc', {
        contains: '{\n  "node": true\n}'
      });
    });
  });

  it('uses blueprints from the project directory', function() {
    return initApp()
      .then(function() {
        return outputFile(
          'blueprints/foo/files/app/foos/__name__.js',
          "import Ember from 'ember';\n" +
          'export default Ember.Object.extend({ foo: true });\n'
        );
      })
      .then(function() {
        return ember(['generate', 'foo', 'bar']);
      })
      .then(function() {
        assertFile('app/foos/bar.js', {
          contains: 'foo: true'
        });
      });
  });

  it('allows custom blueprints to override built-ins', function() {
    return initApp()
      .then(function() {
        return outputFile(
          'blueprints/controller/files/app/controllers/__name__.js',
          "import Ember from 'ember';\n\n" +
          "export default Ember.Controller.extend({ custom: true });\n"
        );
      })
      .then(function() {
        return ember(['generate', 'controller', 'foo']);
      })
      .then(function() {
        assertFile('app/controllers/foo.js', {
          contains: 'custom: true'
        });
      });
  });

  it('passes custom cli arguments to blueprint options', function() {
    return initApp()
      .then(function() {
        outputFile(
          'blueprints/customblue/files/app/__name__.js',
          "Q: Can I has custom command? A: <%= hasCustomCommand %>"
        );
        return outputFile(
          'blueprints/customblue/index.js',
          "module.exports = {\n" +
          "  locals: function(options) {\n" +
          "    var loc = {};\n" +
          "    loc.hasCustomCommand = (options.customCommand) ? 'Yes!' : 'No. :C';\n" +
          "    return loc;\n" +
          "  },\n" +
          "};\n"
        );
      })
      .then(function() {
        return ember(['generate', 'customblue', 'foo', '--custom-command']);
      })
      .then(function() {
        assertFile('app/foo.js', {
          contains: 'A: Yes!'
        });
      });
  });

  it('correctly identifies the root of the project', function() {
    return initApp()
      .then(function() {
        return outputFile(
          'blueprints/controller/files/app/controllers/__name__.js',
          "import Ember from 'ember';\n\n" +
          "export default Ember.Controller.extend({ custom: true });\n"
        );
      })
      .then(function() {
        process.chdir(path.join(tmpdir, 'app'));
      })
      .then(function() {
        return ember(['generate', 'controller', 'foo']);
      })
      .then(function() {
        process.chdir(tmpdir);
      })
      .then(function() {
        assertFile('app/controllers/foo.js', {
          contains: 'custom: true'
        });
      });
  });

  it('route foo --dry-run does not change router.js', function() {
    return generate(['route', 'foo', '--dry-run']).then(function() {
      assertFile('app/router.js', {
        doesNotContain: "route('foo')"
      });
    });
  });

  it('server', function() {
    return generate(['server']).then(function() {
      assertFile('server/index.js');
      assertFile('server/.jshintrc');
    });
  });

  it('availableOptions work with aliases.', function() {
    return generate(['route', 'foo', '-d']).then(function() {
      assertFile('app/router.js', {
        doesNotContain: "route('foo')"
      });
    });
  });

  it('lib', function() {
    return generate(['lib']).then(function() {
      assertFile('lib/.jshintrc');
    });
  });

  it('custom blueprint availableOptions', function() {
    return initApp().then(function() {
      return ember(['generate', 'blueprint', 'foo']).then(function() {
        replaceFile('blueprints/foo/index.js', 'module.exports = {',
          'module.exports = {\navailableOptions: [ \n' +
          '{ name: \'foo\',\ntype: String, \n' +
          'values: [\'one\', \'two\'],\n' +
          'default: \'one\',\n' +
          'aliases: [ {\'one\': \'one\'}, {\'two\': \'two\'} ] } ],\n' +
          'locals: function(options) {\n' +
          'return { foo: options.foo };\n' +
          '},');

        return outputFile(
          'blueprints/foo/files/app/foos/__name__.js',
          "import Ember from 'ember';\n" +
          'export default Ember.Object.extend({ foo: <%= foo %> });\n'
        ).then(function() {
          return ember(['generate','foo','bar','-two']);
        });
      });
    }).then(function() {
      assertFile('app/foos/bar.js', {
        contain: ['export default Ember.Object.extend({ foo: two });']
      });
    });
  });
});
