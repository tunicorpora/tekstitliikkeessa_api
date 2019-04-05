import formidable from 'formidable';
import parseXlsx from 'excel';
import { parallel } from 'async';
import Entry from '../models/entry';
import Author from '../models/author';

const collectAuthors = async authorCol => {
  const authorNames = [];
  const authors = {};
  // Grab the column names but expect the first to contain the author
  // eslint-disable-next-line no-restricted-syntax
  for (const row of authorCol) {
    if (authorNames.indexOf(row[0]) === -1) {
      authorNames.push(row[0]);
    }
  }

  // Scan the list of authors and insert new ones if found
  await Promise.all(
    authorNames.map(async authorName => {
      const oldauthor = await Author.findOne({ name: authorName });
      if (!oldauthor) {
        const author = await new Author({ name: authorName });
        authors[authorName] = author;
        await author.save(authorErr => {
          if (authorErr) {
            console.log('error saving a new author');
          }
        });
      } else {
        authors[authorName] = oldauthor;
      }
    })
  );
  return authors;
};

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

export default (request, response) => {
  const form = new formidable.IncomingForm();
  form.parse(request);
  form.on('file', async (name, file) => {
    try {
      parseXlsx(file.path).then(async data => {
        const colnames = data[0].slice(1).filter(col => col);
        const authors = await collectAuthors(data.slice(1));
        // eslint-disable-next-line no-restricted-syntax
        for (const row of data.slice(1)) {
          const colsRaw = colnames.map((colname, idx) =>
            parseColumns(colname, row[idx + 1])
          );
          const cols = Object.assign({}, ...colsRaw);
          authors[row[0]].publications.push(cols);
          // console.log(cols);
        }
        const docs = Object.keys(authors).map(author => authors[author]);
        const functions = [];

        for (let i = 0; i < docs.length; i++) {
          functions.push(
            (function(doc) {
              return function(callback) {
                doc.save(callback);
              };
            })(docs[i])
          );
        }
        parallel(functions, function(err, results) {
          console.log(err);
          console.log(results);
        });
        // TODO: HERE: add entry to db
        response.status(200).send({ saved: data.length - 1 });
      });
    } catch (error) {
      console.log(error);
      response.status(400).send({ error: 'Could not process the file' });
    }
    // TODO: add error handling
  });
};
