import Author from '../models/author';

const getAuthorNames = (request, response) => {
  Author.find({ name: { $regex: new RegExp(request.query.search, 'i') } })
    .select('name -_id')
    .exec((err, res) => {
      if (err) {
        console.log(err);
        response.status(400).send({ error: 'Cannot find authors' });
      } else {
        response.status(201).send(res.map(r => r.name));
      }
    });
};

const getAuthors = (_, response) => {
  Author.find({}, (err, authors) => {
    if (err) {
      response.status(400).send({ error: 'cannot get a list of authors' });
    } else {
      response.status(200).send(authors);
    }
  });
};

const getAuthor = (request, response) => {
  const { name } = request.params;
  Author.findOne({ name }, (err, res) => {
    if (err) {
      console.log(err);
      response.status(400).send({ error: 'Cannot get author' });
    } else {
      response.status(201).send(res);
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
    console.log(request.body);
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

export {
  getAuthorNames,
  getAuthor,
  updateAuthor,
  saveAuthor,
  getAuthors,
  deleteAuthor,
};
