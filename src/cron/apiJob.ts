import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { CronJob } from 'cron';
import { OpenAiClient } from "src/openai/client";
import type { AboutQuranForAnswer } from "src/types/llm/AboutQuranForAnswer.type";

@Injectable()
export class ApiJob implements OnModuleInit {
    private readonly logger = new Logger(ApiJob.name);

    private readonly themes:string[] = process.env.APP_THEME_LIST!.split(',').map(theme => theme.trim());

    constructor(private readonly openAiClient: OpenAiClient) {}

    onModuleInit() {

        let cronTime:string;
        if ( process.env.ENV === 'PROD' ) {
            this.logger.log(`Cron job will run with schedule : ${process.env.PROD_CRON_SCHEDULE_NOTIFICATION} - ${process.env.ENV}`);
            cronTime = process.env.PROD_CRON_SCHEDULE_NOTIFICATION!;
        } else {
            this.logger.log(`Cron job will run with schedule : ${process.env.DEV_CRON_SCHEDULE_NOTIFICATION} - ${process.env.ENV}`);
            cronTime = process.env.DEV_CRON_SCHEDULE_NOTIFICATION!;
        }

        // TODO : save in DB the data ( to be view on the dashboard on phone )
        // TODO : get list of FCM tokens 
        // TODO : concurrency send X notifications with firebase SDK

        // TODO : manage history ? to avoid same theme twice in a row ? or just randomize it and let it be random ?

        CronJob.from({
                cronTime,
                timeZone: process.env.CRON_TIMEZONE,
                onTick: async () => {
                    this.logger.log('Cron job executed at ' + new Date().toISOString());

                    const theme:string = process.env.ENV! === "DEV" ? 'la justice': this.themes[Math.floor(Math.random() * this.themes.length)];
                    this.logger.log(`Selected theme : ${theme} - ${process.env.ENV!}`);

                    try {
                        // step 1 get verces
                        const result: AboutQuranForAnswer = await this.openAiClient.askChatGPTAboutQuranFor(theme);
                        this.logger.log(`Result: ${JSON.stringify(result)}`);

                        // step 2 get data from alquran API with verces from step 1

                        const { surah, verses } = result;

                        //- text_fr contains translation only 
                        //-  audio contains ar + audio mp3
                        // - text_ar is useless
                        const {text_fr, audio } = result.apis;
                        
                        // ar + audio
                        const arAndAudioData = await fetch(`https://api.alquran.cloud/v1/surah/${surah}/ar.alafasy`);
                        if ( !arAndAudioData.ok ) {
                            throw new Error(`Error while fetching ar + audio data from alquran API for surah ${surah} - status : ${arAndAudioData.status}`);
                        }

                        // fr
                        const frData = await fetch(`https://api.alquran.cloud/v1/surah/${surah}/fr.hamidullah`);
                        if ( !frData.ok ) {
                            throw new Error(`Error while fetching fr data from alquran API for surah ${surah} - status : ${frData.status}`);
                        }

                        if ( arAndAudioData.ok && frData.ok ) {
                            // TODO bug ici, car on peut avoir plusieurs verses ! on peut donc pas juste prendre le 0 ...
                            const {data:arAndAudio} = await arAndAudioData.json();
                            const {audio:arAudio, text:arText} = arAndAudio.ayahs.filter((ayah:any) => verses.includes(ayah.numberInSurah))[0];
                            const {data:fr} = await frData.json();
                            let {text:frText}  = fr.ayahs.filter((ayah:any) => verses.includes(ayah.numberInSurah))[0];

                            const mergedResult = {
                                theme, 
                                surah,
                                verses,
                                content: {
                                    arText,
                                    frText,
                                    arAudio
                                }
                            }

                            this.logger.log(`Merged result : ${JSON.stringify(mergedResult)}`);
                            
                        }

                    } catch ( error ) {
                        this.logger.error(`Error while executing cron job : ${error}`);
                    }
                },
                start: true
            });
    }
}