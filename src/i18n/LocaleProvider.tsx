import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { LocaleContext } from "./context";
import { LANGUAGE_KEY, loadLanguage } from "./core";
import type { Language } from "./core";
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    try {
      return loadLanguage(localStorage);
    } catch {
      return "zh";
    }
  });
  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
    try {
      localStorage.setItem(LANGUAGE_KEY, language);
    } catch {
      /* Session language still works when storage is unavailable. */
    }
    const description = document.querySelector('meta[name="description"]');
    description?.setAttribute(
      "content",
      language === "zh"
        ? "为值得庆祝的未来，许下一个愿望。承诺礼物，邀请大家；条件达成，送出心意。纯浏览器互动演示，不涉及真实资金。"
        : "Make a promise to a future worth celebrating. Commit a simulated gift, invite your people, and explore conditional social gifting with Kindred.",
    );
  }, [language]);
  return (
    <LocaleContext.Provider value={{ language, setLanguage }}>
      {children}
    </LocaleContext.Provider>
  );
}
