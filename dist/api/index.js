"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const fs_1 = __importDefault(require("fs"));
const db_1 = __importDefault(require("../db"));
const router = express_1.Router();
router.use(express_1.urlencoded({ extended: true }));
router.use(cookie_parser_1.default());
router.use(express_1.json());
router.get('/articles', (req, res) => {
    var _a, _b;
    const start = parseInt((_a = req.query.start) !== null && _a !== void 0 ? _a : 0);
    const limit = parseInt((_b = req.query.limit) !== null && _b !== void 0 ? _b : 10);
    db_1.default.query(`SELECT * FROM editions LIMIT ${start}, ${limit}`, (err, data) => {
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
    fs_1.default.readFile(process.env.articles_dir + `/${req.params.id}.md`, (err, data) => {
        if (err) {
            res.status(404).json({
                error: "L'articolo non esiste"
            });
            return;
        }
        else {
            res.status(200).send(data);
        }
    });
});
function requireLogin(req, res, next) {
    let session;
    try {
        session = jsonwebtoken_1.default.verify(req.cookies.session, process.env.jwt_secret);
    }
    catch (err) {
        res.status(401).json({ error: 'Non autorizzato' });
        return;
    }
    req.session = session;
    next();
}
router.post('/new_article', requireLogin, (req, res) => {
    var _a;
    const session = req.session;
    const author = (_a = req.body.author) !== null && _a !== void 0 ? _a : session.name;
    const title = req.body.title;
    const article = req.body.article;
    if (article == null || title == null) {
        res.status(400).json({
            error: "L'articolo e/o il titolo sono vuoti",
            posted: false,
        });
        return;
    }
    else {
        db_1.default.query(`INSERT INTO editions (title, author) VALUES ("${title}", "${author}");`, (err, data) => {
            if (err) {
                console.log(err);
                res.status(500).json({
                    error: "Errore del database",
                    posted: false,
                });
                return;
            }
            fs_1.default.writeFile(process.env.articles_dir + `/${data.insertId}.md`, article, (err) => {
                if (err) {
                    console.log(err);
                    res.status(500).json({
                        error: "Can't create file",
                        posted: false,
                    });
                    return;
                }
                else {
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
exports.default = router;
