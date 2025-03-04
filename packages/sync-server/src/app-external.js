import express from 'express';
import {
    requestLoggerMiddleware,
    validateSessionMiddleware,
  } from './util/middlewares.js';
import { secretsService } from './services/secrets-service.js';
import yahooFinance from 'yahoo-finance2';

const app = express();
app.use(requestLoggerMiddleware);
app.use(express.json());
app.use(validateSessionMiddleware);
export { app as handlers };

app.post("/t212-balance", async (req, res) => {
    let {authorization} = req.headers;
    if(!authorization){
        const {id} = req.body;
        if(!id){
            return res.status(400).send("You must set either the Authorization header or send the account ID");
        }

        authorization = secretsService.get(id);
    }

    const response = await fetch("https://live.trading212.com/api/v0/equity/account/cash", {headers: {authorization}});

    if(!response.ok){
        let error = "An unknown error occurred. Please try again.";
        if(response.status === 401){
            error = "Invalid API key"
        } else if(response.status === 429){
            error = "Too many requests. Slow down!";
        }
        return res.status(response.status).send(error);
    }

    const json = await response.json();
    res.status(200).send({
        status: "ok",
        data: json
    });
});

app.post("/crypto", async (req, res) => {
    let pairs = req.body.map(holding => `${holding.ticker}GBP`).join(",");
    const prices = await fetch(`https://api.kraken.com/0/public/Ticker?pair=${pairs}`).then(res => res.json());

    if(prices.error.length > 0){
        return res.status(500).send(prices.error);
    }

    const retVal = {};
    Object.keys(prices.result).forEach((key, i) => {
        //would love to do exact matching, but it seems Kraken normalises names - e.g. BTCGBP can be returned as XXBTZGBP
        //however, everything seems to be returned in the same order it's sent, so we can (ugh) match on indices instead
        const values = prices.result[key];
        retVal[req.body[i].ticker] = req.body[i].quantity * parseFloat(values.c[0]);
    })

    res.send({
        status: 'ok',
        data: retVal
    });
});

app.post("/investment", async (req, res) => {
    const stocks = await yahooFinance.quote(req.body.map(holding => holding.ticker));
    const rates = {};

    if(stocks.length != req.body.length){
        return res.status(500).send('One or more ticker symbols could not be found');
    }

    const retVal = {};
    for(let i = 0; i < stocks.length; i++){
        let value = (stocks[i].regularMarketPrice * 100) * req.body[i].quantity;

        if(stocks[i].currency != "GBP"){
            if(!rates.hasOwnProperty(stocks[i].currency)){
                const quote = await yahooFinance.quote(`GBP${stocks[i].currency}=X`);
                rates[stocks[i].currency] = quote.regularMarketPrice;
            }

            value /= rates[stocks[i].currency];
        }

        retVal[stocks[i].symbol] = Math.round(value) / 100;
    }
    
    res.send({
        status: 'ok',
        data: retVal
    });
});