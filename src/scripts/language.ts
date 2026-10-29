// The language a reader reads limu in, Go or Rust, picked once for the whole site. The
// script in BaseLayout's head sets it on the root, as data-lang, before the page is drawn,
// and CSS shows only what is for it. Go is the language until another is picked.

import { repositoryUrl, rustRepositoryUrl } from '../lib/site';

export type Language = 'go' | 'rust';

const storageKey = 'limu-lang';

export const currentLanguage = (): Language => (document.documentElement.dataset.lang === 'rust' ? 'rust' : 'go');

// The playground of a language: limumygo's for Go, and limu-rs's for Rust.
export const playgroundPath = (language: Language) => (language === 'rust' ? '/playground/rust' : '/playground');

function show(language: Language) {
  document.documentElement.dataset.lang = language;
  document.querySelectorAll<HTMLButtonElement>('[data-lang-tab]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.langTab === language));
  });
  // Links to the playground go to the one of the language, keeping what they carry.
  document.querySelectorAll<HTMLAnchorElement>('a[data-playground-link]').forEach((link) => {
    const url = new URL(link.href);
    url.pathname = playgroundPath(language);
    link.href = url.toString();
  });
  // The link to GitHub goes to the repository of the language.
  document.querySelectorAll<HTMLAnchorElement>('a[data-repository-link]').forEach((link) => {
    link.href = language === 'rust' ? rustRepositoryUrl : repositoryUrl;
    link.setAttribute('aria-label', `${language === 'rust' ? 'limu-rs' : 'limu'} on GitHub`);
  });
  document.dispatchEvent(new CustomEvent('limu:language', { detail: language }));
}

// A tab of a language picks it. What is above the tab changes height as the language
// changes, so the page is scrolled to keep the tab where the reader clicked it.
export function setupLanguage() {
  show(currentLanguage());
  document.addEventListener('click', (event) => {
    const button = (event.target as Element).closest<HTMLButtonElement>('[data-lang-tab]');
    const language = button?.dataset.langTab;
    if (!button || (language !== 'go' && language !== 'rust') || language === currentLanguage()) return;
    const top = button.getBoundingClientRect().top;
    show(language);
    try { localStorage.setItem(storageKey, language); } catch {}
    window.scrollBy(0, button.getBoundingClientRect().top - top);
  });
}
