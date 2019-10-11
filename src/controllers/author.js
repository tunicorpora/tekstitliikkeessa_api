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

export { getAuthorNames, getAuthor };
