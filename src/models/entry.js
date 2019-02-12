import { Schema, model } from 'mongoose';
import Author from './author';

const { ObjectId } = Schema.Types;

const entrySchema = new Schema({
  author: { type: ObjectId, ref: 'Author' },
  text_type: { type: String, default: '?' },
});

entrySchema.static('addNew', async function addNew(request, response) {
  // Get the parameters from the request body
  const { authorName, textType } = request.body;
  let authorId;
  // Look for the author in the authors db
  await Author.findOne({ name: authorName }, (err, existingAuthor) => {
    if (err) {
      console.log('error in fetching an existing author');
    } else if (existingAuthor) {
      authorId = existingAuthor._id;
    } else {
      // if not found, create a new author based on the name
      const author = new Author({ name: authorName });
      author.save((authorErr, savedAuthor) => {
        if (authorErr) {
          response.status(400).send({ error: 'Could not save the author' });
        } else {
          authorId = savedAuthor._id;
        }
      });
    }
  });
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

const Entry = model('Entry', entrySchema);

export default Entry;
