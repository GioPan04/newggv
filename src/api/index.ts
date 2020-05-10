import { Router, json, urlencoded, NextFunction, Request, Response } from 'express';
import cookie from 'cookie-parser';
import jwt from 'jsonwebtoken';
import fs from 'fs';

import db from '../db';

const router = Router();

router.use(urlencoded({ extended: true }));
router.use(cookie());
router.use(json());

router.get('/articles', (req, res) => {

    const start = parseInt(req.query.start as string ?? 0);
    const limit = parseInt(req.query.limit as string ?? 10);

    db.query(`SELECT * FROM editions LIMIT ${start}, ${limit}`, (err, data: any[]) => {
        if (err) {
            console.log(err);

            res.status(500).json({
                error: "Errore del database"
            });
            return;
        }
        res.status(200).json({
            data
        });
    });
});

function requireLogin(req: Request, res: Response, next: NextFunction) {
    let session: any;
    try {
        session = jwt.verify(req.cookies.session, process.env.jwt_secret as string);
    } catch (err) {
        res.status(401).json({ error: 'Non autorizzato' });
        return;
    }
    (req as any).session = session;
    next();
}

interface RequestWithSession extends Request {
    session: any;
}

router.post('/new_article', requireLogin, (req, res) =>  {
    const session = (req as RequestWithSession).session;
    const author: String = req.body.author ?? session.name;
    const title: String = req.body.title;
    const article: String = req.body.article;
    if (article == null || title == null) {
        res.status(400).json({
            error: "L'articolo e/o il titolo sono vuoti",
            posted: false,
        });
        return;
    } else {
        db.query(`INSERT INTO editions (title, author) VALUES ("${title}", "${author}");`, (err, data) => {
            if(err) {
                console.log(err);
                res.status(500).json({
                    error: "Errore del database",
                    posted: false,
                });
                return;
            }
            fs.writeFile(process.env.articles_dir + `/${data.insertId}.md`, article, (err) => {
                if(err) {
                    console.log(err);
                    res.status(500).json({
                        error: "Can't create file",
                        posted: false,
                    });
                    return;
                } else {
                    res.status(201).json({
                        error: null,
                        posted: true,
                        id: data.insertId,
                        message: `${author}\n${article}`,
                    });
                }
            });
            
        });
    }
});

router.post('/upload/image', (req, res) => {
    
});

router.post('/upload/video', (req, res) => {

});

export default router;
