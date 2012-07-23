var ffi = require('ffi')
  , ref = require('ref')
  , assert = require('assert')
  , b = require('../../lib/core')
  , free = require('../../lib/libc').free

// get Class instances
var NSMutableArray = b.objc_getClass('NSMutableArray')
  , NSString = b.objc_getClass('NSString')
  , NSAutoreleasePool = b.objc_getClass('NSAutoreleasePool')

// get Method instances
var UTF8StringMethod = b.class_getInstanceMethod(NSString, 'UTF8String')
  , allocMethod = b.class_getClassMethod(NSMutableArray, 'alloc')
  , addObjectMethod = b.class_getInstanceMethod(NSMutableArray, 'addObject:')
  , sufMethod = b.class_getInstanceMethod(NSMutableArray, 'sortUsingFunction:context:')

// get the various objc_msgSend() proxy functions
var msgSend = b.get_objc_msgSend(getTypes(allocMethod))
  , msgSend2 = b.get_objc_msgSend(getTypes(UTF8StringMethod))
  , msgSend3 = b.get_objc_msgSend(getTypes(addObjectMethod))
  , msgSend4 = b.get_objc_msgSend(getTypes(sufMethod))

// create an NSAutoreleasePool instance
var pool = msgSend(msgSend(NSAutoreleasePool, 'alloc'), 'init')

// create an NSMutableArray instance
var instance = msgSend(msgSend(NSMutableArray, 'alloc'), 'init')

// log it
//console.log(instance)

// add a couple objects to the array (Class instances in this case)
msgSend3(instance, 'addObject:', NSString)
msgSend3(instance, 'addObject:', NSMutableArray)


// toString() before sort
var before = msgSend2(msgSend(instance, 'description'), 'UTF8String')
//console.log('before:', before)
assert.ok(before.indexOf('NSString') < before.indexOf('NSMutableArray'))

// we can sort, using a JavaScript function to do the sorting logic!!!
// In this simple example we sort based on the length of the class name
var callbackCount = 0
var callback = ffi.Callback('int32', [ 'pointer', 'pointer', 'pointer' ], cb)
function cb (obj1, obj2, context) {
  callbackCount++
  var n1 = b.class_getName(obj1)
    , n2 = b.class_getName(obj2)
  if (n1 == n2) return 0
  return n1 > n2 ? 1 : -1
}

//console.log(instance, callback, instance)
msgSend4(instance, 'sortUsingFunction:context:', callback, null)


// toString() after sort
var after = msgSend2(msgSend(instance, 'description'), 'UTF8String')
assert.ok(after.indexOf('NSString') > after.indexOf('NSMutableArray'))


function getTypes (method) {
  if (!method) throw new Error('bad pointer!')
  var args = []
    , types = []
    , numArgs = b.method_getNumberOfArguments(method)
    , rtnTypePtr = b.method_copyReturnType(method)
    , rtnType = rtnTypePtr.readCString()
  free(rtnTypePtr)
  types.push(rtnType)
  types.push(args)
  for (var i=0; i<numArgs; i++) {
    var argPtr = b.method_copyArgumentType(method, i)
    args.push(argPtr.readCString())
    free(argPtr)
  }
  //console.log(types)
  return types
}

process.on('exit', function () {
  assert.equal(callbackCount, 1)
})
