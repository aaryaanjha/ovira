import { siteOrigin, siteUrl } from "../lib/seo.mjs";

// Search engines and AI search/answer crawlers are welcomed explicitly so OVIRA can appear in
// Google, Bing/Copilot, ChatGPT search, Perplexity, Claude and Apple results. Staff and API
// routes stay private for every crawler. Verify user-agent names against vendor docs yearly.
const searchAndAnswerCrawlers = [
  "Googlebot", "Bingbot", "OAI-SearchBot", "ChatGPT-User", "PerplexityBot", "Perplexity-User",
  "Claude-SearchBot", "Claude-User", "Applebot", "DuckDuckBot",
];
// Training crawlers: allowing them helps future AI models know the brand. Change to disallow
// "/" here if OVIRA decides not to license its content for model training.
const trainingCrawlers = ["GPTBot", "ClaudeBot", "Google-Extended", "Applebot-Extended", "CCBot"];
const privatePaths = ["/admin", "/api/"];

export default function robots() {
  return {
    rules: [
      { userAgent: searchAndAnswerCrawlers, allow: "/", disallow: privatePaths },
      { userAgent: trainingCrawlers, allow: "/", disallow: privatePaths },
      { userAgent: "*", allow: "/", disallow: privatePaths },
    ],
    sitemap: siteUrl("/sitemap.xml"),
    host: siteOrigin,
  };
}
