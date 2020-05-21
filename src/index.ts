import express, { urlencoded, Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';

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
    if (req.path !== '/login') {
        const session = req.cookies.session;
        try {
            jwt.verify(session, process.env.jwt_secret as string);
        }
        catch (_) {
            res.redirect('/login');
            return;
        }
    }
    res.sendFile(resolve('web/public/main.html'));
});

app.listen(3000, () => {
    console.log("Server is listening port 80");
});
