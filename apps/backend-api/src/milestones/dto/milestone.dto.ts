import { IsNotEmpty, IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateMilestoneDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  targetDeadline?: string;
}
