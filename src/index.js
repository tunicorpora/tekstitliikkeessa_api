import express from 'express';

const app = express();

app.get('/test', (request, response) => {
  response.status(200).send('test ok');
});

app.listen(3000, 'localhost', () => {
  // eslint-disable-next-line no-console
  console.log('listening..');
});
