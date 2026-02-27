import { signal } from '@angular/core';
import { StorageSignalCache } from './storage-signal-cache';
import { createFakeStorage } from './testing/fake-storage';

describe('StorageSignalCache', () => {
  let cache: StorageSignalCache;
  let storageA: Storage;
  let storageB: Storage;

  beforeEach(() => {
    cache = new StorageSignalCache();
    storageA = createFakeStorage();
    storageB = createFakeStorage();
  });

  describe('set', () => {
    it('stores a signal for the first key in a storage instance', () => {
      const valueSignal = signal('value');

      cache.set(storageA, 'key', valueSignal);

      expect(cache.get(storageA, 'key')).toBe(valueSignal);
    });

    it('stores signals by key for a given storage instance', () => {
      const signalForFirstKey = signal('first-value');
      const signalForSecondKey = signal('second-value');

      cache.set(storageA, 'first-key', signalForFirstKey);
      cache.set(storageA, 'second-key', signalForSecondKey);

      expect(cache.get(storageA, 'first-key')).toBe(signalForFirstKey);
      expect(cache.get(storageA, 'second-key')).toBe(signalForSecondKey);
    });

    it('replaces the existing signal when called again with the same key and storage', () => {
      const initialSignal = signal('initial-value');
      const replacementSignal = signal('replacement-value');

      cache.set(storageA, 'key', initialSignal);
      cache.set(storageA, 'key', replacementSignal);

      expect(cache.get(storageA, 'key')).toBe(replacementSignal);
    });

    it('does not affect other keys in the same storage instance', () => {
      const signalForKeyOne = signal('value-one');
      const signalForKeyTwo = signal('value-two');

      cache.set(storageA, 'key-one', signalForKeyOne);
      cache.set(storageA, 'key-two', signalForKeyTwo);

      cache.set(storageA, 'key-one', signal('updated-value-one'));

      expect(cache.get(storageA, 'key-two')).toBe(signalForKeyTwo);
    });
  });

  describe('get', () => {
    it('returns undefined when a storage instance has no cached keys', () => {
      expect(cache.get(storageA, 'missing-key')).toBeUndefined();
    });

    it('returns undefined when the requested key is not cached for a storage instance', () => {
      cache.set(storageA, 'cached-key', signal('cached-value'));

      expect(cache.get(storageA, 'missing-key')).toBeUndefined();
    });

    it('returns the exact signal for a matching storage and key', () => {
      const cachedSignal = signal('cached-value');
      cache.set(storageA, 'cached-key', cachedSignal);

      expect(cache.get(storageA, 'cached-key')).toBe(cachedSignal);
    });

    it('keeps same-key lookups isolated across storage instances', () => {
      const signalInStorageA = signal('value-a');
      const signalInStorageB = signal('value-b');

      cache.set(storageA, 'shared-key', signalInStorageA);
      cache.set(storageB, 'shared-key', signalInStorageB);

      expect(cache.get(storageA, 'shared-key')).toBe(signalInStorageA);
      expect(cache.get(storageB, 'shared-key')).toBe(signalInStorageB);
    });
  });

  describe('integration between set and get', () => {
    it('returns all cached signals for different keys in the same storage', () => {
      const userSignal = signal({ id: 1, name: 'Ada' });
      const settingsSignal = signal({ theme: 'dark' });
      const tokenSignal = signal('token-123');

      cache.set(storageA, 'user', userSignal);
      cache.set(storageA, 'settings', settingsSignal);
      cache.set(storageA, 'token', tokenSignal);

      expect(cache.get(storageA, 'user')).toBe(userSignal);
      expect(cache.get(storageA, 'settings')).toBe(settingsSignal);
      expect(cache.get(storageA, 'token')).toBe(tokenSignal);
    });

    it('isolates cached signals across multiple storage instances', () => {
      const userInStorageA = signal('alice');
      const userInStorageB = signal('bob');
      const sharedOnlyInStorageA = signal('a-only');

      cache.set(storageA, 'user', userInStorageA);
      cache.set(storageB, 'user', userInStorageB);
      cache.set(storageA, 'only-in-a', sharedOnlyInStorageA);

      expect(cache.get(storageA, 'user')).toBe(userInStorageA);
      expect(cache.get(storageB, 'user')).toBe(userInStorageB);
      expect(cache.get(storageB, 'only-in-a')).toBeUndefined();
    });
  });
});
