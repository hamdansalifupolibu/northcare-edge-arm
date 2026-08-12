import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let testDb: Firestore | null = null;

export function getDb(): Firestore {
  if (testDb) {
    return testDb;
  }
  return getFirestore();
}

/** Test helper — inject an in-memory or emulator Firestore instance. */
export function setTestDb(db: Firestore | null): void {
  testDb = db;
}
