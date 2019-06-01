import Mongoose from 'mongoose';
import Author from '../models/author';

const getPublications = async (request, response) => {
  const title = new RegExp(request.query.search);
  Author.aggregate([
    { $match: { 'publications.title': { $regex: title } } },
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
        response.status(200).send(mapped);
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
  console.log('waiting...');
  const authorAndPub = await getPublicationAndAuthor(source);
  authorAndPub.publication.set({
    ...authorAndPub.publication,
    ...{ receptions },
  });
  try {
    await authorAndPub.author.save();
    console.log('Author saved!');
  } catch (err) {
    console.log('Error saving author');
  }
  Object.keys(receptions).forEach(async key => {
    receptions[key].forEach(async thisId => {
      const authorAndPub2 = await getPublicationAndAuthor(thisId);
      // const rOf = authorAndPub2.publication.receptionsOf[key] || [];
      // const rOfUpdated = [...new Set([...rOf, source])];
      console.log(authorAndPub2.publication);
      // console.log(rOfUpdated);
      // authorAndPub.publication.set({
      // 	...authorAndPub.publication,
      // 	...{ receptionsOf: authorAndPub },
      // });
    });
  });
  // console.log(request.body);
};

export { getPublications, getPublicationTitles, saveLinks };
