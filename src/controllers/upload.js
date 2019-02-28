import formidable from 'formidable';
import parseXlsx from 'excel';
import Entry from '../models/entry';
import Author from '../models/author';

const collectAuthors = async authorCol => {
  const collectedAuthors = [];
  // Grab the column names but expect the first to contain the author
  // eslint-disable-next-line no-restricted-syntax
  for (const row of authorCol) {
    if (collectedAuthors.indexOf(row[0]) === -1) {
      collectedAuthors.push(row[0]);
    }
  }

  // Scan the list of authors and insert new ones if found
  await Promise.all(
    collectedAuthors.map(async authorName => {
      const oldauthor = await Author.findOne({ name: authorName });
      if (!oldauthor) {
        const author = await new Author({ name: authorName });
        await author.save(authorErr => {
          if (authorErr) {
            console.log('error saving a new author');
          }
        });
      }
    })
  );
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

const addColumns = async colnames => {
  await Entry.findOne({})
    .select('-_id')
    .lean()
    .exec(async (err, res) => {
      if (res) {
        const existingCols = Object.keys(res).filter(
          key => key.indexOf('_') !== 0 && key && key !== 'author'
        );
        const newcols = colnames.filter(
          col => existingCols.indexOf(col) === -1
        );
        if (newcols.length) {
          await Promise.all(
            newcols.map(async colName => {
              await Entry.update(
                {},
                { $set: { [colName]: '' } },
                (updateErr, updateRes) => {
                  if (!updateErr) {
                    console.log(updateRes);
                  } else {
                    console.log(updateErr);
                  }
                }
              );
            })
          );
        }
      }
    });
};

export default (request, response) => {
  const form = new formidable.IncomingForm();
  form.parse(request);
  form.on('file', async (name, file) => {
    try {
      parseXlsx(file.path).then(async data => {
        const colnames = data[0].slice(1).filter(col => col);
        await collectAuthors(data.slice(1));
        await addColumns(colnames);
        // eslint-disable-next-line no-restricted-syntax
        for (const row of data.slice(1)) {
          const colsRaw = colnames.map((colname, idx) =>
            parseColumns(colname, row[idx + 1])
          );
          const cols = Object.assign({}, ...colsRaw);
          // eslint-disable-next-line no-await-in-loop
          await Entry.addNew({
            authorName: row[0],
            ...cols,
          });
        }
        response.status(200).send({ saved: data.length - 1 });
      });
    } catch (error) {
      console.log(error);
      response.status(400).send({ error: 'Could not process the file' });
    }
    // TODO: add error handling
  });
};
