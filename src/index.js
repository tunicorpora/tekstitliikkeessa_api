/* eslint-disable no-await-in-loop */
import bodyparser from 'body-parser';
import cors from 'cors';
import express from 'express';
import expressJwt from 'express-jwt';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import { getEntries, getEntriesAsExcel } from './controllers/entry';
import {
  getPublicationTitles,
  getPublications,
  saveLinks,
} from './controllers/publications';
import Author from './models/author';
import Entry from './models/entry';
import Upload from './controllers/upload';
import User from './models/user';

// eslint-disable-next-line no-unused-vars
const db = mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true });
const app = express();

const protectRoute = expressJwt({
  secret: process.env.JWT_SECRET,
  userProperty: 'auth',
});

const corsOptions = {
  origin: (origin, callback) => {
    console.log(origin);
    if (process.env.ALLOWED_ORIGINS.split(' ').indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};
app.use(cors());

// app.use((req, res, next) => {
//   res.header('Access-Control-Allow-Origin', 'http://localhost:8080');
//   res.header(
//     'Access-Control-Allow-Headers',
//     'Origin, X-Requested-With, Content-Type, Accept'
//   );
//   res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
//   next();
// });

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

app.put('/entry/:id', protectRoute, async (request, response) => {
  const { authorId, ...newVals } = request.body;
  const saveEntry = entryVals => {
    Entry.updateOne(
      { _id: request.params.id },
      entryVals,
      (err, savedEntry) => {
        if (err) {
          console.log(err);
        } else {
          response.status(200).send({ updated: savedEntry.n });
        }
      }
    );
  };

  if (newVals.Toimija) {
    // If we're editing the name of an author
    const oldauthor = await Author.findOne({ name: newVals.Toimija });
    if (!oldauthor) {
      // no such name in the db: adding new
      const author = await new Author({ name: newVals.Toimija });
      await author.save((authorErr, savedAuthor) => {
        if (authorErr) {
          console.log(authorErr);
        } else {
          delete newVals.Toimija;
          // eslint-disable-next-line no-underscore-dangle
          saveEntry({ ...newVals, author: savedAuthor._id });
        }
      });
    } else {
      // eslint-disable-next-line no-underscore-dangle
      saveEntry({ ...newVals, author: oldauthor._id });
    }
  } else {
    // none of the edits involves the author
    saveEntry(newVals);
  }
});

app.delete('/entry/:id', protectRoute, (request, response) => {
  Entry.deleteOne({ _id: request.params.id }, err => {
    if (err) {
      response.status(400).send({ error: 'Deleting failed.' });
    } else {
      response.status(200).send({ status: 'success' });
    }
  });
  // TODO: add error handling
});

// app.post('/upload', protectRoute, Upload);
app.post('/upload', Upload);

app.post('/author', (request, response) => {
  const author = new Author({ name: request.body.authorName });
  author.save((err, savedAuthor) => {
    if (err) {
      response.status(400).send({ error: 'Could not save the author' });
    } else {
      response.status(200).send(savedAuthor);
    }
  });
});

app.get('/author', (request, response) => {
  Author.find({}, (err, authors) => {
    if (err) {
      response.status(400).send({ error: 'cannot get a list of authors' });
    } else {
      response.status(200).send(authors);
    }
  });
});

app.delete('/colnames/:colname', protectRoute, (request, response) => {
  Entry.updateMany(
    {},
    { $unset: { [request.params.colname]: 1 } },
    (err, res) => {
      if (err) {
        response.status(400).send({ error: 'Unable to delete' });
      } else {
        console.log(res);
        response.status(200).send('Column succesfully deleted.');
      }
    }
  );
  console.log(request.params.colname);
});

app.get('/colnames', (request, response) => {
  Entry.findOne({}, (err, entry) => {
    if (entry) {
      response.status(200).send(entry);
    } else {
      response.status(400).send({ error: 'Error finding list of columns' });
    }
  });
});

app.get('/entry', getEntries);
app.get('/publications', getPublications);
app.get('/publication_titles', getPublicationTitles);

app.post('/savelinks', saveLinks);

app.get('/entry/excel', getEntriesAsExcel);

app.get('/test', (request, response) => {
  response.status(200).send('test ok');
});

app.listen(3000, 'localhost', () => {
  console.log('listening..');
});
