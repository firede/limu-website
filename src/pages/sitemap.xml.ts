import type { APIRoute } from 'astro';
import { docs, zhDocs } from '../lib/docs';
import { exampleTypeHref, exampleTypes } from '../lib/examples';
import { localePath } from '../lib/i18n';
import { pageHref } from '../lib/site';

export const GET: APIRoute = ({ site }) => {
  const pages = (locale: 'en' | 'zh', documents: typeof docs) => [pageHref('introduction'), pageHref('examples'), ...exampleTypes.map(({ type }) => exampleTypeHref(type)), ...documents.map(({ id }) => pageHref(id))].map((route) => localePath(locale, route));
  const routes = [...pages('en', docs), '/playground', ...pages('zh', zhDocs)];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map((route) => `<url><loc>${new URL(route, site)}</loc></url>`).join('')}</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
};
