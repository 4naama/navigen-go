// Adds <meta name="cf-country" content="XX"> to HTML responses
export default {
  async fetch(req, env) {
    // serve your static asset
    const res = await env.ASSETS.fetch(req);

    // only rewrite HTML
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("text/html")) return res;

    const country = req.cf?.country || "US";

    // inject a meta your JS already reads
    return new HTMLRewriter()
      .on("head", {
        element(e) {
          e.append(
            `<meta name="cf-country" content="${country}">`,
            { html: true }
          );
        }
      })
      .transform(res);
  }
};
