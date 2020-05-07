import { Router, json, urlencoded, NextFunction, Request, Response } from 'express';
import cookie from 'cookie-parser';
import jwt from 'jsonwebtoken';

import db from '../db';

const router = Router();

router.use(urlencoded({ extended: true }));
router.use(cookie());
router.use(json());

router.get('/get_articles', (req, res) => {
    const start = parseInt(req.query.start as string) ?? 0;
    const limit = parseInt(req.query.limit as string) ?? 10;

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
    console.log((req as RequestWithSession).session);
});

router.post('/upload/image', (req, res) => {
    
});

router.post('/upload/video', (req, res) => {

});

export default router;
