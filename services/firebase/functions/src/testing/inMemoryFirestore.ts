import type { Firestore } from 'firebase-admin/firestore';

type StoredDoc = Record<string, unknown>;

class InMemoryDocRef {
  constructor(
    private readonly store: Map<string, StoredDoc>,
    readonly path: string,
  ) {}

  async get() {
    const data = this.store.get(this.path);
    return {
      exists: data !== undefined,
      id: this.path.split('/').pop() ?? '',
      data: () => data,
    };
  }

  async set(data: StoredDoc, options?: { merge?: boolean }) {
    if (options?.merge && this.store.has(this.path)) {
      this.store.set(this.path, { ...this.store.get(this.path), ...data });
      return;
    }
    this.store.set(this.path, { ...data });
  }
}

class InMemoryQuery {
  constructor(
    private readonly store: Map<string, StoredDoc>,
    private readonly collectionPath: string,
    private readonly limitCount: number,
  ) {}

  async get() {
    const prefix = `${this.collectionPath}/`;
    const docs = [...this.store.entries()]
      .filter(([key]) => {
        if (!key.startsWith(prefix)) return false;
        const remainder = key.slice(prefix.length);
        return remainder.length > 0 && !remainder.includes('/');
      })
      .slice(0, this.limitCount)
      .map(([key, data]) => ({
        id: key.slice(prefix.length),
        data: () => data,
      }));
    return {
      docs,
      empty: docs.length === 0,
      size: docs.length,
    };
  }
}

class InMemoryCollectionRef {
  constructor(
    private readonly store: Map<string, StoredDoc>,
    readonly path: string,
  ) {}

  doc(id: string) {
    return new InMemoryDocRef(this.store, `${this.path}/${id}`);
  }

  limit(count: number) {
    return new InMemoryQuery(this.store, this.path, count);
  }

  async get() {
    return new InMemoryQuery(this.store, this.path, 1000).get();
  }

  async add(data: StoredDoc) {
    const id = `auto-${this.store.size + 1}`;
    const path = `${this.path}/${id}`;
    this.store.set(path, { ...data });
    return { id };
  }
}

class InMemoryFirestore {
  readonly store = new Map<string, StoredDoc>();

  doc(path: string) {
    return new InMemoryDocRef(this.store, path);
  }

  collection(path: string) {
    return new InMemoryCollectionRef(this.store, path);
  }
}

export function createInMemoryFirestore(): Firestore {
  return new InMemoryFirestore() as unknown as Firestore;
}

export function readStoredDoc(store: Map<string, StoredDoc>, path: string): StoredDoc | undefined {
  return store.get(path);
}

export function getInMemoryStore(firestore: Firestore): Map<string, StoredDoc> {
  return (firestore as unknown as InMemoryFirestore).store;
}
