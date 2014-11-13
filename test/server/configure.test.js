/*jshint expr: true */
process.env.FEATURE_URL = 'http://example.com/';
process.env.FEATURE_DEVKEY = 'exp-dev-key-here';
process.env.FEATURE_DEVKEY_SHARED = 'shared-exp-dev-key-here';

var chai = require('chai')
  , expect = require('chai').expect
  , feature = require('../../lib');

describe('.config interface:', function() {
  describe('Given no config object,', function() {
    it('should reject with an Error', function() {
      expect(function() {
        feature.configure();
      }).to.throw(Error, 'Cannot register experiments without a config. Please see the docs');
    });
  });
  describe('Given no experiments array', function() {
    it('should reject with an Error', function() {
      expect(function() {
        feature.configure({});
      }).to.throw(Error, 'Cannot register experiments without `experiments`. Please see the docs');
    });
  });
  describe('Given no experiments in array', function() {
    it('should reject with an Error', function() {
      expect(function() {
        feature.configure({
          experiments : []
        });
      }).to.throw(Error, 'Cannot register experiments without `experiments`. Please see the docs');
    });
  });
  describe('Given no optional Configurations', function() {
    it('should fall back to `process.env` and defaults', function() {
      feature.configure({
        experiments: ['testEx'],
        shared: { experiments: [] }
      });

      expect(feature._settings.featureUrl).to.equal('http://example.com/');
      expect(feature._settings.devKey).to.equal('exp-dev-key-here');
      expect(feature._settings.sharedDevKey).to.equal('shared-exp-dev-key-here');

      expect(feature._settings.timeout).to.equal(5000);
    });
  });
  describe('Given a featureUrl without a trailing slash', function() {
    it('should add a trailing slash', function() {
      feature.configure({
        experiments: ['blargh'],
        featureUrl: 'https://example.thingy.com'
      });

      expect(feature._settings.featureUrl).to.equal('https://example.thingy.com/');
    });
  });
  describe('Given a passed devKey / featureUrl,', function() {
    it('should not fallback to `process.env`', function() {
      feature.configure({
        featureUrl: 'https://example.com/',
        devKey: 'new-dev-key-here',
        experiments: ['testEx2']
      });

      expect(feature._settings.featureUrl).to.equal('https://example.com/');
      expect(feature._settings.devKey).to.equal('new-dev-key-here');
    });
  });
  describe('Given experiment strings, ', function() {
    it('should convert them into objects', function() {
      feature.configure({
        experiments: ['testEx3']
      });

      expect(feature._appConfig.experiments).to.eql([{ name: 'testEx3', default: false }]);
    });
  });
  describe('Given experiment objects, ', function() {
    it('should retain names, defaults, and descriptions', function() {
      feature.configure({
        experiments: [{ name: 'testEx4', default: true, description: 'Description' }]
      });

      expect(feature._appConfig.experiments).to.eql([{ name: 'testEx4', default: true, description: 'Description' }]);
    });
  });

  describe('Plugins', function() {
    it('should be able to add functionality to the core', function() {
      feature.use(function(client) {
        client.plugin = function() {
          return true;
        };
      });

      expect(feature.plugin()).to.equal(true);
    });
  });

});
