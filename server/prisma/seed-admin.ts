import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

const toBool = (value: string | undefined) => value?.trim().toLowerCase() === 'true';

async function main() {
  const username = (process.env.ADMIN_USERNAME ?? 'admin').trim();
  const password = process.env.ADMIN_PASSWORD ?? 'admin';
  const resetPassword = toBool(process.env.ADMIN_RESET_PASSWORD);
  const requestedRole = (process.env.ADMIN_ROLE ?? 'ADMIN').trim().toUpperCase();
  const role = requestedRole === UserRole.STAFF ? UserRole.STAFF : UserRole.ADMIN;

  if (!username) {
    throw new Error('ADMIN_USERNAME cannot be empty');
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    if (resetPassword) {
      const passwordHash = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { id: existing.id },
        data: { passwordHash, role }
      });
      console.log(`Updated existing user "${username}" and reset password.`);
    } else if (existing.role !== role) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role }
      });
      console.log(`Updated role for existing user "${username}" to ${role}.`);
    } else {
      console.log(`User "${username}" already exists. No password change applied.`);
    }
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      username,
      passwordHash,
      role
    }
  });
  console.log(`Created ${role} user "${username}".`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
