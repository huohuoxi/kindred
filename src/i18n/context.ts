import { createContext, useContext } from "react";
import { formatDate, translate } from "./core";
import type { Wish } from "../domain/model";
import type { Language } from "./core";
export const LocaleContext = createContext<{
  language: Language;
  setLanguage: (language: Language) => void;
} | null>(null);
export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("Missing language provider.");
  const { language, setLanguage } = context;
  return {
    language,
    setLanguage,
    locale: language === "zh" ? "zh-CN" : "en-US",
    t: <T>(value: T): T => translate(value, language),
    wishText: (
      wish: Wish,
      field: "title" | "story" | "condition" | "criteria",
    ) => (wish.seeded ? translate(wish[field], language) : wish[field]),
    date: (value: number) => formatDate(value, language),
  };
}
