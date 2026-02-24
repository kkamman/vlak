import { Injectable } from '@angular/core';
import { StorageItem } from './storage-item';

@Injectable({ providedIn: 'root' })
export class StorageItemCache {
  private readonly cache = new WeakMap<
    Storage,
    Map<string, StorageItem<string, unknown>>
  >();

  public add(item: StorageItem<string, unknown>): void {
    let storageCache = this.cache.get(item.storage);
    if (!storageCache) {
      storageCache = new Map<string, StorageItem>();
      this.cache.set(item.storage, storageCache);
    }
    storageCache.set(item.key, item);
  }

  public get(storage: Storage, key: string): StorageItem | undefined {
    const storageCache = this.cache.get(storage);
    return storageCache?.get(key);
  }
}
