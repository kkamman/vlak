import { TestBed } from '@angular/core/testing';
import zod from 'zod';
import { provideWebStorage } from './configuration';
import { storageItem } from './storage-item';

function createFakeStorage(initial?: Array<[string, string]>): Storage {
  const store = new Map<string, string>(initial);
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => store.delete(key),
    setItem: (key: string, value: string) => store.set(key, value),
  };
}

describe('storageItem', () => {
  const storage = createFakeStorage();
  const setItemSpy = vi.spyOn(storage, 'setItem');

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideWebStorage({ watchStorage: false })],
    });
  });

  afterEach(() => {
    setItemSpy.mockClear();
    storage.clear();
  });

  it('should throw when running outside an injection context', () => {
    expect(() => {
      storageItem.untyped(storage, 'key');
    }).toThrowError(/^NG0203/);
  });

  it('should persist changes to storage when value updates', () => {
    TestBed.runInInjectionContext(() => {
      const item = storageItem.untyped(storage, 'key');
      setItemSpy.mockClear();

      item.value.set({ updated: true });
      TestBed.tick();

      expect(setItemSpy).toHaveBeenCalledWith(
        'key',
        JSON.stringify({ updated: true }),
      );
    });
  });

  it('should return the same signal when requested twice for same key', () => {
    TestBed.runInInjectionContext(() => {
      const a = storageItem.untyped(storage, 'same-key');
      const b = storageItem.untyped(storage, 'same-key');
      expect(a.value).toBe(b.value);
    });
  });

  it('should not return the same signal when requested twice for different keys', () => {
    TestBed.runInInjectionContext(() => {
      const a = storageItem.untyped(storage, 'key-one');
      const b = storageItem.untyped(storage, 'key-two');
      expect(a.value).not.toBe(b.value);
    });
  });

  describe('with schema', () => {
    it('should throw when using async schema', () => {
      expect(() => {
        TestBed.runInInjectionContext(() => {
          storageItem(
            storage,
            'key',
            zod.string().refine(async () => true),
            () => 'default',
          );
        });
        TestBed.tick();
      }).toThrowError(
        'Asynchronous validation is not supported for storage items.',
      );
    });

    it('should use default value when schema validation fails', () => {
      TestBed.runInInjectionContext(() => {
        const schema = zod.string();
        const defaultValue = () => 'fallback';
        const storageWithInvalidData = createFakeStorage([
          ['invalid-key', JSON.stringify({ notAString: true })],
        ]);

        const item = storageItem(
          storageWithInvalidData,
          'invalid-key',
          schema,
          defaultValue,
        );

        expect(item.value()).toBe('fallback');
      });
    });
  });
});
