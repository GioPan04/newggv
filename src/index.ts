import express, { urlencoded } from 'express';
import cookieParser from 'cookie-parser';

import { resolve } from 'path';

import auth from './auth';
import api from './api';

const app = express();

app.use(urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/', express.static('web/public'));

app.use('/api', api);

app.use('/api', auth);

app.get('*', (req, res) => {
    res.sendFile(resolve('web/public/index.html'));
});

app.listen(3000, () => {
    console.log("Server is listening port 80");
});
