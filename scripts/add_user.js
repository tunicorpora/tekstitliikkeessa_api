"use strict";

var _mongoose = _interopRequireDefault(require("mongoose"));

var _user = _interopRequireDefault(require("../dist/models/user"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const db = _mongoose.default.connect('mongodb://localhost/tekstitliikkeessa', {
  useNewUrlParser: true
});

const user = new _user.default({
  username: process.argv[2],
  password: process.argv[3]
});
user.save(err => {
  if (err) {
    console.log('error in creating the user!');
  } else {
    console.log('user succesfully created.');
  }
});