import {
  assertInInjectionContext,
  effect,
  signal,
  WritableSignal,
} from '@angular/core';
import { StandardSchemaV1 } from '@standard-schema/spec';

export type StorageItemConfiguration<T> = {
  storage: Storage;
  key: string;
  schema: StandardSchemaV1<unknown, T>;
  defaultValueProvider: (issues: ReadonlyArray<StandardSchemaV1.Issue>) => T;
};

export type StorageItem<T> = {
  readonly key: string;
  readonly value: WritableSignal<T>;
};

export const storageItem = <T>(
  configuration: StorageItemConfiguration<T>,
): StorageItem<T> => {
  assertInInjectionContext(storageItem);

  const { storage, key, schema, defaultValueProvider } = configuration;

  const parseResult = parseStorageItem(storage.getItem(key), schema);
  const value = resolveParseResult(parseResult, defaultValueProvider);
  const valueSignal = signal<T>(value);

  // Read from storage whenever it changes in another tab or window
  addEventListener('storage', (event) => {
    if (event.storageArea !== storage) {
      return;
    }

    if (event.key !== key && event.key !== null) {
      return;
    }

    const parseResult = parseStorageItem(event.newValue, schema);
    const value = resolveParseResult(parseResult, defaultValueProvider);
    valueSignal.set(value);
  });

  // Write to storage whenever the signal value changes
  effect(() => storage.setItem(key, JSON.stringify(valueSignal())));

  return { key, value: valueSignal };
};

const parseStorageItem = <T>(
  value: string | null,
  schema: StandardSchemaV1<unknown, T>,
): StandardSchemaV1.Result<T> => {
  let storedValue: unknown = null;

  if (value !== null) {
    try {
      storedValue = JSON.parse(value);
    } catch {
      storedValue = null;
    }
  }

  const validationResult = schema['~standard'].validate(storedValue);
  console.log('Validation result:', validationResult);

  if (validationResult instanceof Promise) {
    throw new Error(
      'Asynchronous validation is not supported for storage items.',
    );
  }

  return validationResult;
};

const resolveParseResult = <T>(
  parseResult: StandardSchemaV1.Result<T>,
  defaultValueProvider: (issues: ReadonlyArray<StandardSchemaV1.Issue>) => T,
): T => {
  return parseResult.issues
    ? defaultValueProvider(parseResult.issues)
    : parseResult.value;
};
