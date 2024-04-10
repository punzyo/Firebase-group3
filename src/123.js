Promise.resolve()
  .then(function a() {
    Promise.resolve().then( console.log('333'))
    Promise.resolve().then(
      console.log('123')
    )
    throw new Error('OH TEH NOEZ!')
    Promise.resolve().then(function f() {})
  })
  .catch(function b() {})
  .then(function c() {})