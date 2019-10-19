/* eslint-disable no-underscore-dangle */
/* eslint no-restricted-syntax: 0 */
/* eslint no-await-in-loop: 0 */

import Author from './models/author';
import Publication from './models/entry'

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

const extractAuthorsFromPublications = async publications => {
  for (const keyval of Object.entries(publications)) {
    const author =
      (await Author.findOne({ name: keyval[0] }).exec()) ||
      new Author({
        name: keyval[0],
        publications: [],
      });
    keyval[1].forEach(pub => author.publications.push(pub));
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
