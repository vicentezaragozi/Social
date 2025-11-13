import {createNavigation} from "next-intl/navigation";

import {routing} from "./routing";

export const {Link, redirect, usePathname, useRouter} =
  createNavigation(routing);

export {routing};
export type {AppLocale} from "./routing";

