import Mongoose from 'mongoose';
import formidable from 'formidable';
import parseXlsx from 'excel';

import Author from '../models/author';
import saveLinksRaw from './publications';

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
  return publications;
};

const extractAuthorsFromPublications = async publications => {
  Object.keys(publications)
    .filter(key => key)
    .forEach(async key => {
      const author = await Author.findOne({ name: key }).exec();
      if (author) {
        publications[key].forEach(pub => author.publications.push(pub));
        author.save(err => handleAuthorError(err, key));
      } else {
        const newAuthor = new Author({
          name: key,
          publications: publications[key],
        });
        newAuthor.save(err => handleAuthorError(err, key));
      }
    });
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

const getReceptionData = publications => {
  const red = Object.values(publications)
    .reduce((prev, cur) => [...prev, ...Object.values(cur)], [])
    .reduce((allPubs, curPub) => {
      const rType = `${curPub.reception_type}s`;
      const { target } = curPub;
      const receptions = allPubs[target] || {
        translations: [],
        adaptations: [],
        other: [],
      };
      return {
        ...allPubs,
        [target]: { ...receptions, [rType]: [...receptions[rType], curPub.id] },
      };
    }, {});
  console.log(red);
};

const uploadReceptions = (request, response) => {
  const form = new formidable.IncomingForm();
  form.parse(request);
  form.on('file', async (_, file) => {
    try {
      const data = await parseXlsx(file.path).catch(err => console.log(err));
      const publications = getPublications(data, 'author');
      const receptionData = getReceptionData(publications);
      //await extractAuthorsFromPublications(publications);
      //
      //
    } catch (error) {
      console.log(error);
      response.status(400).send({ error: 'Unable to parse xlsx' });
    }
  });
};

export { upload, uploadReceptions };
