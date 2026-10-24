import type { Metadata } from "next";
import type { Lang } from "./dict";
import { getLang } from "./server";

/**
 * `generateMetadata` for a route whose page is a client component: the tab
 * title is picked from that page's dictionary in the visitor's language.
 * The root layout's title template appends "· SoilPlus".
 */
export function titleFrom<T>(dict: Record<Lang, T>, pick: (t: T) => string) {
  return async (): Promise<Metadata> => ({ title: pick(dict[await getLang()]) });
}
