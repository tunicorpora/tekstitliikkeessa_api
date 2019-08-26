import Mongoose from 'mongoose';
import formidable from 'formidable';
import parseXlsx from 'excel';

import Author from '../models/author';

const parseColumns = (colname, val) => {
  const newobj = {};
  newobj[colname] = val.trim();
  /*
            if (colname === 'Julkaisupv') {
              // Treat certain  cols as  dates
              const val = row[idx + 1];
              let thisdate;
              if (val * 1 < 2026 && val * 1 > 1100) {
                thisdate = new Date(val);
              } else if (val * 1 > 2026) {
                thisdate = new Date((val - (25567 + 1)) * 86400 * 1000);
              } else {
                thisdate = null;
              }
              console.log(thisdate);
              newobj[colname] = thisdate;
            }
          */
  return newobj;
};

const handleAuthorError = (err, key) => {
  if (err) {
    console.log(`Error saving ${key}: ${err.message}`);
  } else {
    console.log(`saved ${key}.`);
  }
};

export default (request, response) => {
  const form = new formidable.IncomingForm();
  form.parse(request);
  form.on('file', async (name, file) => {
    try {
      parseXlsx(file.path).then(async data => {
        const colnames = data[0].slice(1).filter(col => col);
        const publications = {};
        data.slice(1).forEach(row => {
          const authorName = row[0];
          const colsRaw = colnames.map((colname, idx) =>
            parseColumns(colname, row[idx + 1])
          );
          const publication = Object.assign({}, ...colsRaw);
          publication.id = new Mongoose.Types.ObjectId();
          publication.receptions = {
            translations: [],
            adaptations: [],
            other: [],
          };
          publication.receptionOf = {
            translations: [],
            adaptations: [],
            other: [],
          };
          if (publications[authorName] === undefined) {
            publications[authorName] = [];
          }
          publications[authorName].push(publication);
        });
        Object.keys(publications).forEach(async key => {
          const author = await Author.findOne({ name: key }).exec();
          if (author) {
            publications[key].forEach(pub => author.publications.push(pub));
            // author.publications = [author.publications, ...publications[key]];
            author.save(err => handleAuthorError(err, key));
          } else {
            const newAuthor = new Author({
              name: key,
              publications: publications[key],
            });
            newAuthor.save(err => handleAuthorError(err, key));
          }
        });
        console.log(publications.length);
        response.status(200).send({ uploadStatus: { saved: data.length } });
      });
    } catch (error) {
      response.status(400).send({ error: 'Could not process the file' });
      console.log(`Error processing file.: ${error.message}`);
    }
    // TODO: add error handling
  });
};
