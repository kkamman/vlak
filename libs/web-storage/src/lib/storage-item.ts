import {
  assertInInjectionContext,
  DestroyRef,
  effect,
  inject,
  linkedSignal,
  signal,
  WritableSignal,
} from '@angular/core';
import { StandardSchemaV1 } from '@standard-schema/spec';
import {
  DEFAULT_WEB_STORAGE_CONFIG,
  WEB_STORAGE_CONFIG,
} from './configuration';
import { StorageItemSignalCache } from './storage-item-signal-cache';
import { StorageWatcher } from './storage-watcher';

export const APPLY_STORAGE_EVENT = Symbol('applyStorageEvent');

export interface StorageItem<TKey extends string = string, TValue = unknown> {
  readonly storage: Storage;
  readonly key: TKey;
  readonly value: WritableSignal<TValue>;
  readonly [APPLY_STORAGE_EVENT]: (event: StorageEvent) => void;
}

export function storageItem<TKey extends string, TValue>(
  storage: Storage,
  key: TKey,
  schema: StandardSchemaV1<unknown, TValue>,
  defaultValue:
    | TValue
    | ((issues: ReadonlyArray<StandardSchemaV1.Issue>) => TValue),
): StorageItem<TKey, TValue> {
  const item = storageItem.untyped(storage, key);

  function resolveValue(value: unknown) {
    const validationResult = schema['~standard'].validate(value);

    if (validationResult instanceof Promise) {
      throw new Error(
        'Asynchronous validation is not supported for storage items.',
      );
    }

    if (!validationResult.issues) {
      return validationResult.value;
    }

    return defaultValue instanceof Function
      ? defaultValue(validationResult.issues)
      : defaultValue;
  }

  const valueSignal = linkedSignal(() => resolveValue(item.value()));

  effect(() => item.value.set(resolveValue(valueSignal())));

  const itemWithSchema = {
    ...item,
    schema,
    defaultValue,
    value: valueSignal,
  };

  return itemWithSchema;
}

storageItem.untyped = function <TKey extends string>(
  storage: Storage,
  key: TKey,
): StorageItem<TKey> {
  assertInInjectionContext(storageItem);

  const signalCache = inject(StorageItemSignalCache);
  const cachedSignal = signalCache.getValueSignalForItemWithKey(storage, key);

  const valueSignal =
    cachedSignal ?? signal(safeJsonParse(storage.getItem(key)));

  effect(() => storage.setItem(key, JSON.stringify(valueSignal())));

  const applyStorageEvent = (event: StorageEvent) => {
    const storedValue = safeJsonParse(event.newValue);
    valueSignal.set(storedValue);
  };

  const itemResult = {
    storage,
    key,
    value: valueSignal,
    [APPLY_STORAGE_EVENT]: applyStorageEvent,
  };

  const webStorageConfig =
    inject(WEB_STORAGE_CONFIG, { optional: true }) ??
    DEFAULT_WEB_STORAGE_CONFIG;

  if (webStorageConfig.watchStorage) {
    const storageWatcher = inject(StorageWatcher);
    const stopWatching = storageWatcher.startWatching(itemResult);

    const destroyRef = inject(DestroyRef, { optional: true });
    destroyRef?.onDestroy(stopWatching);
  }

  if (!cachedSignal) {
    signalCache.cacheItemValueSignal(itemResult);
  }

  return itemResult;
};

function safeJsonParse(value: string | null): unknown | null {
  try {
    return value !== null ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}
