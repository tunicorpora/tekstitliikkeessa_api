import Excel from 'exceljs';
import tempfile from 'tempfile';

import { getPublicationAndAuthor } from '../utilities';
import Author from '../models/author';
import Entry from '../models/entry';

async function parseFilters(request) {
  let filters = {};
  let authorFilter;
  console.log(request.query.filters);
  if (request.query.filters) {
    const filterparams = JSON.parse(request.query.filters)
      .map(filter => {
        switch (filter.operator) {
          case '=':
            return { [`publications.${filter.fieldname}`]: filter.value };
          case '>':
            return {
              [`publications.${filter.fieldname}`]: { $gt: filter.value * 1 },
            };
          default:
            return {
              [`publications.${filter.fieldname}`]: new RegExp(
                filter.value,
                'i'
              ),
            };
        }
      })
      .filter(f => f !== undefined);
    if (filterparams.length) {
      filters = {
        $and: filterparams,
      };
    }
  }
  if (authorFilter) {
    // if filtering by author, let's manually query for the ids first
    const authorCond =
      authorFilter.operator === '='
        ? { name: authorFilter.val }
        : { name: new RegExp(authorFilter.val, 'i') };
    filters.author = {
      $in: await Author.find(authorCond).distinct('_id'),
    };
  }

  return filters;
}

const getEntries = async (request, response) => {
  const filters = await parseFilters(request);
  console.log(filters);
  Author.aggregate([
    { $unwind: '$publications' },
    { $match: filters },
    { $group: { _id: null, content: { $addToSet: '$publications' } } },
  ]).then((result, err) => {
    if (!err) {
      if (result[0]) {
        response.status(200).send(result[0].content);
      } else {
        response.status(200).send([]);
      }
    } else {
      console.log(err);
    }
  });
  // Entry.paginate(filters, {
  //   populate: {
  //     path: 'author',
  //     select: 'name',
  //   },
  //   page: request.query.page * 1,
  //   limit: 50,
  // }).then(result => {
  //   const filteredEntries = {
  //     data: result.docs.map(doc => {
  //       if (doc.author == null) {
  //         return { ...doc, author: { name: '', _id: '' } };
  //       }
  //       return doc;
  //     }),
  //     meta: {
  //       total: result.total,
  //       page: result.page,
  //       pages: result.pages,
  //       showing: result.docs.length,
  //     },
  //   };
  //    response.status(200).send(filteredEntries);
  //  });
};

const getEntriesAsExcel = async (request, response) => {
  const filters = await parseFilters(request);
  Entry.find(filters)
    .populate({
      path: 'author',
      select: 'name',
    })
    .lean()
    .select('-_id')
    .exec((err, entries) => {
      if (err) {
        response.status(400).send({ error: 'unable to get entries' });
      } else {
        try {
          const workbook = new Excel.Workbook();
          const worksheet = workbook.addWorksheet('tietokannasta');
          let headersSet = false;
          // eslint-disable-next-line no-restricted-syntax
          for (const thisentry of entries) {
            const row = { Toimija: thisentry.author.name };
            const keys = Object.keys(thisentry).filter(
              key => key.indexOf('_') !== 0 && key !== 'author' && key
            );
            // eslint-disable-next-line no-restricted-syntax
            for (const key of keys) {
              row[key] = thisentry[key];
            }
            if (!headersSet) {
              worksheet.addRow(Object.keys(row));
              headersSet = true;
            }
            worksheet.addRow(Object.keys(row).map(key => row[key]));
          }
          const tempFilePath = tempfile('.xlsx');
          workbook.xlsx.writeFile(tempFilePath).then(() => {
            response.download(tempFilePath, 'tietokannasta.xslx', fileErr => {
              if (fileErr) {
                console.log(fileErr);
              }
            });
          });
        } catch (error) {
          console.log(error);
          response
            .status(400)
            .send({ error: 'unable to produce the excel file' });
        }
      }
    });
};

const editEntry = async (request, response) => {
  const { id } = request.params;
  const pub = await getPublicationAndAuthor(id);
  pub.publication.set({
    ...pub.publication,
    ...request.body,
  });
  pub.author.save(err => {
    if (err) {
      console.log(err.message);
    } else {
      response.status(200).send({ status: 'ok' });
      console.log('edits saved.');
    }
  });
};

export { getEntries, getEntriesAsExcel, editEntry };
