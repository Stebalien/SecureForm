(function() {

  function eventToKey(event) {
    return 'l_'+String(event).toLowerCase();
  }

  var lastFormId = 0;
  var knownForms = {};

  self.port.on('submit', function(resp) {
    var priv = knownForms[resp.id];
    if (priv) {
      priv.onSubmit(resp.data);
    }
  });

  self.port.on('load', function(resp) {
    var priv = knownForms[resp.id];
    var token = resp.token;
    try {
      var obj = unsafeWindow[token];
      delete unsafeWindow[token];
    } catch (e) {
      return;
    }

    if (priv) {
      priv.onLoad(obj.form, obj.controls);
    }
  });

  self.port.on('hide', function(resp) {
    var priv = knownForms[resp.id];
    if (priv) {
      priv.onHide();
    }
  });

  self.port.on('show', function(resp) {
    var priv = knownForms[resp.id];
    if (priv) {
      priv.onShow();
    }
  });

  function PrivateSecureForm(pub, options) {
    var formsrc = String(options.formsrc);
    var controlssrc = options.hasOwnProperty("controlssrc") ? String(options.controlssrc) : null;

    var priv = this;

    this.id = lastFormId++;
    this.pub = pub;
    this.controlssrc = controlssrc;
    this.formsrc = formsrc;
    this.eventListeners = { };
    this.value = null;
    this.visible = false;
    this.loaded = false;
    this.onShow = function() {
      priv.visible = true;
      priv.pub.dispatchEvent(new CustomEvent('show'));
    };
    this.onHide = function() {
      priv.visible = false;
      priv.pub.dispatchEvent(new CustomEvent('hide'));
    };
    this.onLoad = function(formWindow, controlsWindow) {
      if (priv.loaded) {
        return;
      }
      priv.formWindow = formWindow;
      priv.controlsWindow = controlsWindow;
      priv.loaded = true;
      priv.formWindow.location = priv.formsrc;
      if (priv.controlssrc) {
        priv.controlsWindow.location = priv.controlssrc;
      }
      priv.pub.dispatchEvent(new CustomEvent('load'));
    };
    this.onSubmit = function(value) {
      priv.visible = false;
      priv.value = value;
      priv.pub.dispatchEvent(new CustomEvent('submit', {
        detail: value
      }));
    };
  }

  function SecureForm(options) {
    if (!(this instanceof SecureForm)) {
      return new SecureForm(options);
    }

    if (typeof(options) !== "object" || !options.hasOwnProperty("formsrc")) {
      throw Error("Invalid Arguments");
    }


    var that = this;
    var priv = new PrivateSecureForm(this, options);
    knownForms[priv.id] = priv;

    // Properties.
    ["formWindow", "controlsWindow", "loaded", "value", "visible"].forEach(function(key) {
      Object.defineProperty(that, key, {
        get: function() {
          return priv[key];
        }
      });
    });

    Object.defineProperty(that, "controlssrc", {
      get: function() {
        return priv.controlssrc;
      },
      set: function(value) {
        priv.controlssrc = value;
        priv.controlsWindow.location = value;
      }
    });
    Object.defineProperty(that, "formsrc", {
      get: function() {
        return priv.formsrc;
      },
      set: function(value) {
        priv.formsrc = value;
        priv.formWindow.location = value;
      }
    });

    // Bind methods to private context.
    ["addEventListener", "removeEventListener", "dispatchEvent", "show"].forEach(function(method) {
      that[method] = that[method].bind(priv);
    });

    self.port.emit('new', {
      id: priv.id,
      controlssrc: priv.controlssrc,
      formsrc: priv.formsrc
    });
    Object.freeze(this);
  }

  SecureForm.prototype = {
    show: function show() {
      self.port.emit("show", this.id);
    },
    addEventListener: function addEventListener(event, callback) {
      var key = eventToKey(event);
      if (!this.eventListeners.hasOwnProperty(key)) {
        this.eventListeners[key] = Set();
      }
      this.eventListeners[key].add(callback);
    },
    removeEventListener: function addEventListener(event, callback) {
      var key = eventToKey(event);
      if (this.eventListeners.hasOwnProperty(key)) {
        this.eventListeners[key].remove(callback);
      }
    },
    dispatchEvent: function dispatchEvent(event) {
      var that = this;
      var key = eventToKey(event.type);
      if (this.eventListeners.hasOwnProperty(key)) {
        this.eventListeners[key].forEach(function(listener) {
          listener.call(that.pub, event);
        });
      }
    }
  };
  Object.freeze(SecureForm);

  unsafeWindow.SecureForm = SecureForm;
})();
