import type {
  Gender,
  HealthCategory,
  RubricLevel,
  SessionStatus,
  StudentStatus,
} from "@prisma/client";

import type { TranslationKey } from "@/lib/i18n/dictionaries";
import type { RubricCriterion } from "@/lib/assessment/rubric";

// Maps Prisma enum values to their translation keys so both server components
// (via getI18n's `t`) and client components (via useT's `t`) render them in
// the active locale.
export const STUDENT_STATUS_KEY: Record<StudentStatus, TranslationKey> = {
  ACTIVE: "st.ACTIVE",
  INACTIVE: "st.INACTIVE",
  GRADUATED: "st.GRADUATED",
  SUSPENDED: "st.SUSPENDED",
  ARCHIVED: "st.ARCHIVED",
};

export const SESSION_STATUS_KEY: Record<SessionStatus, TranslationKey> = {
  SCHEDULED: "ss.SCHEDULED",
  TAKEN: "ss.TAKEN",
  MISSED: "ss.MISSED",
  RESCHEDULED: "ss.RESCHEDULED",
  CANCELLED: "ss.CANCELLED",
};

export const HEALTH_CATEGORY_KEY: Record<HealthCategory, TranslationKey> = {
  MENTAL: "hc.MENTAL",
  PHYSICAL: "hc.PHYSICAL",
};

export const GENDER_KEY: Record<Gender, TranslationKey> = {
  MALE: "gender.MALE",
  FEMALE: "gender.FEMALE",
};

// Oral-assessment rubric — four performance descriptors.
export const RUBRIC_LEVEL_KEY: Record<RubricLevel, TranslationKey> = {
  BEGINNER: "rl.BEGINNER",
  DEVELOPING: "rl.DEVELOPING",
  COMPETENT: "rl.COMPETENT",
  DISTINGUISHED: "rl.DISTINGUISHED",
};

// …and its three criteria.
export const CRITERION_KEY: Record<RubricCriterion, TranslationKey> = {
  hifz: "cr.hifz",
  tajweed: "cr.tajweed",
  makharij: "cr.makharij",
};
