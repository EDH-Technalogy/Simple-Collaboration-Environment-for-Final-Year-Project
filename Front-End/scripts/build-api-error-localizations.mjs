/**
 * Builds Persian (prs) and Pashto (ps) JSON from English canonical apiErrors texts.
 */
import fs from "fs";
import { fileURLToPath } from "url";

const enPath = fileURLToPath(
  new URL("../src/lib/apiErrors.en.generated.json", import.meta.url),
);
const raw = fs.readFileSync(enPath, "utf8").replace(/^\uFEFF/, "");
const enFlat = JSON.parse(raw);

const phrasePrs = new Map([
  ["user statistics", "آمار کاربر"],
  ["author profile", "پروفایل نویسنده"],
  ["contributor", "همکار"],
  ["client role", "نقش سرویس گیرنده"],
  ["permission stats", "آمار مجوزها"],
  ["published articles", "مقالات منتشرشده"],
  ["author articles", "مقالات نویسنده"],
  ["article with files", "مقاله با فایل‌ها"],
  ["blog file", "فایل بلاگ"],
  ["file metadata", "متاداده فایل"],
  ["blog files", "فایل‌های بلاگ"],
  ["notification stats", "آمار اعلان‌ها"],
  ["university logo", "لوگوی دانشگاه"],
  ["faculty logo", "لوگوی دانشکده"],
  ["department logo", "لوگوی دپارتمان"],
  ["teacher profile", "پروفایل معلم"],
  ["employee profile", "پروفایل کارمند"],
  ["unread count", "شمارنده خوانده‌نشده"],
  ["video", "ویدئو"],
  ["image", "تصویر"],
  ["logo", "لوگو"],
  ["retry", "تلاش مجدد"],
]);

const phrasePs = new Map([
  ["user statistics", " د کارونکو احصایه"],
  ["author profile", "د لیکوال پېژند"],
  ["contributor", "وندي"],
  ["client role", "کلاینټ رول"],
  ["permission stats", "د اجازو احصایه"],
  ["published articles", "خپاره شوي مقالې"],
  ["author articles", "د لیکوال مقالې"],
  ["article with files", "له فایلونو سره مقاله"],
  ["blog file", "بلاک فایل"],
  ["file metadata", "فایل مېټادیټا"],
  ["blog files", "بلاک فایلونه"],
  ["notification stats", "خبرتیاو احصایه"],
  ["university logo", "پوهنتون نښان"],
  ["faculty logo", "پوهنځي نښان"],
  ["department logo", "څانګې نښان"],
  ["teacher profile", "استاد پېژند"],
  ["employee profile", "کارمند پېژند"],
  ["unread count", "نه لوستلي شمېره"],
  ["video", "ویډيو"],
  ["image", "انځور"],
  ["logo", "لوګو"],
  ["retry", "بیا هڅه"],
]);

const nounPrs = {
  students: "دانش‌آموزان",
  student: "دانش‌آموز",
  departments: "دپارتمان‌ها",
  department: "دپارتمان",
  users: "کاربران",
  user: "کاربر",
  roles: "نقش‌ها",
  role: "نقش",
  permissions: "مجوزها",
  permission: "مجوز",
  articles: "مقالات",
  article: "مقاله",
  notifications: "اعلان‌ها",
  notification: "اعلان",
  comments: "نظرات",
  statistics: "آمار",
  unread: "نخوانده",
  contents: "محتوا",
  tree: "درخت مخزن",
  repository: "مخزن",
  draft: "پیش‌نویس",
  comment: "نظر",
  reply: "پاسخ",
  like: "پسند",
  share: "اشتراک‌گذاری",
  file: "فایل",
  email: "ایمیل",
};

