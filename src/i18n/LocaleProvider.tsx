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
        ? "愿望成真，开心有你一份。先备好礼物，邀朋友一起期待：约好的事成了，礼物就送出。Kindred 体验版，不涉及真实支付。"
        : "Make a promise to a future worth celebrating. Commit a simulated gift, invite your people, and explore conditional social gifting with Kindred.",
    );
  }, [language]);
  return (
    <LocaleContext.Provider value={{ language, setLanguage }}>
      {children}
    </LocaleContext.Provider>
  );
}
