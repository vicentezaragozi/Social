import {getRequestConfig} from "next-intl/server";

import type {AppLocale} from "./routing";
import {routing} from "./routing";

export default getRequestConfig(async ({requestLocale}) => {
  const locale = await requestLocale;
  const localeToUse: AppLocale = routing.locales.includes(locale as AppLocale)
    ? (locale as AppLocale)
    : routing.defaultLocale;

  return {
    locale: localeToUse,
    messages: (await import(`./messages/${localeToUse}.json`)).default,
  };
});

