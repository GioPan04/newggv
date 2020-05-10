"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importStar(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const auth_1 = __importDefault(require("./auth"));
const api_1 = __importDefault(require("./api"));
const app = express_1.default();
app.use(express_1.urlencoded({ extended: true }));
app.use(cookie_parser_1.default());
app.use('/', express_1.default.static('public'));
app.use('/api', api_1.default);
app.use(auth_1.default);
app.listen(80, () => {
    console.log("Server is listening port 80");
});
