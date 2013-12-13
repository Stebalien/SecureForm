console.log('test');
self.port.on('showIndicator', function() {
  document.getElementById('indicator').style.display = 'inline';
  console.log(document.getElementById('indicator').style.display);
});
self.port.on('hideIndicator', function() {
  document.getElementById('indicator').style.display = 'none';
});
