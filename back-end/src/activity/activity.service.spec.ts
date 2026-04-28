import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ActivityService } from './activity.service';
import { ActivityModule } from './activity.module';
import { TestModule, closeInMongodConnection } from 'src/test/test.module';
import { Activity } from './activity.schema';

describe('ActivityService', () => {
  let service: ActivityService;
  let activityModel: Model<Activity>;
  let moduleRef: TestingModule;
  const ownerId = new Types.ObjectId().toHexString();

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [TestModule, ActivityModule],
    }).compile();

    service = moduleRef.get<ActivityService>(ActivityService);
    activityModel = moduleRef.get<Model<Activity>>(getModelToken(Activity.name));
  });

  beforeEach(async () => {
    await activityModel.deleteMany({});
  });

  afterAll(async () => {
    await moduleRef.close();
    await closeInMongodConnection();
  });

  const seed = (docs: Partial<Activity>[]) =>
    activityModel.insertMany(
      docs.map((d) => ({
        description: 'desc',
        owner: ownerId,
        ...d,
      })),
    );

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByCity — diacritic-insensitive search', () => {
    beforeEach(async () => {
      await seed([
        { name: 'Crème brûlée', city: 'Paris', price: 10 },
        { name: 'Creme glacée', city: 'Paris', price: 20 },
        { name: 'CRÈME pâtissière', city: 'Paris', price: 30 },
        { name: 'Café', city: 'Paris', price: 5 },
      ]);
    });

    it('matches accented names from an unaccented query', async () => {
      const result = await service.findByCity('Paris', 'creme');
      expect(result).toHaveLength(3);
    });

    it('matches unaccented names from an accented query', async () => {
      const result = await service.findByCity('Paris', 'crème');
      expect(result).toHaveLength(3);
    });

    it('is case-insensitive', async () => {
      const result = await service.findByCity('Paris', 'CREME');
      expect(result).toHaveLength(3);
    });

    it('filters out non-matching names', async () => {
      const result = await service.findByCity('Paris', 'cafe');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Café');
    });

    it('escapes regex special characters instead of crashing', async () => {
      await expect(
        service.findByCity('Paris', 'crème.*('),
      ).resolves.toEqual([]);
    });

    it('returns all activities of the city when query is empty', async () => {
      const result = await service.findByCity('Paris', '');
      expect(result).toHaveLength(4);
    });
  });

  describe('findByCity — max price cap', () => {
    beforeEach(async () => {
      await seed([
        { name: 'A', city: 'Lyon', price: 10 },
        { name: 'B', city: 'Lyon', price: 50 },
        { name: 'C', city: 'Lyon', price: 51 },
        { name: 'D', city: 'Lyon', price: 100 },
      ]);
    });

    it('includes activities at the price boundary ($lte, not $lt)', async () => {
      const result = await service.findByCity('Lyon', undefined, 50);
      expect(result.map((a) => a.name).sort()).toEqual(['A', 'B']);
    });

    it('excludes activities above the cap', async () => {
      const result = await service.findByCity('Lyon', undefined, 50);
      const names = result.map((a) => a.name);
      expect(names).not.toContain('C');
      expect(names).not.toContain('D');
    });

    it('returns everything when no price is provided', async () => {
      const result = await service.findByCity('Lyon');
      expect(result).toHaveLength(4);
    });
  });

  describe('findByCity — combined filters', () => {
    it('intersects search and price filters', async () => {
      await seed([
        { name: 'Crème brûlée', city: 'Paris', price: 10 },
        { name: 'Crème glacée', city: 'Paris', price: 100 },
        { name: 'Café', city: 'Paris', price: 5 },
        { name: 'Crème de marron', city: 'Lyon', price: 10 },
      ]);

      const result = await service.findByCity('Paris', 'creme', 50);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Crème brûlée');
    });
  });
});
