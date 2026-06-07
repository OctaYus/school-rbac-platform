import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";

import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "@/lib/i18n/config";
import { dictionaries, type TranslationKey } from "@/lib/i18n/dictionaries";

export const getLocale = cache(async (): Promise<Locale> => {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : defaultLocale;
});

/** Server-side translator for the current request's locale. */
export async function getI18n() {
  const locale = await getLocale();
  const dict = dictionaries[locale];
  const t = (key: TranslationKey) => dict[key] ?? key;
  return { locale, dict, t };
}
