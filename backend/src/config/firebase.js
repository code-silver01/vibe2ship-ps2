/**
 * CivicPulse — Firebase Admin SDK Initialization
 * In mock mode, provides a mock Firestore implementation backed by in-memory storage.
 */
import admin from 'firebase-admin';
import config from './env.js';

let db;
let auth;

if (config.useMock) {
  console.log('🔶 Running in MOCK mode — using in-memory Firestore emulator');

  // In-memory document store for mock mode
  const collections = {};

  const createMockDocRef = (collectionName, docId) => ({
    id: docId,
    get: async () => {
      const col = collections[collectionName] || {};
      const data = col[docId];
      return {
        exists: !!data,
        id: docId,
        data: () => data ? { ...data } : undefined,
      };
    },
    set: async (data, options = {}) => {
      if (!collections[collectionName]) collections[collectionName] = {};
      if (options.merge) {
        collections[collectionName][docId] = { ...collections[collectionName][docId], ...data };
      } else {
        collections[collectionName][docId] = { ...data };
      }
    },
    update: async (data) => {
      if (!collections[collectionName]) collections[collectionName] = {};
      collections[collectionName][docId] = { ...collections[collectionName][docId], ...data };
    },
    delete: async () => {
      if (collections[collectionName]) delete collections[collectionName][docId];
    },
  });

  const createMockQuery = (collectionName) => {
    let _filters = [];
    let _orderField = null;
    let _orderDir = 'asc';
    let _limit = null;

    const query = {
      where: (field, op, value) => {
        _filters.push({ field, op, value });
        return query;
      },
      orderBy: (field, dir = 'asc') => {
        _orderField = field;
        _orderDir = dir;
        return query;
      },
      limit: (n) => {
        _limit = n;
        return query;
      },
      get: async () => {
        const col = collections[collectionName] || {};
        let docs = Object.entries(col).map(([id, data]) => ({
          id,
          exists: true,
          data: () => ({ ...data }),
          ref: createMockDocRef(collectionName, id),
        }));

        // Apply filters
        for (const f of _filters) {
          docs = docs.filter((doc) => {
            const val = doc.data()[f.field];
            switch (f.op) {
              case '==': return val === f.value;
              case '!=': return val !== f.value;
              case '>': return val > f.value;
              case '>=': return val >= f.value;
              case '<': return val < f.value;
              case '<=': return val <= f.value;
              case 'in': return Array.isArray(f.value) && f.value.includes(val);
              case 'array-contains': return Array.isArray(val) && val.includes(f.value);
              default: return true;
            }
          });
        }

        // Apply ordering
        if (_orderField) {
          docs.sort((a, b) => {
            const av = a.data()[_orderField];
            const bv = b.data()[_orderField];
            const cmp = av < bv ? -1 : av > bv ? 1 : 0;
            return _orderDir === 'desc' ? -cmp : cmp;
          });
        }

        // Apply limit
        if (_limit) docs = docs.slice(0, _limit);

        return {
          docs,
          empty: docs.length === 0,
          size: docs.length,
          forEach: (fn) => docs.forEach(fn),
        };
      },
    };
    return query;
  };

  db = {
    collection: (name) => {
      const colRef = {
        doc: (id) => createMockDocRef(name, id || `mock_${Date.now()}_${Math.random().toString(36).slice(2)}`),
        add: async (data) => {
          const id = `mock_${Date.now()}_${Math.random().toString(36).slice(2)}`;
          if (!collections[name]) collections[name] = {};
          collections[name][id] = { ...data };
          return { id, ...createMockDocRef(name, id) };
        },
        where: (field, op, value) => createMockQuery(name).where(field, op, value),
        orderBy: (field, dir) => createMockQuery(name).orderBy(field, dir),
        limit: (n) => createMockQuery(name).limit(n),
        get: async () => createMockQuery(name).get(),
      };
      return colRef;
    },
    // Expose raw storage for testing
    _collections: collections,
  };

  // Mock auth
  auth = {
    verifyIdToken: async (token) => {
      // In mock mode, accept tokens formatted as "mock_<uid>_<role>"
      const parts = token.split('_');
      return {
        uid: parts[1] || 'mock_user',
        role: parts[2] || 'citizen',
        email: `${parts[1] || 'user'}@mock.civicpulse.dev`,
      };
    },
    setCustomUserClaims: async (uid, claims) => {
      console.log(`Mock: Set claims for ${uid}:`, claims);
    },
    getUser: async (uid) => ({
      uid,
      email: `${uid}@mock.civicpulse.dev`,
      customClaims: { role: 'citizen' },
    }),
  };
} else {
  // Real Firebase initialization
  const serviceAccount = {
    projectId: config.firebase.projectId,
    clientEmail: config.firebase.clientEmail,
    privateKey: config.firebase.privateKey,
  };

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: config.firebase.projectId,
    });
  }

  db = admin.firestore();
  auth = admin.auth();
}

export { db, auth };
export default { db, auth };
