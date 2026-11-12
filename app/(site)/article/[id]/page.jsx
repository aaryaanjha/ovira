import { cache } from "react";
import { notFound } from "next/navigation";
import { ArticleView } from "../../../../components/PublicContent";
import { publicArticles } from "../../../../lib/store.mjs";

const loadArticles = cache(publicArticles);

export async function generateMetadata({ params }) {
  const { id } = await params;
  const article = (await loadArticles()).find(item => item.id === id);
  return article ? { title: article.title, description: article.description } : {};
}

export default async function Article({ params }) {
  const { id } = await params;
  const articles = await loadArticles();
  const index = articles.findIndex(item => item.id === id);
  if (index === -1) notFound();
  return <ArticleView article={articles[index]} related={articles.filter(item => item.id !== id).slice(0, 3)} index={index} />;
}
