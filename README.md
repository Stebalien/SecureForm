
Installation
============

Go to releases and download and install the XPI (firefox addon). If you can't
figure out how to do that, google it.

Building
========

1. Install the addons sdk (we used version
   [24-06-12-2013](https://github.com/mozilla/addon-sdk/releases/tag/firefox-24-06-12-2013)
   and other versions might not work).
2. Run `cfx --no-strip-xpi xpi`. The `--no-strip-xpi` part is important!

Using (as a user)
=================

Make sure to enable your addons toolbar. You can click on the lock button to
access your keyring, view your current keys, and import new ones.

Using (as a website)
====================

To display a PGP encrypted MIME encoded message/form, place the following in your website:

```html
<encrypted src="/path/to/armored-message.pgp"
```

To open use an encrypted form, do something like the following:

```javascript
var form = SecureForm({
  formsrc: "/path/to/my/form.html",
  [controlssrc: "/path/to/my/controls.html"]
});
form.addEventListener("submit", function() {
  alert("You submitted: \n" + this.value);
});
form.addEventListener("load", function() {
  // Add an element to the form
  var fdoc = this.formWindow.document;
  var div = fdoc.createElement("div");
  div.textContent = "New div in the form!"
  fdoc.appendChild(div);

  // Listen to events on the controls
  var cdoc = this.formWindow.document;
  var button = cdoc.getElementById("myButton");
  button.addEventListener("click", function() {
    alert("user clicked my control");
  });
});
form.addEventListener("error", function() {
  alert("the encrypted message failed to load");
});
form.addEventListener("show", function() {
  alert("the form was shown");
});
form.addEventListener("hide", function() {
  alert("the user hid the form without submitting it");
});

// Show the form!
form.show();
```

