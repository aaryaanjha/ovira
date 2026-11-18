<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# OVIRA website engineering rules

- Follow healthcare accuracy, privacy, accessibility, and conversion rules in `WEBSITE_GROWTH_RULEBOOK.md`.
- Do not publish fertility guarantees, fabricated reviews, fear-based claims, or unverifiable success statistics.
- Keep initial appointment forms limited to low-risk contact details. Never collect diagnoses or medical records through marketing forms.
- Preserve a single H1 per page, unique metadata, canonical URLs, semantic headings, internal links, and crawlable content.
- Use Server Components for content and keep Client Components limited to interaction.
- Validate and sanitize all server-side input; never log sensitive lead data.
- Do not send names, phone numbers, email addresses, diagnoses, or appointment notes to analytics or pixels.
- Keep mobile navigation, forms, focus states, labels, contrast, reduced-motion behavior, and touch targets accessible.
- Optimize and size images. Use AVIF/WebP and lazy-load below-the-fold media.
- Add schema only when it accurately describes visible content. Never fabricate ratings or credentials.
- Run `npm run build` and inspect changed routes in desktop and mobile viewports before release.
