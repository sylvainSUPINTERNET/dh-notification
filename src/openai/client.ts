import { Injectable, Logger } from "@nestjs/common";
import OpenAI from 'openai';
import { prompt_theme } from "./prompts";

@Injectable()
export class OpenAiClient {
    
    private readonly logger = new Logger(OpenAiClient.name);
    readonly client = new OpenAI({
        apiKey: process.env['OPENAI_API_KEY']
    });

    constructor() {
        this.logger.log('OpenAI client initialized');
    }

    /**
     * 
     * @param theme 'patience' ..
     * @returns 
     */
    async test(theme:string): Promise<any> {
        const response = await this.client.responses.create({
            model: process.env.OPENAI_MODEL!,
            input: [
                {
                role: 'system',
                content: `${prompt_theme}`,
                },
                {
                role: 'user',
                content: theme,
                },
            ],
            text: {
                format: {
                type: 'json_object',
                },
            },
        });
        return JSON.parse(response.output_text);
    }


}