import { InjectionToken, Provider } from '@angular/core';

export interface WebStorageConfig {
  watchStorage: boolean;
}

export const WEB_STORAGE_CONFIG = new InjectionToken<WebStorageConfig>(
  'web-storage.config',
);

export const DEFAULT_WEB_STORAGE_CONFIG: WebStorageConfig = {
  watchStorage: true,
};

export function provideWebStorage(
  config?: Partial<WebStorageConfig>,
): Provider[] {
  return [
    {
      provide: WEB_STORAGE_CONFIG,
      useValue: {
        ...DEFAULT_WEB_STORAGE_CONFIG,
        ...config,
      } satisfies WebStorageConfig,
    },
  ];
}
