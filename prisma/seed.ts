/**
 * Seed script.
 *
 * Creates one user per role (strong random passwords printed to stdout ONCE),
 * 10 demo students, student→teacher assignments, session templates, a batch of
 * sessions across statuses, and a few encrypted health records.
 *
 * Run with: pnpm db:seed  (goes through `prisma db seed`, which loads .env)
 */
import { randomBytes } from "node:crypto";
import { PrismaClient, Role, StudentStatus, HealthCategory, SessionStatus } from "@prisma/client";

import { hashPassword } from "../src/lib/auth/password";
import { encrypt } from "../src/lib/security/crypto";

const prisma = new PrismaClient();

/**
 * Generate a strong password that satisfies the platform policy.
 * If SEED_DEMO_PASSWORD is set (CI / local e2e), use it for deterministic
 * logins; otherwise generate a fresh random one per user.
 */
function strongPassword(): string {
  const fixed = process.env.SEED_DEMO_PASSWORD;
  if (fixed) return fixed;
  // base64url of 18 random bytes (~24 chars) + guaranteed character classes.
  const core = randomBytes(18).toString("base64url");
  return `Aa1!${core}`;
}

const HEALTH_NOTES: Array<{ category: HealthCategory; summary: string; details: string }> = [
  {
    category: HealthCategory.MENTAL,
    summary: "Counseling check-in",
    details: "Reports mild test anxiety; coping strategies discussed. Follow up in two weeks.",
  },
  {
    category: HealthCategory.PHYSICAL,
    summary: "Asthma management",
    details: "Carries an inhaler; PE staff notified. No incidents this term.",
  },
  {
    category: HealthCategory.MENTAL,
    summary: "Wellbeing review",
    details: "Settling in well after transfer; positive peer relationships reported.",
  },
];

async function main() {
  console.log("Seeding database…\n");

  // --- Users (one per role) ---
  const roleSpecs: Array<{ key: string; email: string; name: string; role: Role }> = [
    { key: "OWNER", email: "owner@demo.school", name: "Olivia Owner", role: Role.OWNER },
    { key: "MANAGER", email: "manager@demo.school", name: "Marcus Manager", role: Role.MANAGER },
    {
      key: "SUPERVISOR",
      email: "supervisor@demo.school",
      name: "Sofia Supervisor",
      role: Role.SUPERVISOR,
    },
    { key: "TEACHER", email: "teacher@demo.school", name: "Tariq Teacher", role: Role.TEACHER },
  ];

  // --- Demo organization (tenant) ---
  const org = await prisma.organization.upsert({
    where: { slug: "demo" },
    update: {},
    create: { name: "Demo Academy", slug: "demo", plan: "PRO" },
  });

  const credentials: Array<{ role: string; email: string; password: string }> = [];
  const users: Record<string, { id: string }> = {};

  for (const spec of roleSpecs) {
    const password = strongPassword();
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.upsert({
      where: { email: spec.email },
      update: { name: spec.name, role: spec.role, passwordHash, isActive: true },
      create: {
        organizationId: org.id,
        email: spec.email,
        name: spec.name,
        role: spec.role,
        passwordHash,
        isActive: true,
      },
    });
    users[spec.key] = user;
    credentials.push({ role: spec.key, email: spec.email, password });
  }

  // --- Students ---
  const firstNames = ["Ava", "Liam", "Noah", "Emma", "Mia", "Lucas", "Zoe", "Ethan", "Aria", "Leo"];
  const lastNames = [
    "Bennett",
    "Carter",
    "Diaz",
    "Evans",
    "Foster",
    "Gomez",
    "Hughes",
    "Ibrahim",
    "Jensen",
    "Khan",
  ];

  const studentIds: string[] = [];
  for (let i = 0; i < 10; i++) {
    const fullName = `${firstNames[i]} ${lastNames[i]}`;
    const externalId = `STU-${String(1000 + i)}`;
    const student = await prisma.student.upsert({
      where: { organizationId_externalId: { organizationId: org.id, externalId } },
      update: { fullName },
      create: {
        organizationId: org.id,
        fullName,
        externalId,
        status: i % 7 === 0 ? StudentStatus.SUSPENDED : StudentStatus.ACTIVE,
        notes: i % 3 === 0 ? "Prefers morning sessions." : null,
      },
    });
    studentIds.push(student.id);
  }

  // --- Assign the first three students to the demo teacher ---
  for (const studentId of studentIds.slice(0, 3)) {
    await prisma.studentAssignment.upsert({
      where: { studentId_teacherId: { studentId, teacherId: users.TEACHER.id } },
      update: {},
      create: { studentId, teacherId: users.TEACHER.id },
    });
  }

  // --- Marks for the first few students ---
  for (const studentId of studentIds.slice(0, 5)) {
    await prisma.mark.create({
      data: {
        studentId,
        subject: "Mathematics",
        score: 78.5,
        maxScore: 100,
        term: "2025-T2",
        recordedById: users.SUPERVISOR.id,
      },
    });
  }

  // --- Encrypted health records (exercise AES-256-GCM) ---
  for (let i = 0; i < HEALTH_NOTES.length; i++) {
    const note = HEALTH_NOTES[i];
    await prisma.healthRecord.create({
      data: {
        studentId: studentIds[i],
        category: note.category,
        summary: note.summary,
        details: encrypt(note.details, "healthrecord"),
        recordedById: users.SUPERVISOR.id,
      },
    });
  }

  // --- Session templates ---
  for (const t of [
    { type: "Math tutoring", defaultDuration: 45 },
    { type: "Counseling check-in", defaultDuration: 30 },
    { type: "Reading support", defaultDuration: 40 },
  ]) {
    await prisma.sessionTemplate.upsert({
      where: { organizationId_type: { organizationId: org.id, type: t.type } },
      update: { defaultDuration: t.defaultDuration },
      create: { ...t, organizationId: org.id, createdById: users.SUPERVISOR.id },
    });
  }

  // --- Sessions for the teacher across statuses/times ---
  const now = new Date();
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;
  const sessionSeed: Array<{ type: string; offsetMs: number; status: SessionStatus }> = [
    { type: "Math tutoring", offsetMs: 2 * hour, status: SessionStatus.SCHEDULED }, // today, later
    { type: "Counseling check-in", offsetMs: -3 * hour, status: SessionStatus.TAKEN }, // earlier today
    { type: "Reading support", offsetMs: -1 * day, status: SessionStatus.MISSED }, // overdue
    { type: "Math tutoring", offsetMs: 1 * day, status: SessionStatus.SCHEDULED }, // tomorrow
    { type: "Counseling check-in", offsetMs: 3 * day, status: SessionStatus.RESCHEDULED },
  ];

  for (const s of sessionSeed) {
    await prisma.session.create({
      data: {
        organizationId: org.id,
        teacherId: users.TEACHER.id,
        assignedById: users.SUPERVISOR.id,
        type: s.type,
        scheduledAt: new Date(now.getTime() + s.offsetMs),
        durationMin: 45,
        status: s.status,
        takenAt: s.status === SessionStatus.TAKEN ? new Date(now.getTime() + s.offsetMs) : null,
      },
    });
  }

  // --- Print demo credentials once ---
  console.log("Seed complete.\n");
  console.log("==================== DEMO CREDENTIALS ====================");
  console.log("Printed ONCE. Store securely; rotate before any real use.\n");
  for (const c of credentials) {
    console.log(`  ${c.role.padEnd(11)} ${c.email.padEnd(24)} ${c.password}`);
  }
  console.log("=========================================================");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
