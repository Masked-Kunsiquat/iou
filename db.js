// Lightweight IndexedDB wrapper with localStorage fallback
export class DB {
  constructor() {
    this.dbName = 'iouTracker';
    this.version = 1;
    this.isIDBSupported = 'indexedDB' in window;
    this.db = null;
  }

  async init() {
    if (!this.isIDBSupported) {
      console.log('IndexedDB not supported, using localStorage');
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains('persons')) {
          db.createObjectStore('persons', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('transactions')) {
          const store = db.createObjectStore('transactions', { keyPath: 'id' });
          store.createIndex('personId', 'personId', { unique: false });
          store.createIndex('type', 'type', { unique: false });
        }
      };
    });
  }

  async get(storeName, key) {
    if (!this.isIDBSupported) {
      return this._localStorageGet(storeName, key);
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName) {
    if (!this.isIDBSupported) {
      return this._localStorageGetAll(storeName);
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async put(storeName, value) {
    if (!this.isIDBSupported) {
      return this._localStoragePut(storeName, value);
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(value);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName, key) {
    if (!this.isIDBSupported) {
      return this._localStorageDelete(storeName, key);
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName) {
    if (!this.isIDBSupported) {
      return this._localStorageClear(storeName);
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // localStorage fallback methods
  _localStorageGet(storeName, key) {
    const data = JSON.parse(localStorage.getItem(storeName) || '{}');
    return data[key];
  }

  _localStorageGetAll(storeName) {
    const data = JSON.parse(localStorage.getItem(storeName) || '{}');
    return Object.values(data);
  }

  _localStoragePut(storeName, value) {
    const data = JSON.parse(localStorage.getItem(storeName) || '{}');
    data[value.id] = value;
    localStorage.setItem(storeName, JSON.stringify(data));
    return value.id;
  }

  _localStorageDelete(storeName, key) {
    const data = JSON.parse(localStorage.getItem(storeName) || '{}');
    delete data[key];
    localStorage.setItem(storeName, JSON.stringify(data));
  }

  _localStorageClear(storeName) {
    localStorage.removeItem(storeName);
  }
}

export const db = new DB();