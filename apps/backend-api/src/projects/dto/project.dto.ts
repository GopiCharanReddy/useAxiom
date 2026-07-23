import { IsNotEmpty, IsString, IsOptional, IsDateString, IsArray } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  objective!: string;

  @IsDateString()
  @IsOptional()
  targetDeadline?: string;

  @IsString()
  @IsOptional()
  domain?: string;

  @IsString({ each: true })
  @IsOptional()
  techStack?: string[];

  @IsArray()
  @IsOptional()
  tasks?: {
    title: string;
    description: string;
    estimatedHours?: number;
  }[];
}
