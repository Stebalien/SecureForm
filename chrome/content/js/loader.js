/**
 * Hey there...
 * Go away.
 * NO SERIOUSLY. GO AWAY.
 * 
 * (please, for your own sanity)
 **/

(function() {

  // Source: http://stackoverflow.com/a/901144
  function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
    results = regex.exec(location.search);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
  }

  var name = getParameterByName("name");
  if (!name) {
    window.close();
  }

  var args = getParameterByName("args");
  if (args) {
    try {
      args = JSON.parse(args);
    } catch (e) { }
  }
  if (!(args instanceof Array)) {
    args = [];
  }

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
      new Function("require", "require_page", "__args__", ctx.code + '.apply(window, __args__)')
    ).call(window, ctx.require, require_page, args);
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
