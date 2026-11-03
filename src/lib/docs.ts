import type { MarkdownInstance } from 'astro';
import { localizeHref, type Locale } from './i18n';
import { docsPages, type DocsPageId } from './site';

interface DocFrontmatter {
  title: string;
  description: string;
}

// The documents in English are in content/docs, and in Chinese in content/zh/docs, under the
// same names.
const modules = {
  en: import.meta.glob<MarkdownInstance<DocFrontmatter>>('../content/docs/*.md', { eager: true }),
  zh: import.meta.glob<MarkdownInstance<DocFrontmatter>>('../content/zh/docs/*.md', { eager: true }),
};
const sources = {
  en: import.meta.glob<string>('../content/docs/*.md', { eager: true, query: '?raw', import: 'default' }),
  zh: import.meta.glob<string>('../content/zh/docs/*.md', { eager: true, query: '?raw', import: 'default' }),
};
const directory = { en: '../content/docs', zh: '../content/zh/docs' };

const docsIn = (locale: Locale) => docsPages.filter((page) => `${directory[locale]}/${page.id}.md` in modules[locale]).map((page) => {
  const key = `${directory[locale]}/${page.id}.md`;
  return { ...page, module: modules[locale][key], source: sources[locale][key] };
});

export const docs = docsIn('en');
export const zhDocs = docsIn('zh');

export const docsFor = (locale: Locale) => (locale === 'zh' ? zhDocs : docs);

export const getDoc = (id: DocsPageId, locale: Locale = 'en') => docsFor(locale).find((doc) => doc.id === id)!;

// A document's Markdown as an agent reads it, with the names the site shows for one language
// only, written `go:Name` and `rust:name`, marked with their language in words. A Chinese
// document's links go to the Chinese pages, and its headings lose the ids they are given
// with {#id}, which keep them at the English headings' anchors.
export const plainMarkdown = (source: string, locale: Locale = 'en') => {
  const named = source.replace(
    /`(go|rust):([^`]+)`/g, (_code, lang: string, name: string) => `\`${name}\` (${lang === 'go' ? 'Go' : 'Rust'})`,
  );
  if (locale === 'en') return named;
  return named
    .replace(/^(#{1,6} .*?) \{#[\w-]+\}$/gm, '$1')
    .replace(/\]\((\/[^)\s]*)\)/g, (_link, href: string) => `](${localizeHref(locale, href)})`);
};

// The Chinese documents have the English ones' headings, in the same order and with the same
// anchors, so that a link to a heading leads to it in either, and the switch between the
// languages keeps the reader's place. The build fails when they differ.
export function checkHeadings(id: DocsPageId) {
  const en = getDoc(id, 'en').module.getHeadings().map((h) => `${h.depth} ${h.slug}`);
  const zh = getDoc(id, 'zh').module.getHeadings().map((h) => `${h.depth} ${h.slug}`);
  if (en.join('\n') !== zh.join('\n')) {
    throw new Error(`content/zh/docs/${id}.md has other headings than content/docs/${id}.md:\nEnglish: ${en.join(', ')}\nChinese: ${zh.join(', ')}`);
  }
}
