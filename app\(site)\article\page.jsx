import { redirect } from "next/navigation";
import { publicArticles } from "../../../lib/store.mjs";

export default async function LegacyArticle({ searchParams }) {
  const { id } = await searchParams;
  const article = typeof id === "string" ? id : (await publicArticles())[0]?.id;
  redirect(article ? "/article/" + encodeURIComponent(article) : "/blogs");
}
