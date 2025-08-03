require('dotenv').config();

const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();

// Enable CORS for local dev and production frontend
app.use(cors({
  origin: ["http://localhost:8000", "https://navigen-go.onrender.com", "https://navi.genuni.io"],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(express.static('public'));
app.use(express.json());

const priceIds = {
  3: 'price_1RnwRPFf2RZOYEdOOZI397PD',    // ☕
  5: 'price_1RnwT4Ff2RZOYEdOX9SJaDPC',    // 🎈
  10: 'price_1RnwToFf2RZOYEdOWGzwmAwY'    // 🚀
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
      success_url: 'https://navi.genuni.io/?thanks',
      cancel_url: 'https://navi.genuni.io/?cancel'
    });

    res.json({ sessionId: session.id });
  } catch (err) {
    console.error("Stripe error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`✅ Server listening on port ${PORT}`));