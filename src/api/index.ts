import { Router, json, urlencoded, NextFunction, Request, Response } from 'express';
import cookie from 'cookie-parser';
import jwt from 'jsonwebtoken';
import fs from 'fs';

import { authenticate, WithSession } from '../auth';
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

router.get('/articles/:id', (req, res) => {
    fs.readFile(process.env.articles_dir + `/${req.params.id}.md`, (err, data) => {
        if(err) {
            res.status(404).json({
                error: "L'articolo non esiste"
            });
            return;
        } else {
            res.status(200).send(data);
        }
    });
});

router.post('/new_article', authenticate, (req, res) =>  {
    const session = (req as WithSession).session;
    const author: string = req.body.author ?? session.name;
    const title: string = req.body.title;
    const article: string = req.body.article;
    if (article == null || title == null) {
        res.status(400).json({
            error: "L'articolo e/o il titolo sono vuoti",
            posted: false,
        });
        return;
    } else {
        db.query(`INSERT INTO editions (title, author) VALUES (?, ?);`, [db.escape(title), db.escape(author)], (err, data) => {
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
