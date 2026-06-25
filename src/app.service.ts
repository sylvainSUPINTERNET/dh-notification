import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FcmTokens } from './schemas/fcmTokens.schema';
import { Model } from 'mongoose';
import type { FcmTokenPayload } from './types/fcmTokenPayload.type';
import { getMessaging } from 'firebase-admin/messaging';
import { AboutQuranForAnswer } from './types/llm/AboutQuranForAnswer.type';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

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


  async sendPushNotifications(mergeResult: 
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

  async mergeQuranDataApi(LLMResult: AboutQuranForAnswer):Promise<{
    theme:string,
    surah:number,
    verses:number[],
    contents: {
      verseNumber: number;
      text_ar: string;
      text_fr: string;
      text_en: string;
      audio:string;
    }[]}> {
    const { surah, verses, apis } = LLMResult;

    const arData = await fetch(apis.text_ar_url);
    if (!arData.ok) {
      throw new Error(`Error while fetching ar data from alquran API for surah ${surah} - status : ${arData.status}`);
    }

    const frData = await fetch(apis.text_fr_url);
    if (!frData.ok) {
      throw new Error(`Error while fetching fr data from alquran API for surah ${surah} - status : ${frData.status}`);
    }

    const enData = await fetch(apis.text_en_url);
    if (!enData.ok) {
      throw new Error(`Error while fetching en data from alquran API for surah ${surah} - status : ${enData.status}`);
    }

    const audioData = await fetch(apis.audio_url);
    if (!audioData.ok) {
      throw new Error(`Error while fetching audio data from alquran API for surah ${surah} - status : ${audioData.status}`);
    }

    if (arData.ok && frData.ok && enData.ok && audioData.ok) {
      const { data: ar } = await arData.json();
      const { data: fr } = await frData.json();
      const { data: en } = await enData.json();
      const { data: audio } = await audioData.json();
      const mergedResult = {
        theme: LLMResult.theme,
        surah,
        verses,
        contents: ar.ayahs.filter((ayah: any) => verses.includes(ayah.numberInSurah)).map((ayah: any) => {
          const frTextForVerse = fr.ayahs.find((frAyah: any) => frAyah.numberInSurah === ayah.numberInSurah);
          const enTextForVerse = en.ayahs.find((enAyah: any) => enAyah.numberInSurah === ayah.numberInSurah);
          const audioForVerse = audio.ayahs.find((audioAyah: any) => audioAyah.numberInSurah === ayah.numberInSurah);
          if (!frTextForVerse || !enTextForVerse || !audioForVerse) {
            throw new Error(`Error while merging data from alquran API for surah ${surah} - verse ${ayah.numberInSurah} - fr or en or audio text not found`);
          }
          return {
            verseNumber: ayah.numberInSurah,
            text_ar: ayah.text,
            text_fr: frTextForVerse.text,
            text_en: enTextForVerse.text,
            audio: audioForVerse.audio
          }
        })
      }
      return mergedResult;

    } else {
      throw new Error(`Error while fetching data from alquran API for surah ${surah} - status : ${arData.status}, ${frData.status}, ${enData.status}, ${audioData.status}`);
    }
  }


}
