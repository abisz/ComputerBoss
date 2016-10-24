function PeepGenerator () {

}

window.AudioContext = window.AudioContext || window.webkitAudioContext;
// TODO: why can't this be an attribute from PeepGenerator?
context = new AudioContext();

PeepGenerator.prototype.init = function () {

  // this.context = new AudioContext();

};

PeepGenerator.prototype.startPeep = function (freq) {

  if (this.oscillator) this.stopPeep();

  this.oscillator = context.createOscillator();

  this.oscillator.frequency.value = freq;
  this.oscillator.start(0);

  this.gain = context.createGain();
  this.gain.gain.value = 0;

  var that = this;
  this.increaseInterval = setInterval(function () {
    that.increaseVolume(1);
  }, 100);

  // this.oscillator.connect(context.destination);
  this.oscillator.connect(this.gain);
  this.gain.connect(context.destination);
};

PeepGenerator.prototype.stopPeep = function () {
  this.gain.disconnect(context.destination);
  this.oscillator = null;
  clearInterval(this.increaseInterval);
};

PeepGenerator.prototype.increaseVolume = function (d) {
  var current = this.gain.gain.value;
  this.gain.gain.value = Math.min(1000, current + d/1000);
  console.log(this.gain.gain.value);

};