import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Create default admin user
  const hashedPassword = await bcrypt.hash("admin123", 10);

  const adminUser = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      passwordHash: hashedPassword,
    },
  });

  console.log("✅ Created admin user:", {
    id: adminUser.id,
    username: adminUser.username,
  });

  // Create a test user
  const testPassword = await bcrypt.hash("test123", 10);

  const testUser = await prisma.user.upsert({
    where: { username: "testuser" },
    update: {},
    create: {
      username: "testuser",
      passwordHash: testPassword,
    },
  });

  console.log("✅ Created test user:", {
    id: testUser.id,
    username: testUser.username,
  });

  console.log("🎉 Database seed completed!");
  console.log("\nDefault credentials:");
  console.log("  Admin - username: admin, password: admin123");
  console.log("  Test  - username: testuser, password: test123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
