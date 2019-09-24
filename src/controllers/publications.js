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
    return {
      publication: author.publications.id(Mongoose.Types.ObjectId(thisId)),
      author,
    };
  } catch (err) {
    console.log('error getting publication');
  }
};

const saveLinks = async (request, response) => {
  const { body } = request;
  const { source, receptions } = body;
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
  Object.keys(receptions).forEach(async key => {
    receptions[key].forEach(async thisId => {
      const authorAndPub2 = await getPublicationAndAuthor(thisId);
      const rOf = authorAndPub2.publication.receptionOf[key] || [];
      const rOfUpdated = [...new Set([...rOf, source])];
      authorAndPub2.publication.set({
        ...authorAndPub2.publication,
        ...{ receptionOf: rOfUpdated },
      });
      authorAndPub2.author.save((err, res) => {
        if (err) {
          console.log(err.message);
        } else {
          console.log('receptionsOf saved.');
        }
      });
    });
  });
  // console.log(request.body);
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
  getReceptions,
  getPublicationAndAuthor,
};
