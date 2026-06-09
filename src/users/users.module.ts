import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostHogModule } from '../posthog/posthog.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User, UsersSchema } from './schemas/users.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UsersSchema }]),
    PostHogModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
