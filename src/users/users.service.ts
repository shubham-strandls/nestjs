import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TransactionService } from '../common/transaction/transaction.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './schemas/users.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly transactionService: TransactionService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const session = this.transactionService.getSession();
    const user = new this.userModel(createUserDto);
    return user.save({ session });
  }

  async findAll(): Promise<User[]> {
    const session = this.transactionService.getSession();
    return this.userModel.find().session(session ?? null).exec();
  }

  async findOne(id: string): Promise<User> {
    const session = this.transactionService.getSession();
    const user = await this.userModel.findById(id).session(session ?? null).exec();
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const session = this.transactionService.getSession();
    const user = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true, session })
      .exec();
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }
    return user;
  }

  async remove(id: string): Promise<void> {
    const session = this.transactionService.getSession();
    const result = await this.userModel.findByIdAndDelete(id, { session }).exec();
    if (!result) {
      throw new NotFoundException(`User #${id} not found`);
    }
  }
}