const nounPs = {
  students: "زده‌کوونکي",
  student: "زده‌کوونکی",
  departments: "څانګې",
  department: "څانګه",
  users: "کاروونکی",
  user: "کاروونکی",
  roles: "رولونه",
  role: "رول",
  permissions: "اجازې",
  permission: "اجازه",
  articles: "مقالې",
  article: "مقاله",
  notifications: "خبرتیاوې",
  notification: "خبرتیا",
  comments: "تبصرې",
  statistics: "شمېرنه",
  unread: "نالوسته",
  contents: "مینځپانګه",
  tree: "نجرۍ",
  repository: "مخزن",
  draft: "مسوده",
  comment: "تبصره",
  reply: "ځواب",
  like: "خوښول",
  share: "شريکول",
  file: "فایل",
  email: "ایمیل",
};

/** @param {string} phrase @param {'prs'|'ps'} lng */
function embedPhrase(phrase, lng) {
  const lower = phrase.trim().toLowerCase();
  const map = lng === "prs" ? phrasePrs : phrasePs;
  if (map.has(lower)) return map.get(lower);
  const dic = lng === "prs" ? nounPrs : nounPs;
  let out = phrase;
  const keys = [...Object.keys(dic)].sort((a, b) => b.length - a.length);
  for (const en of keys) {
    const re = new RegExp(`\\b${en}\\b`, "gi");
    out = out.replace(re, dic[en]);
  }
  return out;
}

function toPrs(en) {
  if (en === "Login failed.") return "ورود ناموفق بود.";
  if (en === "Signup failed.") return "ثبت نام ناموفق بود.";
  if (en === "Google authentication failed.")
    return "احراز هویت با گوگل ناموفق بود.";
  if (en === "Token refresh failed.") return "تمدید توکن ناموفق بود.";
  if (en === "Forgot password request failed.")
    return "درخواست فراموشی رمز ناموفق بود.";
  if (en === "Password reset failed.") return "بازنشانی رمز ناموفق بود.";
  if (en === "Email verification failed.") return "تأیید ایمیل ناموفق بود.";
  if (en === "Resend verification failed.")
    return "ارسال مجدد تأیید ایمیل ناموفق بود.";
  if (en === "Change password failed.") return "تغییر رمز ناموفق بود.";
  if (en === "Registration failed.") return "ثبت نام ناموفق بود.";
  if (en === "VC login failed.") return "ورود مخزن کد ناموفق بود.";
  const rules = [
    [/^Failed to load (.+)\.$/i, (m) => `بارگذاری ${embedPhrase(m[1], "prs")} ناموفق بود.`],
    [/^Failed to create (.+)\.$/i, (m) => `ایجاد ${embedPhrase(m[1], "prs")} ناموفق بود.`],
    [/^Failed to update (.+)\.$/i, (m) => `به‌روزرسانی ${embedPhrase(m[1], "prs")} ناموفق بود.`],
    [/^Failed to delete (.+)\.$/i, (m) => `حذف ${embedPhrase(m[1], "prs")} ناموفق بود.`],
    [/^Failed to upload (.+)\.$/i, (m) => `بارگذاری ${embedPhrase(m[1], "prs")} ناموفق بود.`],
    [/^Failed to save (.+)\.$/i, (m) => `ذخیره ${embedPhrase(m[1], "prs")} ناموفق بود.`],
    [/^Failed to post (.+)\.$/i, (m) => `ارسال ${embedPhrase(m[1], "prs")} ناموفق بود.`],
    [/^Failed to send (.+)\.$/i, (m) => `ارسال ${embedPhrase(m[1], "prs")} ناموفق بود.`],
    [/^Failed to resend (.+)\.$/i, (m) => `ارسال مجدد ${embedPhrase(m[1], "prs")} ناموفق بود.`],
    [/^Failed to list (.+)\.$/i, (m) => `فهرست ${embedPhrase(m[1], "prs")} ناموفق بود.`],
    [/^Failed to download (.+)\.$/i, (m) => `دانلود ${embedPhrase(m[1], "prs")} ناموفق بود.`],
    [/^Failed to cleanup (.+)\.$/i, (m) => `پاک‌سازی ${embedPhrase(m[1], "prs")} ناموفق بود.`],
    [/^Failed to trigger (.+)\.$/i, (m) => `اجرای ${embedPhrase(m[1], "prs")} ناموفق بود.`],
    [/^Failed to record (.+)\.$/i, (m) => `ثبت ${embedPhrase(m[1], "prs")} ناموفق بود.`],
    [/^Failed to assign (.+)\.$/i, (m) => `تخصیص ${embedPhrase(m[1], "prs")} ناموفق بود.`],
    [/^Failed to remove (.+)\.$/i, (m) => `حذف ${embedPhrase(m[1], "prs")} ناموفق بود.`],
    [/^Failed to add (.+)\.$/i, (m) => `افزودن ${embedPhrase(m[1], "prs")} ناموفق بود.`],
    [/^Failed to like (.+)\.$/i, (m) => `پسندیدن ${embedPhrase(m[1], "prs")} ناموفق بود.`],
    [/^Failed to search (.+)\.$/i, (m) => `جستجو ${embedPhrase(m[1], "prs")} ناموفق بود.`],
    [/^Failed to suspend (.+)\.$/i, (m) => `تعلیق ${embedPhrase(m[1], "prs")} ناموفق بود.`],
    [/^Failed to activate (.+)\.$/i, (m) => `فعال‌سازی ${embedPhrase(m[1], "prs")} ناموفق بود.`],
    [/^Failed to lock (.+)\.$/i, (m) => `قفل ${embedPhrase(m[1], "prs")} ناموفق بود.`],
    [/^Failed to publish (.+)\.$/i, (m) => `انتشار ${embedPhrase(m[1], "prs")} ناموفق بود.`],
  ];
  for (const [re, fn] of rules) {
    const m = re.exec(en);
    if (m) return fn(m);
  }
  if (/^Failed to verify email\.$/i.test(en)) return "تأیید ایمیل ناموفق بود.";
  return `خطا: ${en}`;
}

