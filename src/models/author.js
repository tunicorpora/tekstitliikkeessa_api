import { Schema, model } from 'mongoose';

const publicationSchema = new Schema({
  title: { type: String },
  'english title': { type: String },
  'other authors': { type: String },
  'document type': { type: String },
  genre: { type: String },
  language: { type: String },
  publisher: { type: String },
  'publication name': { type: String },
  source: { type: String },
  'publish location': { type: String },
  year: { type: Number },
  date: { type: Date },
  reference: { type: String },
  note: { type: String },
  reception_type: { type: String }, // Just for importing receptions from excel
  target: { type: String }, // Just for importing receptions from excel
  receptions: { type: Object },
  receptionOf: { type: Array },
});

const authorSchema = new Schema({
  name: { type: String, default: '?', unique: true },
  pseudonyms: { type: String },
  'other names': { type: String },
  'year of birth': { type: Number },
  'year of death': { type: Number },
  country: { type: String },
  language: { type: String },
  'biographical details': { type: String },
  'professional details': { type: String },
  publications: [publicationSchema],
});

const Author = model('Author', authorSchema);
const Publication = model('Publication', publicationSchema);
export { Publication };
export default Author;
