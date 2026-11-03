export const siteDescription = 'limu is a diagram layout engine in Rust and Go. It reads Mermaid and leaves the drawing to your program.';
export const repositoryUrl = 'https://github.com/firede/limu';
export const rustRepositoryUrl = 'https://github.com/firede/limu-rs';
export const modulePath = 'github.com/firede/limu';

// The pages, in the order the navigation lists them. The home page and the examples are
// pages of their own; the other pages have a Markdown source in content/docs. A page of a
// backend that only one language has names it. zh is a page's title in Chinese.
export const docsPages = [
  { id: 'introduction', title: 'Introduction', zh: '简介' },
  { id: 'examples', title: 'Examples', zh: '示例' },
  { id: 'getting-started', title: 'Getting started', zh: '快速上手' },
  { id: 'api', title: 'API', zh: 'API' },
  { id: 'theming', title: 'Theming', zh: '主题' },
  { id: 'svg', title: 'SVG', zh: 'SVG' },
  { id: 'tiny-skia', title: 'tiny-skia', zh: 'tiny-skia', language: 'rust' },
  { id: 'core-graphics', title: 'Core Graphics', zh: 'Core Graphics', language: 'rust' },
  { id: 'gpui', title: 'GPUI', zh: 'GPUI', language: 'rust' },
  { id: 'terminal', title: 'Terminal', zh: '终端', language: 'rust' },
  { id: 'mygo', title: 'MyGo', zh: 'MyGo', language: 'go' },
  { id: 'architecture', title: 'Architecture', zh: '架构' },
  { id: 'compatibility', title: 'Compatibility', zh: '兼容性' },
] as const;

export const languageTitles = { rust: 'Rust', go: 'Go' } as const;

export type DocsPageId = typeof docsPages[number]['id'];

export const pageHref = (id: DocsPageId): string => (id === 'introduction' ? '/' : `/${id}`);

export interface Heading {
  depth: number;
  slug: string;
  text: string;
}
