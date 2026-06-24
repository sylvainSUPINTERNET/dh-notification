import { Injectable, Logger } from "@nestjs/common";
import { cert, initializeApp } from "firebase-admin";

@Injectable()
export class FirebaseClient {
    
    private readonly logger = new Logger(FirebaseClient.name);
    
    constructor() {
        initializeApp({
            credential: cert({
                projectId: process.env.FIREBASE_PROJECT_ID!,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
                privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
            }),
        });
        this.logger.log('Firebase client initialized');
    }
}