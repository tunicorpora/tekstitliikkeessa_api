import Excel from 'exceljs';
import tempfile from 'tempfile';
import Entry from '../models/entry';
import Author from '../models/author';

async function parseFilters(request) {
  let filters = {};
  let authorFilter;
  if (request.query.filters) {
    const filterparams = JSON.parse(request.query.filters)
      .map(filter => {
        if (filter.fieldname === 'Toimija') {
          authorFilter = { val: filter.value, operator: filter.operator };
          return undefined;
        }
        // TODO: conditio type: regex, numerical etc
        switch (filter.operator) {
          case '=':
            return { [filter.fieldname]: filter.value };
          case '>':
            return { [filter.fieldname]: { $gt: filter.value * 1 } };
          default:
            return { [filter.fieldname]: new RegExp(filter.value, 'i') };
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
  Entry.paginate(filters, {
    populate: {
      path: 'author',
      select: 'name',
    },
    page: request.query.page * 1,
    limit: 50,
  }).then(result => {
    const filteredEntries = {
      data: result.docs.map(doc => {
        if (doc.author == null) {
          return { ...doc, author: { name: '', _id: '' } };
        }
        return doc;
      }),
      meta: {
        total: result.total,
        page: result.page,
        pages: result.pages,
        showing: result.docs.length,
      },
    };
    response.status(200).send(filteredEntries);
  });
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
              console.log(Object.keys(row));
              worksheet.addRow(Object.keys(row));
              headersSet = true;
            }
            worksheet.addRow(Object.keys(row).map(key => row[key]));
          }
          const tempFilePath = tempfile('.xlsx');
          workbook.xlsx.writeFile(tempFilePath).then(() => {
            response.sendFile(tempFilePath, fileErr => {
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

export { getEntries, getEntriesAsExcel };
