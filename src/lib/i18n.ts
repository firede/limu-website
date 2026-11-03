// The languages the site is written in, English and Simplified Chinese. English is at the
// root, and Chinese at the same paths under /zh. The playgrounds are in English alone.

import { docsPages, type DocsPageId } from './site.ts';

export type Locale = 'en' | 'zh';

export const htmlLang: Record<Locale, string> = { en: 'en', zh: 'zh-Hans' };

// A page's pathname is /zh, /zh/ or /zh.html for the Chinese home page as Astro builds it.
export const localeOf = (pathname: string): Locale => (/^\/zh(?:\/|\.html$|$)/.test(pathname) ? 'zh' : 'en');

// The path of an English page in a locale.
export const localePath = (locale: Locale, path: string): string => {
  if (locale === 'en') return path;
  return path === '/' ? '/zh' : `/zh${path}`;
};

// The path of a page in English, from its path in either locale.
export const englishPath = (pathname: string): string => {
  const path = pathname.replace(/\.html$/, '').replace(/\/index$/, '/').replace(/(.)\/$/, '$1');
  if (path === '/zh') return '/';
  return path.startsWith('/zh/') ? path.slice(3) : path;
};

// The pages written in both languages. The examples' pages are, too, with the diagrams and the
// examples' titles in English, as limu's gallery writes them.
const translated = (path: string): boolean =>
  path === '/' || path === '/examples' || /^\/examples\/[^/]+$/.test(path)
  || docsPages.some((page) => page.id !== 'introduction' && path === `/${page.id}`);

// The same page in the other locale, or undefined for a page in English alone.
export const alternatePath = (pathname: string): { locale: Locale; path: string } | undefined => {
  const path = englishPath(pathname);
  if (!translated(path)) return undefined;
  const other: Locale = localeOf(pathname) === 'zh' ? 'en' : 'zh';
  return { locale: other, path: localePath(other, path) };
};

// A link in a document, taken to the page in the document's locale where there is one. The
// Chinese documents link to the English paths, as the English ones do, and are taken to
// their own pages here and in their Markdown.
export const localizeHref = (locale: Locale, href: string): string => {
  if (locale === 'en' || !href.startsWith('/') || href.startsWith('//')) return href;
  const [, path, hash = ''] = href.match(/^([^#]*)(#.*)?$/) ?? [];
  const markdown = path.endsWith('.md');
  const page = markdown ? (path === '/index.md' ? '/' : path.slice(0, -3)) : path;
  if (!translated(page)) return href;
  // The examples' Markdown is in English alone.
  if (markdown && page.startsWith('/examples')) return href;
  const localized = localePath(locale, page);
  return `${markdown ? (page === '/' ? '/zh/index' : localized) + '.md' : localized}${hash}`;
};

export const pageTitle = (locale: Locale, id: DocsPageId): string => {
  const page = docsPages.find((p) => p.id === id)!;
  return locale === 'zh' ? page.zh : page.title;
};

// The words of the site's own pages and controls.
export const ui = {
  en: {
    siteDescription: 'limu is a diagram layout engine in Rust and Go. It reads Mermaid and leaves the drawing to your program.',
    homeTitle: 'limu · Mermaid diagrams, laid out in Rust and Go',
    socialImageAlt: 'limu, a diagram layout engine in Rust and Go, under the sea, with how it works drawn in bubbles of glass rising from limu kohu.',
    asMarkdown: 'as Markdown',
    home: 'limu home',
    mainNavigation: 'Main navigation',
    language: 'Language',
    playground: 'Playground',
    documentation: 'Documentation',
    documentationMenu: 'Documentation menu',
    openMenu: 'Open documentation menu',
    closeMenu: 'Close documentation menu',
    switchTheme: 'Switch between light and dark',
    themeTitle: 'Light or dark',
    otherLocale: '中文',
    otherLocaleLabel: '阅读中文版',
    copyCode: 'Copy code',
    copied: 'Copied',
    copyMarkdown: 'Copy Markdown',
    copyFailed: 'Copy failed',
    viewMarkdown: 'View Markdown',
    table: (heading: string) => (heading ? `${heading} table` : 'Table'),
    pictureCaption: 'One scene, laid out once and drawn four ways',
    footerNavigation: 'Footer navigation',
    footerGroups: { start: 'Start', guides: 'Guides', backends: 'Backends', project: 'Project' },
    onGitHub: (name: string) => `${name} on GitHub`,
    footerNote: ['limu-rs and limu are open source under the MIT license, in ', 'Rust', ' and in ', 'Go', '. Both are ported from ', 'Pele', ', by the Obsidian team.'],
    diagramTheme: 'Theme',
    copySource: ['Copy', ' source'],
    openInPlayground: ['Open in ', 'Playground'],
  },
  zh: {
    siteDescription: 'limu 是一个用 Rust 和 Go 编写的图表布局引擎。它读取 Mermaid，把绘制交给你的程序。',
    homeTitle: 'limu · 用 Rust 和 Go 布局 Mermaid 图表',
    socialImageAlt: 'limu，用 Rust 和 Go 编写的图表布局引擎，置身海底。它的工作方式画在从 limu kohu 升起的玻璃气泡里。',
    asMarkdown: '的 Markdown',
    home: 'limu 首页',
    mainNavigation: '主导航',
    language: '编程语言',
    playground: 'Playground',
    documentation: '文档',
    documentationMenu: '文档菜单',
    openMenu: '打开文档菜单',
    closeMenu: '关闭文档菜单',
    switchTheme: '切换浅色与深色',
    themeTitle: '浅色或深色',
    otherLocale: 'English',
    otherLocaleLabel: 'Read in English',
    copyCode: '复制代码',
    copied: '已复制',
    copyMarkdown: '复制 Markdown',
    copyFailed: '复制失败',
    viewMarkdown: '查看 Markdown',
    table: (heading: string) => (heading ? `表格：${heading}` : '表格'),
    pictureCaption: '同一个场景，只布局一次，用四种方式绘制',
    footerNavigation: '页脚导航',
    footerGroups: { start: '开始', guides: '指南', backends: '后端', project: '项目' },
    onGitHub: (name: string) => `GitHub 上的 ${name}`,
    footerNote: ['limu-rs 和 limu 以 MIT 许可证开源，分别用 ', 'Rust', ' 和 ', 'Go', ' 编写，都移植自 Obsidian 团队的 ', 'Pele', '。'],
    diagramTheme: '主题',
    copySource: ['复制', '源码'],
    openInPlayground: ['在 ', 'Playground', ' 中打开'],
  },
} as const;
