import type { HealthCategory, SessionStatus, StudentStatus } from "@prisma/client";

import type { TranslationKey } from "@/lib/i18n/dictionaries";

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
