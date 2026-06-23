import { Body, Controller, Get, HttpStatus, Logger, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AppService } from './app.service';
import type { FcmTokenPayload } from './types/fcmTokenPayload.type';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);
  
  constructor(private readonly appService: AppService) {}

  @Get()
  health(@Res() res: Response): Response {
    return res.status(200).json({ status: 'ok' });
  }

  @Post("/fcm-token")
  async saveFcmToken(
    @Body() body: FcmTokenPayload,
    @Res() res: Response): Promise<Response>{
      const { fcmToken, uuid, isRefresh } = body;
      this.logger.log(`Received FCM token: ${fcmToken}, UUID: ${uuid}, isRefresh: ${isRefresh}`);
      try {
        const fcmTokenResult = await this.appService.upsertFcmToken({ fcmToken, uuid, isRefresh });
        return res.status(HttpStatus.OK).json({
          ...fcmTokenResult
        });
      } catch (error) {
        this.logger.error(`Error saving FCM token: ${error}`);
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Failed to save FCM token' });
      }
  };
}
