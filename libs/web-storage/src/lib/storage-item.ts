import {
  assertInInjectionContext,
  DestroyRef,
  effect,
  inject,
  Renderer2,
  signal,
  WritableSignal,
} from '@angular/core';
import { StandardSchemaV1 } from '@standard-schema/spec';

export interface StorageItem<TKey extends string, TValue> {
  readonly key: TKey;
  readonly value: WritableSignal<TValue>;
}

export function storageItem<
  TKey extends string,
  TValue extends object,
  TSchema extends StandardSchemaV1<unknown, TValue>,
>(config: {
  storage: Storage;
  key: TKey;
  schema: TSchema;
  defaultValue: (
    issues: ReadonlyArray<StandardSchemaV1.Issue>,
  ) => StandardSchemaV1.InferOutput<TSchema>;
}): StorageItem<TKey, StandardSchemaV1.InferOutput<TSchema>> {
  assertInInjectionContext(storageItem);

  const { storage, key, schema, defaultValue } = config;

  const value = resolveStoredValue(storage.getItem(key), schema, defaultValue);
  const valueSignal = signal<TValue>(value);

  const valuesToSkipWriting = new WeakSet<TValue>();

  // Update the signal when the storage item changes in other tabs/windows
  registerStorageListener((event) => {
    if (event.storageArea !== storage) {
      return;
    }

    if (event.key !== key && event.key !== null) {
      return;
    }

    const value = resolveStoredValue(event.newValue, schema, defaultValue);
    valuesToSkipWriting.add(value);
    valueSignal.set(value);
  });

  // Update storage whenever the signal value changes
  effect(() => {
    const value = valueSignal();

    if (valuesToSkipWriting.has(value)) {
      valuesToSkipWriting.delete(value);
      return;
    }

    storage.setItem(key, JSON.stringify(valueSignal()));
  });

  return { key, value: valueSignal };
}

function registerStorageListener(callback: (event: StorageEvent) => void) {
  const renderer = inject(Renderer2);
  const destroyRef = inject(DestroyRef);
  const disposeStorageListener = renderer.listen('window', 'storage', callback);
  destroyRef.onDestroy(() => disposeStorageListener());
}

function resolveStoredValue<T>(
  value: string | null,
  schema: StandardSchemaV1<unknown, T>,
  defaultValue: (issues: ReadonlyArray<StandardSchemaV1.Issue>) => T,
): T {
  const parsedValue = parseStoredValue(value);
  const validationResult = validateStoredValue(parsedValue, schema);
  return validationResult.issues
    ? defaultValue(validationResult.issues)
    : validationResult.value;
}

function parseStoredValue(value: string | null): unknown | null {
  try {
    return value !== null ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function validateStoredValue<T>(
  value: unknown,
  schema: StandardSchemaV1<unknown, T>,
): StandardSchemaV1.Result<T> {
  const validationResult = schema['~standard'].validate(value);

  if (validationResult instanceof Promise) {
    throw new Error(
      'Asynchronous validation is not supported for storage items.',
    );
  }

  return validationResult;
}
