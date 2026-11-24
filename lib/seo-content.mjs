// Search copy for the starter articles: keyword-led SEO titles, fuller meta descriptions, meta
// keywords and in-body links between related guides (from the Nov 2026 SEO audits).
//
// Article text lives in the database, so these upgrades are applied when articles are read. Each
// field is replaced only while the database still holds the original starter text ("from"), so
// anything staff edit in the admin panel always wins.

export const starterArticleSeo = {
  "what-is-ivf": {
    seoTitle: { from: "What Is IVF? Understanding In Vitro Fertilisation", to: "What Is IVF? In Vitro Fertilisation Explained" },
    metaDescription: {
      from: "A clear introduction to IVF, why it may be recommended, and what can influence outcomes.",
      to: "What is IVF? Learn how in vitro fertilisation works, why a fertility specialist may recommend it, who can consider it and what affects IVF success.",
    },
    keywords: ["what is IVF", "in vitro fertilisation", "IVF meaning", "IVF treatment", "how IVF works", "IVF success factors"],
    anchor: "What is IVF and how does it work?",
    related: ["ivf-treatment-process", "ivf-vs-iui", "myth-multiple-pregnancy", "fertility-first-steps"],
  },
  "ivf-treatment-process": {
    seoTitle: { from: "IVF Treatment Process: A Step-by-Step Guide", to: "IVF Process Step by Step: Stages of IVF Treatment" },
    metaDescription: {
      from: "Learn about the common stages of IVF, from the first assessment to a pregnancy test.",
      to: "The IVF treatment process step by step: fertility assessment, ovarian stimulation, egg retrieval, fertilisation, embryo transfer and the pregnancy test.",
    },
    keywords: ["IVF process", "IVF treatment process", "IVF steps", "stages of IVF", "egg retrieval", "embryo transfer"],
    anchor: "The IVF treatment process, step by step",
    related: ["what-is-ivf", "ivf-vs-iui", "myth-multiple-pregnancy", "supporting-wellbeing"],
  },
  "ivf-vs-iui": {
    seoTitle: { from: "IVF vs IUI: Understanding the Difference", to: "IVF vs IUI: Key Differences and Which May Suit You" },
    metaDescription: {
      from: "Compare how IUI and IVF work and why the right treatment depends on individual needs.",
      to: "IVF vs IUI explained: how each fertility treatment works, the key differences, who each may suit, and why the right choice depends on your diagnosis.",
    },
    keywords: ["IVF vs IUI", "difference between IVF and IUI", "IUI treatment", "intrauterine insemination", "IVF or IUI"],
    anchor: "IVF vs IUI: the key differences",
    related: ["what-is-ivf", "ivf-treatment-process", "pcos-and-infertility", "fertility-and-partners"],
  },
  "pcos-and-infertility": {
    // The H1 keeps the question form; a different <title> stops the "duplicate H1 and title" warning.
    seoTitle: { from: "PCOS and Infertility: Can You Get Pregnant with PCOS?", to: "PCOS and Fertility: Getting Pregnant with PCOS" },
    metaDescription: {
      from: "Understand how PCOS can affect ovulation and what fertility options a clinician may discuss.",
      to: "Can you get pregnant with PCOS? How PCOS affects ovulation and fertility, and the lifestyle, ovulation induction, IUI and IVF options doctors discuss.",
    },
    keywords: ["PCOS and infertility", "getting pregnant with PCOS", "PCOS fertility treatment", "PCOS and ovulation", "polycystic ovary syndrome"],
    anchor: "PCOS and infertility: can you get pregnant with PCOS?",
    related: ["understanding-ovulation", "ivf-vs-iui", "fertility-first-steps"],
  },
  "myth-multiple-pregnancy": {
    seoTitle: { from: "Does fertility treatment always mean twins?", to: "IVF and Twins: Does Fertility Treatment Mean Twins?" },
    metaDescription: {
      from: "A closer look at treatment choices and the chance of multiple pregnancy.",
      to: "Does IVF or fertility treatment always mean twins? How embryo transfer choices affect the chance of a multiple pregnancy, and what to ask your doctor.",
    },
    keywords: ["IVF twins", "fertility treatment twins", "multiple pregnancy", "embryo transfer", "IVF multiple pregnancy risk"],
    anchor: "Does IVF always mean twins?",
    related: ["ivf-treatment-process", "what-is-ivf", "fertility-first-steps"],
  },
  "fertility-and-partners": {
    title: { from: "Fertility care includes both partners", to: "Male and Female Infertility: Why Both Partners Are Assessed" },
    seoTitle: { from: "Fertility care includes both partners", to: "Male and Female Infertility: Why Both Partners Count" },
    metaDescription: {
      from: "Why a whole-picture approach can make evaluation more thoughtful.",
      to: "Infertility can involve male factors, female factors, both partners or no clear cause. Learn why a fertility evaluation often includes both partners.",
    },
    keywords: ["male infertility", "female infertility", "infertility causes", "fertility testing for couples", "fertility evaluation for both partners"],
    anchor: "Male and female infertility: why both partners are assessed",
    related: ["fertility-first-steps", "what-is-ivf", "supporting-wellbeing"],
  },
  "understanding-ovulation": {
    title: { from: "Understanding ovulation, without the overwhelm", to: "Understanding Ovulation: Your Cycle, Signs and Timing" },
    seoTitle: { from: "Understanding ovulation, without the overwhelm", to: "Ovulation Explained: Cycle, Signs and Fertile Window" },
    metaDescription: {
      from: "A clear starting point for learning about the menstrual cycle and timing.",
      to: "Ovulation explained in plain language: how the menstrual cycle varies, common signs of ovulation, cycle tracking, and when to talk to a clinician.",
    },
    keywords: ["ovulation", "signs of ovulation", "fertile window", "menstrual cycle", "ovulation tracking", "trying to conceive"],
    anchor: "Understanding ovulation and your cycle",
    related: ["pcos-and-infertility", "fertility-first-steps", "fertility-and-partners"],
  },
  "supporting-wellbeing": {
    title: { from: "Caring for your wellbeing while trying to conceive", to: "Emotional Wellbeing While Trying to Conceive" },
    seoTitle: { from: "Caring for your wellbeing while trying to conceive", to: "Emotional Wellbeing While Trying to Conceive" },
    metaDescription: {
      from: "Small, compassionate ways to support yourself through an uncertain season.",
      to: "Trying to conceive can be emotionally demanding. Gentle, practical ways to care for your wellbeing, find support and talk openly with your care team.",
    },
    keywords: ["trying to conceive", "fertility stress", "emotional wellbeing", "infertility support", "mental health and fertility"],
    anchor: "Emotional wellbeing while trying to conceive",
    related: ["fertility-first-steps", "fertility-and-partners", "myth-multiple-pregnancy"],
  },
  "fertility-first-steps": {
    title: { from: "A gentle guide to your first fertility conversation", to: "Your First Fertility Consultation: What to Expect" },
    seoTitle: { from: "A gentle guide to your first fertility conversation", to: "First Fertility Consultation: What to Expect" },
    metaDescription: {
      from: "What to expect, what to bring, and how to make space for your questions.",
      to: "Preparing for your first fertility consultation? What a first visit may include, questions worth writing down, and how to make the conversation yours.",
    },
    keywords: ["first fertility consultation", "fertility doctor appointment", "questions to ask a fertility specialist", "fertility consultation"],
    anchor: "Your first fertility consultation: what to expect",
    related: ["understanding-ovulation", "fertility-and-partners", "what-is-ivf", "supporting-wellbeing"],
  },
};

