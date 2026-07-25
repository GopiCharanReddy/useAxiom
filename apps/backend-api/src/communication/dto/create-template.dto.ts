import { IsString, IsEnum, IsOptional, IsBoolean, MaxLength, MinLength } from 'class-validator';
import { NotificationEventType, NotificationChannel } from '../events/notification-event.types';

export class CreateTemplateDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsEnum(NotificationEventType)
  eventType!: NotificationEventType;

  @IsEnum(NotificationChannel)
  channel!: NotificationChannel;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @IsString()
  @MinLength(5)
  body!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;
}
