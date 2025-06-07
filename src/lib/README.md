# Structure Firebase - Guide d'utilisation

## Architecture

### 📁 Fichiers principaux

- **`firebase.js`** - Configuration Firebase de base
- **`auth.js`** - Service d'authentification
- **`database.ts`** - Service Firestore pour la base de données
- **`../contexts/AuthContext.tsx`** - Context React pour l'état d'authentification
- **`../hooks/useAuth.ts`** - Hooks personnalisés pour l'authentification

## 🔐 Authentification

### Utilisation du service d'authentification

```typescript
import { authService } from '@/lib/auth';

// Connexion
await authService.login('email@example.com', 'password');

// Inscription
await authService.register('email@example.com', 'password');

// Déconnexion
await authService.logout();

// Réinitialisation du mot de passe
await authService.resetPassword('email@example.com');
```

### Utilisation du Context d'authentification

```typescript
import { useAuth } from '@/contexts/AuthContext';

const MyComponent = () => {
  const { user, loading, login, logout } = useAuth();
  
  if (loading) return <div>Chargement...</div>;
  if (!user) return <div>Non connecté</div>;
  
  return <div>Bonjour {user.email}</div>;
};
```

### Hooks personnalisés

```typescript
import { useAuthForm, useFormValidation } from '@/hooks/useAuth';

const LoginForm = () => {
  const { loading, error, handleAuthAction } = useAuthForm();
  const { validateEmail } = useFormValidation();
  
  // Utilisation dans un formulaire...
};
```

## 📊 Base de données (Firestore)

### Utilisation du service de base de données

```typescript
import { dbService } from '@/lib/database';

// Créer un document
const id = await dbService.create('users', { name: 'John', email: 'john@example.com' });

// Lire un document
const user = await dbService.getById('users', id);

// Lire tous les documents
const users = await dbService.getAll('users');

// Requête avec conditions
const activeUsers = await dbService.query('users', [
  { field: 'active', operator: '==', value: true }
]);

// Mettre à jour
await dbService.update('users', id, { name: 'John Doe' });

// Supprimer
await dbService.delete('users', id);
```

### Collections prédéfinies

```typescript
dbService.collections = {
  users: 'users',
  games: 'games',
  characters: 'characters',
  sessions: 'sessions'
};
```

## 🛡️ Protection des routes

### AuthGuard Component

```typescript
import { AuthGuard } from '@/components/auth/AuthGuard';

const ProtectedPage = () => (
  <AuthGuard>
    <div>Contenu protégé</div>
  </AuthGuard>
);
```

## 🔄 Integration dans l'application

### 1. Wrapper l'app avec AuthProvider

```typescript
// app/layout.tsx
import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 2. Utiliser les hooks et components

```typescript
// Dans vos pages/components
import { useAuth } from '@/contexts/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
```

## 📝 Gestion des erreurs

Les erreurs Firebase sont automatiquement traduites en français dans `authService.getErrorMessage()`.

## 🚀 Exemples d'utilisation

### Page de connexion simple

```typescript
const { login } = useAuth();
const { loading, error, handleAuthAction } = useAuthForm();

const handleSubmit = async (email: string, password: string) => {
  await handleAuthAction(
    () => login(email, password),
    () => router.push('/dashboard')
  );
};
```

### Création d'un profil utilisateur après inscription

```typescript
const { register } = useAuth();

const handleRegister = async (userData) => {
  const user = await register(userData.email, userData.password);
  await dbService.createUserProfile(user.uid, {
    displayName: userData.name,
    email: userData.email
  });
};
```

Cette structure garantit une organisation claire et évolutive pour tous les aspects de Firebase dans votre application JDR. 