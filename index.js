const express = require("express");
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser')

// Replace if using a different env file or config
const env = require("dotenv").config({ path: "./.env" });

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-08-01",
});

app.use(cors());
// app.use(express.static(process.env.STATIC_DIR));
app.use(bodyParser.json());

app.get("/config", (req, res) => {
  res.send({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
});

app.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency, productId, productTitles, quantity } = req.body;

    // Create a PaymentIntent with the specified amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Amount in cents (e.g., $10.00 is 1000 cents)
      currency: currency, // e.g., 'usd'
      payment_method_types: ['card'], // Specify accepted payment methods
      metadata: {
        productId: productId,
        productTitles: productTitles,
        quantity: quantity.toString(), // Stripe metadata requires values to be strings
      },
    });

    // Send the client_secret to the client
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Error creating PaymentIntent:', error);
    res.status(500).json({ error: 'Failed to create PaymentIntent' });
  }
});

app.post('/calculateShipping', (req, res) => {
  const { shippingAddress } = req.body;

  // Check if the country is supported
  if (shippingAddress.country !== 'US') {
    return res.status(400).json({ status: 'invalid_shipping_address' });
  }

  // Define example shipping options
  const shippingOptions = [
    {
      id: 'standard',
      label: 'Standard Shipping (5-7 business days)',
      amount: 500,  // Amount in cents
      description: 'Standard shipping rate'
    },
    {
      id: 'express',
      label: 'Express Shipping (2-3 business days)',
      amount: 1000, // Amount in cents
      description: 'Express shipping rate'
    }
  ];

  // Send the supported shipping options back to the client
  res.json({ supportedShippingOptions: shippingOptions });
});

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
        variants(first: 5) {
          edges {
            node {
              id
              priceV2 {
                amount
                currencyCode
              }
            }
          }
        }
        images(first: 10) {
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
    const originalData = data.data;

    const formattedData = {
      product: {
        id: originalData.product.id,
        variant_id: originalData.product.variants.edges[0].node.id,
        title: originalData.product.title,
        description: originalData.product.description,
        images: originalData.product.images.edges.map(edge => edge.node.src),
        price: originalData.product.variants.edges[0].node.priceV2.amount,
        currency: originalData.product.variants.edges[0].node.priceV2.currencyCode
      }
    };

    res.json({ ...formattedData });  // Adjusting the response format to match what the client expects
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).send('Error fetching product');
  }
});

app.get('/api/products', async (req, res) => {
  // Construct the GraphQL query to fetch products with their title and ID
  const query = `
    {
      products(first: 100) {
        edges {
          node {
            id
            title
            availableForSale
            variants(first: 100) {
              edges {
                node {
                  id
                  availableForSale
                }
              }
            }
          }
        }
          
        pageInfo {
          hasNextPage
          endCursor
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

    console.log(`Fetching products from: https://${process.env.SHOPIFY_DOMAIN}/api/2023-10/graphql.json`);

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();

    // console.log(data.data.products.edges[0].node.variants.edges[0].node)

    // Respond with the data, focusing on products and pagination info if needed
    res.json({
      products: data.data.products.edges.map(edge => ({
        id: edge.node.id,
        title: edge.node.title,
        available: edge.node.availableForSale
      })).filter(x => x.available),
      pageInfo: data.data.products.pageInfo,
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).send('Error fetching products');
  }
});





app.listen(8000, () =>
  console.log(`Node server listening at http://localhost:8000`)
);
