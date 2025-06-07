'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthForm, useFormValidation } from '@/hooks/useAuth';
import { dbService } from '@/lib/database';
import { authService } from '@/lib/auth';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const router = useRouter();
  const { } = useAuth();
  const { loading, error, handleAuthAction } = useAuthForm();
  const { validateEmail, validatePassword, validatePasswordMatch, validateName } = useFormValidation();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const nameValidation = validateName(name);
    if (!nameValidation.isValid) {
      return;
    }

    if (!validateEmail(email)) {
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return;
    }

    if (!validatePasswordMatch(password, confirmPassword)) {
      return;
    }

    await handleAuthAction(
      async () => {
        // Créer le compte utilisateur avec authService qui retourne l'user
        const user = await authService.register(email, password);
        
        // Créer le profil utilisateur dans Firestore
        await dbService.createUserProfile(user.uid, {
          displayName: name.trim(),
          email: email,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        
        console.log('Profil utilisateur créé avec succès:', {
          uid: user.uid,
          name: name.trim(),
          email: email
        });
      },
      () => router.push('/')
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Rejoignez-nous !</h1>
          <p className="text-gray-600 dark:text-gray-300">Créez votre compte et commencez votre aventure</p>
        </div>
        
        <Card className="w-full shadow-xl">
          <CardHeader className="space-y-4 pb-6">
            <CardTitle className="text-2xl text-center text-gray-900 dark:text-white">Inscription</CardTitle>
            <CardDescription className="text-center text-gray-600 dark:text-gray-300">
              Remplissez les informations ci-dessous pour créer votre compte
            </CardDescription>
          </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom complet</Label>
              <Input
                id="name"
                type="text"
                placeholder="Votre nom complet"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="Au moins 6 caractères"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Répétez votre mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Création du compte...' : 'Créer un compte'}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Déjà un compte ?{' '}
              <Link href="/auth/login" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                Se connecter
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}