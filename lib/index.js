/**
 * Module Dependencies
 */
var Q = require('q')
  , superagent = require('superagent')
  , cron = require('cron')
  , debug = require('debug')('feature:index')
  , experimentValidator = require('xpr-util-validation').experimentValidator;

/**
 * These are the internal settings.
 *
 * These data are used for transmission of XPRMNTL
 * data, but are not used afterward.
 *
 * @type {Object}
 */
var _settings = exports._settings = {
  // Required component defaults
  // Str - App's XPRMNTL dev key
  devKey: process.env.FEATURE_DEVKEY,
  // Str - URL to the XPRMNTL Dashboard (with trailing slash)
  featureUrl: process.env.FEATURE_URL,

  // Optional component defaults
  // Int - Sets the request timeout (ms)
  timeout: 5000,

  // Str - Shared App's XPRMNTL dev key
  sharedDevKey: process.env.FEATURE_DEVKEY_SHARED,

  // This is the state of the configuration
  // It can be `true`, `null`, or `false`
  // `true` represents a successful announcement (fully-functional)
  // `null` represents non-announced (non-functional)
  // `false` represents a failed announcement (semi-functional, using defaults only)
  configured: null,

  // This is a node-cron cron job. This will re-fetch the configuration on
  // a set interval, based on the cron-job configuration
  cronJob: null,
};

/**
 * This is the data sent to the XPRMNTL server
 *
 * On failure from server, it is converted into the
 * _config data
 *
 * @type {Object}
 */
var _appConfig = exports._appConfig = {
  // Array of experiments
  experiments: null,

  // Optional Components
  // Str - Identifies the reference type (local, beta, prod, etc)
  reference: null,

  // Object - Identifies the set of shared experiments
  shared: { experiments: [] },
};

/**
 * Experiments Configuration returned from server
 *
 * On failure from server, this is generated from
 * the initial app's config data
 */
var _config;

exports.configure = function(config) {
  var key;

  if (! config) throw new Error('Cannot register experiments without a config. Please see the docs');
  if (! (config.experiments && config.experiments.length)) throw new Error('Cannot register experiments without `experiments`. Please see the docs');

  // Pass the right stuff to _settings
  for (key in _settings) {
    if (_settings.hasOwnProperty(key) && config.hasOwnProperty(key)) {
      _settings[key] = config[key];
    }
  }

  // Pass everything else to _appConfig
  for (key in _appConfig) {
    if (_appConfig.hasOwnProperty(key) && config.hasOwnProperty(key)) {
      _appConfig[key] = config[key];
    }
  }

  // Fix the featureUrl
  var featureUrl = _settings.featureUrl;
  if (featureUrl && (featureUrl.charAt(featureUrl.length - 1) !== '/')) {
    _settings.featureUrl += '/';
  }

  // Parse the experiments
  _appConfig.experiments = _appConfig.experiments.map(cleanupExperiment);

  /* Filter out any invalid experiments. */
  _appConfig.experiments = _appConfig.experiments.filter(experimentValidator.isValid);

  // Parse the shared devKey and experiments
  if (config.shared) {
    _settings.sharedDevKey = config.shared.devKey || _settings.sharedDevKey;
    _appConfig.shared.experiments = config.shared.experiments.map(cleanupExperiment);
  } else {
    // or not
    _settings.sharedDevKey = null;
    _appConfig.shared = null;
  }

  // Prep the failed configuration, just in case
  _config = exports._config = generateFailedConfig();

  // Allow chaining
  return this;
};

/**
 * Before announcement, verify we have what we need.
 */
exports.preflight = function() {
  if (! _settings.devKey) return new Error('No devKey defined.');
  if (! _settings.featureUrl) return new Error('No featureUrl defined.');

  return true;
};

/**
 * Set up a cron-job subscription
 * @param  {String}   cronTime Cron-style subscription timer
 * @param  {Function} handler  Function to be called whenever the cron is successful
 */
exports.cron = function(cronTime, handler) {
  var CronJob = cron.CronJob;

  _settings.cronJob = new CronJob({
    cronTime: cronTime,
    onTick: function() {
      debug('Cron-fetching XPRMNTL config');
      exports.load(handler);
    },
    start: false
  });

  return this;
};

var cronStarted;

