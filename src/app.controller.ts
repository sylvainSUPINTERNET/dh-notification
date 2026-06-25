import { Body, Controller, Get, HttpStatus, Logger, Param, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AppService } from './app.service';
import type { FcmTokenPayload } from './types/fcmTokenPayload.type';
import { QuotesHistory } from './schemas/quotesHistory.schema';

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

  @Get("/quotes-history/:year/:month")
  async getQuotesHistory(
    @Res() res: Response,
    @Param('year') year: number,
    @Param('month') month: number): Promise<Response> {
      try {
        const quotesHistory = await this.appService.getQuotesHistoryByMonth(year, month);
        return res.status(HttpStatus.OK).json(quotesHistory);
      } catch (error) {
        this.logger.error(`Error retrieving quotes history: ${error}`);
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Failed to retrieve quotes history' });
      }
  }
}
