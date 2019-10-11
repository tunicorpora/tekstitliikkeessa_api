import Author from '../models/author';

const getAuthorNames = (request, response) => {
  Author.find({ name: { $regex: new RegExp(request.query.search) } })
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

const getAuthorTest = (request, response) => {
  const { name } = request.params;
  Author.findOne({ name }, async (err, res) => {
    if (err) {
      console.log(err);
      response.status(400).send({ error: 'Cannot get author' });
    } else {
      const { publications } = res;
      if (Array.isArray(publications)) {
        publications.forEach(pub => {
          const { receptions } = pub;
          Object.keys(receptions).forEach(key => {
            if (Array.isArray(receptions[key])) {
              receptions[key].forEach(reception => {
                console.log(reception);
              });
            }
          });
        });
        response.status(201).send(res);
      }
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

export { getAuthorNames, getAuthor, updateAuthor, saveAuthor };
