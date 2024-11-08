const express = require("express");
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser')

// Replace if using a different env file or config
const env = require("dotenv").config({ path: "./.env" });

// const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY, {
//   apiVersion: "2022-08-01",
// });

app.use(cors());
// app.use(express.static(process.env.STATIC_DIR));
app.use(bodyParser.json());

// app.get("/config", (req, res) => {
//   res.send({
//     publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
//   });
// });

// app.post('/create-payment-intent', async (req, res) => {
//   const { token, shipping } = req.body; // Extract token and shipping details

//   try {
//     const charge = await stripe.charges.create({
//       amount: 2000, // amount in cents
//       currency: 'usd',
//       source: token,
//       description: 'Payment Description',

//     });

//     res.status(200).send({ success: true, charge });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send({ error: 'Payment failed' });
//   }
// });

// Endpoint to fetch product details
app.get('/api/products/:id', async (req, res) => {
  const productId = req.params.id;

  // Construct the GraphQL query to fetch a specific product
  const query = `
    {
      product(id: "gid://shopify/Product/${productId}") {
        id
        title
        description
        images(first: 1) {
          edges {
            node {
              src
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(`https://${process.env.SHOPIFY_DOMAIN}/api/2023-10/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN,
      },
      body: JSON.stringify({ query }),
    });

    console.log(`Fetching product from: https://${process.env.SHOPIFY_DOMAIN}/api/2023-10/graphql.json`);

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    res.json({ data: data.data });  // Adjusting the response format to match what the client expects
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).send('Error fetching product');
  }
});




app.listen(8000, () =>
  console.log(`Node server listening at http://localhost:8000`)
);