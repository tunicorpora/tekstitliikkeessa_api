/* eslint no-restricted-syntax: 0 */
/* eslint no-await-in-loop: 0 */
/* eslint no-underscore-dangle: 0 */
import { getPublicationAndAuthor } from '../utilities';

const filterByReceptionType = async (publication, receptionTypes) => {
  if (
    receptionTypes.includes('original') &&
    (publication.receptionOf.length === 0 ||
      !Array.isArray(publication.receptionOf))
  ) {
    // If this is NOT a reception of another publication,
    // consider that it passes the ORIGINAL filter.
    return true;
  }
  if (
    Array.isArray(publication.receptionOf) &&
    publication.receptionOf.length > 0
  ) {
    for (const sourceId of publication.receptionOf) {
      const authorAndPub = await getPublicationAndAuthor(sourceId);
      for (const receptionType of receptionTypes) {
        if (
          authorAndPub.publication.receptions[receptionType] &&
          authorAndPub.publication.receptions[receptionType]
            .map(id => id + '')
            .includes(publication._id + '')
        ) {
          return true;
        }
      }
    }
  }
  return false;
};

export { filterByReceptionType };
