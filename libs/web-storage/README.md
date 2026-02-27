# @vlak/web-storage

Angular Web Storage utilities built around Signals.

## Features

- Reactive `localStorage` / `sessionStorage` values via Angular Signals.
- Optional runtime validation through Standard Schema compatible validators (for example Zod).
- Storage event syncing across tabs/windows.

## Installation

TODO

## API

### `provideWebStorage(config?)`

Registers library configuration.

```ts
import { provideWebStorage } from '@vlak/web-storage';

providers: [provideWebStorage({ watchStorage: true })];
```

Config shape:

```ts
interface WebStorageConfig {
  watchStorage: boolean; // default: true
}
```

### `storageItem.untyped(storage, key)`

Creates a storage-backed signal without validation.

```ts
import { storageItem } from '@vlak/web-storage';

const themeItem = storageItem.untyped(localStorage, 'theme');

themeItem.value(); // read
themeItem.value.set('dark'); // write
```

### `storageItem(storage, key, schema, defaultValue)`

Creates a typed storage-backed signal with synchronous schema validation.

```ts
import { storageItem } from '@vlak/web-storage';
import z from 'zod';

const preferencesItem = storageItem(
  localStorage,
  'preferences',
  z.object({
    compactMode: z.boolean(),
  }),
  { compactMode: false },
);

preferencesItem.value();
preferencesItem.value.set({ compactMode: true });
```

If validation fails, `defaultValue` is used. `defaultValue` can be either:

- a value, or
- a function receiving schema issues.

## Usage in Angular

`storageItem` must be called within an Angular injection context, such as during service or component initialization.

```ts
import { Injectable, signal } from '@angular/core';
import { storageItem } from '@vlak/web-storage';
import z from 'zod';

@Injectable({ providedIn: 'root' })
export class PreferencesStore {
  private readonly item = storageItem(localStorage, 'preferences', z.object({ compactMode: z.boolean() }), { compactMode: false });

  readonly preferences = this.item.value;

  setCompactMode(compactMode: boolean) {
    this.preferences.update((value) => ({ ...value, compactMode }));
  }
}
```

## Behavior notes

- Values are serialized with `JSON.stringify` and parsed with `JSON.parse`.
- Invalid JSON in storage is treated as `null`.
- The same `(storage, key)` pair reuses a cached signal instance.
- Async schema validation is not supported.
- When `watchStorage` is enabled, updates from browser `storage` events are applied automatically.
