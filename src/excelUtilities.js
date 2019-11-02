/* eslint-disable no-underscore-dangle */
/* eslint no-restricted-syntax: 0 */
/* eslint no-await-in-loop: 0 */

import moment from 'moment';
import Author from './models/author';
import Publication from './models/entry';

const parseColumns = (colname, val) => {
  const newobj = {};
  newobj[colname] = val.trim();
  if (colname === 'date') {
    // Validate the date
    const dateAsMoment = moment(val, 'DD.MM.YYYY');
    newobj[colname] = dateAsMoment.isValid() ? dateAsMoment : '';
  }
  return newobj;
};

const extractPublications = (data, groupingKey) => {
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

const extractAuthorsFromPublications = async publicationData => {
  for (const [name, publications] of Object.entries(publicationData)) {
    const author =
      (await Author.findOne({ name }).exec()) ||
      new Author({
        name,
        publications: [],
      });
    publications.forEach(pub => author.publications.push(pub));
    try {
      const savedAuthor = await author.save();
      console.log(`author saved (${savedAuthor._id})`);
    } catch (e) {
      console.log(`Error saving author ${keyval[0]}: ${e}`);
    }
  }
};

const getReceptionData = publications =>
  Object.values(publications)
    .reduce((prev, cur) => [...prev, ...Object.values(cur)], [])
    .reduce((allPubs, curPub) => {
      const rType = `${curPub.reception_type}s`;
      const { target } = curPub;
      const receptions = allPubs[target] || {
        translations: [],
        reviews: [],
        articles: [],
        adaptations: [],
        other: [],
      };
      return {
        ...allPubs,
        [target]: {
          ...receptions,
          [rType]: [...receptions[rType], curPub._id],
        },
      };
    }, {});

export {
  extractAuthorsFromPublications,
  getReceptionData,
  extractPublications,
  parseColumns,
};
