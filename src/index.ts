import express from 'express';

import api from './api';

const app = express();

app.use('/api', api);

app.listen(80, () => {
    console.log("Server is listening port 80");
});
