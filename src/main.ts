import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  if ( !process.env.ENV ) {
    console.error('Error : Application cannot start because ENV variable is not set, must be `PROD` or `DEV`');
    process.exit(1);
  } else {
    console.log(`Application starting with ENV variable is set to ${process.env.ENV}`);
  }

  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
