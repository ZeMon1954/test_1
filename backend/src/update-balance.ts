import prisma from "./prisma";

async function main() {
  await prisma.users.updateMany({
    data: {
      initialBalance: 93.34
    }
  });
  console.log("Updated existing users' initialBalance to 93.34");
}

main().catch(console.error).finally(() => prisma.$disconnect());
