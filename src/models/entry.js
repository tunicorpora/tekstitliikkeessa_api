import { Schema, model } from 'mongoose';

const EntrySchema = new Schema({
  kirjailija: { type: String, default: '?' },
  tekstityyppi: { type: String, default: '?' },
});

const Entry = model('Entry', EntrySchema);

export default Entry;
