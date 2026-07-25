import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class SendTestWhatsappDto {
  @IsString()
  @IsNotEmpty()
  recipientPhone!: string;

  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  @IsObject()
  variables?: Record<string, string>;
}
