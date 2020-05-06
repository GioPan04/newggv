import { Router, json, urlencoded } from 'express';

import db from '../db';

const router = Router();

router.use(urlencoded({ extended: true }));
router.use(json());

router.get('/get_articles', (req, res) => {
    const start = parseInt(req.query.start as string) ?? 0;
    const limit = parseInt(req.query.limit as string) ?? 10;

    db.connect();
    db.query(`SELECT * FROM editions LIMIT ${start}, ${limit}`, (err, data: any[]) => {
        if (err) {
            console.log(err);

            res.status(500).json({
                error: "Errore del database"
            });
            return;
        }
        res.json({ data });
    });
    db.end();
});

router.post('/new_article', (req, res) =>  {

});

router.post('/upload/image', (req, res) => {
    
});

router.post('/upload/video', (req, res) => {

});

export default router;
