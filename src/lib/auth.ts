import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updatePassword,
  updateProfile,
  reauthenticateWithCredential,
  EmailAuthProvider,
  User
} from 'firebase/auth';
import { doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth, db, storage } from './firebase';

// Types pour TypeScript
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

// Fonctions d'authentification
export const authService = {
  // Connexion
  async login(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error: unknown) {
      const firebaseError = error as { code: string };
      throw new Error(this.getErrorMessage(firebaseError.code));
    }
  },

  // Inscription
  async register(email: string, password: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Créer le document utilisateur dans Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      return user;
    } catch (error: unknown) {
      const firebaseError = error as { code: string };
      throw new Error(this.getErrorMessage(firebaseError.code));
    }
  },

  // Déconnexion
  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch {
      throw new Error('Erreur lors de la déconnexion');
    }
  },

  // Réinitialisation du mot de passe
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: unknown) {
      const firebaseError = error as { code: string };
      throw new Error(this.getErrorMessage(firebaseError.code));
    }
  },

  // Mise à jour du mot de passe avec ré-authentification
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    if (!auth.currentUser) {
      throw new Error('Utilisateur non connecté');
    }
    
    if (!auth.currentUser.email) {
      throw new Error('Email utilisateur non disponible');
    }

    try {
      // Ré-authentification requise pour changer le mot de passe
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      // Changer le mot de passe
      await updatePassword(auth.currentUser, newPassword);
    } catch (error: unknown) {
      const firebaseError = error as { code: string };
      throw new Error(this.getErrorMessage(firebaseError.code));
    }
  },

  // Upload d'image de profil
  async uploadProfileImage(file: File): Promise<string> {
    if (!auth.currentUser) {
      throw new Error('Utilisateur non connecté');
    }

    try {
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        throw new Error('Le fichier doit être une image');
      }

        // Vérifier la taille (max 6MB)
  if (file.size > 6 * 1024 * 1024) {
    throw new Error('L\'image ne doit pas dépasser 6MB');
      }

      // Créer une référence unique pour l'image
      const imageRef = ref(storage, `profile-images/${auth.currentUser.uid}/${Date.now()}`);
      
      // Supprimer l'ancienne image si elle existe
      if (auth.currentUser.photoURL) {
        try {
          const oldImageRef = ref(storage, auth.currentUser.photoURL);
          await deleteObject(oldImageRef);
        } catch (error) {
          // L'ancienne image n'existe peut-être pas, continuer
          console.log('Ancienne image non trouvée:', error);
        }
      }

      // Upload l'image
      const snapshot = await uploadBytes(imageRef, file);
      
      // Obtenir l'URL de téléchargement
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      throw error instanceof Error ? error : new Error('Erreur lors de l\'upload de l\'image');
    }
  },

  // Mise à jour du profil
  async updateUserProfile(displayName: string, photoURL?: string): Promise<void> {
    if (!auth.currentUser) {
      throw new Error('Utilisateur non connecté');
    }
    try {
      // Mettre à jour Firebase Auth
      await updateProfile(auth.currentUser, { displayName, photoURL });
      
      // Mettre à jour Firestore
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      
      // Vérifier si le document utilisateur existe
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        // Mettre à jour le document existant
        await updateDoc(userDocRef, {
          displayName,
          ...(photoURL && { photoURL }),
          updatedAt: new Date()
        });
      } else {
        // Créer un nouveau document utilisateur
        await setDoc(userDocRef, {
          uid: auth.currentUser.uid,
          email: auth.currentUser.email,
          displayName,
          ...(photoURL && { photoURL }),
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      throw new Error('Erreur lors de la mise à jour du profil');
    }
  },

  // Observer les changements d'état d'authentification
  onAuthStateChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  },

  // Obtenir l'utilisateur actuel
  getCurrentUser(): User | null {
    return auth.currentUser;
  },

  // Gestion des messages d'erreur
  getErrorMessage(errorCode: string): string {
    const errorMessages: { [key: string]: string } = {
      'auth/user-not-found': 'Utilisateur introuvable',
      'auth/wrong-password': 'Mot de passe incorrect',
      'auth/email-already-in-use': 'Cette adresse email est déjà utilisée',
      'auth/weak-password': 'Le mot de passe est trop faible',
      'auth/invalid-email': 'Adresse email invalide',
      'auth/user-disabled': 'Ce compte a été désactivé',
      'auth/too-many-requests': 'Trop de tentatives, réessayez plus tard',
      'auth/operation-not-allowed': 'Opération non autorisée',
      'auth/requires-recent-login': 'Cette opération nécessite une connexion récente',
    };

    return errorMessages[errorCode] || 'Une erreur inattendue s\'est produite';
  }
}; 