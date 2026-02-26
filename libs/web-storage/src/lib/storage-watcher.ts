import { DestroyRef, inject, Injectable, Renderer2 } from '@angular/core';
import { APPLY_STORAGE_EVENT, StorageItem } from './storage-item';

@Injectable({ providedIn: 'root' })
export class StorageWatcher {
  private readonly renderer = inject(Renderer2);
  private readonly destroyRef = inject(DestroyRef);

  private readonly watchedItemsByStorage: WeakMap<
    Storage,
    Map<string, StorageItem>
  > = new WeakMap();

  private isListeningToStorageEvents = false;

  public startWatching(item: StorageItem): () => void {
    this.ensureListeningToStorageEvents();

    let storageItems = this.watchedItemsByStorage.get(item.storage);

    if (!storageItems) {
      storageItems = new Map<string, StorageItem>();
      this.watchedItemsByStorage.set(item.storage, storageItems);
    }

    storageItems.set(item.key, item);

    return () => this.stopWatching(item);
  }

  public stopWatching(item: StorageItem): void {
    const storageItems = this.watchedItemsByStorage.get(item.storage);
    storageItems?.delete(item.key);
  }

  private handleStorageEvent(event: StorageEvent): void {
    if (!event.storageArea) {
      return;
    }

    const storageItems = this.watchedItemsByStorage.get(event.storageArea);

    if (!storageItems) {
      return;
    }

    if (event.key === null) {
      storageItems.forEach((item) => item[APPLY_STORAGE_EVENT](event));
      return;
    }

    const storageItem = storageItems.get(event.key);

    if (!storageItem) {
      return;
    }

    storageItem[APPLY_STORAGE_EVENT](event);
  }

  private ensureListeningToStorageEvents(): void {
    if (this.isListeningToStorageEvents) {
      return;
    }

    const stopListening = this.renderer.listen(
      'window',
      'storage',
      this.handleStorageEvent,
    );

    this.isListeningToStorageEvents = true;

    this.destroyRef.onDestroy(stopListening);
  }
}