// ivf-explained repeated what-is-ivf and ivf-treatment-process (keyword cannibalisation flagged in
// both audits). It is hidden from listings and permanently redirected (see next.config.mjs).
export const retiredArticles = { "ivf-explained": "/article/ivf-treatment-process" };

const categoryKeywords = {
  "Treatment options": ["fertility treatment", "IVF treatment"],
  "Fertility basics": ["fertility basics", "trying to conceive"],
  "Getting started": ["fertility consultation", "fertility specialist"],
  "Myths & facts": ["IVF myths and facts", "fertility myths"],
  Wellbeing: ["fertility and wellbeing", "trying to conceive"],
};

export const siteKeywords = ["fertility", "IVF", "IVF treatment", "fertility treatment", "fertility care India"];

// Applies the upgrades above to an article read from the database or the starter content.
export function withSearchCopy(article) {
  const key = article.slug || article.id;
  const seo = starterArticleSeo[key] || starterArticleSeo[article.id];
  const next = { ...article };
  if (seo) {
    for (const field of ["title", "seoTitle", "metaDescription"]) {
      const change = seo[field];
      if (change && (!next[field] || next[field] === change.from)) next[field] = change.to;
    }
    // When only the H1 was upgraded, keep the SEO title from following the old heading.
    if (!next.seoTitle) next.seoTitle = next.title;
  }
  next.keywords = seo?.keywords || [...new Set([...(categoryKeywords[article.category] || []), "fertility", "IVF"])];
  next.relatedIds = seo?.related || [];
  return next;
}

export const relatedAnchor = article => starterArticleSeo[article.slug || article.id]?.anchor || article.title;

// Links each myth to the article that explains it in more depth.
const mythGuides = [
  [/twins|multiple pregnanc/i, "myth-multiple-pregnancy"],
  [/woman’s problem|women’s issue|woman's problem/i, "fertility-and-partners"],
  [/painful/i, "ivf-treatment-process"],
  [/last option|only fertility treatment/i, "ivf-vs-iui"],
  [/always successful|unnatural/i, "what-is-ivf"],
  [/wait a year/i, "fertility-first-steps"],
  [/stress/i, "supporting-wellbeing"],
];
export function mythGuideSlug(mythText, publishedSlugs) {
  const match = mythGuides.find(([pattern, slug]) => pattern.test(mythText) && publishedSlugs.has(slug));
  return match?.[1] || "";
}
