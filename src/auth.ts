import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

import db from './db';

const router = Router();

router.post('/login', (req, res) => {
    const username = req.body.username as string;
    const password = req.body.password as string;

    db.query(`SELECT name,role,passwd FROM users WHERE name = ${db.escape(username)}`, async (err, results: any[]) => {
        if (err) {
            console.log(err);
            res.status(500).json({
                error: 'Errore del database',
                logged: false,
            });
            return;
        }

        if (results.length === 0) {
            res.status(401).json({
                error: "Username o password errati",
                logged: false,
            });
            return;
        }

        const [{ name, role, passwd }] = results;

        if (await bcrypt.compare(password, passwd)) {
            res.cookie('session', jwt.sign({
                name,
                role
            }, process.env.jwt_secret as string)).status(200).json({error: null, logged: true});
        } else {
            res.status(401).json({
                error: "Username o password errati",
                logged: false,
            });
        }
    });
});

router.post('/logout', authenticate, (_, res) => {
    res.clearCookie('session').send();
});

export default router;

export interface Session {
    name: string;
    role: string;
}

export interface WithSession extends Request {
    session: Session;
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
    try {
        (req as WithSession).session = jwt.verify(req.cookies.session, process.env.jwt_secret as string) as Session;
    }
    catch (_) {
        res.sendStatus(401);
        return;
    }
    next();
}
