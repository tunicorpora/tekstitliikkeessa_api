import { Schema, model } from 'mongoose';
import Author from './author';

const { ObjectId } = Schema.Types;

const entrySchema = new Schema({
  author: { type: ObjectId, ref: 'Author' },
  text_type: { type: String, default: '?' },
});

entrySchema.static('addNew', body => {
  // Get the parameters from the request body
  const { authorName, textType } = body;
  // Look for the author in the authors db
  // if not found, create a new author based on the name
  const author = new Author(authorName);
  console.log(author);
  console.log(textType);
  // finally, save the entry
});

const Entry = model('Entry', entrySchema);

export default Entry;
