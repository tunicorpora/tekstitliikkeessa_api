import { parallel } from 'async';
import Mongoose from 'mongoose';
import formidable from 'formidable';
import parseXlsx from 'excel';

import Author from '../models/author';
import Entry from '../models/entry';

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
  try {
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
  } catch (err) {
    console.log('ERROR fetching authors');
  }
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
        const publications = {};
        data.slice(1).forEach(row => {
          const authorName = row[0];
          const colsRaw = colnames.map((colname, idx) =>
            parseColumns(colname, row[idx + 1])
          );
          const publication = Object.assign({}, ...colsRaw);
          publication.id = new Mongoose.Types.ObjectId();
          publication.receptions = [];
          publication.receptionsOf = [];
          if (publications[authorName] === undefined) {
            publications[authorName] = [];
          }
          publications[authorName].push(publication);
        });
        Object.keys(publications).forEach(async name => {
          const author = await Author.findOne({ name }).exec();
          if (author) {
            author.publications = [author.publications, ...publications[name]];
            author.save();
          } else {
            const newAuthor = new Author({
              name,
              publications: publications[name],
            });
            newAuthor.save();
          }
        });
        response.status(200).send('done.');
      });
    } catch (error) {
      response.status(400).send({ error: 'Could not process the file' });
      console.log('Error processing file.');
      console.log(error);
    }
    // TODO: add error handling
  });
};
