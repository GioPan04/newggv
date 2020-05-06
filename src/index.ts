import express, { urlencoded } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

import api from './api';
import db from './db';

const app = express();

app.use(urlencoded({ extended: true }));

app.use('/api', api);

app.post('/login', (req, res) => {
    const username = req.body.username as string;
    const password = req.body.password as string;

    db.connect();
    db.query(`SELECT name,role,passwd FROM users WHERE name = ${username}`, async (err, results: any[]) => {

        console.log(results);
        if (err) {
            console.log(err);
            res.status(500).json({
                error: 'Errore del database',
                logged: false,
            });
            return;
        }
        // if (await bcrypt.compare(password, passwd)) {
        //     res.cookie('session', jwt.sign({
        //         name,
        //         role
        //     }, process.env.jwt_secret as string)).status(200).json({logged: true});
        // } else {
        //     res.status(401).json({
        //         error: "Username o password errati",
        //         logged: false,
        //     });
        // }
    });
    db.end();
});

app.listen(3000, () => {
    console.log("Server is listening port 80");
});