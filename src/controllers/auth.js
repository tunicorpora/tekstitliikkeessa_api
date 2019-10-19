/* eslint-disable no-underscore-dangle */
/* eslint-disable consistent-return */
import jwt from 'jsonwebtoken';
import expressJwt from 'express-jwt';
import User from '../models/user';

const hasAuthorization = (req, res, next) => {
  const authorized =
    req.profile && req.auth && req.profile._id === req.auth._id;
  if (!authorized) {
    return res.status('403').json({
      error: 'User is not authorized',
    });
  }
  next();
  return null;
};

const protectRoute = expressJwt({
  secret: process.env.JWT_SECRET,
  userProperty: 'auth',
});

const signIn = (request, response) => {
  const { username, password } = request.body;
  User.findOne({ username }, (err, user) => {
    if (err || !user) {
      return response.status(401).send({ error: 'User not found.' });
    }
    if (!user.authenticate(password)) {
      return response.status(401).send({ error: 'Wrong password / username' });
    }

    const token = jwt.sign(
      {
        _id: user._id,
      },
      process.env.JWT_SECRET
    );

    response.cookie('t', token, { expire: new Date() + 9999 });
    response.send({ token, user: { _id: user._id, username: user.username } });
  });
};

const signOut = (_, response) => {
  response.clearCookie('t');
  response.send({ message: 'signed out' });
};

export { protectRoute, hasAuthorization, signIn, signOut };
