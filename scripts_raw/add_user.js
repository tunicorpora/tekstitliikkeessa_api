/*
Usage: node scripts/add_user.js testuser testpw
*/
import mongoose from 'mongoose';
import User from '../dist/models/user';

const db = mongoose.connect('mongodb://telimongo:27017/teli', {
  useNewUrlParser: true,
});

const user = new User({ username: process.argv[2], password: process.argv[3] });
user.save(err => {
  if (err) {
    console.log('error in creating the user!');
  } else {
    console.log('user succesfully created.');
  }
});
