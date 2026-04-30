import { openDB } from 'idb';

const DB_NAME = 'circuit-designer-db';
const DB_VERSION = 1;
const STORE_NAME = 'models';

let dbPromise;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
}

export async function saveModel(id, blob) {
  const db = await getDB();
  return db.put(STORE_NAME, blob, id);
}

export async function getModel(id) {
  const db = await getDB();
  return db.get(STORE_NAME, id);
}

export async function deleteModel(id) {
    const db = await getDB();
    return db.delete(STORE_NAME, id);
}