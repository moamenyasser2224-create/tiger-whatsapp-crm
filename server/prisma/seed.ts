import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export const DEFAULT_MESSAGE_TEMPLATES = [
  {
    status: 'جديد',
    body: 'مرحباً {name}، شكرًا لتواصلك معنا! كيف يمكننا مساعدتك؟',
  },
  {
    status: 'تم التواصل',
    body: 'مرحباً {name}، تم التواصل معك سابقًا، حابب أتابع معاك آخر التفاصيل.',
  },
  {
    status: 'مهتم',
    body: 'مرحباً {name}، حابب أطمّن هل لسه مهتم بالعرض؟ جاهز أساعدك بأي استفسار.',
  },
  {
    status: 'تم البيع',
    body: 'مرحباً {name}، شكرًا لثقتك بنا! لو احتجت أي دعم بعد الشراء أنا موجود.',
  },
  {
    status: 'غير مهتم',
    body: 'مرحباً {name}، تمام، لو احتجت أي حاجة في المستقبل أنا موجود.',
  },
];

async function main() {
  console.log('🌱 Starting database seed...');

  const demoEmail = 'admin@example.com';
  const existingUser = await prisma.user.findUnique({
    where: { email: demoEmail },
  });

  if (existingUser) {
    console.log(`ℹ️ Demo user (${demoEmail}) already exists. Skipping creation.`);
    return;
  }

  const hashedPassword = await bcrypt.hash('Admin@123456', 12);

  const demoUser = await prisma.user.create({
    data: {
      email: demoEmail,
      name: 'مدير النظام التجريبي',
      password: hashedPassword,
      isTwoFactorEnabled: false,
    },
  });

  console.log(`✅ Demo user created: ${demoUser.email} (ID: ${demoUser.id})`);

  for (const tpl of DEFAULT_MESSAGE_TEMPLATES) {
    await prisma.messageTemplate.create({
      data: {
        userId: demoUser.id,
        status: tpl.status,
        body: tpl.body,
      },
    });
  }

  console.log('✅ Default 5 message templates created for demo user.');
  console.log('🌱 Seeding completed successfully (No dummy customers added).');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
