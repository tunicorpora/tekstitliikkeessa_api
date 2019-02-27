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
            console.log({ $gt: filter.value * 1 });
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
    filters = {
      $in: await Author.find(authorCond).distinct('_id'),
    };
  }
  return filters;
}

const getEntries = async (request, response) => {
  const filters = await parseFilters(request);
  console.log(filters);
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

export { getEntries };
