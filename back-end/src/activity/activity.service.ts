import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Activity } from './activity.schema';
import { CreateActivityInput } from './activity.inputs.dto';

const DIACRITIC_GROUPS: Record<string, string> = {
  a: '[aàáâãäåæ]',
  c: '[cç]',
  e: '[eèéêë]',
  i: '[iìíîï]',
  n: '[nñ]',
  o: '[oòóôõöø]',
  u: '[uùúûü]',
  y: '[yýÿ]',
};

const REGEX_SPECIALS = /[.*+?^${}()|[\]\\]/;

function buildDiacriticInsensitiveRegex(input: string): string {
  const stripped = input.normalize('NFD').replace(/[̀-ͯ]/g, '');
  let out = '';
  for (const ch of stripped) {
    const group = DIACRITIC_GROUPS[ch.toLowerCase()];
    if (group) out += group;
    else if (REGEX_SPECIALS.test(ch)) out += '\\' + ch;
    else out += ch;
  }
  return out;
}

@Injectable()
export class ActivityService {
  constructor(
    @InjectModel(Activity.name)
    private activityModel: Model<Activity>,
  ) {}

  async findAll(): Promise<Activity[]> {
    return this.activityModel.find().sort({ createdAt: -1 }).exec();
  }

  async findLatest(): Promise<Activity[]> {
    return this.activityModel.find().sort({ createdAt: -1 }).limit(3).exec();
  }

  async findByUser(userId: string): Promise<Activity[]> {
    return this.activityModel
      .find({ owner: userId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Activity> {
    const activity = await this.activityModel.findById(id).exec();
    if (!activity) throw new NotFoundException();
    return activity;
  }

  async findByIds(ids: string[]): Promise<Activity[]> {
    return this.activityModel.find({ _id: { $in: ids } }).exec();
  }

  async create(userId: string, data: CreateActivityInput): Promise<Activity> {
    const activity = await this.activityModel.create({
      ...data,
      owner: userId,
    });
    return activity;
  }

  async findCities(): Promise<string[]> {
    return this.activityModel.distinct('city').exec();
  }

  async findByCity(
    city: string,
    activity?: string,
    price?: number,
  ): Promise<Activity[]> {
    return this.activityModel
      .find({
        $and: [
          { city },
          ...(price ? [{ price: { $lte: price } }] : []),
          ...(activity
            ? [{ name: { $regex: buildDiacriticInsensitiveRegex(activity), $options: 'i' } }]
            : []),
        ],
      })
      .exec();
  }

  async countDocuments(): Promise<number> {
    return this.activityModel.estimatedDocumentCount().exec();
  }
}
