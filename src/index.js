import express from 'express';
import bodyparser from 'body-parser';
import mongoose from 'mongoose';
import formidable from 'formidable';
import parseXlsx from 'excel';
import Entry from './models/entry';
import Author from './models/author';

// eslint-disable-next-line no-unused-vars
const db = mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true });
const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
  next();
});

app.use(bodyparser.urlencoded({ extended: true }));
app.use(bodyparser.json());

app.post('/entry', (request, response) => {
  Entry.addNew(request.body);
  // TODO: add error handling
});

app.put('/entry/:id', (request, response) => {
  Entry.updateOne({ _id: request.params.id }, request.body, err => {
    if (err) {
      console.log(err);
    } else {
      console.log('success!');
      response.status(200).send({ updated: 1 });
    }
  });
});

app.delete('/entry/:id', (request, response) => {
  Entry.deleteOne({ _id: request.params.id }, err => {
    if (err) {
      response.status(400).send({ error: 'Deleting failed.' });
    } else {
      response.status(200).send({ status: 'success' });
    }
  });
  // TODO: add error handling
});

app.post('/upload', (request, response) => {
  const form = new formidable.IncomingForm();
  form.parse(request);
  form.on('file', (name, file) => {
    try {
      parseXlsx(file.path).then(async data => {
        // eslint-disable-next-line no-restricted-syntax
        for (const row of data.slice(1)) {
          // eslint-disable-next-line no-await-in-loop
          await Entry.addNew({
            authorName: row[0],
            textType: row[1],
          });
          console.log(`saved ${row.join(', ')}`);
        }
        console.log('all saved.');
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

app.get('/entry', (request, response) => {
  Entry.find({})
    .populate('author', 'name')
    .exec((err, entries) => {
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
