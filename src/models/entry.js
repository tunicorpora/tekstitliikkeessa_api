import { Schema, model } from 'mongoose';
import Author from './author';

const { ObjectId } = Schema.Types;

const entrySchema = new Schema({
  author: { type: ObjectId, ref: 'Author' },
  text_type: { type: String, default: '?' },
});

const Entry = model('Entry', entrySchema);

export default Entry;
