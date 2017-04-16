function noop() {}

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

var app = {
  // options
  prefs: null,

  // internal
  //

  init: function () {
    bindEvents(this, {
      'document': {'deviceready': this.ready},
      'form input': {'change': this.change}
    });
    return this;
  },

  ready: function () {
    // Store DOM nodes
    // TODO

    // Grab preferences
    // this.prefs = plugins.appPreferences;
    this.start();
    return this;
  },

  change: function () {
    return this;
  },

  render: function () {
    return this;
  }
};

app.init();