function startCron() {
  if (cronStarted) return;
  if (! _settings.cronJob) return;

  debug('Setting up XPRMNTL cron');

  _settings.cronJob.start();
  cronStarted = true;
}



/**
 * Fetch-only (GET) the remote configuration data
 *
 * Responds with either the successful response data or reformatted
 * default configuration data.
 *
 * @param  {Function} cb  Callback
 * @return {Promise}      Q.promise
 */
exports.load = _getExperimentFetcher(false);

/**
 * Announce (POST) the default configuration data
 *
 * Responds with either the successful response data or reformatted
 * default configuration data.
 *
 * @param  {Function} cb  Callback
 * @return {Promise}      Q.promise
 */
exports.announce = _getExperimentFetcher(true);

/**
 * Returns the function that does the fetching
 * @param  {Boolean} sendData Whether to update the remote data or not
 * @return {Function}           The experiment fetcher
 */
function _getExperimentFetcher(sendData) {
  /**
   * Fetches the experiment list.
   *
   * This function is what actually does the fetching
   * of the experiment list. If it sends the current
   * configuration (sendData === true), it will update
   * the remote list. If not (sendData !== false) it
   * will only fetch the list without updating it.
   *
   * @param  {Function} cb Callback
   * @return {Promise}     Q.promise
   */
  return function fetchExperiments(cb) {

    function instaFail(err) {
      // Respond with an error and the failedConfig
      debug('Using failedConfig: preflight');
      if (cb) cb(err, _config);
      return Q.reject([err, _config]);
    }
    var check = exports.preflight();

    if (check !== true) return instaFail(check);

    var dfd = Q.defer();

    function dfdFail(err) {
      debug('Using failedConfig: failure');

      // Keep trying, in case the error is something auto-fixing
      startCron();

      if (cb) cb(err, _config);
      return dfd.reject([err, _config]);
    }

    var request;

    if (sendData) {
      request = superagent.post(_settings.featureUrl + 'api/coupling/')
        .send(_appConfig);
    } else {
      request = superagent.get(_settings.featureUrl + 'api/coupling/');
    }

    request
      .set('x-feature-key', _settings.devKey)
      .on('error', function(err) {
        debug('Feature fetch err: ', err);

        return dfdFail(err);
      });

    if (_settings.timeout) request.timeout(_settings.timeout);
    if (_settings.sharedDevKey) request.set('x-feature-key-shared', _settings.sharedDevKey);

    request.end(function(error, resp) {
      if (error) {
        return dfdFail(error);
      }
      if (resp.status !== 200) {
        var err = new Error('Something went wrong: ', resp.status);

        return dfdFail(err);
      }

      var data = resp.body;

      debug('Feature data: ', JSON.stringify(data));

      // If there's a subscription, do that too
      startCron();

      if (cb) cb(null, data);
      return dfd.resolve(data);
    });

    return dfd.promise;
  };
}

/**
 * Fetch the name of this reference
 */
exports.getReference = function() {
  return _appConfig.reference;
};

/**
 * Plugin tie-in
 * @param  {Function} fn Plugin function
 */
exports.use = function(fn) {
  fn(this);
  return this;
};

/**
 * Converts the experiments into the standard format with
 * `name` and default`.
 *
 * @param  {Object} exp The experiment to fix (String or Object)
 * @return {Object}     The same experiment Object
 */
function cleanupExperiment(exp) {
  if (typeof exp === 'string') exp = { name : exp };
  if (typeof exp.default === 'undefined') exp.default = false;

  return exp;
}

/**
 * Converts the supplied configuration into a format useable
 * by the experiment middleware
 *
 * @return {Object} Converted data
 */
function generateFailedConfig() {
  var temp = {
    app: {
      experiments: objectifyExps(_appConfig.experiments)
    }
  };

  if (_appConfig.shared) {
    temp.shared = {
      experiments: objectifyExps(_appConfig.shared.experiments)
    };
  }

  debug('Generated config from defaults: ', JSON.stringify(temp));

  return temp;
}

/**
 * Converts a single experiment data array from service object format to
 * the consumable object format
 *
 * @param  {Array} expList Array of Experiment data config
 * @return {Object}        name:default object of all experiment dataa
 */
function objectifyExps(expList) {
  var obj = {};

  expList.map(function(item) {
    if (item.name) obj[item.name] = item.default;
  });

  return obj;
}
