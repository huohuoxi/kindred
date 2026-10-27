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
    [/^Commit (.+) demo funds$/, (_, amount) => `确认预留 ${amount} 礼金`],
    [
      /^(.+) each · first (\d+) people$/,
      (_, amount, n) => `前 ${n} 位报名，每人 ${amount}`,
    ],
    [
      /^A personal gift for ([^.]+)$/,
      (_, name) => `只送给${translate(name, language)}`,
    ],
    [
      /^(.+) each for the first (.+) people\.$/,
      (_, amount, n) => `前 ${n} 位报名的人，每人 ${amount}。`,
    ],
    [
      /^One gift for (.+)\.$/,
      (_, name) => `礼物送给${translate(name, language)}。`,
    ],
    [
      /^All entered times are UTC\. Demo clock: (.+)\.$/,
      (_, when) => `时间统一按 UTC 填写。当前演示时间：${when}。`,
    ],
    [
      /^Objections remain open until (.+)\.$/,
      (_, when) => `公示至 ${when}，有疑问可以在这之前提出。`,
    ],
    [
      /^(\d+) \/ (\d+) slots joined$/,
      (_, n, total) => `${n} / ${total} 个名额已报名`,
    ],
    [/^(\d+) (?:person|people) joined$/, (_, n) => `${n} 人已报名`],
    [/^(\d+) joined$/, (_, n) => `${n} 人已报名`],
    [
      /^Slot (\d+) of (\d+)$/,
      (_, n, total) => `已占第 ${n} 个名额，共 ${total} 个`,
    ],
    [/^Enrollment #(\d+)$/, (_, n) => `第 ${n} 位报名`],
    [
      /^You joined for free(.*)\.$/,
      (_, tail) =>
        tail
          ? `报名成功${tail.replace(/ · recipient position (\d+) of (\d+)/, "，占第 $1 个名额，共 $2 个")}，没有扣钱。`
          : "报名成功，没有扣钱。",
    ],
    [
      /^A personal gift for (.+)\. Public enrollment is unavailable\.$/,
      (_, name) => `这份礼物只送给${translate(name, language)}，不开放报名。`,
    ],
    [
      /^(.+) per person(.*)$/,
      (_, amount, tail) => `每人 ${amount}${translate(tail, language)}`,
    ],
    [
      /^No wishes (created|followed|joined) yet\.$/,
      (_, kind) =>
        kind === "created"
          ? "还没发起过愿望，想好要庆祝什么了吗？"
          : kind === "followed"
            ? "还没关注愿望，去看看有没有你期待的好事吧。"
            : "还没参与过愿望，去逛逛吧。",
    ],
    [
      /^(Follow|Unfollow) (.+)$/,
      (_, action, title) =>
        `${translate(action, language)}：${translate(title, language)}`,
    ],
    [
      /^Proposed (YES|NO)\. The 24-hour objection window is open\.$/,
      (_, result) =>
        `已申请确认「${result === "YES" ? "已达成" : "未达成"}」，接下来公示 24 小时，供大家核对。`,
    ],
    [
      /^Proposal rejected: (.+) Enrollment remains closed\.$/,
      (_, reason) => `结果申请未通过：${reason} 报名仍然关闭。`,
    ],
    [
      /^Illustrative sample evidence: the required record confirms this fictional condition was met before the deadline\. (.+)$/,
      (_, criteria) =>
        `凭证记录显示，约定已在截止前达成。${translate(criteria, language)}`,
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
