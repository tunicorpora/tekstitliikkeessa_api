import { Schema, model } from 'mongoose';
import Author from './author';

const { ObjectId } = Schema.Types;

const saveEntry = (authorId, textType, response) => {
  // eslint-disable-next-line no-underscore-dangle
  const entry = new Entry({ author: authorId, textType });
  entry.save((entryErr, savedEntry) => {
    if (entryErr) {
      response.status(400).send({ error: 'Could not save the entry' });
    } else {
      response.status(200).send(savedEntry);
    }
  });
};

const entrySchema = new Schema({
  author: { type: ObjectId, ref: 'Author' },
  textType: { type: String, default: '?' },
});

entrySchema.static('addNew', async function addNew(request, response) {
  // Get the parameters from the request body
  const { authorName, textType } = request.body;
  // Look for the author in the authors db
  const oldauthor = await Author.findOne({ name: authorName });
  if (!oldauthor) {
    // if not found, create a new author based on the name
    const author = new Author({ name: authorName });
    author.save((authorErr, savedAuthor) => {
      if (authorErr) {
        response.status(400).send({ error: 'Could not save the author' });
      }
      saveEntry(savedAuthor._id, textType, response);
    });
  } else {
    saveEntry(oldauthor._id, textType, response);
  }
});

const Entry = model('Entry', entrySchema);

export default Entry;
