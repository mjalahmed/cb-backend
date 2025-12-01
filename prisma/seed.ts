import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Seeding database...');

  // Create default categories
  const categories = [
    { name: 'Chocolate Bars', description: 'Classic chocolate bars' },
    { name: 'Truffles', description: 'Premium chocolate truffles' },
    { name: 'Gift Boxes', description: 'Curated gift collections' },
    { name: 'Seasonal', description: 'Limited edition seasonal items' }
  ];

  for (const category of categories) {
    const existing = await prisma.category.findFirst({
      where: { name: category.name }
    });

    if (!existing) {
      const created = await prisma.category.create({
        data: category
      });
      console.log(`✅ Category created: ${created.name}`);
    } else {
      console.log(`⏭️  Category already exists: ${category.name}`);
    }
  }

  // Create a default admin user (optional - you can remove this)
  // Note: You'll need to authenticate via OTP first, then manually update role to ADMIN in database

  console.log('✨ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

