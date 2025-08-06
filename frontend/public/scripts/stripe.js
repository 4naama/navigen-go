let stripe;

/**
 * ✅ Initializes Stripe with the public key.
 * This assumes Stripe.js is already loaded via script tag in HTML.
 */
export function initStripe(publicKey) {
  try {
    if (!window.Stripe) {
      console.error("❌ Stripe.js not loaded in DOM.");
      return;
    }

    if (!publicKey || typeof publicKey !== "string") {
      console.warn("⚠️ No Stripe public key provided");
      return;
    }

    // 🎯 Detect supported locale
    const supportedLocales = [
      "auto", "en", "fr", "de", "es", "it", "ja", "zh", "nl", "pl", "pt",
      "sv", "da", "fi", "nb", "cs", "hu", "sk"
    ];

    const rawLang = localStorage.getItem("lang") || navigator.language.slice(0, 2).toLowerCase() || "en";
    const stripeLocale = supportedLocales.includes(rawLang) ? rawLang : "en";
    console.log("📦 Stripe locale:", stripeLocale);

    stripe = Stripe(publicKey, { locale: stripeLocale });
    console.log("✅ Stripe initialized");
  } catch (err) {
    console.error("❌ Stripe init failed:", err);
  }
}

export async function handleDonation(amount, meta = {}) {
  if (!stripe) {
    console.error("❌ Stripe not initialized");
    return;
  }

  // Show loader (only if available in global scope)
  if (typeof showStripeLoader === "function") showStripeLoader();

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
    const res = await fetch("https://navigen-go.onrender.com/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.sessionId) {
      const fallback = await res.text().catch(() => "");
      console.error("❌ Server error:", data || fallback);
      throw new Error("Invalid session response");
    }

    const result = await stripe.redirectToCheckout({ sessionId: data.sessionId });
    if (result.error) {
      console.error("❌ Stripe redirect error:", result.error.message);
    }
  } catch (err) {
    console.error("❌ handleDonation failed:", err);
    alert("Something went wrong. Please try again.");
  } finally {
    if (typeof hideStripeLoader === "function") hideStripeLoader();
  }
}
