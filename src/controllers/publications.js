/* eslint no-restricted-syntax: 0 */
/* eslint no-await-in-loop: 0 */
import Mongoose from 'mongoose';
import Author from '../models/author';

const getPublications = async (request, response) => {
  const title = new RegExp(request.query.search);
  const { id } = request.params;
  const condition = id
    ? { $match: { 'publications._id': Mongoose.Types.ObjectId(id) } }
    : { $match: { 'publications.title': { $regex: title } } };
  Author.aggregate([
    condition,
    { $unwind: '$publications' },
    {
      $group: {
        _id: '$name',
        publications: { $addToSet: '$publications' },
      },
    },
  ]).then((result, err) => {
    if (!err) {
      if (result) {
        const mapped = [];
        result.forEach(res =>
          res.publications.forEach(pub => {
            if (title.test(pub.title)) {
              mapped.push({ author: res._id, ...pub });
            }
          })
        );
        response
          .status(200)
          .send(id ? mapped.find(pub => pub._id == id) : mapped);
      } else {
        response.status(200).send([]);
      }
    } else {
      console.log(err);
    }
  });
};

const getPublicationTitles = async (request, response) => {
  const title = new RegExp(request.query.search);
  Author.aggregate([
    { $match: { 'publications.title': { $regex: title } } },
    { $unwind: '$publications' },
    { $group: { _id: null, content: { $addToSet: '$publications' } } },
  ]).then((result, err) => {
    if (!err) {
      if (result[0]) {
        const mapped = result[0].content.map(item => item.title);
        response.status(200).send(mapped);
      } else {
        response.status(200).send([]);
      }
    } else {
      console.log(err);
    }
  });
};

const getPublicationAndAuthor = async thisId => {
  try {
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

const saveLinksRaw = async (source, receptions) => {
  const authorAndPub = await getPublicationAndAuthor(source);
  authorAndPub.publication.set({
    ...authorAndPub.publication,
    ...{ receptions },
  });
  try {
    await authorAndPub.author.save();
  } catch (err) {
    console.log('Error saving author');
  }
  for (const [receptionType, receptionIds] of Object.entries(receptions)) {
    for (const thisId of receptionIds) {
      const authorAndPub2 = await getPublicationAndAuthor(thisId);
      const rOf = authorAndPub2.publication.receptionOf[receptionType] || [];
      const rOfUpdated = [...new Set([...rOf, source])];
      authorAndPub2.publication.set({
        ...authorAndPub2.publication,
        ...{ receptionOf: rOfUpdated },
      });
      try {
        await authorAndPub2.author.save();
        console.log('receptionsOf saved.');
      } catch (err) {
        console.log('Cant save receptionsOF.');
        console.log(`sourceid: ${source}`);
        console.log(err.message);
      }
    }
  }
};

const saveLinks = async (request, response) => {
  const { body } = request;
  const { source, receptions } = body;
  saveLinksRaw(source, receptions);
};

const getReceptions = async (request, response) => {
  const { id } = request.params;
  const pub = await getPublicationAndAuthor(id);
  let promises = [];
  Object.keys(pub.publication.receptions).forEach(key => {
    promises = [
      ...promises,
      ...pub.publication.receptions[key].map(trId =>
        getPublicationAndAuthor(trId)
      ),
    ];
  });
  Promise.all(promises).then(values => {
    response.status(201).send(
      values.map(both => ({
        ...both.publication._doc,
        ...{ author: both.author.name },
      }))
    );
  });
};

export {
  getPublications,
  getPublicationTitles,
  saveLinks,
  saveLinksRaw,
  getReceptions,
  getPublicationAndAuthor,
};
