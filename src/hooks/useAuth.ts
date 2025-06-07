import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Hook pour gérer les formulaires d'authentification
export const useAuthForm = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuthAction = async (
    action: () => Promise<void>,
    onSuccess?: () => void
  ) => {
    setLoading(true);
    setError('');
    
    try {
      await action();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError('');

  return {
    loading,
    error,
    handleAuthAction,
    clearError,
  };
};

// Hook pour vérifier si l'utilisateur est connecté
export const useRequireAuth = () => {
  const { user, loading } = useAuth();
  
  return {
    user,
    loading,
    isAuthenticated: !!user,
  };
};

// Hook pour la validation des formulaires
export const useFormValidation = () => {
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): { isValid: boolean; message?: string } => {
    if (password.length < 6) {
      return { isValid: false, message: 'Le mot de passe doit contenir au moins 6 caractères' };
    }
    return { isValid: true };
  };

  const validatePasswordMatch = (password: string, confirmPassword: string): boolean => {
    return password === confirmPassword;
  };

  const validateName = (name: string): { isValid: boolean; message?: string } => {
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      return { isValid: false, message: 'Le nom doit contenir au moins 2 caractères' };
    }
    if (trimmedName.length > 50) {
      return { isValid: false, message: 'Le nom ne peut pas dépasser 50 caractères' };
    }
    return { isValid: true };
  };

  return {
    validateEmail,
    validatePassword,
    validatePasswordMatch,
    validateName,
  };
}; 