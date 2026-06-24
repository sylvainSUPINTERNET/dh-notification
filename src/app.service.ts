import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FcmTokens } from './schemas/fcmTokens.schema';
import { Model } from 'mongoose';
import type { FcmTokenPayload } from './types/fcmTokenPayload.type';
import { getMessaging } from 'firebase-admin/messaging';

@Injectable()
export class AppService {

  constructor(@InjectModel(FcmTokens.name) private fcmTokenModel: Model<FcmTokens>) {}
  
  capitalize(str):string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

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


  async sendNotifications(mergeResult: 
    { 
      theme:string, 
      surah:number,
      verses:number[],
      contents: {
        verseNumber: number;
        text_ar: string;
        text_fr: string;
        audio:string;
      }[]
    }) {
    const firstVerse = mergeResult.contents[0]
    const fcmTokensToNotiyfy: FcmTokens[]= await this.fcmTokenModel.find();
    console.log(`Sending notifications to ${fcmTokensToNotiyfy.length} tokens`);

    // firebase limits the number of tokens per batch to 500, so we need to split the tokens into batches
    const BATCH_SIZE = 500;
    for (let i = 0; i < fcmTokensToNotiyfy.length; i += BATCH_SIZE) {
      const batch = fcmTokensToNotiyfy.slice(i, i + BATCH_SIZE);

      await getMessaging().sendEachForMulticast({
        tokens: batch.map(token => token.fcmToken),
        notification: {
          title: `${this.capitalize(mergeResult.theme)}`,
          body: firstVerse.text_fr,
        },
        data: {
          type: 'dhikr',
          mergeResult: JSON.stringify(mergeResult)
        }
      });
    }
  }


}
