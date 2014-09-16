/*jshint expr: true */
var chai = require('chai')
  , expect = require('chai').expect
  , featureClient = require('../../lib')
  , Q = require('q');


describe('.config interface:', function() {
  describe('Given no config object,', function() {
    it('should reject with an Error', function() {
      expect(function() {
        featureClient.configure();
      }).to.throw(Error, 'Cannot register experiments without a config. Please see docs');
    });
  });
  describe('Given a valid devKey and config', function() {
    it('should attempt to call the Feature dashboard');
  });
  describe('Given no `name`,', function() {
    it('should assign "noName" as the name');
  });
  describe('Given a no `devKey`,', function() {
    it('should recognize the config object');
  });

});
