/**
 * Module dependencies
 */

var client = require('hyperagent');
var Emitter = require('emitter');
var each = require('each');

/**
 * Setup a singleton emitter
 */

var emitter = new Emitter();

/**
 * Get a resource and get called any time it changes
 *
 * @param {String} url
 * @param {Function} fn
 * @return {Function}
 */

exports.get = function(url, fn) {
  // Proxy the fn so it can be used more than once
  function handle(err, body) { fn(err, body); }

  emitter.on(url, handle);
  exports.refresh(url, true);

  // Return a function to unsubscribe
  return function unsubscribe() {
    emitter.off(url, handle);
  };
};

/**
 * Submit a form and update any subscribers
 *
 * @param {String} method
 * @param {String} action
 * @param {Object} data
 * @param {Function} fn
 */

exports.submit = function(method, action, data, fn) {
  var lowerMethod = (method || 'GET').toLowerCase();

  var req = client[lowerMethod](action);

  if (lowerMethod === 'get') req.query(data);
  else if (data) req.send(data);

  req
    .on('error', fn)
    .end(function(res) {
      fn(null, res.body);

      if (lowerMethod === 'get') return;

      // Hard refresh any resources that may have been affected
      var urls = [action];
      each(exports.refreshHeaders, function(header) {
        var value = res.headers[header];
        if (value && value !== action) urls.push(location);
      });

      // TODO look for http://tools.ietf.org/html/draft-nottingham-linked-cache-inv-04

      each(urls, exports.refresh);
    });
};

/**
 * Save any urls that are in flight
 */

var inflights = {};

/**
 * Refresh a url and notify the subscribers
 *
 * @param {String} url
 * @param {Boolean} useCache
 */

exports.refresh = function(url, useCache) {
  // If someone is already making a request wait for theirs
  if (inflights[url] || !emitter.hasListeners(url)) return;

  inflights[url] = true;

  var req = client.get(url);

  if (!useCache) req.ignoreCache();

  function handle(err, body, res) {
    delete inflights[url];
    emitter.emit(url, err, body);
  }

  req
    .on('error', handle)
    .end(function(res) {
      handle(null, res.body, res);
    });
};

/**
 * Expose the list of headers to refresh
 */

exports.refreshHeaders = [
  'location',
  'content-location'
];