function toPs(en) {
  if (en === "Login failed.") return "ننوتنه ناکامه وه.";
  if (en === "Signup failed.") return "نوی حساب ثبت نه شو.";
  if (en === "Google authentication failed.") return "د ګووګل سره چک ناکامه وه.";
  if (en === "Token refresh failed.") return "توکن تازه کول شاته پاتې.";
  if (en === "Forgot password request failed.") return "د بیرته نیونې بلنه ناکامه وه.";
  if (en === "Password reset failed.") return "پټنوم بیرته نیونه ناکامه وه.";
  if (en === "Email verification failed.") return "د ایمیل تاييد ناکام شو.";
  if (en === "Resend verification failed.") return "تايید بيا لیږل ناکام شول.";
  if (en === "Change password failed.") return "پټنوم بدلول ناکام شول.";
  if (en === "Registration failed.") return "ثبت ناکام شو.";
  if (en === "VC login failed.") return "د کوډ مخزن ننوتنه ناکامه وه.";
  const rules = [
    [/^Failed to load (.+)\.$/i, (m) => `${embedPhrase(m[1], "ps")} پورته کول ناکام شول.`],
    [/^Failed to create (.+)\.$/i, (m) => `${embedPhrase(m[1], "ps")} جوړول ناکام شول.`],
    [/^Failed to update (.+)\.$/i, (m) => `${embedPhrase(m[1], "ps")} تازه کول ناکام شول.`],
    [/^Failed to delete (.+)\.$/i, (m) => `${embedPhrase(m[1], "ps")} ړنګول ناکام شول.`],
    [/^Failed to upload (.+)\.$/i, (m) => `${embedPhrase(m[1], "ps")} پورته کول ناکام شول.`],
    [/^Failed to save (.+)\.$/i, (m) => `${embedPhrase(m[1], "ps")} خوندي کول ناکام شول.`],
    [/^Failed to post (.+)\.$/i, (m) => `${embedPhrase(m[1], "ps")} لیږل ناکام شول.`],
    [/^Failed to send (.+)\.$/i, (m) => `${embedPhrase(m[1], "ps")} لیږل ناکام شول.`],
    [/^Failed to resend (.+)\.$/i, (m) => `${embedPhrase(m[1], "ps")} بیا لیږل ناکام شول.`],
    [/^Failed to list (.+)\.$/i, (m) => `${embedPhrase(m[1], "ps")} لیست کول ناکام شول.`],
    [/^Failed to download (.+)\.$/i, (m) => `${embedPhrase(m[1], "ps")} ښکته کول ناکام شول.`],
    [/^Failed to cleanup (.+)\.$/i, (m) => `${embedPhrase(m[1], "ps")} پاکول ناکام شول.`],
    [/^Failed to trigger (.+)\.$/i, (m) => `${embedPhrase(m[1], "ps")} پیلول ناکام شول.`],
    [/^Failed to record (.+)\.$/i, (m) => `${embedPhrase(m[1], "ps")} ثبتول ناکام شول.`],
    [/^Failed to assign (.+)\.$/i, (m) => `${embedPhrase(m[1], "ps")} ورکول ناکام شول.`],
    [/^Failed to remove (.+)\.$/i, (m) => `${embedPhrase(m[1], "ps")} لرې کول ناکام شول.`],
    [/^Failed to add (.+)\.$/i, (m) => `${embedPhrase(m[1], "ps")} اضافه کول ناکام شول.`],
    [/^Failed to like (.+)\.$/i, (m) => `${embedPhrase(m[1], "ps")} خوښول ناکام شول.`],
    [/^Failed to search (.+)\.$/i, (m) => `${embedPhrase(m[1], "ps")} پلټنه ناکامه وه.`],
    [/^Failed to suspend (.+)\.$/i, (m) => `${embedPhrase(m[1], "ps")} تعلیق ناکام شو.`],
    [/^Failed to activate (.+)\.$/i, (m) => `${embedPhrase(m[1], "ps")} فعالول ناکام شول.`],
    [/^Failed to lock (.+)\.$/i, (m) => `${embedPhrase(m[1], "ps")} قفلول ناکام شول.`],
    [/^Failed to publish (.+)\.$/i, (m) => `${embedPhrase(m[1], "ps")} خپرول ناکام شول.`],
  ];
  for (const [re, fn] of rules) {
    const m = re.exec(en);
    if (m) {
      return fn(m);
    }
  }
  if (/^Failed to verify email\.$/i.test(en)) return "د ایمیل تایید ناکام شو.";
  return `ستونزه: ${en}`;
}

