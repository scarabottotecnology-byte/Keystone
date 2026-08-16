import type { ComponentType } from "react";

export type PostMeta = {
  slug: string;
  title: string;
  description: string;
  date: string; // ISO
  readingTime: string;
  category: string;
  author: string;
};

export type PostModule = {
  meta: PostMeta;
  default: ComponentType;
};

const modules = import.meta.glob<PostModule>("./posts/*.tsx", { eager: true });

export const posts: PostModule[] = Object.values(modules).sort(
  (a, b) => new Date(b.meta.date).getTime() - new Date(a.meta.date).getTime(),
);

export function getPost(slug: string): PostModule | undefined {
  return posts.find((p) => p.meta.slug === slug);
}
