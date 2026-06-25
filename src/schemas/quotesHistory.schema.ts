import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type QuotesHistoryDocument = HydratedDocument<QuotesHistory>;

@Schema({ _id: false })
export class QuoteContent {
  @Prop({ required: true })
  verseNumber!: number;

  @Prop({ required: true })
  text_ar!: string;

  @Prop({ required: true })
  text_fr!: string;

  @Prop({ required: true })
  text_en!: string;

  @Prop({ required: true })
  audio!: string;
}

export const QuoteContentSchema = SchemaFactory.createForClass(QuoteContent);

@Schema({
  collection: 'quotes_history',
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
})
export class QuotesHistory {
  @Prop({ required: true })
  theme!: string;

  @Prop({ required: true })
  surah!: number;

  @Prop({ type: [Number], required: true })
  verses!: number[];

  @Prop({ type: [QuoteContentSchema], required: true })
  contents!: QuoteContent[];
}

export const QuotesHistorySchema = SchemaFactory.createForClass(QuotesHistory);
