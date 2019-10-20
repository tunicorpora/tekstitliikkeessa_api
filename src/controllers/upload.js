/* eslint no-restricted-syntax: 0 */
/* eslint no-await-in-loop: 0 */
/* eslint no-underscore-dangle: 0 */
import formidable from 'formidable';
import parseXlsx from 'excel';

import Author, { Publication } from '../models/author';
import { saveLinksRaw } from './publications';

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

const getPublications = (data, groupingKey) => {
  const colnames = data[0].filter(col => col);
  const authornameIdx = colnames.findIndex(
    colname => colname.toLowerCase() === groupingKey
  );
  const publications = {};
  data
    .slice(1)
    .filter(row => row.join(''))
    .forEach(row => {
      const authorName = row[authornameIdx];
      const colsRaw = colnames
        .map((colname, idx) => parseColumns(colname, row[idx]))
        .filter(rawCol => !Object.keys(rawCol).includes(groupingKey));
      const publication = Object.assign({}, ...colsRaw);
      publication.receptions = {
        translations: [],
        reviews: [],
        articles: [],
        adaptations: [],
        other: [],
      };
      publication.receptionOf = [];
      if (publications[authorName] === undefined) {
        publications[authorName] = [];
      }
      publications[authorName].push(new Publication({ ...publication }));
    });
  return publications;
};

const upload = (request, response) => {
  const form = new formidable.IncomingForm();
  form.parse(request);
  form.on('file', async (_, file) => {
    try {
      parseXlsx(file.path).then(async data => {
        const publications = getPublications(data, 'author');
        await extractAuthorsFromPublications(publications);
        response.status(200).send({ uploadStatus: { saved: data.length } });
      });
    } catch (error) {
      response.status(400).send({ error: 'Could not process the file' });
      console.log(`Error processing file.: ${error.message}`);
    }
  });
};

export { upload, uploadReceptions };
