[![XPRMNTL][logo-image]][logo-url]
# Feature-Client.js
[![Build Status][build-image]][build-url]
[![NPM version][npm-image]][npm-url]
[![Downloads][downloads-image]][downloads-url]
[![Tips][gratipay-image]][gratipay-url]

This is a Node.js library for the consumption of [XPRMNTL](https://github.com/XPRMNTL/xpr-dashboard) product.

```js
var feature = require('feature-client');

feature.configure({
  devKey: 'put the XPRMNTL devkey for your app here',
  experiments: [  'testExp1', 'testExp2' ],
  shared: {
    devKey: 'put the XPRMNTL devkey for your shared app here',
    experiments: [ 'sharedExp1', 'sharedExp2' ]
  }
});

feature.cron('* * * * *', function(err, settings) {
  // Reload your settings into memory
});

// This step must be called last
feature.announce().then(function(settings) {
  // Load settings into memory; start your app
});
```

### Installation
```sh
$ npm install feature-client
```

### Configuration
Necessary components:
- `featureUrl`
  - this is the URL to the XPRMNTL dashboard.
  - Defaults to `process.env.FEATURE_URL`.
- `devKey`
  - this is the devKey generated for you by the XPRMNTL dashboard.
  - Defaults to `process.env.FEATURE_DEVKEY`
- `experiments`
  - This is an array of all of your app-level experiments. These can be strings, objects, or a mixture of the two:
    - String: `'experimentName'`
    - Object:
```js
{
  name: 'experimentName',
  default: true,
  description: 'Here\'s my description of my experiment. This helps set context for anyone who wants to know what it is for.'
}
```
- `timeout`
  - This is the number of milliseconds after which the request should time out.
  - May be disabled by setting to `false` or `0`
  - Defaults to 5000 (5s)
- `shared`
  - This object allows you to configure and accept configuration for a shared set of experiments. If, for example, you have a separate set of experiments for your site-wide theme, you would configure those here, shared among your applications.
  - This object has two properties:
    - `devKey` - The devKey for the shared experiment data
    - `experiments` - An array of shared experiments. Same format as app-level experiments.
- `reference`
  - This string determines which "reference" is making the request.
  - If this value is sent, only that reference's configuration is sent back instead of all of them.
  - Currently supported: "local", "int" (integration), "beta", "prod"


### Cron Job Subscription
Use of the cron allows you to refetch your configuration on whatever period you'd like.


```js
feature.cron('* * * * *', function(err, settings) {
  // This calls every minute (5 stars)
  // Handle your re-configuration and errors here.
});
```

```js
feature.cron('*/30 * * * * *', function(err, settings) {
  // This calls every 30 seconds
  // Handle your re-configuration and errors here.
});
```
feature.cron accepts two parameters:
- `cronTime`
  - string in the [Cron format](http://en.wikipedia.org/wiki/Cron#Predefined_scheduling_definitions). Since it uses [node-cron](https://github.com/ncb000gt/node-cron), it also allows you to add an optional 6th item at the beginning for seconds
- `handler`
  - This function should have an arity of 2 to accept an error and the new configuration settings, and it gets called on each refetch attempt.


### Announcement
This step sends your configuration to the XPRMTNL dashboard to update and fetch the remote configuration. Any new experiments get registered and default either to `false` or to whatever you've set as your `default` for that experiment.

This is an asynchronous step that returns a Q.promise and/or accepts a callback:

```js
feature.announce(function(err, data) {
  // Handle the configuration or failure here
});

feature.announce().then(function success(data) {
  // Handle the configuration here
}, function failure(resp) {
  // Handle failure here
  var err = resp[0];
  var defaults = resp[1];
);
```
In case of XPRMNTL failure, the defaults are returned.

### Loading
In your development environment, when you're creating and working with new experiments, you will call `announce` whenever you start your application. If you're in a production environment, you no longer need to check to see if there are new experiments, so you need not send your full configuration to the server. In this case, you simply need to `load`.

The callback and/or handlers for `load` and `announce` are expected to work the same, but `load`ing will only fetch the remote configuration, rather than potentially updating that information based on the configuration in this app. This can be a time-saver for your build process.

```js
feature.load(function(err, data) {
  // Handle the configuration or failure here
});

feature.load().then(function success(data) {
  // Handle the configuration here
}, function failure(resp) {
  // Handle failure here
  var err = resp[0];
  var defaults = resp[1];
});


```

[logo-image]: https://raw.githubusercontent.com/XPRMNTL/XPRMNTL.github.io/master/images/ghLogo.png
[logo-url]: https://github.com/XPRMNTL/XPRMNTL.github.io
[build-image]: https://travis-ci.org/XPRMNTL/feature-client.js.svg?branch=master
[build-url]: https://travis-ci.org/XPRMNTL/feature-client
[npm-image]: https://img.shields.io/npm/v/feature-client.svg
[npm-url]: https://www.npmjs.org/package/feature-client
[downloads-image]: https://img.shields.io/npm/dm/feature-client.svg
[downloads-url]: https://www.npmjs.org/package/feature-client
[gratipay-image]: https://img.shields.io/gratipay/dncrews.svg
[gratipay-url]: https://www.gratipay.com/dncrews/
