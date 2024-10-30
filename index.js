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
    const { shipping } = req.body || ''; // Expecting shipping info from client

    // Static values for amount and currency
    const amount = 1999; // Amount in cents (e.g., $19.99)
    const currency = "USD";
    // Create the payment intent with dynamic amount and shipping details if provided
    const paymentIntent = await stripe.paymentIntents.create({
      currency,
      amount, // Use the amount provided in the request body
      automatic_payment_methods: { enabled: true },
      shipping, // Add shipping details if available
    });

    // Send the client secret and other details to the client
    res.send({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id, // You can send the payment intent ID for tracking
    });
  } catch (e) {
    return res.status(400).send({
      error: {
        message: e.message,
      },
    });
  }
});

app.listen(8000, () =>
  console.log(`Node server listening at http://localhost:8000`)
);