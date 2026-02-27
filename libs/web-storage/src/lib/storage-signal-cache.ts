import { Injectable, WritableSignal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StorageSignalCache {
  private readonly cache = new WeakMap<
    Storage,
    Map<string, WritableSignal<unknown>>
  >();

  public set(
    storage: Storage,
    key: string,
    signal: WritableSignal<unknown>,
  ): void {
    let storageCache = this.cache.get(storage);
    if (!storageCache) {
      storageCache = new Map<string, WritableSignal<unknown>>();
      this.cache.set(storage, storageCache);
    }
    storageCache.set(key, signal);
  }

  public get(
    storage: Storage,
    key: string,
  ): WritableSignal<unknown> | undefined {
    const storageCache = this.cache.get(storage);
    return storageCache?.get(key);
  }
}
