/* eslint-disable no-await-in-loop */
import bodyparser from 'body-parser';
import cors from 'cors';
import express from 'express';
import expressJwt from 'express-jwt';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import { editEntry, getEntries, getEntriesAsExcel } from './controllers/entry';
import {
  getAuthor,
  getAuthorNames,
  updateAuthor,
  saveAuthor,
} from './controllers/author';
import {
  getPublicationTitles,
  getPublications,
  getReceptions,
  saveLinks,
  searchPublications,
} from './controllers/publications';
import { getPublicationAndAuthor } from './utilities';
import Author from './models/author';
import Entry from './models/entry';
import { upload, uploadReceptions } from './controllers/upload';
import User from './models/user';

// eslint-disable-next-line no-unused-vars
const db = mongoose.connect('mongodb://telimongo:27017/teli', {
  useNewUrlParser: true,
});
const app = express();

const protectRoute = expressJwt({
  secret: process.env.JWT_SECRET,
  userProperty: 'auth',
});

const corsOptions = {
  origin: (origin, callback) => {
    // TODO: DEV only
    callback(null, true);
    //if (process.env.ALLOWED_ORIGINS.split(' ').indexOf(origin) !== -1) {
    //  callback(null, true);
    //} else {
    //  callback(new Error('Not allowed by CORS'));
    //}
  },
  credentials: true,
};
app.use(cors(corsOptions));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:8080');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
  next();
});

app.use(bodyparser.urlencoded({ extended: true }));
app.use(bodyparser.json());

app.post('/signin', (request, response) => {
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
        // eslint-disable-next-line no-underscore-dangle
        _id: user._id,
      },
      process.env.JWT_SECRET
    );

    response.cookie('t', token, { expire: new Date() + 9999 });

    // eslint-disable-next-line no-underscore-dangle
    response.send({ token, user: { _id: user._id, username: user.username } });
  });
});

app.get('/signout', (request, response) => {
  response.clearCookie('t');
  response.send({ message: 'signed out' });
});

app.put('/colnames/:name/:newname', protectRoute, async (request, response) => {
  const { name, newname } = request.params;
  Entry.updateMany({}, { $rename: { [name]: newname } }, err => {
    if (err) {
      response.status(400).send({ error: 'unable to rename' });
    } else {
      response.status(200).send({ updatesuccess: 'renamed succesfully' });
    }
  });
});

app.delete('/entry/:id', protectRoute, async (request, response) => {
  const authorAndPub = await getPublicationAndAuthor(request.params.id);
  if (authorAndPub.author) {
    await authorAndPub.publication.remove();
    authorAndPub.author.save(err => {
      if (err) {
        console.log('error deleting');
        response.status(400).send({ status: 'error deleting' });
        // console.log(err.message);
      } else {
        response.status(200).send({ status: 'ok' });
        console.log('deleted');
      }
    });
  }
  // TODO: add error handling
});

// app.post('/upload', protectRoute, Upload);
app.post('/upload_receptions', uploadReceptions);
app.post('/upload', upload);
app.put('/author', protectRoute, updateAuthor);
app.post('/author', protectRoute, saveAuthor);

app.get('/author', (request, response) => {
  Author.find({}, (err, authors) => {
    if (err) {
      response.status(400).send({ error: 'cannot get a list of authors' });
    } else {
      response.status(200).send(authors);
    }
  });
});

app.get('/search', searchPublications);
app.put('/entry/:id', protectRoute, editEntry);
app.get('/entry', getEntries);
app.get('/receptions/:id', getReceptions);
app.get('/publications/:id', getPublications);
app.get('/publications', getPublications);
app.get('/publication_titles', getPublicationTitles);
app.get('/authornames', getAuthorNames);
app.get('/author/:name', getAuthor);

app.post('/savelinks', saveLinks);

app.get('/entry/excel', getEntriesAsExcel);

app.get('/test', (request, response) => {
  response.status(200).send('test ok');
});

app.delete('/author', protectRoute, async (_, response) => {
  Author.deleteMany({}, err => {
    if (err) {
      console.log(err);
      response.status(400).send({ error: 'unable to delete' });
    }
    response.status(200).send({ status: 'succesfully deleted' });
  });
});

app.listen(3000, '0.0.0.0', () => {
  console.log('listening..');
});
