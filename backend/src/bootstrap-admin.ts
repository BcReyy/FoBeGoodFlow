
import 'dotenv/config';
import * as argon2 from 'argon2';

import AppDataSource from './data-source';
import { User } from './entities/user.entity';

async function bootstrapAdmin() {
  const password = process.env.FBG_ADMIN_PASSWORD;

  if (!password || password.length < 12) {
    throw new Error(
      'A temporary Admin password with at least 12 characters is required.',
    );
  }

  await AppDataSource.initialize();

  try {
    const users = AppDataSource.getRepository(User);

    // Prevent accidentally creating multiple administrators.
    const existingAdmin = await users.findOne({
      where: { role: 'Admin' },
    });

    if (existingAdmin) {
      throw new Error(
        'An Admin account already exists. No account was created.',
      );
    }

    const email = 'admin@example.com';

    const existingEmail = await users.findOne({
      where: { email },
    });

    if (existingEmail) {
      throw new Error(
        'The bootstrap email is already registered.',
      );
    }

    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
    });

    const admin = users.create({
      fullName: 'Local Administrator',
      email,
      passwordHash,
      role: 'Admin',
      isActive: true,
      createdAt: new Date(),
    });

    await users.save(admin);

    console.log('Admin account created successfully.');
    console.log('Email:', email);
  } finally {
    await AppDataSource.destroy();
  }
}

void bootstrapAdmin().catch((error: unknown) => {
  console.error(
    'Admin setup failed:',
    error instanceof Error ? error.message : 'Unknown error',
  );
  process.exitCode = 1;
});
