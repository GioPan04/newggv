import { Router, json, urlencoded, NextFunction, Request, Response } from 'express';
import cookie from 'cookie-parser';
import crypto from 'crypto';
import { PassThrough } from 'stream';
import jwt from 'jsonwebtoken';
import upload from 'express-fileupload';
import { join } from 'path';
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

    db.query(`(SELECT * FROM editions LIMIT ${start}, ${limit}) ORDER BY id DESC`, (err, data: any[]) => {
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
        db.query(`INSERT INTO editions (title, author, thumnail_url	, date, views) VALUES (?, ?, ?, ?, ?);`, [title, author, thumbnailUrl, date, views], (err, data) => {
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

router.all('/sputo', (req, res) => {
    db.query("(SELECT * FROM sputi WHERE ip = ?) ORDER BY id DESC", [req.connection.remoteAddress], (err, data) => {
        if(err) {
            console.log(err);
            res.status(500).json({
                error: "Errore del database",
                posted: false,
            });
            return;
        }
        const timestamp = Date.now();
        if(timestamp - data[0]?.timestamp < 60 * 60 * 1000) {
            res.status(400).json({
                error: "Hai già inviato uno sputo, aspetta 1 ora prima di inviarne un'altro",
                posted: false,
            });
            return;
        }
        db.query("INSERT INTO sputi (text, ip, timestamp) VALUES (?, ?, ?)", [req.body.text, req.connection.remoteAddress, timestamp], (err, data) => {
            if(err){
                console.log(err);
                res.status(500).json({
                    error: "Errore del database",
                    posted: false,
                });
            }
            res.status(201).json({
                error: null,
                posted: true,
            });
        })
    }); 
});

router.get('/sputi', (req, res) => {
    const start = parseInt(req.query.start as string ?? 0);
    const limit = parseInt(req.query.limit as string ?? 20);

    db.query(`(SELECT * FROM sputi LIMIT ${start}, ${limit}) ORDER BY id DESC`, (err, data: any[]) => {
        if (err) {
            console.log(err);

            res.status(500).json({
                error: "Errore del database"
            });
            return;
        }
        res.status(200).json({data: data.map(({ text, timestamp }) => ({ text, timestamp }))});
    });
});

function sha256(data: Buffer): string {
    const hash = crypto.createHash('sha256');
    hash.update(data);
    return hash.digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

router.post('/upload/image', authenticate, upload({limits: { fileSize: 10 * 1024 * 1024 },}), (req, res) => {
    const image = req.files?.image as upload.UploadedFile;

    console.log(req.files);
    console.log(req.body);

    if (image.truncated) {
        res.status(400).json({
            error: 'File sopra i 10 MB consentiti',
            uploaded: false,
            url: null,
        });
        return;
    }
    
    const filename = sha256(image.data) + '.' + image.mimetype.slice(6);

    image.mv(join(process.env.images_dir as string, filename), console.log);

    res.status(201).json({
        error: null,
        uploaded: true,
        url: 'https://ggv.pangio.it/photo/' + filename
    });
});

const mimeTypeToExt: { [key: string]: string } = {
    "video/x-flv": ".flv",
    "video/mp4": ".mp4",
    "application/x-mpegURL": "m3u8",
    "video/MP2T": ".ts",
    "video/3gpp": ".3gp",
    "video/quicktime": ".mov",
    "video/x-msvideo": ".avi",
    "video/x-ms-wmv": ".wmv"
};

router.post('/upload/video', authenticate, upload({limits: { fileSize: 200 * 1024 * 1024 }, tempFileDir: '/tmp/', useTempFiles: true }), (req, res) => {
    const video = req.files?.video as upload.UploadedFile;

    const title = req.body.title as string;
    const thumbnailUrl = req.body.thumbnailUrl as string;
    const author = req.body.author ?? (req as WithSession).session.name;
    
    if(!title || !thumbnailUrl) {
        res.status(400).json({
            error: "Titolo o la copertina sono vuoti",
            uploaded: false,
        });
        return;
    }

    const ext = mimeTypeToExt[video.mimetype];

    db.query("INSERT INTO videos (title, author, ext, thumbnailUrl) VALUES (?, ?, ?, ?)", [title, author, ext, thumbnailUrl], (err, data) => {
        if(err) {
            console.log(err);
            res.status(500).json({
                error: "Errore del database",
                uploaded: false,
            });
            return;
        }
        const id = data.insertId;
        video.mv(join(process.env.videos_dir as string, id + ext));
        res.status(201).json({
            error: null,
            uploaded: true,
        });
    });
});

router.get('/videos', (req, res) => {
    const start = parseInt(req.query.start as string ?? 0);
    const limit = parseInt(req.query.limit as string ?? 10);

    db.query(`(SELECT * FROM videos LIMIT ${start}, ${limit}) ORDER BY id DESC`, (err, data: any[]) => {
        if (err) {
            console.log(err);

            res.status(500).json({
                error: "Errore del database"
            });
            return;
        }
        res.status(200).json({data: data.map(({ id, title, author, ext, thumbnailUrl }) => ({ id, title, author, videoUrl : `http://localhost:3000/5${ext}`, thumbnailUrl }))});
    });
});

router.all('*', (req, res) => {
    res.status(404).json({
        error: 'Not found',
    });
});

export default router;