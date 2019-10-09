import { Schema, model } from 'mongoose';

const publicationSchema = new Schema({
  title: { type: String },
  'english title': { type: String },
  'document type': { type: String },
  Genre: { type: String },
  Language: { type: String },
  Publisher: { type: String },
  'Publication name': { type: String },
  Source: { type: String },
  'publish location': { type: String },
  Date: { type: String },
  Reference: { type: String },
  Sources: { type: String },
  Note: { type: String },
  'Reception type': { type: String },
  receptions: { type: Object },
  receptionOf: { type: Object },
});

const authorSchema = new Schema({
  name: { type: String, default: '?', unique: true },
  publications: [publicationSchema],
});
const Author = model('Author', authorSchema);
export default Author;
