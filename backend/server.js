require('dotenv').config();

const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();

// Enable CORS for local dev and production frontend
app.use(cors({
  origin: [
    "http://localhost:8000",
    "https://navigen-go.onrender.com",
    "https://navigen-go.pages.dev",
    "https://navi.genuni.io",
    "https://navigen.io",
    "https://www.navigen.io"
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// ? Handle preflight requests
app.options('*', cors());

app.use(express.json());

// 💳 Stripe Price IDs

// 🔒 Live mode (commented out)
// const priceIds = {
//   3: 'price_1RnwRPFf2RZOYEdOOZI397PD',    // ☕
//   5: 'price_1RnwT4Ff2RZOYEdOX9SJaDPC',    // 🎈
//   10: 'price_1RnwToFf2RZOYEdOWGzwmAwY'    // 🚀
// };

// 🧪 Test mode (active)
const priceIds = {
  3: 'price_1RsLn1Ff2RZOYEdOjXQOitkS',    // ☕
  5: 'price_1RsLnSFf2RZOYEdO51D1dCCM',    // 🎈
  10: 'price_1RsLnmFf2RZOYEdOpvNnrf27'    // 🚀
};

app.post('/create-checkout-session', async (req, res) => {
  const { amount } = req.body;
  const priceId = priceIds[amount];

  if (!priceId) return res.status(400).json({ error: 'Invalid donation amount' });

  try {
    console.log("amount:", amount, "priceId:", priceId); // ✅ inside try

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: 'https://navigen-go.pages.dev/?thanks&sid={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://navigen-go.pages.dev/?cancel'
    });

    res.json({ sessionId: session.id });
  } catch (err) {
    console.error("Stripe error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/", (req, res) => {
  res.send("? Backend is running");
});

const PORT = process.env.PORT || 8000;

// ✅ Phase 1 backend endpoint: /stripe/session?sid=...

// ✅ GET /stripe/session?sid=cs_...
app.get("/stripe/session", async (req, res) => {
  const sessionId = req.query.sid;
  if (!sessionId) return res.status(400).json({ error: "Missing session ID" });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Extract minimal fields needed
    const result = {
      amount_total: session.amount_total,
      currency: session.currency
    };

    res.json(result);
  } catch (err) {
    console.error("Stripe session fetch error:", err.message);
    res.status(500).json({ error: "Failed to retrieve session" });
  }
});

app.listen(PORT, () => console.log(`✅ Server listening on port ${PORT}`));