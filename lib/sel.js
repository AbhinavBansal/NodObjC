
/**
 * Provides a transparent bridge between JavaScript Strings and Objective-C
 * `SEL`s.
 */

/*!
 * Module exports.
 */

exports.toSEL = toSEL
exports.toString = toString

/*!
 * Module dependencies.
 */

var debug = require('debug')('NodObjC:sel')
  , ref = require('ref')
  , ffi = require('ffi')
  , libobjc = require('./libobjc')
  , sel_registerName = ffi.ForeignFunction(libobjc.get('sel_registerName'), 'void*', [ 'string' ])
  , sel_getName = ffi.ForeignFunction(libobjc.get('sel_getName'), 'string', [ 'void*' ])

/**
 * Comply with ref's "type" interface.
 */

exports.name = 'SEL'
exports.indirection = 1
exports.size = ref.sizeof.pointer
exports.alignment = ref.alignof.pointer
exports.get = function get (buffer, offset) {
  var sel = buffer.readPointer(offset)
  return toString(sel)
}
exports.set = function set (buffer, offset, value) {
  var sel = ref.NULL
  if (value) {
    if (Buffer.isBuffer(value)) {
      sel = value
    } else { // string
      sel = toSEL(value)
    }
  }
  assert(Buffer.isBuffer(sel))
  return buffer.writePointer(sel, offset)
}

// cache of SEL pointers
exports.cache = {}

/**
 * Transforms a JS String selector into a `SEL` pointer reference.
 * This function does caching internally.
 *
 * @param {String} sel A String selector to turn into a native SEL pointer.
 * @return {Pointer} The SEL pointer that was generated, or a cached version.
 * @api private
 */

function toSEL (sel) {
  var rtn = exports.cache[sel]
  if (rtn) {
    return rtn
  }
  debug('sel_registerName()', sel)
  return exports.cache[sel] = sel_registerName(sel)
}

/**
 * Transforms a `SEL` reference to a JS String.
 *
 * @param {Pointer} SEL the SEL Pointer to turn into a JS String.
 * @return {String} The String value of the given SEL.
 * @api private
 */

function toString (SEL) {
  debug('sel_getName()', SEL)
  return sel_getName(SEL)
}
