/* eslint-disable no-underscore-dangle */
/* eslint no-restricted-syntax: 0 */
/* eslint no-await-in-loop: 0 */

import formidable from 'formidable';
import parseXlsx from 'excel';
import {
  extractPublications,
  extractAuthorsFromPublications,
  getReceptionData,
} from '../excelUtilities';
import { getPublicationAndAuthor } from '../utilities';

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

const saveLinks = async request => {
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

const uploadReceptions = (request, response) => {
  const form = new formidable.IncomingForm();
  form.parse(request);
  form.on('file', async (_, file) => {
    try {
      const data = await parseXlsx(file.path).catch(err => console.log(err));
      const publications = extractPublications(data, 'author');
      const receptionData = getReceptionData(publications);
      await extractAuthorsFromPublications(publications);
      for (const [source, receptions] of Object.entries(receptionData)) {
        console.log('saving receptions...');
        await saveLinksRaw(source, receptions, true);
        console.log('receptions saved');
      }
      response.status(200).send({ uploadStatus: 'receptions ok' });
    } catch (error) {
      console.log(error);
      response.status(400).send({ error: 'Unable to parse xlsx' });
    }
  });
};

export { saveLinks, saveLinksRaw, getReceptions, uploadReceptions };
