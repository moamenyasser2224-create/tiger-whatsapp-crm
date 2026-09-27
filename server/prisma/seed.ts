import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export const DEFAULT_SOURCES = [
  'إعلان',
  'واتساب',
  'انستغرام',
  'فيسبوك',
  'توصية',
  'معرض',
  'أخرى',
];

export const DEFAULT_STATUSES = [
  'جديد',
  'تم التواصل',
  'مهتم',
  'تم البيع',
  'غير مهتم',
];

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

  // 1. Seed Organization Settings
  const existingSettings = await prisma.settings.findFirst();
  if (!existingSettings) {
    await prisma.settings.create({
      data: {
        orgName: 'تايجر CRM',
      },
    });
    console.log('✅ Default Organization Settings created.');
  }

  // 2. Seed ListOptions (Sources & Statuses)
  const statusMap = new Map<string, string>();

  for (let i = 0; i < DEFAULT_SOURCES.length; i++) {
    const label = DEFAULT_SOURCES[i];
    let opt = await prisma.listOption.findFirst({
      where: { type: 'source', label },
    });
    if (!opt) {
      opt = await prisma.listOption.create({
        data: {
          type: 'source',
          label,
          order: i,
          isDefault: true,
        },
      });
    }
  }

  for (let i = 0; i < DEFAULT_STATUSES.length; i++) {
    const label = DEFAULT_STATUSES[i];
    let opt = await prisma.listOption.findFirst({
      where: { type: 'status', label },
    });
    if (!opt) {
      opt = await prisma.listOption.create({
        data: {
          type: 'status',
          label,
          order: i,
          isDefault: true,
        },
      });
    }
    statusMap.set(label, opt.id);
  }
  console.log('✅ Default ListOptions (Sources and Statuses) initialized.');

  // 3. Seed Demo Admin User
  const demoEmail = 'admin@example.com';
  let demoUser = await prisma.user.findUnique({
    where: { email: demoEmail },
  });

  if (!demoUser) {
    const hashedPassword = await bcrypt.hash('Admin@123456', 12);
    demoUser = await prisma.user.create({
      data: {
        email: demoEmail,
        name: 'مدير النظام التجريبي',
        password: hashedPassword,
        role: 'admin',
        isTwoFactorEnabled: false,
      },
    });
    console.log(`✅ Demo admin user created: ${demoUser.email}`);
  } else {
    // Ensure role is admin
    if (demoUser.role !== 'admin') {
      await prisma.user.update({
        where: { id: demoUser.id },
        data: { role: 'admin' },
      });
    }
    console.log(`ℹ️ Demo user (${demoEmail}) ready.`);
  }

  // 4. Seed Message Templates
  for (const tpl of DEFAULT_MESSAGE_TEMPLATES) {
    const statusId = statusMap.get(tpl.status);
    const existingTpl = await prisma.messageTemplate.findFirst({
      where: {
        userId: demoUser.id,
        status: tpl.status,
      },
    });

    if (!existingTpl) {
      await prisma.messageTemplate.create({
        data: {
          userId: demoUser.id,
          status: tpl.status,
          statusId: statusId || null,
          body: tpl.body,
        },
      });
    }
  }

  console.log('✅ Default 5 message templates verified for demo user.');
  console.log('🌱 Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
