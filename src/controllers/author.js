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


export { getAuthorNames, getAuthor };
