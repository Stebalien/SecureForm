var Backbone = require('backbone');
var _ = require('underscore');
var openpgp = require('openpgp');

// Source: http://jsperf.com/binary-string-to-hex-string/5
function convertId(s) {
  var s2 = '', c;
  for (var i = 0, l = s.length; i < l; ++i) {
    c = s.charCodeAt(i);
    s2 += (c >> 4).toString(16);
    s2 += (c & 0xF).toString(16);
  }
  return '0x' + s2.toUpperCase();
}

function encrypt(message, keys) {
  var pks = _.map(keys, function(key) {
    return key.get("pgpKey");
  });
  return openpgp.write_encrypted_message(pks, message);
}

function encryptAndSign(message, publicKeys, privateKey) {
  if (privateKey.get('locked')) {
    return;
  }
  var publicPgpKeys = _.map(publicKeys, function(key) {
    return key.get("pgpKey");
  });
  var privatePgpKey = privateKey.get('pgpKey');
  return openpgp.write_signed_and_encrypted_message(
    privatePgpKey,
    publicPgpKeys,
    message
  );
};

var Uid = Backbone.RelationalModel.extend({}, {
  fromPgpUid: function(uid) {
    return new Uid({
      pgpUid: uid,
      uid: uid.text
    });
  }
});

var UidCollection = Backbone.Collection.extend({ model: Uid });

var Key = Backbone.RelationalModel.extend({
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
  ],
  getShortId: function() {
    return this.get('primaryKey').getShortId();
  }
});

var PublicSubKey = Backbone.RelationalModel.extend({
  getShortId: function() {
    return '0x' + this.id.substring(10);
  },
}, {
  fromPgpKey: function(pgpKey) {
    return PublicSubKey.findOrCreate({
      id: convertId(pgpKey.getKeyId()),
      expires: pgpKey.expiration,
      created: pgpKey.creationTime,
      pgpKey: pgpKey
    });
  }
});
var PublicSubKeyCollection = Backbone.Collection.extend({model: PublicSubKey});

var PublicKey = Key.extend({
  relations: Key.prototype.relations.concat([
    {
      type: Backbone.HasOne,
      key: 'primaryKey',
      relatedModel: PublicSubKey,
      reverseRelation: {
        key: 'masterKey',
        type: Backbone.HasOne
      }
    },
    {
      type: Backbone.HasMany,
      key: 'subKeys',
      relatedModel: PublicSubKey,
      collectionType: PublicSubKeyCollection,
      reverseRelation: {
        key: 'masterKey',
        type: Backbone.HasOne
      }
    }
  ])
}, {
  fromPgpKey: function(pgpKey) {
    var primaryKey = PublicSubKey.fromPgpKey(pgpKey.publicKeyPacket);
    var subKeys = _.map(pgpKey.subKeys, function(subKey) {
      return PublicSubKey.fromPgpKey(subKey);
    });

    return PublicKey.findOrCreate({
      id: primaryKey.id,
      uids: _.map(pgpKey.userIds, function(uid) {
        return Uid.fromPgpUid(uid);
      }),
      subKeys: subKeys,
      primaryKey: primaryKey,
      pgpKey: pgpKey
    });
  }
});


var PrivateSubKey = Backbone.RelationalModel.extend({
  defaults: {
    locked: true,
  },
  unlock: function(password) {
    if (this.get('pgpKey').decryptSecretMPIs(password)) {
      this.set('locked', false);
      return true;
    } else {
      return false;
    }
  },
  getShortId: function() {
    return this.get('publicKey').getShortId();
  },
  relations: [
    {
      type: Backbone.HasOne,
      key: 'publicKey',
      relatedModel: PublicSubKey,
      reverseRelation: {
        key: 'privateKey',
        type: Backbone.HasOne
      }
    },
  ]
}, {
  fromPgpKey: function(pgpKey) {
    return PrivateSubKey.findOrCreate({
      id: convertId(pgpKey.publicKey.getKeyId()),
      publicKey: PublicSubKey.fromPgpKey(pgpKey.publicKey),
      pgpKey: pgpKey
    });
  }
});
var PrivateSubKeyCollection = Backbone.Collection.extend({model: PrivateSubKey});

var PrivateKey = Key.extend({
  relations: Key.prototype.relations.concat([
    {
      type: Backbone.HasOne,
      key: 'primaryKey',
      relatedModel: PrivateSubKey,
      reverseRelation: {
        key: 'masterKey',
        type: Backbone.HasOne
      }
    },
    {
      type: Backbone.HasMany,
      key: 'subKeys',
      relatedModel: PrivateSubKey,
      collectionType: PrivateSubKeyCollection,
      reverseRelation: {
        key: 'masterKey',
        type: Backbone.HasOne
      }
    }
  ]),
  getPublicKey: function() {
    return this.get('primaryKey').get('publicKey').get('masterKey');
  }
}, {
  fromPgpKey: function(pgpKey) {
    var primaryKey = PrivateSubKey.fromPgpKey(pgpKey.privateKeyPacket);
    var subKeys = _.map(pgpKey.subKeys, function(subKey) {
      return PrivateSubKey.fromPgpKey(subKey);
    });
    return PrivateKey.findOrCreate({
      id: primaryKey.id,
      uids: _.map(pgpKey.userIds, function(uid) {
        return Uid.fromPgpUid(uid);
      }),
      subKeys: subKeys,
      primaryKey: primaryKey,
      pgpKey: pgpKey
    });
  }
});

