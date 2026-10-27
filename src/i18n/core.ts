import zh from "./zh.json";
import { date as englishDate } from "../domain/model";
export type Language = "zh" | "en";
export const LANGUAGE_KEY = "kindred-language-v1";
const dictionary: Record<string, string> = zh;
export function loadLanguage(storage: Pick<Storage, "getItem">): Language {
  try {
    return storage.getItem(LANGUAGE_KEY) === "en" ? "en" : "zh";
  } catch {
    return "zh";
  }
}
export function translate<T>(value: T, language: Language): T {
  if (language === "en" || typeof value !== "string") return value;
  const key = value.trim();
  const translated =
    dictionary[key] ?? dictionary[key.replace(/^the /, "The ")];
  if (translated) return value.replace(key, () => translated) as T;
  // Complete dynamic messages use explicit patterns, keeping user-entered fragments intact.
  const patterns: [RegExp, (...parts: string[]) => string][] = [
    [
      /^(.+) · Kindred$/,
      (_, title) => `${translate(title, language)} · Kindred`,
    ],
    [
      /^Use (\d+)–(\d+) characters\.$/,
      (_, min, max) => `请输入 ${min}–${max} 个字符。`,
    ],
    [/^Commit (.+) demo funds$/, (_, amount) => `承诺投入 ${amount} 演示资金`],
    [
      /^(.+) each · first (\d+) people$/,
      (_, amount, n) => `前 ${n} 位参与者每人 ${amount}`,
    ],
    [
      /^A personal gift for ([^.]+)$/,
      (_, name) => `送给${translate(name, language)}的专属礼物`,
    ],
    [
      /^(.+) each for the first (.+) people\.$/,
      (_, amount, n) => `前 ${n} 位参与者，每人 ${amount}。`,
    ],
    [
      /^One gift for (.+)\.$/,
      (_, name) => `一份送给${translate(name, language)}的礼物。`,
    ],
    [
      /^All entered times are UTC\. Demo clock: (.+)\.$/,
      (_, when) => `输入时间均按 UTC 解释。演示时钟：${when}。`,
    ],
    [
      /^Objections remain open until (.+)\.$/,
      (_, when) => `异议窗口开放至 ${when}。`,
    ],
    [
      /^(\d+) \/ (\d+) slots joined$/,
      (_, n, total) => `${n} / ${total} 个名额已加入`,
    ],
    [/^(\d+) (?:person|people) joined$/, (_, n) => `${n} 人已加入`],
    [/^(\d+) joined$/, (_, n) => `${n} 人已加入`],
    [/^Slot (\d+) of (\d+)$/, (_, n, total) => `第 ${n} / ${total} 个名额`],
    [/^Enrollment #(\d+)$/, (_, n) => `加入顺序：第 ${n} 位`],
    [
      /^You joined for free(.*)\.$/,
      (_, tail) =>
        tail
          ? `你已免费加入${tail.replace(/ · recipient position (\d+) of (\d+)/, " · 第 $1 / $2 个领取名额")}。`
          : "你已免费加入。",
    ],
    [
      /^A personal gift for (.+)\. Public enrollment is unavailable\.$/,
      (_, name) =>
        `这是送给${translate(name, language)}的专属礼物，不开放公开加入。`,
    ],
    [
      /^(.+) per person(.*)$/,
      (_, amount, tail) => `每人 ${amount}${translate(tail, language)}`,
    ],
    [
      /^No wishes (created|followed|joined) yet\.$/,
      (_, kind) =>
        kind === "created"
          ? "你还没有创建愿望。"
          : kind === "followed"
            ? "你还没有关注愿望。"
            : "你还没有加入愿望。",
    ],
    [
      /^(Follow|Unfollow) (.+)$/,
      (_, action, title) =>
        `${translate(action, language)}：${translate(title, language)}`,
    ],
    [
      /^Proposed (YES|NO)\. The 24-hour objection window is open\.$/,
      (_, result) =>
        `已提议“${result === "YES" ? "条件达成" : "条件未达成"}”，24 小时异议窗口现已开放。`,
    ],
    [
      /^Proposal rejected: (.+) Enrollment remains closed\.$/,
      (_, reason) => `提议已被驳回：${reason} 加入通道保持关闭。`,
    ],
    [
      /^Illustrative sample evidence: the required record confirms this fictional condition was met before the deadline\. (.+)$/,
      (_, criteria) =>
        `示例证据：所需记录确认该虚构条件在截止前已达成。${translate(criteria, language)}`,
    ],
  ];
  for (const [pattern, render] of patterns) {
    const match = key.match(pattern);
    if (match) return value.replace(key, () => render(...match)) as T;
  }
  // Zod's generated length errors are converted at the presentation boundary.
  if (/^Too small: expected string to have >=\d+ characters$/.test(key))
    return "内容过短，请补充完整。" as T;
  if (/^Too big: expected string to have <=\d+ characters$/.test(key))
    return "内容过长，请适当缩短。" as T;
  return value;
}
export function formatDate(value: number, language: Language): string {
  return language === "en"
    ? englishDate(value)
    : new Intl.DateTimeFormat("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
        timeZone: "UTC",
      }).format(value) + " UTC";
}
