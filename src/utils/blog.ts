import { getCollection, type CollectionEntry } from 'astro:content';

export type BlogPost = CollectionEntry<'blog'>;

export interface TagCount {
  name: string;
  slug: string;
  count: number;
}

export async function getPublishedPosts(): Promise<BlogPost[]> {
  const posts = await getCollection('blog', ({ data }) => {
    return import.meta.env.PROD ? !data.draft : true;
  });

  return posts.sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );
}

export function slugifyTag(tag: string): string {
  return tag.trim().toLowerCase().replace(/\s+/g, '-');
}

export function getTagHref(tag: string): string {
  return `/blog/tags/${encodeURIComponent(slugifyTag(tag))}`;
}

export function getAllTags(posts: BlogPost[]): TagCount[] {
  const map = new Map<string, TagCount>();

  for (const post of posts) {
    for (const tag of post.data.tags) {
      const slug = slugifyTag(tag);
      const existing = map.get(slug);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(slug, { name: tag, slug, count: 1 });
      }
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name),
  );
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function formatIsoDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function estimateReadingTime(body: string | undefined): number {
  if (!body) return 1;

  const plainText = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/\$[^$\n]+\$/g, ' ')
    .replace(/[#*_`>~[\]()-]/g, ' ');

  const cjkChars = (
    plainText.match(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/g) ?? []
  ).length;
  const latinWords = plainText
    .replace(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  const minutes = cjkChars / 500 + latinWords / 220;
  return Math.max(1, Math.round(minutes));
}
