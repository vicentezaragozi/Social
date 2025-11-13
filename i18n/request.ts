import {getRequestConfig} from "next-intl/server";

import type {AppLocale} from "../src/i18n/routing";
import {routing} from "../src/i18n/routing";

export default getRequestConfig(async ({requestLocale}) => {
  let locale = await requestLocale;
  
  // Ensure that the locale matches one of our supported locales
  if (!routing.locales.includes(locale as AppLocale)) {
    locale = routing.defaultLocale;
  }
  
  const localeToUse = locale as AppLocale;

  return {
    locale: localeToUse,
    messages: (await import(`../src/i18n/messages/${localeToUse}.json`)).default,
  };
});
