import { Injectable, WritableSignal } from '@angular/core';
import { StorageItem } from './storage-item';

@Injectable({ providedIn: 'root' })
export class StorageItemSignalCache {
  private readonly cache = new WeakMap<
    Storage,
    Map<string, WritableSignal<unknown>>
  >();

  public cacheItemValueSignal(item: StorageItem): void {
    let storageCache = this.cache.get(item.storage);
    if (!storageCache) {
      storageCache = new Map<string, WritableSignal<unknown>>();
      this.cache.set(item.storage, storageCache);
    }
    storageCache.set(item.key, item.value);
  }

  public getValueSignalForItemWithKey(
    storage: Storage,
    key: string,
  ): WritableSignal<unknown> | undefined {
    const storageCache = this.cache.get(storage);
    return storageCache?.get(key);
  }
}
