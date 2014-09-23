[![XPRMNTL](https://raw.githubusercontent.com/XPRMNTL/XPRMNTL.github.io/master/images/ghLogo.jpg)](https://github.com/XPRMNTL/XPRMNTL.github.io)
# Feature-Client.js [![Build Status](https://travis-ci.org/XPRMNTL/feature-client.js.svg?branch=master)](https://travis-ci.org/XPRMNTL/feature-client.js) [![NPM version](https://img.shields.io/npm/v/feature-client.svg)](https://www.npmjs.org/package/feature-client)

This is a Node.js library for the consumption of [XPRMNTL](https://github.com/XPRMNTL/feature) product.

```js
var featureClient = require('feature-client');

var feature = featureClient.configure({
  devKey: 'put the XPRMNTL devkey for your app here',
  experiments: [  'testExp1', 'testExp2' ],
  shared: {
    repo: 'username/repo',
    experiments: [ 'sharedExp1', 'sharedExp2' ]
  }
});

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

### Announcement
This step preforms the fetching of the configuration against the XPRMNTL dashboard. Any new experiments get registered and default either to `false` or to whatever you've set as your `default` for that experiment.

This is an asynchronous step that returns a Q.promise and/or accepts a callback:

```js
feature.announce(function(err, data) {
  // Handle the configuration or failure here
});
feature.announce().then(function success(data) {
  // Handle the configuration here
}, function failure(err) {
  // Handle failure here
);
```
