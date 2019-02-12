import express from 'express';
import bodyparser from 'body-parser';
import mongoose from 'mongoose';
import Entry from './models/entry';
import Author from './models/author';

// eslint-disable-next-line no-unused-vars
const db = mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true });
const app = express();

app.use(bodyparser.urlencoded({ extended: true }));
app.use(bodyparser.json());

app.post('/entry', (request, response) => {
  // Get the parameters from the request body
  const { authorName, textType } = request.body;
  let authorId;
  // Look for the author in the authors db
  Author.findOne({ name: authorName }, (err, existingAuthor) => {
    if (err) {
      console.log('error in fetching an existing author');
    } else if (existingAuthor) {
      authorId = existingAuthor._id;
    } else {
      // if not found, create a new author based on the name
      author.save((authorErr, savedAuthor) => {
        if (authorErr) {
          response.status(400).send({ error: 'Could not save the author' });
        } else {
          authorId = savedAuthor._id;
        }
      });
    }
    if (authorId) {
      // eslint-disable-next-line no-underscore-dangle
      const entry = new Entry({ author: authorId, textType });
      entry.save((entryErr, savedEntry) => {
        if (entryErr) {
          response.status(400).send({ error: 'Could not save the entry' });
        } else {
          response.status(200).send(savedEntry);
        }
      });
    }
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

app.get('/test', (request, response) => {
  response.status(200).send('test ok');
});

app.listen(3000, 'localhost', () => {
  console.log('listening..');
});
