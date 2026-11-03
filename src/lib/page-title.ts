import { ui, type Locale } from './i18n';

export function formatPageTitle(title?: string, locale: Locale = 'en'): string {
  return title ? `${title} · limu` : ui[locale].homeTitle;
}
