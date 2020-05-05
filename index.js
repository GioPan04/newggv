const express = require("express");
const app = express();

app.get("/", (req, res) => {
    res.send("Hello, My beautiful world!");
});

app.listen(80, () => {
    console.log("Listening port 80");
});