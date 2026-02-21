import { effect, signal, WritableSignal } from '@angular/core';
import { ZodError, ZodSafeParseResult, ZodType } from 'zod';

export type StorageItemConfiguration<T> = {
  storage: Storage;
  key: string;
  schema: ZodType<T>;
  defaultValueProvider: (error: ZodError<T>) => T;
};

export type StorageItem<T> = {
  readonly key: string;
  readonly value: WritableSignal<T>;
};

export const storageItem = <T>(
  configuration: StorageItemConfiguration<T>,
): StorageItem<T> => {
  const { storage, key, schema, defaultValueProvider } = configuration;

  const parseResult = parseStorageItem(storage.getItem(key), schema);
  const initialValue = resolveParseResult(parseResult, defaultValueProvider);
  const valueSignal = signal<T>(initialValue);

  // Read from storage whenever it changes in another tab or window
  addEventListener('storage', (event) => {
    if (event.storageArea !== storage) {
      return;
    }

    if (event.key !== key && event.key !== null) {
      return;
    }

    const parseResult = parseStorageItem(event.newValue, schema);
    const newValue = resolveParseResult(parseResult, defaultValueProvider);
    valueSignal.set(newValue);
  });

  // Write to storage whenever the signal value changes
  effect(() => storage.setItem(key, JSON.stringify(valueSignal())));

  return { key, value: valueSignal };
};

const parseStorageItem = <T>(
  value: string | null,
  schema: ZodType<T>,
): ZodSafeParseResult<T> => {
  let storedValue: unknown = null;

  if (value != null) {
    try {
      storedValue = JSON.parse(value);
    } catch {
      storedValue = value;
    }
  }

  return schema.safeParse(storedValue);
};

const resolveParseResult = <T>(
  parseResult: ZodSafeParseResult<T>,
  defaultValueProvider: (error: ZodError<T>) => T,
): T => {
  return parseResult.success
    ? parseResult.data
    : defaultValueProvider(parseResult.error);
};
