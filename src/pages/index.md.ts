import type { APIRoute } from 'astro';
import content from '../content/pages/index.md?raw';
import { plainMarkdown } from '../lib/docs';

export const GET: APIRoute = () => new Response(plainMarkdown(content), {
  headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
});
