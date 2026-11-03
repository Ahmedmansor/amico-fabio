function kind(value: unknown): string {
  if (value === null) return 'null';
  return Array.isArray(value) ? 'array' : typeof value;
}

function compare(reference: unknown, candidate: unknown, locale: string, path: string): void {
  if (kind(reference) !== kind(candidate)) {
    throw new Error(`[i18n] ${locale}:${path} expected ${kind(reference)}, received ${kind(candidate)}.`);
  }

  if (Array.isArray(reference) && Array.isArray(candidate)) {
    if (reference.length !== candidate.length) {
      throw new Error(`[i18n] ${locale}:${path} expected ${reference.length} items, received ${candidate.length}.`);
    }
    reference.forEach((value, index) => compare(value, candidate[index], locale, `${path}[${index}]`));
    return;
  }

  if (reference !== null && typeof reference === 'object' && candidate !== null && typeof candidate === 'object') {
    const source = reference as Record<string, unknown>;
    const target = candidate as Record<string, unknown>;
    for (const key of Object.keys(source)) {
      const nextPath = path ? `${path}.${key}` : key;
      if (!Object.hasOwn(target, key)) {
        throw new Error(`[i18n] ${locale}:${nextPath} missing translation key.`);
      }
      compare(source[key], target[key], locale, nextPath);
    }
    for (const key of Object.keys(target)) {
      if (!Object.hasOwn(source, key)) {
        throw new Error(`[i18n] ${locale}:${path ? `${path}.` : ''}${key} unexpected translation key.`);
      }
    }
  }
}

export function validateTranslations(
  dictionaries: Record<string, unknown>,
  locales: readonly string[],
  defaultLanguage: string,
): void {
  if (!locales.includes(defaultLanguage)) {
    throw new Error(`[i18n] Default language ${defaultLanguage} is not enabled.`);
  }
  for (const locale of locales) {
    if (!Object.hasOwn(dictionaries, locale) || dictionaries[locale] === undefined) {
      throw new Error(`[i18n] Missing dictionary for ${locale}.`);
    }
  }
  for (const locale of Object.keys(dictionaries)) {
    if (!locales.includes(locale)) {
      throw new Error(`[i18n] Dictionary ${locale} is not an enabled language.`);
    }
  }
  for (const locale of locales) {
    compare(dictionaries[defaultLanguage], dictionaries[locale], locale, '');
  }
}
