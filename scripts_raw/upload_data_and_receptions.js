/*
Usage: node scripts/add_user.js testuser testpw
*/
import mongoose from 'mongoose';
import User from '../dist/models/user';
import parseXlsx from 'excel';
import fs from 'fs';
import path from 'path';

const db = mongoose.connect('mongodb://telimongo:27017/teli', {
  useNewUrlParser: true,
});

console.log('MOROOO');
parseXlsx(path.join(__dirname, '/../tuonti.xlsx'))
  .then(async data => {



  })
  .catch(err => console.log(err));

//const user = new User({ username: process.argv[2], password: process.argv[3] });
//user.save(err => {
//  if (err) {
//    console.log('error in creating the user!');
//  } else {
//    console.log('user succesfully created.');
//  }
//});
