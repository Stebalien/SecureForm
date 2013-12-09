var Backbone = require('backbone');
var _ = require('underscore');
var openpgp = require('openpgp');

// Source: http://jsperf.com/binary-string-to-hex-string/5
function binToHex(s) {
  var s2 = '', c;
  for (var i = 0, l = s.length; i < l; ++i) {
    c = s.charCodeAt(i);
    s2 += (c >> 4).toString(16);
    s2 += (c & 0xF).toString(16);
  }
  return s2.toUpperCase();
}

var Uid = Backbone.RelationalModel.extend({
  initialize: function() {
    var uid = this.get("pgpUid");
    this.set("uid", uid.text);
  }
});
var UidCollection = Backbone.Collection.extend({ model: Uid });

var PublicKey = Backbone.RelationalModel.extend({
  initialize: function() {
    var key = this.get("pgpKey");
    this.set({
      id: binToHex(key.obj.getKeyId()),
      expires: key.obj.publicKeyPacket.expiration,
      created: key.obj.publicKeyPacket.creationTime,
      uids: _.map(key.obj.userIds, function(uid) {
        return {pgpUid: uid};
      })
    });
  },
  prettyId: function() {
    return '0x' + this.get('id').substring(8);
  },
  relations: [
    {
      type: Backbone.HasMany,
      key: 'uids',
      relatedModel: Uid,
      collectionType: UidCollection,
      reverseRelation: {
        key: 'key'
      }
    }
  ]
});

var PrivateKey = Backbone.RelationalModel.extend({
  initialize: function() {
    var key = this.get("pgpKey");
    var publicKey = new PublicKey({"pgpKey": key.obj.privateKeyPacket.publicKey});
    this.set({
      id: publicKey.get('id'),
      publicKey: publicKey
    });
  },
  relations: [
    {
      type: Backbone.OneToOne,
      key: 'publicKey',
      relatedModel: PublicKey,
      reverseRelation: {
        key: 'privateKey'
      }
    }
  ]
});

var PublicKeyCollection = Backbone.Collection.extend({ model: PublicKey });
var PrivateKeyCollection = Backbone.Collection.extend({ model: PrivateKey });

var Keyring = Backbone.RelationalModel.extend({
  initialize: function() {
    var that = this;

    var pgpKeyring = this.get('pgpKeyring');
    if (!pgpKeyring) {
      pgpKeyring = openpgp.keyring;
      this.set('pgpKeyring', pgpKeyring);
    }
    this.set({
      privateKeys: _.map(pgpKeyring.privateKeys, function(key) {
        return {pgpKey: key};
      }),
      publicKeys: _.compact(_.map(pgpKeyring.publicKeys, function(key) {
        try {
          return new PublicKey({pgpKey: key});
        } catch (e) { }
      }))
    });

    function manageKey(key, collection) {
      that.listenTo(key, 'add:uids', function(uid) {
        that.get('uids').add(uid);
      });
      that.listenTo(key, 'remove:uids', function(uid) {
        that.get('uids').remove(uid);
      });
      that.get('uids').add(key.get('uids').models);
    }

    function unmanageKey(key, collection) {
      that.stopListening(key);
      that.get('uids').remove(key.get('uids').models);
    }

    function teardown() {
      that.stopListening();
      that.get('uids').reset();
    }

    function setup() {
      that.get('publicKeys').each(manageKey);
      that.on('add:publicKeys', manageKey);
      that.on('remove:publicKeys', unmanageKey);
      that.on('reset', function() {
        teardown();
        setup();
      });
    }

    setup();
  },
  relations: [
    {
      type: Backbone.HasMany,
      key: 'uids',
      relatedModel: Uid,
      collectionType: UidCollection
    },
    {
      type: Backbone.HasMany,
      key: 'privateKeys',
      relatedModel: PrivateKey,
      collectionType: PrivateKeyCollection
    },
    {
      type: Backbone.HasMany,
      key: 'publicKeys',
      relatedModel: PublicKey,
      collectionType: PublicKeyCollection
    }
  ],
  search: function(terms) {
    var words = _.str.words(terms);
    return this.get('uids')
      .chain()
      .filter(function(uid) {
        var id = uid.get('id');
        return _.every(words, function(word) {
          id.contains(word);
        });
      }).groupBy(function(uid) {
        uid.get('key');
      }).value();
  },
  find: function(id) {
    return this.get('publicKeys').get(id);
  },
  importPublicKey: function(key) {
    var publicKeys = this.get('publicKeys');
    var pgpKeyring = this.get('pgpKeyring');
    var index = publicKeys.length;
    if (pgpKeyring.importPublicKey(key)) {
      var toRemove = [];
      this.get('publicKeys').add(_.compact(_.map(pgpKeyring.publicKeys.slice(index), function(key) {
        try {
          return new PublicKey({pgpKey: key});
        } catch (e) {
          toRemove.push(index);
        }
      })));
      toRemove.reverse();
      _.each(toRemove, function(index) {
        pgpKeyring.removePublicKey.splice(index, 1);
      });
      pgpKeyring.store();
      return true;
    }
    return false;
  },
  importPrivateKey: function(key, password) {
    var privateKeys = this.get('privateKeys');
    var pgpKeyring = this.get('pgpKeyring');
    var index = privateKeys.length;
    if (pgpKeyring.importPrivateKey(key, password)) {
      var toRemove = [];
      this.get('privateKeys').add(_.compact(_.map(pgpKeyring.privateKeys.slice(index), function(key, index) {
        try {
          return new PrivateKey({pgpKey: key});
        } catch (e) {
          toRemove.push(index);
        }
      })));
      toRemove.reverse();
      _.each(toRemove, function(index) {
        pgpKeyring.removePrivateKey.splice(index, 1);
      });
      pgpKeyring.store();
      return true;
    }
    return false;
  }
});



exports.Uid = Uid;
exports.PublicKey = PublicKey;
exports.PrivateKey = PrivateKey;

var cachedKeyring = null;
exports.Keyring = Keyring;
Object.defineProperty(exports, "keyring", {
  configurable: true,
  get: function() {
    if (cachedKeyring === null) {
      cachedKeyring = new Keyring();
    } 
    return cachedKeyring;
  }
});
