"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mysql_1 = __importDefault(require("mysql"));
const db = mysql_1.default.createConnection({
    user: process.env.db_user,
    password: process.env.db_password,
    database: process.env.db_name,
    host: 'localhost',
});
exports.default = db;
