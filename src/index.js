/* eslint-disable no-await-in-loop */
import express from 'express';
import bodyparser from 'body-parser';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import formidable from 'formidable';
import parseXlsx from 'excel';
import expressJwt from 'express-jwt';
import cors from 'cors';
import Entry from './models/entry';
import Author from './models/author';
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
    if (['http://localhost:8080'].indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));

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
  User.findOne({ username: username }, (err, user) => {
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

app.put('/entry/:id', protectRoute, (request, response) => {
  Entry.updateOne({ _id: request.params.id }, request.body, err => {
    if (err) {
      console.log(err);
    } else {
      console.log('success!');
      response.status(200).send({ updated: 1 });
    }
  });
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

app.post('/upload', protectRoute, (request, response) => {
  const form = new formidable.IncomingForm();
  const collectedAuthors = [];
  form.parse(request);
  form.on('file', async (name, file) => {
    try {
      parseXlsx(file.path).then(async data => {
        // Grab the column names but expect the first to contain the author
        // eslint-disable-next-line no-restricted-syntax
        for (const row of data.slice(1)) {
          if (collectedAuthors.indexOf(row[0]) === -1) {
            collectedAuthors.push(row[0]);
          }
        }

        // Scan the list of authors and insert new ones if found
        await Promise.all(
          collectedAuthors.map(async authorName => {
            const oldauthor = await Author.findOne({ name: authorName });
            if (!oldauthor) {
              const author = await new Author({ name: authorName });
              await author.save(authorErr => {
                if (authorErr) {
                  console.log('error saving a new author');
                }
              });
            }
          })
        );

        const colnames = data[0].slice(1);
        // eslint-disable-next-line no-restricted-syntax
        for (const row of data.slice(1)) {
          const colsRaw = colnames.map((colname, idx) => {
            const newobj = {};
            newobj[colname] = row[idx + 1].trim();
            return newobj;
          });
          const cols = Object.assign({}, ...colsRaw);
          // eslint-disable-next-line no-await-in-loop
          await Entry.addNew({
            authorName: row[0],
            ...cols,
          });
        }
        response.status(200).send({ saved: data.length - 1 });
      });
    } catch (error) {
      console.log(error);
      response.status(400).send({ error: 'Could not process the file' });
    }
    // TODO: add error handling
  });
});

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

app.get('/colnames', (request, response) => {
  Entry.findOne({}, (err, entry) => {
    if (entry) {
      response.status(200).send(entry);
    } else {
      response.status(400).send({ error: 'Error finding list of columns' });
    }
  });
});

app.get('/entry', (request, response) => {
  let filters = {};
  let authorFilter = '.*';
  if (request.query.filters) {
    const filterparams = JSON.parse(decodeURIComponent(request.query.filters))
      .map(filter => {
        if (filter.fieldname === 'Toimija') {
          authorFilter = filter.value;
          return undefined;
        }
        // TODO: conditio type: regex, numerical etc
        return { [filter.fieldname]: new RegExp(filter.value, 'i') };
      })
      .filter(f => f !== undefined);
    if (filterparams.length) {
      filters = {
        $and: filterparams,
      };
    }
  }
  Entry.find(filters)
    .populate({
      path: 'author',
      match: { name: new RegExp(authorFilter, 'i') },
      select: 'name',
    })
    .exec((err, entries) => {
      if (err) {
        response.status(400).send({ error: 'cannot get a list of entries' });
      } else {
        const filteredEntries = entries.filter(
          newentry => newentry.author != null
        );
        response.status(200).send(filteredEntries);
      }
    });
});

app.get('/test', (request, response) => {
  response.status(200).send('test ok');
});

app.listen(3000, 'localhost', () => {
  console.log('listening..');
});
