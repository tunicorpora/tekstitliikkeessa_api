import Mongoose from 'mongoose';
import formidable from 'formidable';
import parseXlsx from 'excel';
import Author from '../models/author';
import { filterByReceptionType } from '../filters';
import { getPublicationAndAuthor, parseFilters } from '../utilities';
import {
  extractAuthorsFromPublications,
  extractPublications,
} from '../excelUtilities';

const searchPublications = async (req, resp) => {
  const filters = await parseFilters(req);
  try {
    const result = await Author.aggregate([
      { $unwind: '$publications' },
      { $addFields: { 'publications.author': '$name' } },
      { $match: filters },
      {
        $group: {
          _id: null,
          content: { $addToSet: '$publications' },
        },
      },
    ]);
    const resultCore = result[0].content;
    if (req.query.textTypes) {
      // If text types defined, filter according to them
      const promises = resultCore.map(pub =>
        filterByReceptionType(pub, req.query.textTypes.split(','))
      );
      const receptionFilter = await Promise.all(promises).catch(err =>
        console.log(err)
      );
      resp
        .status(200)
        .send(resultCore.filter((_, idx) => receptionFilter[idx]));
    } else {
      resp.status(200).send(resultCore);
    }
  } catch (err) {
    console.log('error in query or no results');
    console.log(err);
    resp.status(200).send([]);
  }
};

const deletePublication = async (request, response) => {
  const authorAndPub = await getPublicationAndAuthor(request.params.id);
  if (authorAndPub.author) {
    await authorAndPub.publication.remove();
    authorAndPub.author.save(err => {
      if (err) {
        console.log('error deleting');
        response.status(400).send({ status: 'error deleting' });
        // console.log(err.message);
      } else {
        response.status(200).send({ status: 'ok' });
        console.log('deleted');
      }
    });
  }
  // TODO: add error handling
};

const editPublication = async (request, response) => {
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

const upload = (request, response) => {
  const form = new formidable.IncomingForm();
  form.parse(request);
  form.on('file', async (_, file) => {
    try {
      parseXlsx(file.path)
        .then(async data => {
          const publications = extractPublications(data, 'author');
          await extractAuthorsFromPublications(publications);
          const ids = [
            ...Object.values(publications).reduce(
              (prev, cur) => [
                ...prev,
                ...cur.map(p => ({
                  title: p.title,
                  id: p._id,
                })),
              ],
              []
            ),
          ];
          response.status(200).send({
            uploadStatus: {
              saved: ids,
            },
          });
        })
        .catch(err => {
          console.log(err);
          response.status(400).send({ error: 'Could not read the file' });
        });
    } catch (error) {
      response.status(400).send({ error: 'Could not process the file' });
      console.log(`Error processing file.: ${error.message}`);
    }
  });
};

const getPublication = async (request, response) => {
  const title = new RegExp(request.query.search, 'i');
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

export {
  searchPublications,
  deletePublication,
  editPublication,
  upload,
  getPublication,
};
