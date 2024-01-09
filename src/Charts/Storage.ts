class LocalStore {
  constructor() {}

  GetOrDefault(key: string, defaultValue: any) {
    const stored = localStorage.getItem(key);
    if (stored !== undefined) return stored;
    return defaultValue;
  }
}

const Store = new LocalStore();

export default Store;
