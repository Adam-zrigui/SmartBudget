import { prisma } from "@/lib/prisma";

export async function ensureUserRecord(userId: string) {
  const safeUid = String(userId).replace(/[^a-zA-Z0-9._-]/g, "_");
  const fallbackEmail = `firebase-${safeUid}@local.smartbudget`;

  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      email: fallbackEmail,
    },
  });
}

