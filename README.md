hyper-emitter
=============

Easily subscribe to hyper resources

Usage
-----

```js
var client = require('hyper-emitter');

// Make a request to a resource
client.get('/component.json', function(err, body) {
  console.log('First subscriber', err, body);
});

// Another request to the same resource will only make 1 request
var unsub = client.get('/component.json', function(err, body) {
  console.log('Second subscriber', err, body);

  // call `unsub` to unsubscribe from any changes
  unsub();
});

setTimeout(function() {
  // refresh the resource for all of the listeners
  client.refresh('/component.json');
}, 2000);
```
