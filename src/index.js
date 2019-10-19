/* eslint-disable no-await-in-loop */
import bodyparser from 'body-parser';
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import authRoutes from './routes/auth';
import publicationRoutes from './routes/publication';
import authorRoutes from './routes/author';
import receptionRoutes from './routes/reception';

// eslint-disable-next-line no-unused-vars
const db = mongoose.connect('mongodb://telimongo:27017/teli', {
  useNewUrlParser: true,
});
const app = express();

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || process.env.CORS_ORIGIN.split(' ').includes(origin)) {
      callback(null, true);
    } else {
      console.log(origin);
      console.log(process.env.CORS_ORIGIN.split(' '));
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'PUT', 'POST', 'DELETE'],
};

app.use(cors(corsOptions));
app.use(bodyparser.urlencoded({ extended: true }));
app.use(bodyparser.json());
app.use('/', authorRoutes);
app.use('/', receptionRoutes);
app.use('/', publicationRoutes);
app.use('/', authRoutes);

app.listen(3000, '0.0.0.0', () => {
  console.log('listening..');
  console.log(process.env.CORS_ORIGIN);
});
