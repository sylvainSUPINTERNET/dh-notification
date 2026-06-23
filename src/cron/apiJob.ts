import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { CronJob } from 'cron';

@Injectable()
export class ApiJob implements OnModuleInit {
    private readonly logger = new Logger(ApiJob.name);

    constructor() {}

    onModuleInit() {
        const cronTime = process.env.CRON_SCHEDULE_NOTIFICATION!;

        // TODO : rework prompt 
        // https://chatgpt.com/c/6a39d9bd-d2a8-83ed-868a-2e08e9b31e24
        
        // TODO : prompt 
        // TODO : save in DB the data ( to be view on the dashboard on phone )
        // TODO : get list of FCM tokens 
        // TODO : concurrency send X notifications with firebase SDK

        CronJob.from({
                cronTime,
                onTick: () => {
                    this.logger.log('Cron job executed at ' + new Date().toISOString());
                },
                start: true,
                timeZone: process.env.CRON_TIMEZONE,
            });
    }
}