import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { CronJob } from 'cron';
import { AppService } from "src/app.service";
import { OpenAiClient } from "src/openai/client";
import type { AboutQuranForAnswer } from "src/types/llm/AboutQuranForAnswer.type";

@Injectable()
export class ApiJob implements OnModuleInit {
    private readonly logger = new Logger(ApiJob.name);

    private readonly themes:string[] = process.env.APP_THEME_LIST!.split(',').map(theme => theme.trim());

    constructor(private readonly openAiClient: OpenAiClient, private readonly appService:AppService) {}

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
                        const LLMResult: AboutQuranForAnswer = await this.openAiClient.askChatGPTAboutQuranFor(theme);
                        this.logger.log(`Result: ${JSON.stringify(LLMResult)}`);

                        const mergedData = await this.appService.mergeQuranDataApi(LLMResult);
                        this.logger.log(`Merged data: ${JSON.stringify(mergedData)}`);
                        

                        await this.appService.sendPushNotifications(mergedData);
                        this.logger.log(`Notifications sent successfully for theme : ${theme} - ${process.env.ENV!}`);

                    } catch ( error ) {
                        this.logger.error(`Error while executing cron job : ${error}`);
                    }
                },
                start: true
            });
    }
}