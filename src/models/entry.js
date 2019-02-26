import { Schema, model } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate';
import Author from './author';

/*

ADDING new fields:

db.entries.update( {}, { $set: {"uusi kenttä": ""} }, false, true)

*/

const { ObjectId } = Schema.Types;

const saveEntry = (authorId, cols) => {
  // eslint-disable-next-line no-underscore-dangle
  const entry = new Entry({ author: authorId, ...cols });
  entry.save(entryErr => {
    if (entryErr) {
      console.log('Error saving a new bibliographical entry');
    } else {
      //console.log('Entry succesfully saved');
    }
  });
};

const entrySchema = new Schema(
  {
    author: { type: ObjectId, ref: 'Author' },
  },
  { strict: false }
);

entrySchema.static('addNew', async function addNew(body) {
  // Get the parameters from the request body
  const { authorName, ...cols } = body;
  // Look for the author in the authors db
  const oldauthor = await Author.findOne({ name: authorName });
  if (!oldauthor) {
    // if not found, create a new author based on the name
    console.log('creating a new author');
    const author = new Author({ name: authorName });
    author.save((authorErr, savedAuthor) => {
      if (authorErr) {
        // console.log('error saving a new author');
      } else {
        // console.log('author saved');
        saveEntry(savedAuthor._id, cols);
      }
    });
  } else {
    // console.log('using an existing author');
    saveEntry(oldauthor._id, cols);
  }
});

entrySchema.plugin(mongoosePaginate);

const Entry = model('Entry', entrySchema);

export default Entry;
