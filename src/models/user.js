/* eslint-disable no-underscore-dangle */
import { Schema, model } from 'mongoose';
import crypto from 'crypto';

const userSchema = new Schema({
  username: String,
  hashed_password: String,
  salt: String,
});

userSchema
  .virtual('password')
  .set(function setPw(password) {
    this.hashed_password = password;
    this.salt = this.makeSalt();
    this.hashed_password = this.encryptPassword(password);
  })
  .get(function getPw() {
    return this._password;
  });

userSchema.methods = {
  authenticate(plainText) {
    return this.encryptPassword(plainText) === this.hashed_password;
  },
  encryptPassword(password) {
    if (!password) {
      return '';
    }
    try {
      return crypto
        .createHmac('sha1', this.salt)
        .update(password)
        .digest('hex');
    } catch (err) {
      return '';
    }
  },
  makeSalt() {
    return `${Math.round(new Date().valueOf() * Math.random())}`;
  },
};

const User = model('User', userSchema);

export default User;
