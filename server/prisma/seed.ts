import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export const DEFAULT_SOURCES = [
  'Ads',
  'WhatsApp',
  'Instagram',
  'Facebook',
  'Referral',
  'Exhibition',
  'Other',
];

export const DEFAULT_STATUSES = [
  'New',
  'Contacted',
  'Interested',
  'Closed Won',
  'Lost',
];

export const DEFAULT_MESSAGE_TEMPLATES = [
  {
    status: 'New',
    body: 'Hello {name}, thank you for contacting Tiger! How can we assist you today?',
  },
  {
    status: 'Contacted',
    body: 'Hello {name}, following up regarding our recent discussion. Let us know if you need any further specifications.',
  },
  {
    status: 'Interested',
    body: 'Hello {name}, we are pleased to assist you with our machine automation solutions. Feel free to ask any questions!',
  },
  {
    status: 'Closed Won',
    body: 'Hello {name}, thank you for partnering with Tiger! We are dedicated to ensuring your operations run smoothly.',
  },
  {
    status: 'Lost',
    body: 'Hello {name}, thank you for your consideration. Feel free to contact us whenever you require industrial automation solutions.',
  },
];

async function main() {
  console.log('🌱 Starting database seed with English Tiger defaults...');

  // 1. Seed Organization Settings
  const existingSettings = await prisma.settings.findFirst();
  if (!existingSettings) {
    await prisma.settings.create({
      data: {
        orgName: 'Tiger',
      },
    });
    console.log('✅ Default Organization Settings created as "Tiger".');
  } else {
    await prisma.settings.update({
      where: { id: existingSettings.id },
      data: { orgName: 'Tiger' },
    });
    console.log('✅ Existing Organization Settings updated to "Tiger".');
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
  console.log('✅ Default ListOptions (Sources and Statuses) initialized in English.');

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
        name: 'Tiger Administrator',
        password: hashedPassword,
        role: 'admin',
        isTwoFactorEnabled: false,
      },
    });
    console.log(`✅ Demo admin user created: ${demoUser.email}`);
  } else {
    await prisma.user.update({
      where: { id: demoUser.id },
      data: {
        role: 'admin',
        name: 'Tiger Administrator',
      },
    });
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
    } else {
      await prisma.messageTemplate.update({
        where: { id: existingTpl.id },
        data: {
          statusId: statusId || null,
          body: tpl.body,
        },
      });
    }
  }

  // 5. Clean up any legacy Arabic data in database tables
  const arabicSourceMap: Record<string, string> = {
    '\u0625\u0639\u0644\u0627\u0646\u0627\u062a': 'Ads',
    '\u0648\u0627\u062a\u0633\u0627\u0628': 'WhatsApp',
    '\u0627\u0646\u0633\u062a\u063a\u0631\u0627\u0645': 'Instagram',
    '\u0641\u064a\u0633\u0628\u0648\u0643': 'Facebook',
    '\u062a\u0648\u0635\u064a\u0629': 'Referral',
    '\u0645\u0639\u0631\u0636': 'Exhibition',
    '\u0623\u062e\u0631\u0649': 'Other',
  };

  const arabicStatusMap: Record<string, string> = {
    '\u062c\u062f\u064a\u062f': 'New',
    '\u062a\u0645 \u0627\u0644\u062a\u0648\u0627\u0635\u0644': 'Contacted',
    '\u0645\u0647\u062a\u0645': 'Interested',
    '\u062a\u0645 \u0627\u0644\u0628\u064a\u0639': 'Closed Won',
    '\u063a\u064a\u0631 \u0645\u0647\u062a\u0645': 'Lost',
  };

  for (const [ar, en] of Object.entries(arabicSourceMap)) {
    await prisma.customer.updateMany({
      where: { source: ar },
      data: { source: en },
    });
    await prisma.listOption.deleteMany({
      where: { type: 'source', label: ar },
    });
  }

  for (const [ar, en] of Object.entries(arabicStatusMap)) {
    await prisma.customer.updateMany({
      where: { status: ar },
      data: { status: en },
    });
    await prisma.listOption.deleteMany({
      where: { type: 'status', label: ar },
    });
    await prisma.messageTemplate.deleteMany({
      where: { status: ar },
    });
  }

  // Purge any orphan/corrupt options
  await prisma.listOption.deleteMany({
    where: { label: { notIn: [...DEFAULT_SOURCES, ...DEFAULT_STATUSES] } },
  });

  console.log('✅ Default 5 message templates verified for demo user.');
  console.log('✅ Legacy database records cleaned up.');
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
