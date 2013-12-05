/**
 * Hey there...
 * Go away.
 * NO SERIOUSLY. GO THE FUCK AWAY.
 * 
 * (please, for your own sanity)
 **/

(function() {

  // We need the name but don't want to polute the scope.
  var name = (function() {
    var match = /[\\?&]name=([^&#]*)/.exec(location.search);
    if (!match) {
      // XXX: Unknown page!  // Should probably do something else!
      window.close();
    }
    return decodeURIComponent(match[1].replace(/\+/g, " "));
  })();

  // Funciton that launches the page.
  var exec = function(ctx) {
    // Setup require_page...
    var loader_scope = Components.utils.import('resource://gre/modules/commonjs/toolkit/loader.js', {});
    var options = jQuery.extend({}, ctx.options);
    options.globals = window;
    var loader = loader_scope.Loader.Loader(options);
    var requirer = loader_scope.Loader.Module('pages/' + name, document.location.href);
    var require_page = loader_scope.Loader.Require(loader, requirer);

    // Evaluate the page code.
    return (
      new Function("require", "require_page", ctx.code + '()')
    ).call(window, ctx.require, require_page);
  };

  // Pivot or schedule a pivot.
  var pivot_scope = Components.utils.import('chrome://secure-form/content/pivot.jsm', {});
  var ctx = pivot_scope.pivot[name];

  if (ctx && ctx.code) {
    exec(ctx);
  } else {
    if (!ctx) {
      ctx = pivot_scope.pivot[name] = [];
    }
    ctx.push(exec);
  }
})();
