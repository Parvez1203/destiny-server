// index.js
const express = require("express");
const cors = require("cors");
require('dotenv').config()
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY); // Replace with your actual secret key

const app = express();
const PORT = 8000;

// Use CORS middleware
app.use(cors());

// Parse JSON bodies (as sent by API clients)
app.use(express.json());

// Basic route
app.get("/", (req, res) => {
  res.send("Hello, World!");
});

// Endpoint to create a product and Checkout session in USD
// app.post("/create-product-and-checkout-session", async (req, res) => {
//   console.log("working");
  
//   try {
//     const { name, description, amount } = req.body; // Extract product details from the request body

//     // Create the product in Stripe
//     const product = await stripe.products.create({
//       name,
//       description,
//       // images,
//     });

//     // Create a price for the product in USD
//     const price = await stripe.prices.create({
//       unit_amount: Math.round(amount * 100),  // Amount in cents (ensure rounding)
//       currency: 'usd',                         // Always set currency to USD
//       product: product.id,                     // Associate the price with the product
//     });

//     // Create a Checkout session for the product
//     const session = await stripe.checkout.sessions.create({
//       line_items: [
//         {
//           price: price.id,            // Use the price ID created above
//           quantity: 1,                // Set quantity to 1
//         },
//       ],
//       mode: 'payment',                // Checkout mode
//       success_url: 'https://destiny-client-seven.vercel.app/', // Redirect URL on successful payment
//       cancel_url: 'https://destiny-client-seven.vercel.app/',   // Redirect URL on canceled payment
//     });

//     // Respond with the session ID
//     console.log(session.id);
    
//     res.send(JSON.stringify({ sessionId: session.id }));
//   } catch (error) {
//     console.error("Error creating product and Checkout session:", error);
//     res.status(500).json({ error: error.message });
//   }
// });

app.post("/create-product-and-checkout-session", async (req, res) => {
  console.log("working");
  
  const { paymentMethodType, shipping, email, product } = req.body;

  try {
    // Step 1: Create a Payment Intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: product.price * 100, // Amount in cents
      currency: product.currency,
      payment_method_types: [paymentMethodType],
      receipt_email: email,
      description: product.description,
      shipping: {
        name: shipping.recipient,
        address: {
          line1: shipping.addressLine[0],
          line2: shipping.addressLine[1] || '',
          city: shipping.city,
          state: shipping.region,
          postal_code: shipping.postalCode,
          country: shipping.countryCode,
        },
      },
    });

    res.send({ clientSecret: paymentIntent.client_secret });

  } catch (error) {
    console.error("Error creating product and Checkout session:", error);
    res.status(500).json({ error: error.message });
  }
});



// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
