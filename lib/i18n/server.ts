import { cookies } from "next/headers";
import { DEFAULT_LANG, DICTS, LANG_COOKIE, isLang, type Lang } from "./dict";

/** Language chosen with the RU/EN switch, read from its cookie. */
export async function getLang(): Promise<Lang> {
  const v = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(v) ? v : DEFAULT_LANG;
}

export async function getDict() {
  return DICTS[await getLang()];
}
