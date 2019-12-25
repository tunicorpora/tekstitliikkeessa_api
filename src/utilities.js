import Mongoose from 'mongoose';
import Author from './models/author';

async function parseFilters(request) {
  let filters = {};
  let authorFilter;
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

const getPublicationAndAuthor = async thisId => {
  try {
    console.info(thisId)
    const author = await Author.findOne({
      'publications._id': Mongoose.Types.ObjectId(thisId),
    }).exec();
    if (!author) {
      console.log(`No author found, aborting`);
      return null;
    }
    return {
      publication: author.publications.id(Mongoose.Types.ObjectId(thisId)),
      author,
    };
  } catch (err) {
    console.log(`unable to retrieve the author of the publication ${thisId}`);
  }
  return null;
};

export { getPublicationAndAuthor, parseFilters };
