import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const learn = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/learn' }),
  schema: z.object({
    title: z.string(), metaTitle: z.string().max(60), metaDescription: z.string().max(155),
    slug: z.string(), date: z.coerce.date(), updated: z.coerce.date(),
    keyword: z.string(), supporting: z.array(z.string()).default([]),
    answer: z.string(), calculator: z.string().optional(),
    cta: z.object({ title: z.string(), body: z.string(), button: z.string(), href: z.string() }),
    faq: z.array(z.object({ q: z.string(), a: z.string() })),
    teaser: z.string(),
  }),
});
const changelog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/changelog' }),
  schema: z.object({ date: z.coerce.date(), title: z.string(), summary: z.string().max(200) }),
});
export const collections = { learn, changelog };
