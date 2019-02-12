import express from 'express';

const app = express();

app.get('/test', (request, response) => {
  response.status(200).send('test ok');
});
