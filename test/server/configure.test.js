/*jshint expr: true */
var chai = require('chai')
  , expect = require('chai').expect
  , featureClient = require('../../lib');


process.env.FEATURE_URL = 'http://example.com/';
process.env.FEATURE_DEVKEY = 'exp-dev-key-here';


describe('.config interface:', function() {
  describe('Given no config object,', function() {
    it('should reject with an Error', function() {
      expect(function() {
        featureClient.configure();
      }).to.throw(Error, 'Cannot register experiments without a config. Please see docs');
    });
  });
  describe('Given no experiments array', function() {
    it('should reject with an Error', function() {
      expect(function() {
        featureClient.configure({});
      }).to.throw(Error, 'Cannot register experiments without `experiments`. Please see the docs');
    });
  });
  describe('Given no experiments in array', function() {
    it('should reject with an Error', function() {
      expect(function() {
        featureClient.configure({
          experiments : []
        });
      }).to.throw(Error, 'Cannot register experiments without `experiments`. Please see the docs');
    });
  });
  describe('Given no devKey / featureUrl,', function() {
    it('should fallback to `process.env`', function() {
      var feature = featureClient.configure({
        experiments: ['testEx']
      });

      expect(feature.featureUrl).to.equal('http://example.com/');
      expect(feature.devKey).to.equal('exp-dev-key-here');
    });
  });
  describe('Given a passed devKey / featureUrl,', function() {
    it('should not fallback to `process.env`', function() {
      var feature = featureClient.configure({
        featureUrl: 'https://example.com/',
        devKey: 'new-dev-key-here',
        experiments: ['testEx2']
      });

      expect(feature.featureUrl).to.equal('https://example.com/');
      expect(feature.devKey).to.equal('new-dev-key-here');
    });
  });
  describe('Given experiment strings, ', function() {
    it('should convert them into objects', function() {
      var feature = featureClient.configure({
        experiments: ['testEx3']
      });

      expect(feature.config.experiments).to.eql([{ name: 'testEx3', default: false }]);
    });
  });
  describe('Given experiment objects, ', function() {
    it('should retain names, defaults, and descriptions', function() {
      var feature = featureClient.configure({
        experiments: [{ name: 'testEx4', default: true, description: 'Description' }]
      });

      expect(feature.config.experiments).to.eql([{ name: 'testEx4', default: true, description: 'Description' }]);
    });
  });


});
