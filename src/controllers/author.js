import Author from '../models/author';

const getAuthorNames = async (request, response) => {
  const { page, offset, search, letter } = request.query;
  const defaultOffset = 10;
  const cond = { $and: [{}] };
  if (search) {
    cond.$and.push({ name: { $regex: new RegExp(search, 'i') } });
  }
  if (letter) {
    cond.$and.push({ name: { $regex: new RegExp(`^${letter}`, 'i') } });
  }
  let query = Author.find(cond)
    .collation({ locale: 'fi' })
    .select('name -_id')
    .sort({ name: 'asc' });
  if (page) {
    query = query.skip(page * 1).limit(offset ? offset * 1 : defaultOffset);
  }
  try {
    const res = await query.exec();
    response.status(201).send(res.map(author => author.name));
  } catch (e) {
    console.log(e);
    response.status(400).send({ error: 'errorii' });
    /* handle error */
  }
};

const getAuthors = (request, response) => {
  const { letter } = request.query;
  //TODO: order alphabetically
  Author.find(cond, (err, authors) => {
    if (err) {
      response.status(400).send({ error: 'cannot get a list of authors' });
    } else {
      response.status(200).send(authors);
    }
  });
};

const getAuthorLetters = async (request, response) => {
  const query = Author.find({}).sort({ name: 'asc' });
  try {
    const authors = await query.exec();
    const letters = [
      ...new Set(authors.map(author => author.name.charAt(0).toUpperCase())),
    ];
    response.status(200).send(letters.sort());
  } catch (e) {
    console.log('cannot get author letters', e);
  }
};

const getAuthor = (request, response) => {
  const { name } = request.params;
  Author.findOne({ name }, (err, res) => {
    if (err) {
      console.log(err);
      response.status(400).send({ error: 'Cannot get author' });
    } else {
      response.status(200).send(res || {publications: []});
    }
  });
};

const updateAuthor = async (request, response) => {
  const { _id, __v, ...rest } = request.body;
  try {
    const res = await Author.updateOne({ _id }, rest);
    response.status(201).send({ updated: res.nModified });
  } catch (e) {
    console.log(e);
    response.status(400).send({ error: 'Udpate failed' });
  }
};

const saveAuthor = async (request, response) => {
  try {
    const author = new Author({ ...request.body, publications: [] });
    const saved = await author.save();
    response.status(200).send({ author_id: saved._id });
  } catch (e) {
    console.log(e);
    response.status(400).send({ error: 'Inserting a new author failed' });
  }
};

const deleteAuthor = async (_, response) => {
  Author.deleteMany({}, err => {
    if (err) {
      console.log(err);
      response.status(400).send({ error: 'unable to delete' });
    }
    response.status(200).send({ status: 'succesfully deleted' });
  });
};

const deleteSingleAuthor = async (request, response) => {
  const { id } = request.params;
  Author.deleteOne({ _id: id }, err => {
    if (err) {
      console.log(err);
      response.status(400).send({ error: 'unable to delete' });
    }
    response.status(200).send({ status: 'succesfully deleted' });
  });
};

const combineAuthors = async (request, response) => {
  const { from, to } = request.params;
  const toBeGone = await Author.findOne({ name: from });
  const willRemain = await Author.findOne({ name: to });
	if(toBeGone === willRemain){
    response.status(400).send({ error: 'Cannot combine authors: names are identical'});
	}
  willRemain.publications = [
    ...willRemain.publications,
    ...toBeGone.publications,
  ];
  try {
    await willRemain.save();
    await Author.deleteOne({ name: from });
    response.status(200).send({ message: 'Combining done.' });
  } catch (e) {
    /* handle error */
    response.status(400).send({ error: 'failed to combine', reason: e });
  }
};

export {
  getAuthorNames,
  getAuthorLetters,
  getAuthor,
  updateAuthor,
  saveAuthor,
  getAuthors,
  deleteAuthor,
  deleteSingleAuthor,
  combineAuthors,
};
