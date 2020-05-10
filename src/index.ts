import express, { urlencoded } from 'express';
import cookieParser from 'cookie-parser';

import auth from './auth';
import api from './api';

const app = express();

app.use(urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/', express.static('public'));

app.use('/api', api);

app.use(auth);

app.listen(80, () => {
    console.log("Server is listening port 80");
});
