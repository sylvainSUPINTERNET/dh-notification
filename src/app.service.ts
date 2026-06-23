import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FcmTokens } from './schemas/fcmTokens.schema';
import { Model } from 'mongoose';
import type { FcmTokenPayload } from './types/fcmTokenPayload.type';

@Injectable()
export class AppService {

  constructor(@InjectModel(FcmTokens.name) private fcmTokenModel: Model<FcmTokens>) {}
  
  async upsertFcmToken(payload:FcmTokenPayload): Promise<FcmTokens> {
  const fcmTokenRecord = await this.fcmTokenModel.findOneAndUpdate(
      { uuid: payload.uuid },
      {
        fcmToken: payload.fcmToken,
        updatedAt: new Date(),
      },
      {
        upsert: true,
        returnDocument: 'after',
      },
    );
    return fcmTokenRecord;
  }
}
