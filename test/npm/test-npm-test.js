'use strict';
const os = require('os');
const path = require('path');
const fs = require('fs');

const test = require('tap').test;
const mkdirp = require('mkdirp');
const rimraf = require('rimraf');
const ncp = require('ncp');
const rewire = require('rewire');

const npmTest = rewire('../../lib/npm/test');

const sandbox = path.join(os.tmpdir(), 'citgm-' + Date.now());
const fixtures = path.join(__dirname, '..', 'fixtures');

const passFixtures = path.join(fixtures, 'omg-i-pass');
const passTemp = path.join(sandbox, 'omg-i-pass');

const failFixtures = path.join(fixtures, 'omg-i-fail');
const failTemp = path.join(sandbox, 'omg-i-fail');

const badFixtures = path.join(fixtures, 'omg-i-do-not-support-testing');
const badTemp = path.join(sandbox, 'omg-i-do-not-support-testing');

test('npm-test: setup', function (t) {
  t.plan(7);
  mkdirp(sandbox, function (err) {
    t.error(err);
    ncp(passFixtures, passTemp, function (e) {
      t.error(e);
      t.ok(fs.existsSync(path.join(passTemp, 'package.json')));
    });
    ncp(failFixtures, failTemp, function (e) {
      t.error(e);
      t.ok(fs.existsSync(path.join(failTemp, 'package.json')));
    });
    ncp(badFixtures, badTemp, function (e) {
      t.error(e);
      t.ok(fs.existsSync(path.join(badTemp, 'package.json')));
    });
  });
});

test('npm-test: basic module passing', function (t) {
  const context = {
    emit: function() {},
    path: sandbox,
    module: {
      name: 'omg-i-pass'
    },
    meta: {},
    options: {
      npmLevel: 'silly'
    }
  };
  npmTest(context, function (err) {
    t.error(err);
    t.end();
  });
});

test('npm-test: basic module failing', function (t) {
  const context = {
    emit: function() {},
    path: sandbox,
    module: {
      name: 'omg-i-fail'
    },
    meta: {},
    options: {}
  };
  npmTest(context, function (err) {
    t.equals(err && err.message, 'The canary is dead:');
    t.end();
  });
});

test('npm-test: basic module no test script', function (t) {
  const context = {
    emit: function() {},
    path: sandbox,
    module: {
      name: 'omg-i-do-not-support-testing'
    },
    meta: {},
    options: {}
  };
  npmTest(context, function (err) {
    t.equals(err && err.message, 'Module does not support npm-test!');
    t.end();
  });
});

test('npm-test: no package.json', function (t) {
  const context = {
    emit: function() {},
    path: sandbox,
    module: {
      name: 'omg-i-dont-exist'
    },
    meta: {},
    options: {}
  };
  npmTest(context, function (err) {
    t.equals(err && err.message, 'Package.json Could not be found');
    t.end();
  });
});

test('npm-test: alternative test-path', function (t) {
  // Same test as 'basic module passing', except with alt node bin which fails.
  const nodeBinName = npmTest.__get__('nodeBinName');
  npmTest.__set__('nodeBinName', 'fake-node');
  const context = {
    emit: function() {},
    path: sandbox,
    module: {
      name: 'omg-i-pass'
    },
    meta: {},
    options: {
      npmLevel: 'silly',
      testPath: path.resolve(__dirname, '..', 'fixtures', 'fakenodebin')
    }
  };
  npmTest(context, function (err) {
    npmTest.__set__('nodeBinName', nodeBinName);
    t.equals(err && err.message, 'The canary is dead:');
    t.end();
  });
});

test('npm-test: teardown', function (t) {
  rimraf(sandbox, function (err) {
    t.error(err);
    t.end();
  });
});
