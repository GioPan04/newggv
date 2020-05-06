import { Router, json, urlencoded } from 'express';

import mysql from 'mysql';

const db = mysql.createConnection({
    user: process.env.db_user,
    password: process.env.db_password,
    database: process.env.db_name,
    host: 'pangio.it',
});

const router = Router();

router.use(urlencoded({ extended: true }));
router.use(json());

router.get('/get_articles', (req, res) => {
    const start = parseInt(req.query.start as string);
    const limit = parseInt(req.query.limit as string);
    db.connect();
    db.query(`SELECT * FROM editions`, (err, data: any[], field) => {
        if (err) {
            console.log(err);

            res.status(500).json({
                error: "Errore del database"
            });
            return;
        }
        res.json({ data });
    });

});

router.post('/new_article', (req, res) =>  {

});

router.post('/upload/image', (req, res) => {
    
});

router.post('/upload/video', (req, res) => {

});

export default router;
