import { Router, json, urlencoded, NextFunction, Request, Response } from 'express';
import cookie from 'cookie-parser';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import fs from 'fs';

import { authenticate, WithSession } from '../auth';
import db from '../db';

const router = Router();

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, process.env.images_dir as string);
    },
    filename(req, file, cb) {
        if (!file.mimetype.startsWith('image/')) {
            cb(new Error("No image"), '');
            return;
        }
        const hash = crypto.createHash('sha256');
        const chunks: Buffer[] = [];
        file.stream.on('data', chunk => {
            chunks.push(chunk);
        }).on('end', () => {
            hash.update(Buffer.concat(chunks));
            cb(null, hash.digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '') + '.' + file.mimetype.slice(6));
        });
    }
});

const images = multer({
    storage
});

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
            db.query("UPDATE editions SET views = views + 1 WHERE id = ?", [req.params.id], (err, data) => {
                if(err) console.log(err);
            });
            res.status(200).send(data);
        }
    });
});

router.post('/new_article', authenticate, (req, res) =>  {
    const session = (req as WithSession).session;
    const author: string = req.body.author ?? session.name;
    const title: string = req.body.title;
    const thumbnailUrl: string = req.body.thumbnailUrl;
    const date: number = Date.now();
    const views: number = req.body.views ?? 0;
    const article: string = req.body.article;
    if (article == null || title == null) {
        res.status(400).json({
            error: "L'articolo e/o il titolo sono vuoti",
            posted: false,
        });
        return;
    } else {
        db.query(`INSERT INTO editions (title, author, thumbnailUrl, date, views) VALUES (?, ?, ?, ?, ?);`, [title, author, thumbnailUrl, date, views], (err, data) => {
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

router.post('/upload/image', authenticate, images.single('image'), (req, res) => {
    res.status(201).json({
        error: null,
        uploaded: true,
        url: 'https://ggv.pangio.it/photo/' + req.file.filename
    });
});

router.post('/upload/video', authenticate, (req, res) => {

});

export default router;
