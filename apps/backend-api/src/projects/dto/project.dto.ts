import { IsNotEmpty, IsString, IsOptional, IsDateString } from 'class-validator';

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
}
