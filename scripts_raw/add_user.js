import mongoose from 'mongoose';
import User from '../dist/models/user';

const db = mongoose.connect('mongodb://localhost/tekstitliikkeessa', {
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
