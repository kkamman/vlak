import { TestBed } from '@angular/core/testing';
import {
  DEFAULT_WEB_STORAGE_CONFIG,
  provideWebStorage,
  WEB_STORAGE_CONFIG,
} from './configuration';

describe('provideWebStorage', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('provides the default configuration when no override is passed', () => {
    TestBed.configureTestingModule({
      providers: [provideWebStorage()],
    });

    const config = TestBed.inject(WEB_STORAGE_CONFIG);

    expect(config).toEqual(DEFAULT_WEB_STORAGE_CONFIG);
    expect(config.watchStorage).toBe(true);
  });

  it('merges the provided configuration over defaults', () => {
    TestBed.configureTestingModule({
      providers: [provideWebStorage({ watchStorage: false })],
    });

    const config = TestBed.inject(WEB_STORAGE_CONFIG);

    expect(config).toEqual({ watchStorage: false });
  });
});
