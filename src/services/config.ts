import Conf from 'conf';

interface AppConfig {
  checkUpdates: boolean;
  ignoredPackages: string[];
  watchedPackages: string[]; // 监控更新的包列表
  lastCheckTime: number;
}

class ConfigService {
  private store: Conf<AppConfig>;

  constructor() {
    this.store = new Conf<AppConfig>({
      projectName: 'term-clean',
      defaults: {
        checkUpdates: true,
        ignoredPackages: [],
        watchedPackages: [], // 默认不监控任何包
        lastCheckTime: 0,
      },
    });
  }

  public get shouldCheckUpdates(): boolean {
    return this.store.get('checkUpdates');
  }

  public setCheckUpdates(enable: boolean): void {
    this.store.set('checkUpdates', enable);
  }

  public isPackageIgnored(packageName: string): boolean {
    const ignored = this.store.get('ignoredPackages');
    return ignored.includes(packageName);
  }

  public togglePackageIgnore(packageName: string): void {
    const ignored = this.store.get('ignoredPackages');
    if (ignored.includes(packageName)) {
      this.store.set(
        'ignoredPackages',
        ignored.filter((p) => p !== packageName)
      );
    } else {
      this.store.set('ignoredPackages', [...ignored, packageName]);
    }
  }

  // 监控包管理
  public isPackageWatched(packageName: string): boolean {
    const watched = this.store.get('watchedPackages');
    return watched.includes(packageName);
  }

  public togglePackageWatch(packageName: string): void {
    const watched = this.store.get('watchedPackages');
    if (watched.includes(packageName)) {
      this.store.set(
        'watchedPackages',
        watched.filter((p) => p !== packageName)
      );
    } else {
      this.store.set('watchedPackages', [...watched, packageName]);
    }
  }

  public getWatchedPackages(): string[] {
    return this.store.get('watchedPackages');
  }

  public get lastCheckTime(): number {
    return this.store.get('lastCheckTime');
  }

  public setLastCheckTime(time: number): void {
    this.store.set('lastCheckTime', time);
  }
}

export const configService = new ConfigService();
