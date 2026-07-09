import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateAssignmentDto {
  @IsUUID()
  @IsNotEmpty()
  userId!: string;
}
