import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import busboy from 'connect-busboy';
import busboyBodyParser from 'busboy-body-parser';

import userRoutes from './src/routes/user.routes'

const app = express();

app.use(morgan('dev'));
app.use(busboy());
app.use(busboyBodyParser());
app.use(express.json());
app.use(cors());

app.use('/user', userRoutes)


app.listen(8000, () => {
    console.log('WS okay');
  });