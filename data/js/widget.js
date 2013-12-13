self.port.on('showIndicator', function() {
  document.getElementById('indicator').style.display = 'inline';
});
self.port.on('hideIndicator', function() {
  document.getElementById('indicator').style.display = 'none';
});
