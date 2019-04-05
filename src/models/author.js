import { Schema, model } from 'mongoose';

const authorSchema = new Schema({
  name: { type: String, default: '?', unique: true },
  publications: [],
});

const Author = model('Author', authorSchema);

export default Author;
