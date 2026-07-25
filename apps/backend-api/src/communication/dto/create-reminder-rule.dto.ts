import { IsString, IsEnum, IsOptional, IsBoolean, MaxLength, MinLength, IsInt, Min, IsObject } from 'class-validator';
import { NotificationEventType, NotificationChannel } from '../events/notification-event.types';

export class CreateReminderRuleDto {
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
  templateId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  delayMinutes?: number;

  @IsOptional()
  @IsObject()
  conditions?: Record<string, unknown>;
}
