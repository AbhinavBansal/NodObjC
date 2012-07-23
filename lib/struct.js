
/**
 * Internal module that parses *"struct type encodings"* and turns them into
 * proper node-ffi `Struct` instances.
 */

/*!
 * Module exports.
 */

exports.isStruct = isStruct
exports.getStruct = getStruct
exports.parseStructName = parseStructName
exports.parseStruct = parseStruct

/*!
 * Module dependencies.
 */

var Struct = require('ref-struct')
  , debug = require('debug')('NodObjC:struct')
  , types = require('./types')
  , test = /^\{.*?\}$/

// cache of generated structs
exports.cache = {}

/**
 * Tests if the given arg is a `Struct` constructor or a string type encoding
 * describing a struct (then true), otherwise false.
 *
 * @api private
 */

function isStruct (type) {
  return type && (type.fields || test.test(type))
}

/**
 * Returns the struct constructor function for the given struct name or type.
 *
 *     {CGPoint="x"d"y"d}
 *
 * @api private
 */

function getStruct (type) {
  // First check if a regular name was passed in
  var rtn = exports.cache[type]
  if (rtn) {
    debug('returning cached Struct for given name:', name)
    return rtn
  }
  // If the struct type name has already been created, return that one
  var name = exports.parseStructName(type)
  //console.error('name: %s', name)
  rtn = exports.cache[name]
  if (rtn) {
    debug('returning cached Struct for type:', type)
    debug('                     parsed name:', name)
    return rtn
  }
  // Next parse the type structure
  var parsed = exports.parseStruct(type)
  // Otherwise we need to create a new Struct constructor
  var struct = Struct()
  parsed.props.forEach(function (prop) {
    struct.defineProperty(prop[0], types.map(prop[1]))
  })
  debug('finished defining Struct', parsed.name, struct)
  return exports.cache[parsed.name] = struct
}

/**
 * Extracts only the name of the given struct type encoding string.
 *
 * @api private
 */

function parseStructName (struct) {
  var s = struct.substring(1, struct.length - 1)
    , equalIndex = s.indexOf('=')
  if (~equalIndex)
    s = s.substring(0, equalIndex)
  return s
}

/**
 * Parses a struct type string into an Object with a `name` String and
 * a `props` Array (entries are a type string, or another parsed struct object)
 *
 * @api private
 */

function parseStruct (struct) {
  var s = struct.substring(1, struct.length - 1)
    , equalIndex = s.indexOf('=')
    , rtn = {
        name: s.substring(0, equalIndex)
      , props: []
    }
  s = s.substring(equalIndex + 1)
  var curProp = []
    , numBrackets = 0
    , entries = []
  for (var i = 0; i < s.length; i++) {
    var cur = s[i]
    switch (cur) {
      case '"':
        if (numBrackets > 0)
          curProp.push(cur)
        else
          addProp()
        break;
      case '{':
      case '[':
      case '(':
        numBrackets++
        curProp.push(cur)
        break;
      case '}':
      case ']':
      case ')':
        numBrackets--
        curProp.push(cur)
        break;
      default:
        curProp.push(cur)
        break;
    }
  }
  addProp()
  function addProp () {
    entries.push(curProp.join(''))
    curProp = []
    numBrackets = 0
  }
  for (var i = 1; i < entries.length; i += 2) {
    rtn.props.push([entries[i], entries[i + 1]])
  }
  return rtn
}
