import express from 'express';
import {
    requestLoggerMiddleware,
    validateSessionMiddleware,
  } from './util/middlewares.js';

const app = express();
app.use(requestLoggerMiddleware);
app.use(express.json());
app.use(validateSessionMiddleware);
export { app as handlers };

app.get("/t212-balance", async (req, res) => {
    const {authorization} = req.headers;
    const response = await fetch("https://live.trading212.com/api/v0/equity/account/cash", {headers: {authorization}});

    if(!response.ok){
        console.log(response.status);
        return res.status(response.status).send();
    }

    const json = await response.json();
    res.status(200).send(json);
});