const prs = {};
const ps = {};

for (const [key, english] of Object.entries(enFlat)) {
  prs[key] = toPrs(english);
  ps[key] = toPs(english);
}

const rootUrl = new URL("../src/lib/", import.meta.url);
fs.mkdirSync(fileURLToPath(rootUrl), { recursive: true });
fs.writeFileSync(
  fileURLToPath(new URL("../src/lib/apiErrors.en.generated.json", import.meta.url)),
  JSON.stringify(enFlat, null, 2),
);
fs.writeFileSync(
  fileURLToPath(new URL("../src/lib/apiErrors.prs.generated.json", import.meta.url)),
  JSON.stringify(prs, null, 2),
);
fs.writeFileSync(
  fileURLToPath(new URL("../src/lib/apiErrors.ps.generated.json", import.meta.url)),
  JSON.stringify(ps, null, 2),
);

const fallbacksPrs = Object.entries(prs).filter(([, v]) =>
  /^خطا:/.test(v),
);
const fallbacksPs = Object.entries(ps).filter(([, v]) =>
  /^ستونزه:/.test(v),
);
console.log("Wrote generated JSON. Unmatched prs:", fallbacksPrs.length, "ps:", fallbacksPs.length);
if (fallbacksPrs.length) console.log("prs samples:", fallbacksPrs.slice(0, 5));
if (fallbacksPs.length) console.log("ps samples:", fallbacksPs.slice(0, 5));
