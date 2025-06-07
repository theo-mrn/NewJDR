'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { User, LogOut, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Navbar() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  return (
    <nav className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-sm">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
          🎲 NewJDR
        </Link>
        
        <div className="flex items-center space-x-6">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                  <User className="h-5 w-5" />
                  <span className="font-medium">{user.displayName || user.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-2">
                <DropdownMenuItem asChild>
                  <Link href="/account" className="flex items-center px-3 py-2">
                    <Settings className="mr-3 h-4 w-4" />
                    Mon compte
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="px-3 py-2">
                  <LogOut className="mr-3 h-4 w-4" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex space-x-3">
              <Button variant="ghost" asChild size="lg">
                <Link href="/auth/login">Connexion</Link>
              </Button>
              <Button asChild size="lg">
                <Link href="/auth/register">Inscription</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
} 