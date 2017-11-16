

var fg = require('./index')

var _mockDB = {}

var forgot = fg({
  db : _mockDB
})

console.log(forgot)
