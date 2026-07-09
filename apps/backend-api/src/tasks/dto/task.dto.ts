import { IsNotEmpty, IsString, IsOptional, IsUUID, IsNumber, IsEnum } from 'class-validator';
import { TaskStatus } from '@useaxiom/database';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsUUID()
  @IsOptional()
  milestoneId?: string;

  @IsNumber()
  @IsOptional()
  estimatedHours?: number;
}

export class UpdateTaskStatusDto {
  @IsEnum(TaskStatus)
  @IsNotEmpty()
  status!: TaskStatus;
}
