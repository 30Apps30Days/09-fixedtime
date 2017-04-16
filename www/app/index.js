'use strict';

function noop() {}

// From: https://github.com/lodash/lodash/blob/master/shuffle.js
function shuffle(array) {
  var length = array == null ? 0 : array.length;
  if (!length) { return []; }

  var index = -1;
  var lastIndex = length - 1;
  var result = array;
  while (++index < length) {
    var rand = index + Math.floor(Math.random() * (lastIndex - index + 1));
    var value = result[rand];
    result[rand] = result[index];
    result[index] = value;
  }
  return result
}

function bindEvents(thisArg, events) {
   Object.keys(events).forEach(function (selector) {
        Object.keys(events[selector]).forEach(function (event) {
            var handler = events[selector][event].bind(thisArg);
            if('document' === selector) {
                document.addEventListener(event, handler, false);
            } else if ('window' === selector) {
                window.addEventListener(event, handler, false);
            } else {
                document.querySelectorAll(selector).forEach(function (dom) {
                    dom.addEventListener(event, handler, false);
                });
            }
        });
    }); // all events bound
}

function f(name, params) {
  params = Array.prototype.slice.call(arguments, 1, arguments.length);
  return name + '(' + params.join(', ') + ')';
}

var IS_CORDOVA = !!window.cordova;

var app = {
  // options
  DATA_KEY: 'org.metaist.fixedtime.data',
  store: null,
  options: {
    hour: 17,
    debug: false
  },

  // internal
  zones: [],
  idx: null,      // index into zones
  clock: null,    // refresh clock
  interval: null, // refresh interval

  // DOM
  $hour: null,
  $zone: null,

  init: function () {
    bindEvents(this, {
      'document': {'deviceready': this.ready},
      'form input': {'change': this.change},
      '#hour': {'input': this.change},
      'main': {'click': this.tick}
    });

    if(!IS_CORDOVA) {
      this.options.debug && console.log('NOT cordova');
      bindEvents(this, {'window': {'load': this.ready}});
    }

    return this;
  },

  ready: function () {
    // Store DOM nodes
    this.$hour = document.querySelector('#hour');
    this.$zone = document.querySelector('#zone');

    this.store = plugins.appPreferences;
    this.store.fetch(this.DATA_KEY).then(function (data) {
      this.options = data || this.options;
      this.$hour.MaterialSlider.change(this.options.hour);
      this.tick();
    }.bind(this));

    return this.start();
  },

  change: function () {
    var hour = parseInt(this.$hour.value, 10);
    if(hour !== this.options.hour) {
      this.options.hour = hour;
      this.tick();
    }

    this.store.store(noop, noop, this.DATA_KEY, this.options);
    return this;
  },

  render: function () {
    var zone = 'no place';
    if (this.zones.length) {
      zone = this.zones[this.idx]
                 .replace(/_/g, ' ')
                 .replace(/.*\//, '');
    }

    var time = this.options.hour;
    switch(time) {
    case 0: time = 'midnight'; break;
    case 12: time = 'noon'; break;
    default: time = (time % 12) + ' ' + (time < 12 ? 'am' : 'pm')
    }

    var text = ['It is', time, '<br />', 'in', zone];
    this.$zone.innerHTML = text.join(' ');
    if (this.zones.length) {
      this.$zone.setAttribute('title', this.zones[this.idx]);
    } else {
      this.$zone.setAttribute('title', 'Nowhere');
    }

    return this;
  },

  reset: function () {
    this.options.debug && console.log('reset');
    this.zones = shuffle(this.zones);
    this.idx = 0;
    return this;
  },

  next: function () {
    this.options.debug && console.log('next', this.idx);
    this.idx++;
    if (this.idx >= this.zones.length) { this.reset(); }
    return this.render();
  },

  tick: function () {
    this.options.debug && console.log('tick');
    var now = moment();
    var diff = (moment.utc().hour() - this.options.hour) * 60;

    this.idx = null;
    this.zones = [];
    moment.tz.names().forEach(function(name) {
      var offset = moment.tz.zone(name).offset(now);
      if (offset === diff) {
        if (-1 == name.indexOf('GMT')) {
          this.zones.push(name);
        }
      }
    }.bind(this));

    if(this.zones.length) { this.reset(); }
    return this.next();
  },

  start: function () {
    this.options.debug && console.log('start');
    var now = moment();
    this.stop();
    this.interval = ((60 - now.minutes()) * 60 * 1000) +
                    ((60 - now.seconds()) * 1000) +
                    500;
    this.clock = window.setInterval(this.tick.bind(this), this.interval);
    return this.tick();
  },

  stop: function () {
    this.options.debug && console.log('stop', this.clock);
    window.clearInterval(this.clock);
    this.clock = null;
    this.interval = null;
    return this;
  }

};

app.init();
