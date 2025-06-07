"use client"

import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/toggle";
import { toast } from "sonner";
import { DemoOne } from "@/components/demo";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-6 py-16 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white leading-tight">
            Bienvenue sur 
            <span className="text-blue-600 dark:text-blue-400"> NewJDR</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Votre plateforme de jeux de rôle en ligne. Créez, gérez et jouez vos aventures épiques avec vos amis.
          </p>
          
          {user ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg space-y-6">
              <div className="space-y-4">
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Bon retour, {user.displayName || user.email} ! 👋
                </p>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  Prêt pour votre prochaine aventure ?
                </p>
              </div>
              <div className="flex gap-4 justify-center">
                <Button asChild size="lg">
                  <Link href="/account">Gérer mon compte</Link>
                </Button>
                <Button variant="outline" size="lg">
                  Mes campagnes
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg space-y-6">
              <p className="text-xl text-gray-700 dark:text-gray-300">
                Connectez-vous pour commencer votre aventure épique
              </p>
              <div className="flex gap-4 justify-center">
                <Button asChild size="lg">
                  <Link href="/auth/register">Créer un compte</Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/auth/login">Se connecter</Link>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg space-y-4 hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">🎲</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Création de personnages
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Créez et personnalisez vos personnages avec un système complet de caractéristiques et d&apos;équipements.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg space-y-4 hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">🗺️</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Gestion de campagnes
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Organisez vos sessions de jeu et suivez l&apos;évolution de vos histoires épiques.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg space-y-4 hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Jeu collaboratif
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Jouez en temps réel avec vos amis grâce à notre système multijoueur intégré.
            </p>
          </div>
        </div>
        
        {/* Demo Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Outils de développement
            </h2>
            <ModeToggle />
          </div>
          
          <div className="space-y-6">
            <Button
              variant="outline"
              size="lg"
              onClick={() =>
                toast("Événement créé avec succès ! 🎉", {
                  description: "Votre session de JDR est programmée pour dimanche à 14h00",
                  action: {
                    label: "Voir détails",
                    onClick: () => console.log("Voir détails"),
                  },
                })
              }
              className="w-full"
            >
              Tester les notifications
            </Button>
            
            <div className="border-t dark:border-gray-700 pt-6">
              <DemoOne />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
