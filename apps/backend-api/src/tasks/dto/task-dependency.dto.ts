import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateTaskDependencyDto {
  @IsUUID()
  @IsNotEmpty()
  dependsOnTaskId!: string;
}
