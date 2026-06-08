import { RubricLevel } from "@prisma/client";

import {
  RUBRIC_LEVEL_VALUE,
  type RubricCriterion,
  type RubricLevels,
} from "@/lib/assessment/rubric";
import type { Locale } from "@/lib/i18n/config";

/**
 * Deterministic Response-to-Intervention (RTI) remedial-plan generator.
 *
 * Pure & dependency-free (no external AI call). It inspects a student's rubric
 * levels, finds the weakest criterion, and produces a three-tier differentiated
 * plan (foundational → targeted → extension) tailored to that skill, in the
 * requested locale. The output is a *draft* meant for teacher review
 * (Human-in-the-Loop) before sharing with the student.
 */

export interface RemedialTier {
  tier: 1 | 2 | 3;
  title: string;
  activities: string[];
}

export interface RemedialPlan {
  focus: RubricCriterion;
  focusLabel: string;
  level: RubricLevel;
  durationMin: number;
  tiers: RemedialTier[];
}

/** Lowest-scoring criterion; ties resolve hifz → tajweed → makharij. */
export function weakestCriterion(levels: RubricLevels): RubricCriterion {
  const order: RubricCriterion[] = ["hifz", "tajweed", "makharij"];
  return order.reduce((worst, c) =>
    RUBRIC_LEVEL_VALUE[levels[c]] < RUBRIC_LEVEL_VALUE[levels[worst]] ? c : worst,
  );
}

type TierContent = { title: string; activities: string[] };
type CriterionContent = { focusLabel: string; tiers: [TierContent, TierContent, TierContent] };

