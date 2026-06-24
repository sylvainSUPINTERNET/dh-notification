import { Injectable, Logger } from "@nestjs/common";
import OpenAI from 'openai';
import { prompt_theme_step1 } from "./prompts";

import mockLLMResult from "../mocks/prompt_result_theme-justice.json";
import type { AboutQuranForAnswer } from "src/types/llm/AboutQuranForAnswer.type";


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
     * @param theme 'patience' 'justice' ...
     * @returns 
     */
    async askChatGPTAboutQuranFor(theme:string): Promise<AboutQuranForAnswer> {
        if ( process.env.ENV! === 'PROD' ) {
            this.logger.log(`Calling OpenAI API with theme : ${theme} - ${process.env.ENV!}`);
            const response = await this.client.responses.create({
                model: process.env.OPENAI_MODEL!,
                input: [
                    {
                    role: 'system',
                    content: `${prompt_theme_step1}`,
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
        } else {
            this.logger.log(`Calling OpenAI API with theme : justice - ${process.env.ENV!}`);
            return mockLLMResult;
        }
    }
}