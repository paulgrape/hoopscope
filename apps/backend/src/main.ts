import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { API_TITLE, API_VERSION } from './site';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3001',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true } as any),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle(API_TITLE)
    .setVersion(API_VERSION)
    .build();
  SwaggerModule.setup(
    'api/docs',
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
  );

  await app.listen(process.env.PORT ?? 3000);
  console.log(
    `Backend running on http://localhost:${process.env.PORT ?? 3000}`,
  );
  console.log(
    `Swagger docs at http://localhost:${process.env.PORT ?? 3000}/api/docs`,
  );
}
void bootstrap();
