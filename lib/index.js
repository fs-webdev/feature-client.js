var Q = require('q')
  , superagent = require('superagent')
  , debug = require('debug')('feature:index');

function FeatureClient(config) {
  this.devKey = config.devKey || process.env.FEATURE_DEVKEY;
  this.featureUrl = config.featureUrl || process.env.FEATURE_URL;

  this.config = config;

  config.experiments = config.experiments.map(cleanupExperiment);
  if (config.shared) config.shared.experiments = config.shared.experiments.map(cleanupExperiment);

  delete config.devKey;
  delete config.featureUrl;

  function cleanupExperiment(item) {
    if (typeof item === 'string') item = { name : item };
    if (typeof item.default === 'undefined') item.default = false;

    return item;
  }


  return this;
}

FeatureClient.prototype.announce = function(cb) {
  function instaFail(msg) {
    var err = new Error(msg);
    if (cb) cb(err);
    return Q.reject(err);
  }
  if (! this.devKey) return instaFail('No devKey defined.');
  if (! this.featureUrl) return instaFail('No featureUrl defined.');

  var dfd = Q.defer();

  var url = this.featureUrl + 'api/coupling/';

  superagent.post(url)
    .set('x-feature-key', this.devKey)
    .send(this.config)
    .on('error', function(err) {
      debug('Feature fetch err: ', err);
      dfd.reject(err);
    })
    .end(function(resp) {
      if (resp.status !== 200) {
        var err = new Error('Something went wrong');
        debug('Something err:', resp.status);
        if (cb) cb(err);
        return dfd.reject(err);
      }
      var data = resp.body;
      debug('Feature data: ', JSON.stringify(data));
      dfd.resolve(data);
    });

  return dfd.promise;
};

exports.configure = function(config) {
  if (! (config && typeof config === 'object')) throw new Error('Cannot register experiments without a config. Please see docs');

  debug('Configuring: ', config);
  return new FeatureClient(config);
};