var DecryptedMessage = Backbone.RelationalModel.extend({
  relations: [
    {
      type: Backbone.HasOne,
      key: 'signatureKey',
      relatedModel: PublicSubKey
    },
  ],
  verifySignature: function() {
    // TODO
    return false;
  },
  toString: function() {
    return this.get("cipherText");
  }
}, {
  fromPgpMessage: function(encryptedMessage, pgpMessage) {
    var ePgpMsg = encryptedMessage.get('pgpMessage');
    if (ePgpMsg.signature) {
      var signatureKey = PublicSubKey.findOrCreate(
        convertId(ePgpMsg.getSigningKeyId())
      );
    }
    return new DecryptedMessage({
      encryptedMessage: encryptedMessage,
      pgpMessage: pgpMessage,
      text: pgpMessage.data,
      signatureKey: signatureKey
    });
  }
});

var EncryptedMessage = Backbone.RelationalModel.extend({
  getDecryptionKeys: function() {
    return _.compact(_.map(_.keys(this.get("sessionKeys")), function(id) {
      return PrivateSubKey.find(id);
    }));
  },
  getSessionKey: function(privKey) {
    return this.get('sessionKeys')[privKey.id];
  },
  decrypt: function(key) {
    var that = this;
    if (key.get('locked')) {
      throw new Error("Key Locked");
    }

    // Can't do it!
    var sessionKey = this.getSessionKey(key);
    if (!sessionKey) {
      return;
    }
    var decryptedMessages = this.get('pgpMessage').decryptMessages({
      keymaterial: key.get('pgpKey')
    }, sessionKey);
    if (decryptedMessages) {
      return _.chain(decryptedMessages)
      .filter(function(msg) {
        return msg.messagePacket.tagType == 11;
      })
      .map(function(msg) {
        return DecryptedMessage.fromPgpMessage(that, msg);
      }).value();
    }
  },
  toString: function() {
    return this.get("cipherText");
  }
}, {
  fromText: function(text) {
    var pgpMsg = openpgp.read_message(text)[0];

    var sessionKeys = {};
    _.each(pgpMsg.sessionKeys, function(sessionKey) {
      sessionKeys[convertId(sessionKey.keyId.bytes)] = sessionKey;
    });
    return new EncryptedMessage({
      sessionKeys: sessionKeys,
      cipherText: text,
      pgpMessage: pgpMsg
    });
  }
});


var KeyCollection = Backbone.Collection.extend({
  model: Key,
  getByShortId: function(string) {
    var string = '0x' + string.substring(string.length - 8).toUpperCase();
    return this.find(function(k) {
      return k.getShortId() === string;
    });
  },
  search: function(string) {
    var words = _.str.words(string);
    return this.filter(function(k) {
      return k.get('uids').some(function(uid) {
        return _.every(words, function(word) {
          return uid.get('uid').indexOf(word) >= 0;
        });
      });
    });
  }
});

var PublicKeyCollection = KeyCollection.extend({ model: PublicKey });
var PrivateKeyCollection = KeyCollection.extend({ model: PrivateKey });

var Keyring = Backbone.RelationalModel.extend({
  initialize: function() {
    var that = this;
    var pgpKeyring = this.get('pgpKeyring');
    if (!pgpKeyring) {
      pgpKeyring = openpgp.keyring;
      this.set('pgpKeyring', pgpKeyring);
    }
    this.set('privateKeys', _.map(pgpKeyring.privateKeys, function(keyObj) {
      return PrivateKey.fromPgpKey(keyObj.obj);
    }));

    this.set('publicKeys', _.map(pgpKeyring.publicKeys, function(keyObj) {
      return PublicKey.fromPgpKey(keyObj.obj);
    }));
  },
  relations: [
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
  importKeys: function(key) {
    var privateKeys = this.get('privateKeys');
    var publicKeys = this.get('privateKeys');
    var pgpKeyring = this.get('pgpKeyring');

    var publicIndex = privateKeys.length;
    var privateIndex = privateKeys.length;

    pgpKeyring.importKeys(key);

    privateKeys.add(_.map(pgpKeyring.privateKeys.slice(privateIndex), function(keyObj) {
      return PrivateKey.fromPgpKey(keyObj.obj);
    }));
    publicKeys.add(_.map(pgpKeyring.publicKeys.slice(publicIndex), function(keyObj) {
      return PublicKey.fromPgpKey(keyObj.obj);
    }));
    pgpKeyring.store();
  }
});



exports.Uid = Uid;
exports.PublicKey = PublicKey;
exports.PrivateKey = PrivateKey;
exports.EncryptedMessage = EncryptedMessage;
exports.convertId = convertId;
exports.encrypt = encrypt;

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
