import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { OpenAiClient } from './openai/client';
import { ApiJob } from './cron/apiJob';
import { MongooseModule } from '@nestjs/mongoose';
import { FcmTokens, FcmTokensSchema } from './schemas/fcmTokens.schema';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    MongooseModule.forRoot(`${process.env.MONGODB_URI!}`),
    MongooseModule.forFeature([{ name: FcmTokens.name, schema: FcmTokensSchema }])
  ],
  controllers: [AppController],
  providers: [AppService, OpenAiClient, ApiJob],
})
export class AppModule {}
