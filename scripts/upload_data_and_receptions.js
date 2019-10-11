"use strict";

var _mongoose = _interopRequireDefault(require("mongoose"));

var _user = _interopRequireDefault(require("../dist/models/user"));

var _excel = _interopRequireDefault(require("excel"));

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
Usage: node scripts/add_user.js testuser testpw
*/
const db = _mongoose.default.connect('mongodb://telimongo:27017/teli', {
  useNewUrlParser: true
});

console.log('MOROOO'); //parseXlsx(path.join(__dirname, '/../tuonti.xlsx'))

(0, _excel.default)(process.argv[1]).then(async data => {}).catch(err => console.log(err)); //const user = new User({ username: process.argv[2], password: process.argv[3] });
//user.save(err => {
//  if (err) {
//    console.log('error in creating the user!');
//  } else {
//    console.log('user succesfully created.');
//  }
//});