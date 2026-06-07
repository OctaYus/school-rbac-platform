"use client";

import { createContext, useContext } from "react";
import { useRouter } from "next/navigation";

import { dirFor, LOCALE_COOKIE, type Locale } from "@/lib/i18n/config";
import type { Dictionary, TranslationKey } from "@/lib/i18n/dictionaries";

interface I18nValue {
  locale: Locale;
  t: (key: TranslationKey) => string;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nValue>({
  locale: "en",
  t: (key) => key,
  setLocale: () => {},
});

export const useT = () => useContext(I18nContext);

export function I18nProvider({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const t = (key: TranslationKey) => dict[key] ?? key;

  function setLocale(next: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = next;
    document.documentElement.dir = dirFor(next);
    // Re-render server components in the new locale.
    router.refresh();
  }

  return <I18nContext.Provider value={{ locale, t, setLocale }}>{children}</I18nContext.Provider>;
}
