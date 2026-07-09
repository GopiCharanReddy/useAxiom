import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { ProjectsModule } from './projects/projects.module';
import { MilestonesModule } from './milestones/milestones.module';
import { TasksModule } from './tasks/tasks.module';
import { AssignmentsModule } from './assignments/assignments.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    ProjectsModule,
    MilestonesModule,
    TasksModule,
    AssignmentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
