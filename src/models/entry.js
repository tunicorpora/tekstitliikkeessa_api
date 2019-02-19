import { Schema, model } from 'mongoose';
import Author from './author';

const { ObjectId } = Schema.Types;

const saveEntry = (authorId, textType) => {
  // eslint-disable-next-line no-underscore-dangle
  const entry = new Entry({ author: authorId, textType });
  entry.save((entryErr, savedEntry) => {
    if (entryErr) {
      console.log('Error saving a new bibliographical entry');
    } else {
      console.log('Entry succesfully saved');
    }
  });
};

const entrySchema = new Schema({
  author: { type: ObjectId, ref: 'Author' },
  textType: { type: String, default: '?' },
});

entrySchema.static('addNew', async function addNew(body) {
  // Get the parameters from the request body
  const { authorName, textType } = body;
  // Look for the author in the authors db
  const oldauthor = await Author.findOne({ name: authorName });
  if (!oldauthor) {
    // if not found, create a new author based on the name
    console.log('creating a new author');
    const author = new Author({ name: authorName });
    author.save((authorErr, savedAuthor) => {
      if (authorErr) {
        console.log('error saving a new author');
      }
      console.log('author saved');
      saveEntry(savedAuthor._id, textType);
    });
  } else {
    console.log('using an existing author');
    saveEntry(oldauthor._id, textType);
  }
});

const Entry = model('Entry', entrySchema);

export default Entry;
