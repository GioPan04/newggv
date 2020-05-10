"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = __importDefault(require("./db"));
const router = express_1.Router();
router.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    db_1.default.query(`SELECT name,role,passwd FROM users WHERE name = ${db_1.default.escape(username)}`, async (err, results) => {
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
        if (await bcrypt_1.default.compare(password, passwd)) {
            res.cookie('session', jsonwebtoken_1.default.sign({
                name,
                role
            }, process.env.jwt_secret)).status(200).json({ error: null, logged: true });
        }
        else {
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
exports.default = router;
function authenticate(req, res, next) {
    try {
        req.session = jsonwebtoken_1.default.verify(req.cookies.session, process.env.jwt_secret);
    }
    catch (_) {
        res.sendStatus(401);
        return;
    }
    next();
}
exports.authenticate = authenticate;
