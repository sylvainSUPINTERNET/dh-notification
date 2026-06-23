import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { CronJob } from 'cron';

@Injectable()
export class ApiJob implements OnModuleInit {
    private readonly logger = new Logger(ApiJob.name);

    constructor() {}

    onModuleInit() {
        const cronTime = process.env.CRON_SCHEDULE_NOTIFICATION!;

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