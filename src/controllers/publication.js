/* eslint-disable no-underscore-dangle */
/* eslint no-restricted-syntax: 0 */
/* eslint no-await-in-loop: 0 */
import Mongoose from 'mongoose';
import formidable from 'formidable';
import parseXlsx from 'excel';
import Author from '../models/author';
import Publication from '../models/entry';
import { filterByReceptionType } from '../filters';
import { getPublicationAndAuthor, parseFilters } from '../utilities';
import {
  extractAuthorsFromPublications,
  extractPublications,
  getReceptionData,
} from '../excelUtilities';
import { saveLinksRaw } from './reception';

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

/**
 * deletePublicationRaw delete a single publication
 *
 * @param authorAndPub object containing author and publication
 * @returns {undefined}
 */
const deletePublicationRaw = async authorAndPub => {
  if (authorAndPub.author) {
    await authorAndPub.publication.remove();
    try {
      await authorAndPub.author.save();
    } catch (e) {
      console.log('error deleting');
      return false;
    }
  }
  return true;
};

const deletePublication = async (request, response) => {
  const authorAndPub = await getPublicationAndAuthor(request.params.id);
  const deleteSuccess = await deletePublicationRaw(authorAndPub);
  if (!deleteSuccess) {
    console.log('error deleting');
    response.status(400).send({ status: 'error deleting' });
  } else {
    response.status(200).send({ status: 'ok' });
  }
};

const batchDeletePublication = async (request, response) => {
  const { ids } = request.query;
  // TODO: when removing receptions, remove the link, too?!?!?
  const deleteSuccesses = await Promise.all(
    ids.split(',').map(async id => {
      try {
        const authorAndPub = await getPublicationAndAuthor(id);
        return deletePublicationRaw(authorAndPub);
      } catch (e) {
        console.info('problem with ids');
      }
      return false;
    })
  );
  console.log(deleteSuccesses);
  response.status(200).send({ status: 'ok' });
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

const getPublicationIdsAndTitles = publications => {
  return [
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
};

const uploadSingle = async (request, response) => {
  const { publication: publicationRaw, type } = request.body;
  const { author, ...publication } = publicationRaw;
  publication.receptions = {
    translations: [],
    reviews: [],
    articles: [],
    adaptations: [],
    other: [],
  };
  const publicationData = { [author]: [new Publication({ ...publication })] };
  await extractAuthorsFromPublications(publicationData);
  if (type === 'reception') {
    const receptionData = getReceptionData(publicationData);
    for (const [source, receptions] of Object.entries(receptionData)) {
      console.log(source);
      console.log(receptions);
      await saveLinksRaw(source, receptions, true);
    }
  }
  const idsAndTitles = getPublicationIdsAndTitles(publicationData);
  response.status(200).send({
    uploadStatus: {
      saved: idsAndTitles,
    },
  });
  response.status(201);
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
          const idsAndTitles = getPublicationIdsAndTitles(publications);
          response.status(200).send({
            uploadStatus: {
              saved: idsAndTitles,
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
  uploadSingle,
  batchDeletePublication,
};
