import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import BlogArticle from "./BlogArticle";
import { blogPostImage } from "@/lib/blogData";
import { absoluteUrl, createPageMetadata } from "@/lib/seo";
import { getPublishedBlogPost, getPublishedBlogPosts } from "@/lib/serverContent";

export const revalidate = 3600;

type BlogPostPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedBlogPost(slug);
  if (!post) return { title: "Travel Guide Not Found", robots: { index: false, follow: false } };

  const description =
    post.seoDescription || post.excerpt || "A travel guide from the CompareMyTrip travel desk.";
  return createPageMetadata({
    title: post.seoTitle || post.title,
    description,
    path: `/blog/${post.id}`,
    image: blogPostImage(post) || "/images/destinations-header-banner.jpg",
    imageAlt: post.coverAlt || post.title,
    type: "article",
  });
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const posts = await getPublishedBlogPosts();
  const post = posts.find((item) => item.id === slug);
  if (!post) notFound();

  const description = post.seoDescription || post.excerpt;
  const cover = blogPostImage(post);
  const articleUrl = absoluteUrl(`/blog/${post.id}`);

  return (
    <>
      <Header />
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
              { "@type": "ListItem", position: 2, name: "Travel guides", item: absoluteUrl("/blog") },
              { "@type": "ListItem", position: 3, name: post.title, item: articleUrl },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description,
            datePublished: post.publishedAt,
            author: { "@type": "Person", name: post.author },
            image: cover ? absoluteUrl(cover) : undefined,
            mainEntityOfPage: articleUrl,
            publisher: { "@id": absoluteUrl("/#organization") },
            inLanguage: "en-IN",
          },
        ]}
      />
      <BlogArticle initialPost={post} initialPosts={posts} />
      <Footer />
    </>
  );
}
