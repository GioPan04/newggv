import express from 'express';

import api from './api';

const app = express();

app.use('/api', api);

app.listen(3000, () => {
    console.log("Server is listening port 80");
});
