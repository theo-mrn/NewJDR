import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  setDoc,
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  DocumentData,
  WhereFilterOp
} from 'firebase/firestore';
import app from './firebase';

// Initialiser Firestore
export const db = getFirestore(app);

// Service pour la base de données
export const dbService = {
  // Collections de référence
  collections: {
    users: 'users',
    games: 'games',
    characters: 'characters',
    sessions: 'sessions',
  },

  // Créer un document
  async create(collectionName: string, data: DocumentData): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Erreur lors de la création du document:', error);
      throw new Error('Erreur lors de la création du document');
    }
  },

  // Lire un document par ID
  async getById(collectionName: string, id: string): Promise<DocumentData | null> {
    try {
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error('Erreur lors de la lecture du document:', error);
      throw new Error('Erreur lors de la lecture du document');
    }
  },

  // Lire tous les documents d'une collection
  async getAll(collectionName: string): Promise<DocumentData[]> {
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erreur lors de la lecture des documents:', error);
      throw new Error('Erreur lors de la lecture des documents');
    }
  },

  // Requête avec conditions
  async query(
    collectionName: string, 
    conditions: { field: string; operator: WhereFilterOp; value: unknown }[] = [],
    orderByField?: string,
    limitCount?: number
  ): Promise<DocumentData[]> {
    try {
      let q = collection(db, collectionName);
      
      // Ajouter les conditions where
      conditions.forEach(condition => {
        q = query(q, where(condition.field, condition.operator, condition.value));
      });
      
      // Ajouter le tri
      if (orderByField) {
        q = query(q, orderBy(orderByField));
      }
      
      // Ajouter la limite
      if (limitCount) {
        q = query(q, limit(limitCount));
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erreur lors de la requête:', error);
      throw new Error('Erreur lors de la requête');
    }
  },

  // Mettre à jour un document
  async update(collectionName: string, id: string, data: Partial<DocumentData>): Promise<void> {
    try {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du document:', error);
      throw new Error('Erreur lors de la mise à jour du document');
    }
  },

  // Supprimer un document
  async delete(collectionName: string, id: string): Promise<void> {
    try {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Erreur lors de la suppression du document:', error);
      throw new Error('Erreur lors de la suppression du document');
    }
  },

  // Créer un profil utilisateur
  async createUserProfile(userId: string, userData: Record<string, unknown>): Promise<void> {
    try {
      const userRef = doc(db, this.collections.users, userId);
      await setDoc(userRef, {
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Erreur lors de la création du profil utilisateur:', error);
      throw new Error('Erreur lors de la création du profil utilisateur');
    }
  },

  // Obtenir le profil utilisateur
  async getUserProfile(userId: string): Promise<DocumentData | null> {
    return await this.getById(this.collections.users, userId);
  }
}; 