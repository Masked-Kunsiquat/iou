/**
 * @file A lightweight IndexedDB wrapper with a fallback to localStorage.
 * This module provides a simple, promise-based API for interacting with IndexedDB
 * for client-side storage. If IndexedDB is not supported by the browser, it
 * gracefully falls back to using localStorage.
 */

/**
 * A class to manage database operations for IndexedDB with a localStorage fallback.
 */
export class DB {
  /**
   * Initializes the DB class by setting up database properties and checking for IndexedDB support.
   */
  constructor() {
    /** @type {string} The name of the database. */
    this.dbName = 'iouTracker';
    /** @type {number} The version of the database. */
    this.version = 1;
    /** @type {boolean} A flag indicating if IndexedDB is supported by the browser. */
    this.isIDBSupported = 'indexedDB' in window;
    /** @type {IDBDatabase|null} The database instance. */
    this.db = null;
  }

  /**
   * Initializes the database connection. If IndexedDB is supported, it opens a
   * connection and creates object stores if they don't exist.
   * @returns {Promise<void>} A promise that resolves when the database is successfully initialized.
   */
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
        const db = /** @type {IDBOpenDBRequest} */ (event.target)?.result;
        if (!db) return;

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

  /**
   * Executes a series of database operations atomically within a single transaction.
   * @param {Array<{type: 'put'|'delete', storeName: string, value?: any, key?: any}>} operations - An array of operations to perform.
   * @returns {Promise<void>} A promise that resolves if the transaction is successful, and rejects if it fails.
   */
  async transact(operations) {
    if (!this.isIDBSupported || !this.db) {
      console.warn('Atomic transactions are not supported with localStorage fallback. Executing sequentially.');
      // Fallback for localStorage: execute one by one without atomicity.
      try {
        for (const op of operations) {
          if (op.type === 'put') await this._localStoragePut(op.storeName, op.value);
          else if (op.type === 'delete') await this._localStorageDelete(op.storeName, op.key);
        }
        return Promise.resolve();
      } catch (error) {
        return Promise.reject(error);
      }
    }

    const storeNames = [...new Set(operations.map(op => op.storeName))];

    return new Promise((resolve, reject) => {
        if (!this.db) {
            return reject(new Error("Database not initialized."));
        }
        const transaction = this.db.transaction(storeNames, 'readwrite');
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);

        for (const op of operations) {
            const store = transaction.objectStore(op.storeName);
            if (op.type === 'put') {
                store.put(op.value);
            } else if (op.type === 'delete') {
                store.delete(op.key);
            }
        }
    });
  }

  /**
   * Retrieves a single record from a specified object store by its key.
   * @param {string} storeName - The name of the object store.
   * @param {any} key - The key of the record to retrieve.
   * @returns {Promise<any>} A promise that resolves with the retrieved record, or undefined if not found.
   */
  async get(storeName, key) {
    if (!this.isIDBSupported || !this.db) {
      return this._localStorageGet(storeName, key);
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        return reject(new Error("Database not initialized."));
      }
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Retrieves all records from a specified object store.
   * @param {string} storeName - The name of the object store.
   * @returns {Promise<any[]>} A promise that resolves with an array of all records in the store.
   */
  async getAll(storeName) {
    if (!this.isIDBSupported || !this.db) {
      return this._localStorageGetAll(storeName);
    }

    return new Promise((resolve, reject) => {
        if (!this.db) {
            return reject(new Error("Database not initialized."));
        }
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Adds a new record or updates an existing record in a specified object store.
   * @param {string} storeName - The name of the object store.
   * @param {object & {id: any}} value - The record to add or update. It must contain a key property (e.g., 'id').
   * @returns {Promise<any>} A promise that resolves with the key of the stored record.
   */
  async put(storeName, value) {
    if (!this.isIDBSupported || !this.db) {
      return this._localStoragePut(storeName, value);
    }

    return new Promise((resolve, reject) => {
        if (!this.db) {
            return reject(new Error("Database not initialized."));
        }
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(value);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Deletes a record from a specified object store by its key.
   * @param {string} storeName - The name of the object store.
   * @param {any} key - The key of the record to delete.
   * @returns {Promise<void>} A promise that resolves when the record is successfully deleted.
   */
  async delete(storeName, key) {
    if (!this.isIDBSupported || !this.db) {
      return this._localStorageDelete(storeName, key);
    }

    return new Promise((resolve, reject) => {
        if (!this.db) {
            return reject(new Error("Database not initialized."));
        }
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clears all records from a specified object store.
   * @param {string} storeName - The name of the object store to clear.
   * @returns {Promise<void>} A promise that resolves when the store is successfully cleared.
   */
  async clear(storeName) {
    if (!this.isIDBSupported || !this.db) {
      return this._localStorageClear(storeName);
    }

    return new Promise((resolve, reject) => {
        if (!this.db) {
            return reject(new Error("Database not initialized."));
        }
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // localStorage fallback methods

  /**
   * @private
   * Retrieves a single item from localStorage.
   * @param {string} storeName - The key used for the localStorage item.
   * @param {string} key - The key of the object to retrieve.
   * @returns {any} The retrieved object, or undefined if not found.
   */
  _localStorageGet(storeName, key) {
    const data = JSON.parse(localStorage.getItem(storeName) || '{}');
    return data[key];
  }

  /**
   * @private
   * Retrieves all items from a localStorage entry.
   * @param {string} storeName - The key used for the localStorage item.
   * @returns {any[]} An array of all objects.
   */
  _localStorageGetAll(storeName) {
    const data = JSON.parse(localStorage.getItem(storeName) || '{}');
    return Object.values(data);
  }

  /**
   * @private
   * Adds or updates an item in localStorage.
   * @param {string} storeName - The key used for the localStorage item.
   * @param {object & {id: any}} value - The object to store. It must have an 'id' property.
   * @returns {any} The id of the stored item.
   */
  _localStoragePut(storeName, value) {
    const data = JSON.parse(localStorage.getItem(storeName) || '{}');
    data[value.id] = value;
    localStorage.setItem(storeName, JSON.stringify(data));
    return value.id;
  }

  /**
   * @private
   * Deletes an item from localStorage.
   * @param {string} storeName - The key used for the localStorage item.
   * @param {string} key - The key of the object to delete.
   */
  _localStorageDelete(storeName, key) {
    const data = JSON.parse(localStorage.getItem(storeName) || '{}');
    delete data[key];
    localStorage.setItem(storeName, JSON.stringify(data));
  }

  /**
   * @private
   * Clears all data from a localStorage item.
   * @param {string} storeName - The key used for the localStorage item.
   */
  _localStorageClear(storeName) {
    localStorage.removeItem(storeName);
  }
}

/**
 * An instance of the DB class, exported for use throughout the application.
 * @type {DB}
 */
export const db = new DB();