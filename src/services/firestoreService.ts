import { collection, getDocs, doc, getDoc, addDoc, setDoc, query, where, type DocumentData, type WhereFilterOp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const firestoreService = {
    // Generic Fetch Collection
    getAll: async <T>(collectionName: string): Promise<T[]> => {
        try {
            if (!db) throw new Error("Database not initialized");
            const querySnapshot = await getDocs(collection(db, collectionName));
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as T));
        } catch (error) {
            console.error(`Error fetching collection ${collectionName}:`, error);
            throw error;
        }
    },

    // Generic Fetch Document
    getById: async <T>(collectionName: string, id: string): Promise<T | null> => {
        try {
            if (!db) throw new Error("Database not initialized");
            const docRef = doc(db, collectionName, id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() } as unknown as T;
            }
            return null;
        } catch (error) {
            console.error(`Error fetching document ${collectionName}/${id}:`, error);
            throw error;
        }
    },

    // Generic Add
    add: async <T extends DocumentData>(collectionName: string, data: T): Promise<string> => {
        try {
            if (!db) throw new Error("Database not initialized");
            const docRef = await addDoc(collection(db, collectionName), data);
            return docRef.id;
        } catch (error) {
            console.error(`Error adding to ${collectionName}:`, error);
            throw error;
        }
    },

    // Generic Update
    update: async (collectionName: string, id: string, data: any): Promise<void> => {
        try {
            if (!db) throw new Error("Database not initialized");
            const docRef = doc(db, collectionName, id);
            await setDoc(docRef, data, { merge: true });
        } catch (error) {
            console.error(`Error updating document ${collectionName}/${id}:`, error);
            throw error;
        }
    },

    // Generic Query
    getWhere: async <T>(collectionName: string, field: string, operator: WhereFilterOp, value: any): Promise<T[]> => {
        try {
            if (!db) throw new Error("Database not initialized");
            const q = query(collection(db, collectionName), where(field, operator, value));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as T));
        } catch (error) {
            console.error(`Error querying collection ${collectionName}:`, error);
            throw error;
        }
    }
};
