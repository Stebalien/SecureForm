var {Class, Enum} = require('types');
var {Request} = require('sdk/request');
var querystring = require('sdk/querystring');

function extractPublicKey(string) {
  var match = string.match(
    /^-----BEGIN PGP PUBLIC KEY BLOCK-----$[\s\S]+?^-----END PGP PUBLIC KEY BLOCK-----$/m
  );
  return match ? match[0] : null;
}

function extractSearchResults(string) {
  var current_key = null;
  var results = [];
  string.split(/\r?\n/).forEach(function(line) {
    var pieces = line.split(':');

    switch (pieces[0]) {
      case 'pub':
        current_key = {
          id: pieces[1],
          algorithm: parseInt(pieces[2]),
          length: parseInt(pieces[3]),
          created: pieces[4] === '' ? null : parseInt(pieces[4]),
          expires: pieces[5] === '' ? null : parseInt(pieces[5]),
          flags:   pieces[6] === '' ? null : pieces[6],
          uids: []
        };
        results.push(current_key);
        break;
      case 'uid':
        if (!current_key) { return; }
        current_key.uids.push({
          text: decodeURIComponent(pieces[1]),
          created: pieces[2] === '' ? null : parseInt(pieces[2]),
          expires: pieces[3] === '' ? null : parseInt(pieces[3]),
          flags:   pieces[4] === '' ? null : pieces[4]
        });
        break;
    }
  });
  return results;
}

exports.Server = Class.extend({
  server: "http://pgp.mit.edu:11371/pks/lookup",
  init: function(server) {
    if (server) {
      this.server = server;
    }
  },
  _query: function(operation, argument, success, error) {
    return new Request({
      url: this.server + '?' + querystring.stringify({
        op: operation,
        options: 'mr',
        search: argument
      }),
      onComplete: function(response) {
        if (response.status === 200) {
          if (success) success(response.text);
        } else {
          if (error) error(response);
        }
      }
    }).get();
  },
  get: function(key_or_id, success, error) {
   return this._query('get', '0x' + (key_or_id.id ? key_or_id.id : key_or_id), function(data) {
     var pk = extractPublicKey(data);
     if (pk) {
       if (success) {
         success(pk);
       }
     } else {
       if (error) {
         error(data);
       }
     }
   }, error);
  },
  search: function(terms, success, error) {
    return this._query('search', terms, function(data) {
      if (success) {
        success(extractSearchResults(data));
      }
    }, error);
  }
});
