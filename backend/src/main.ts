
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);


  app.enableCors({
    origin: [
      'http://127.0.0.1:5173',
      'http://localhost:5173',
    ],

    methods: [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS',
    ],

    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
    ],

    credentials: false,
  });


  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );


  const port = Number(process.env.PORT ?? 3000);

  await app.listen(port, '127.0.0.1');

  console.log(
    `FoBeGoodFlow backend running at http://127.0.0.1:${port}`,
  );
}

void bootstrap();
