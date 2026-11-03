import type { APIRoute } from 'astro';
import { formatPageTitle } from '../../lib/page-title';
import { getDoc, plainMarkdown, zhDocs } from '../../lib/docs';
import type { DocsPageId } from '../../lib/site';

export function getStaticPaths() {
  return zhDocs.map((doc) => ({ params: { page: doc.id } }));
}

export const GET: APIRoute = ({ params }) => new Response(plainMarkdown(getDoc(params.page as DocsPageId, 'zh').source, 'zh').replace(
  /^title: (.+)$/m, (_line, title: string) => `title: ${formatPageTitle(title, 'zh')}`,
), {
  headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
});
