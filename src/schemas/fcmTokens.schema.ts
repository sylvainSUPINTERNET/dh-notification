import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type FcmTokensDocument = HydratedDocument<FcmTokens>;

@Schema(
  {
      collection: 'fcm_tokens',
      timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      }
  }
)
export class FcmTokens {
  @Prop({ required: true })
  fcmToken!: string;

  @Prop({ required: true })
  uuid!: string;

  @Prop({ default: false })
  isRefresh!: boolean;
}

export const FcmTokensSchema = SchemaFactory.createForClass(FcmTokens);
