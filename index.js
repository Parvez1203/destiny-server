const express = require("express");
const app = express();
const cors = require('cors');

// Replace if using a different env file or config
const env = require("dotenv").config({ path: "./.env" });

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-08-01",
});

app.use(cors());
// app.use(express.static(process.env.STATIC_DIR));

app.get("/config", (req, res) => {
  res.send({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
});

app.post("/create-payment-intent", async (req, res) => {
  try {
    const { token } = req.body;
    const charge = await stripe.charges.create({
      amount: 2000, // amount in cents
      currency: 'usd',
      source: token,
      description: 'Payment Description',
    });
    res.status(200).send({ success: true, charge });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Payment failed' });
  }
});

app.listen(8000, () =>
  console.log(`Node server listening at http://localhost:8000`)
);