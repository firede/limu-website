export const siteDescription = 'limu is a diagram layout engine in Rust and Go. It reads Mermaid and leaves the drawing to your program.';
export const repositoryUrl = 'https://github.com/firede/limu';
export const rustRepositoryUrl = 'https://github.com/firede/limu-rs';
export const modulePath = 'github.com/firede/limu';

// The pages, in the order the navigation lists them. The home page and the examples are
// pages of their own; the other pages have a Markdown source in content/docs. A page of a
// backend that only one language has names it.
export const docsPages = [
  { id: 'introduction', title: 'Introduction' },
  { id: 'examples', title: 'Examples' },
  { id: 'getting-started', title: 'Getting started' },
  { id: 'api', title: 'API' },
  { id: 'theming', title: 'Theming' },
  { id: 'svg', title: 'SVG' },
  { id: 'tiny-skia', title: 'tiny-skia', language: 'rust' },
  { id: 'core-graphics', title: 'Core Graphics', language: 'rust' },
  { id: 'gpui', title: 'GPUI', language: 'rust' },
  { id: 'terminal', title: 'Terminal', language: 'rust' },
  { id: 'mygo', title: 'MyGo', language: 'go' },
  { id: 'architecture', title: 'Architecture' },
  { id: 'compatibility', title: 'Compatibility' },
] as const;

export const languageTitles = { rust: 'Rust', go: 'Go' } as const;

export type DocsPageId = typeof docsPages[number]['id'];

export const pageHref = (id: DocsPageId): string => (id === 'introduction' ? '/' : `/${id}`);

export interface Heading {
  depth: number;
  slug: string;
  text: string;
}
