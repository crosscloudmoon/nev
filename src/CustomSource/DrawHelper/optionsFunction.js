let optionsFunction = {};
function clone(from, to) {
  if (from == null || typeof from !== 'object') return from;
  if (from.constructor !== Object && from.constructor !== Array) return from;
  if (from.constructor === Date || from.constructor === RegExp || from.constructor === Function ||
        from.constructor === String || from.constructor === Number || from.constructor === Boolean) {return new from.constructor(from);}

  to = to || new from.constructor();

  for (var name in from) {
    to[name] = typeof to[name] === 'undefined' ? clone(from[name], null) : to[name];
  }

  return to;
}

optionsFunction.fillOptions = function(options, defaultOptions) {
  options = options || {};
  var option;
  for (option in defaultOptions) {
    if (options[option] === undefined) {
      options[option] = clone(defaultOptions[option]);
    }
  }
};

// shallow copy
optionsFunction.copyOptions = function(options, defaultOptions) {
  /*
   eslint-disable
   */
  var newOptions = clone(options), option;
  for (option in defaultOptions) {
    if (newOptions[option] === undefined) {
      newOptions[option] = clone(defaultOptions[option]);
    }
  }
  return newOptions;
};
export default optionsFunction;
