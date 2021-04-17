const express = require('express');
const app = express();
const { resolve } = require('path');
require('dotenv').config({ path: './.env' });


let products = [
  {
    name: 'Carried',
    description: '8x10 print',
    images: ['http://143.110.155.189:80/images/carried.jpg']
  },
  {
    name: 'Mountains',
    description: '8x10 print',
    images: ['http://143.110.155.189:80/images/mountains.jpg']
  },
  {
    name: 'Triangles',
    description: '8x10 print',
    images: ['http://143.110.155.189:80/images/triangles.jpg']
  },
  {
    name: 'Donation:',
    description: 'No picture'
  }
];

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.use(express.static(process.env.STATIC_DIR));
app.use(
  express.json({
    // We need the raw body to verify webhook signatures.
    // Let's compute it only when hitting the Stripe webhook endpoint.
    verify: function (req, res, buf) {
      if (req.originalUrl.startsWith('/webhook')) {
        req.rawBody = buf.toString();
      }
    },
  })
);

app.get('/', (req, res) => {
  const path = resolve(process.env.STATIC_DIR + '/index.html');
  res.sendFile(path);
});

app.get('/config', async (req, res) => {
  console.log("CONFIG **************************************************");
  res.send({
    publicKey: process.env.STRIPE_PUBLISHABLE_KEY,
    products: products
  });
});

// Fetch the Checkout Session to display the JSON result on the success page
app.get('/checkout-session', async (req, res) => {
  const { sessionId } = req.query;
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  res.send(session);
});

app.post('/create-checkout-session', async (req, res) => {
  const domainURL = process.env.DOMAIN;
  const { locale, amount, productId } = req.body;
  const pmTypes = ('card').split(',').map((m) => m.trim());
  // const pmTypes = (process.env.PAYMENT_METHOD_TYPES || 'card').split(',').map((m) => m.trim());

  let sessionData = {
    payment_method_types: pmTypes,
    mode: 'payment',
    locale: locale,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: amount,
          product_data: {...products[productId]}
        },
        quantity: 1,
      }
    ],
    // ?session_id={CHECKOUT_SESSION_ID} means the redirect will have the session ID set as a query param
    success_url: `${domainURL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${domainURL}/canceled.html`
  }
  if(productId != products.length-1){
    sessionData.shipping_address_collection = {allowed_countries: ['US', 'CA']};
  }
  const session = await stripe.checkout.sessions.create(sessionData);

  res.send({
    sessionId: session.id,
  });
});

// Webhook handler for asynchronous events.
app.post('/webhook', async (req, res) => {
  let data;
  let eventType;
  // Check if webhook signing is configured.
  if (process.env.STRIPE_WEBHOOK_SECRET) {
    // Retrieve the event by verifying the signature using the raw body and secret.
    let event;
    let signature = req.headers['stripe-signature'];

    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed.`);
      return res.sendStatus(400);
    }
    // Extract the object from the event.
    data = event.data;
    eventType = event.type;
  } else {
    // Webhook signing is recommended, but if the secret is not configured in `config.js`,
    // retrieve the event data directly from the request body.
    data = req.body.data;
    eventType = req.body.type;
  }

  if (eventType === 'checkout.session.completed') {
    console.log(`🔔  Payment received!`);
  }

  res.sendStatus(200);
});

app.listen(80, () => console.log(`Node server listening on port ${80}!`));
