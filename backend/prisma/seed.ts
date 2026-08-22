import 'dotenv/config';

import { faker } from '@faker-js/faker';
import { PrismaPg } from '@prisma/adapter-pg';

import { hashPassword } from '../src/shared/utils/bcrypt.util';
import { PrismaClient, TradeSide, TradeStatus } from './generated/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const SEED_USER_COUNT = 8;
const SEED_PASSWORD = 'Password123!';
const TRADE_COUNT = 500;
const CANCELLED_RATIO = 0.1;

const SYMBOLS = [
  'AAPL',
  'MSFT',
  'GOOGL',
  'AMZN',
  'TSLA',
  'NVDA',
  'META',
  'NFLX',
  'JPM',
  'V',
];
const BOOKS = ['EQUITY-01', 'EQUITY-02', 'DERIVATIVES-01'];

async function seedUsers() {
  const hashedPassword = await hashPassword(SEED_PASSWORD);

  const users = await Promise.all(
    Array.from({ length: SEED_USER_COUNT }, (_, i) => {
      const n = i + 1;
      return prisma.user.upsert({
        where: { email: `trader${n}@seed.local` },
        update: {},
        create: {
          email: `trader${n}@seed.local`,
          username: `trader${n}`,
          password: hashedPassword,
        },
      });
    }),
  );

  return users;
}

async function seedTrades(userIds: string[]) {
  await prisma.trade.deleteMany({ where: { traderId: { in: userIds } } });

  const trades = Array.from({ length: TRADE_COUNT }, () => ({
    symbol: faker.helpers.arrayElement(SYMBOLS),
    quantity: faker.number.int({ min: 1, max: 10000 }),
    price: faker.number.float({ min: 1, max: 2000, fractionDigits: 2 }),
    side: faker.helpers.arrayElement([TradeSide.BUY, TradeSide.SELL]),
    status: faker.helpers.weightedArrayElement([
      { value: TradeStatus.ACTIVE, weight: 1 - CANCELLED_RATIO },
      { value: TradeStatus.CANCELLED, weight: CANCELLED_RATIO },
    ]),
    tradeTimestamp: faker.date.recent({ days: 30 }),
    book: faker.helpers.arrayElement(BOOKS),
    counterparty: faker.company.name(),
    traderId: faker.helpers.arrayElement(userIds),
  }));

  await prisma.trade.createMany({ data: trades });
}

async function main() {
  const users = await seedUsers();
  console.log(`Seeded ${users.length} users.`);

  await seedTrades(users.map((u) => u.id));
  console.log(`Seeded ${TRADE_COUNT} trades.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
