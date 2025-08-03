// stripe.js
let stripe;

/**
 * ✅ Initializes Stripe with the public key.
 * Call once, after DOMContentLoaded.
 */
export function initStripe(publicKey) {
  if (!window.Stripe) {
    console.warn("❌ Stripe.js not loaded");
    return;
  }

  stripe = Stripe(publicKey);
  console.log("✅ Stripe initialized");
}

/**
 * 💳 Handle a donation or product purchase
 *
 * @param {number} amount - Donation amount (in €)
 * @param {Object} meta - Optional metadata (e.g., { type: "donation", userId: "xyz" })
 */
export async function handleDonation(amount, meta = {}) {
  if (!stripe) {
    console.error("❌ Stripe not initialized");
    return;
  }

  const payload = {
    amount,
    currency: "eur",
    metadata: {
      ...meta,
      origin: "app",
      ts: Date.now()
    }
  };

  try {
    // 🔄 Call backend to create Checkout Session
    const res = await fetch("https://navigen-payment.onrender.com/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data || !data.sessionId) {
      const fallback = await res.text().catch(() => "");
      console.error("❌ Server response error:", data || fallback);
      throw new Error("Invalid session response");
    }

    // 🚀 Redirect using sessionId (best practice)
    const result = await stripe.redirectToCheckout({ sessionId: data.sessionId });

    if (result.error) {
      console.error("❌ Stripe redirect error:", result.error.message);
    }

  } catch (err) {
    console.error("❌ Failed to start Stripe flow:", err);
    alert("Error contacting payment system. Please try again.");
  }
}
