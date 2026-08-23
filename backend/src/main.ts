import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { ValidationException } from './shared/exceptions/validation.exception';
import { ValidationFilter } from './shared/filters/validation.filter';
import helmet from 'helmet';
import { AllExceptionsFilter } from './shared/filters/exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const corsOrigin = configService.get<string>('CORS_ORIGIN', '*');
  app.enableCors({
    origin: corsOrigin === '*' ? '*' : corsOrigin.split(','),
  });

  app.setGlobalPrefix('api/v1');

  app.useGlobalFilters(new ValidationFilter(), new AllExceptionsFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory(errors: ValidationError[]) {
        return new ValidationException(errors);
      },
    }),
  );

  app.use(helmet());

  if (configService.get<string>('NODE_ENV') == 'dev') {
    const swaggerOptions = new DocumentBuilder()
      .setTitle('NestJS POC Trading Plaform')
      .setDescription('API Specifications')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerOptions, {
      ignoreGlobalPrefix: false,
    });
    SwaggerModule.setup('api/v1/docs', app, document);
  }

  await app.listen(configService.get<number>('PORT') ?? 3000);
}
bootstrap();
