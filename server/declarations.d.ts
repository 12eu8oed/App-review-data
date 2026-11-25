declare module 'app-store-scraper' {
  export interface AppStoreAppResult {
    id: number | string;
    appId: string;
    title: string;
    icon: string;
    developer: string;
    url: string;
  }

  const appStore: {
    app(options: {
      id?: string | number;
      appId?: string;
      country?: string;
    }): Promise<AppStoreAppResult>;
  };

  export default appStore;
}
