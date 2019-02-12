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
  Entry.addNew(request, response);
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

app.get('/entry', (request, response) => {
  Entry.find({}, (err, entries) => {
    if (err) {
      response.status(400).send({ error: 'cannot get a list of entries' });
    } else {
      response.status(200).send(entries);
    }
  });
});

app.get('/test', (request, response) => {
  response.status(200).send('test ok');
});

app.listen(3000, 'localhost', () => {
  console.log('listening..');
});