const CONTENT: Record<RubricCriterion, Record<Locale, CriterionContent>> = {
  hifz: {
    en: {
      focusLabel: "Memorization (Hifz)",
      tiers: [
        {
          title: "Tier 1 — Foundational support",
          activities: [
            "Break the passage into 2–3 verse chunks and recite each one with a model.",
            "Daily spaced repetition (a short morning and afternoon review).",
            "Pair the student with an advanced peer for confidence-building recitation.",
          ],
        },
        {
          title: "Tier 2 — Targeted practice",
          activities: [
            "Cloze drills: hide the weak words and have the student fill them from memory.",
            "Record the passage and self-check against the mushaf, marking slips.",
          ],
        },
        {
          title: "Tier 3 — Advanced extension",
          activities: [
            "Link each verse to its meaning to strengthen long-term recall.",
            "Lead a small-group review as a junior tutor.",
          ],
        },
      ],
    },
    ar: {
      focusLabel: "الحفظ",
      tiers: [
        {
          title: "المستوى الأول — دعم تأسيسي",
          activities: [
            "تقسيم المقطع إلى ٢–٣ آيات وتسميع كل جزء مع نموذج.",
            "تكرار يومي موزّع (مراجعة قصيرة صباحًا ومساءً).",
            "إقران الطالب بزميل متقدّم لبناء الثقة في التسميع.",
          ],
        },
        {
          title: "المستوى الثاني — تدريب موجّه",
          activities: [
            "تمارين الحذف: إخفاء الكلمات الضعيفة وإكمالها من الحفظ.",
            "تسجيل المقطع ومقارنته بالمصحف وتحديد مواضع الخطأ.",
          ],
        },
        {
          title: "المستوى الثالث — إثراء متقدّم",
          activities: [
            "ربط كل آية بمعناها لتقوية الحفظ بعيد المدى.",
            "قيادة مراجعة جماعية صغيرة كمعلّم مساعد.",
          ],
        },
      ],
    },
  },
  tajweed: {
    en: {
      focusLabel: "Tajweed — Ghunnah / Ikhfa",
      tiers: [
        {
          title: "Tier 1 — Foundational support",
          activities: [
            "Re-teach Ikhfa using colour-coded letters in the assessed verses.",
            "Group choral repetition, holding a complete two-harakah Ghunnah aloud.",
            "Pair the struggling student with an advanced peer to ease recitation anxiety.",
          ],
        },
        {
          title: "Tier 2 — Targeted practice",
          activities: [
            "Extract Ikhfa cases from other short surahs and mark them.",
            "Record audio and compare pronunciation against a verified Qari model.",
          ],
        },
        {
          title: "Tier 3 — Advanced extension",
          activities: [
            "Identify Mutashabihat (similar verses) and explain the Ghunnah differences.",
            "Act as a junior tutor guiding a peer through the rule.",
          ],
        },
      ],
    },
    ar: {
      focusLabel: "التجويد — الغنّة / الإخفاء",
      tiers: [
        {
          title: "المستوى الأول — دعم تأسيسي",
          activities: [
            "إعادة شرح الإخفاء باستخدام تلوين حروف الإخفاء في الآيات المُقيَّمة.",
            "ترديد جماعي مع إظهار غنّة كاملة بمقدار حركتين بصوت مسموع.",
            "إقران الطالب المتعثّر بزميل متقدّم لتخفيف قلق التلاوة.",
          ],
        },
        {
          title: "المستوى الثاني — تدريب موجّه",
          activities: [
            "استخراج مواضع الإخفاء من سور قصيرة أخرى وتعليمها.",
            "تسجيل صوتي ومقارنة النطق بنموذج قارئ موثوق.",
          ],
        },
        {
          title: "المستوى الثالث — إثراء متقدّم",
          activities: [
            "تحديد المتشابهات وشرح الفروق في الغنّة.",
            "العمل كمعلّم مساعد يوجّه زميلًا خلال القاعدة.",
          ],
        },
      ],
    },
  },
  makharij: {
    en: {
      focusLabel: "Articulation (Makharij)",
      tiers: [
        {
          title: "Tier 1 — Foundational support",
          activities: [
            "Re-teach the articulation points of the confused letters using a mirror.",
            "Minimal-pair drills (e.g. Qaf/Kaf, Sin/Sad) at a slow pace.",
            "Slow choral repetition focusing on the weak makhraj.",
          ],
        },
        {
          title: "Tier 2 — Targeted practice",
          activities: [
            "Record the targeted letters and compare to a verified Qari model.",
            "Articulation drills isolating the weak makhraj in different words.",
          ],
        },
        {
          title: "Tier 3 — Advanced extension",
          activities: [
            "Identify the letter's sifaat (characteristics) and explain them to a peer.",
            "Junior-tutor a classmate on the correct makhraj.",
          ],
        },
      ],
    },
    ar: {
      focusLabel: "المخارج",
      tiers: [
        {
          title: "المستوى الأول — دعم تأسيسي",
          activities: [
            "إعادة شرح مخارج الحروف المتشابهة باستخدام المرآة.",
            "تدريبات الأزواج المتقاربة (مثل القاف/الكاف، السين/الصاد) ببطء.",
            "ترديد جماعي بطيء يركّز على المخرج الضعيف.",
          ],
        },
        {
          title: "المستوى الثاني — تدريب موجّه",
          activities: [
            "تسجيل الحروف المستهدفة ومقارنتها بنموذج قارئ موثوق.",
            "تدريبات نطق تعزل المخرج الضعيف في كلمات مختلفة.",
          ],
        },
        {
          title: "المستوى الثالث — إثراء متقدّم",
          activities: [
            "تحديد صفات الحرف وشرحها لزميل.",
            "توجيه زميل كمعلّم مساعد على المخرج الصحيح.",
          ],
        },
      ],
    },
  },
};

/** Build a three-tier RTI plan for the weakest criterion, in the given locale. */
export function generateRemedialPlan(levels: RubricLevels, locale: Locale): RemedialPlan {
  const focus = weakestCriterion(levels);
  const content = CONTENT[focus][locale] ?? CONTENT[focus].en;
  return {
    focus,
    focusLabel: content.focusLabel,
    level: levels[focus],
    durationMin: 45,
    tiers: content.tiers.map((t, i) => ({
      tier: (i + 1) as 1 | 2 | 3,
      title: t.title,
      activities: t.activities,
    })),
  };
}
