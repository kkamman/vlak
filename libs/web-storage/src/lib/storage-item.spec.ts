import { TestBed } from '@angular/core/testing';
import zod from 'zod';
import { storageItem, StorageItemConfiguration } from './storage-item';

describe('webStorageItem', () => {
  const testSchema = zod.object({ test: zod.string() });
  const testConfig: StorageItemConfiguration<zod.infer<typeof testSchema>> = {
    storage: localStorage,
    key: 'test',
    schema: testSchema,
    defaultValueProvider: () => ({ test: 'test' }),
  };

  const localStorageSpy = vi
    .spyOn(Storage.prototype, 'getItem')
    .mockReturnValue(JSON.stringify({ test: 'test' }));

  afterEach(() => {
    localStorageSpy.mockClear();
    localStorage.clear();
  });

  it('should throw when running outside an injection context', () => {
    expect(() => {
      storageItem(testConfig);
    }).toThrowError(/^NG0203/);
  });

  it('should throw when using async schema', () => {
    const asyncSchema = zod
      .object({ test: zod.string() })
      .refine(async () => true);

    expect(() => {
      TestBed.runInInjectionContext(() =>
        storageItem({
          ...testConfig,
          schema: asyncSchema,
        }),
      );
    }).toThrowError(
      'Asynchronous validation is not supported for storage items.',
    );
  });
});
