"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { Lock, User, Upload, X, Camera, LogOut } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Home } from "lucide-react";
import { authService } from "@/lib/auth";

export default function AccountPage() {
  const { user, logout } = useAuth();
  const [passwordMessage, setPasswordMessage] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [mounted, setMounted] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (user?.displayName) {
      setDisplayName(user.displayName);
    }
  }, [user]);

  async function handleProfileUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) {
      setProfileMessage("Le nom ne peut pas être vide");
      return;
    }

    setUpdatingProfile(true);
    setProfileMessage("");

    try {
      await authService.updateUserProfile(displayName.trim());
      setProfileMessage("Profil mis à jour avec succès");
    } catch (error) {
      setProfileMessage(error instanceof Error ? error.message : "Erreur lors de la mise à jour du profil");
    }

    setUpdatingProfile(false);
  }

  async function handleImageUpload(file: File) {
    if (!file) return;

    setUploadingImage(true);
    setProfileMessage("");

    try {
      // Upload l'image et obtenir l'URL
      const photoURL = await authService.uploadProfileImage(file);
      
      // Mettre à jour le profil avec la nouvelle image
      await authService.updateUserProfile(displayName || user?.displayName || "", photoURL);
      
      setProfileMessage("Image de profil mise à jour avec succès");
    } catch (error) {
      setProfileMessage(error instanceof Error ? error.message : "Erreur lors de l'upload de l'image");
    }

    setUploadingImage(false);
  }

  async function handleRemoveImage() {
    setUploadingImage(true);
    setProfileMessage("");

    try {
      // Mettre à jour le profil sans photo
      await authService.updateUserProfile(displayName || user?.displayName || "", "");
      setProfileMessage("Photo de profil supprimée avec succès");
    } catch (error) {
      setProfileMessage(error instanceof Error ? error.message : "Erreur lors de la suppression de l'image");
    }

    setUploadingImage(false);
  }



  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMessage("Les mots de passe ne correspondent pas");
      return;
    }

    setChangingPassword(true);
    setPasswordMessage("");

    try {
      await authService.changePassword(currentPassword, newPassword);
      setPasswordMessage("Mot de passe mis à jour avec succès");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setPasswordMessage(error instanceof Error ? error.message : "Erreur lors de la mise à jour du mot de passe");
    }

    setChangingPassword(false);
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-center text-gray-600">Veuillez vous connecter pour accéder à votre compte.</p>
        </div>
      </div>
    );
  }

  // Bouton retour dashboard
  const DashboardButton = () => (
    <Link href="/dashboard" className="absolute left-6 top-6 z-20">
      <button className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground transition-colors shadow">
        <Home className="h-5 w-5" />
        <span className="font-medium">Dashboard</span>
      </button>
    </Link>
  );

  return (
    <div className="min-h-screen bg-background py-40 px-4 md:px-6 flex flex-col items-center relative ">
      <DashboardButton />
      <Card className={cn(
        "w-full max-w-4xl mx-auto overflow-hidden transition-all duration-500",
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
      )}>
        {/* Profile Header */}
        <div className="bg-primary px-8 py-8 relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-6">
              {/* Profile Avatar */}
              <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                <DialogTrigger asChild>
                  <div className="cursor-pointer group relative">
                    <Avatar className="h-28 w-28 border-4 border-primary-foreground/20 shadow-xl transition-transform duration-300 group-hover:scale-105">
                      {user?.photoURL ? (
                        <div className="relative w-full h-full">
                          <Image
                            src={user.photoURL}
                            alt={user?.displayName || "User"}
                            fill
                            priority={true}
                            className="object-cover rounded-full"
                          />
                        </div>
                      ) : null}
                      <AvatarFallback className="bg-muted text-muted-foreground text-2xl">
                        {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <Camera className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Mettre à jour la photo de profil</DialogTitle>
                    <DialogDescription>Téléchargez une nouvelle photo de profil ou supprimez l&apos;actuelle.</DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col gap-4 py-4">
                    <div className="flex justify-center py-4">
                      <Avatar className="h-32 w-32 border-4 border-muted">
                        {user?.photoURL ? (
                          <div className="relative w-full h-full">
                            <Image
                              src={user.photoURL}
                              alt={user?.displayName || "User"}
                              fill
                              className="object-cover rounded-full"
                            />
                          </div>
                        ) : null}
                        <AvatarFallback className="bg-muted text-muted-foreground text-3xl">
                          {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <label className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 cursor-pointer">
                      <Upload className="mr-2 h-4 w-4" />
                      {uploadingImage ? "Upload en cours..." : "Télécharger une nouvelle image"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleImageUpload(file);
                          }
                        }}
                        disabled={uploadingImage}
                      />
                    </label>
                                          <button 
                        onClick={handleRemoveImage}
                        disabled={uploadingImage || !user?.photoURL}
                        className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <X className="mr-2 h-4 w-4" />
                        {uploadingImage ? "Suppression..." : "Supprimer la photo"}
                      </button>
                    <p className="text-xs text-muted-foreground text-center">JPG, GIF ou PNG. Taille max 6MB.</p>
                  </div>
                </DialogContent>
              </Dialog>

              {/* User Info */}
              <div>
                <h2 className="text-3xl font-bold text-primary-foreground tracking-tight">
                  {user?.displayName || "Utilisateur"}
                </h2>
                <p className="text-primary-foreground/80">{user?.email}</p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={() => logout()}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <CardContent className="px-0 py-0">
          <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b">
              <TabsList className="h-16 w-full rounded-none bg-transparent border-b border-transparent justify-start px-6">
                <TabsTrigger
                  value="profile"
                  className="flex items-center gap-2 h-16 rounded-none border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary border-transparent transition-all relative"
                >
                  <User className="h-4 w-4" />
                  <span>Profil</span>
                </TabsTrigger>
                <TabsTrigger
                  value="security"
                  className="flex items-center gap-2 h-16 rounded-none border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary border-transparent transition-all relative"
                >
                  <Lock className="h-4 w-4" />
                  <span>Sécurité</span>
                </TabsTrigger>

              </TabsList>
            </div>

            {/* Profile Tab */}
            <TabsContent value="profile" className="px-6 py-8 space-y-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold">Informations du profil</h3>
                  <p className="text-sm text-muted-foreground">Mettez à jour vos informations personnelles.</p>
                </div>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom complet</Label>
                    <Input
                      id="name"
                      placeholder="Votre nom complet"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Adresse email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="votre.email@exemple.com"
                      value={user?.email || ""}
                      readOnly
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">L&apos;adresse email ne peut pas être modifiée.</p>
                  </div>
                  {profileMessage && (
                    <p className={cn(
                      "text-sm",
                      profileMessage.includes("succès") ? "text-green-600" : "text-red-600"
                    )}>
                      {profileMessage}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={updatingProfile}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                  >
                    {updatingProfile ? "Mise à jour..." : "Mettre à jour le profil"}
                  </button>
                </form>
              </div>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="px-6 py-8 space-y-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold">Changer le mot de passe</h3>
                  <p className="text-sm text-muted-foreground">Mettez à jour votre mot de passe pour sécuriser votre compte.</p>
                </div>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Mot de passe actuel</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nouveau mot de passe</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmer le nouveau mot de passe</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  {passwordMessage && (
                    <p className={cn(
                      "text-sm",
                      passwordMessage.includes("succès") ? "text-green-600" : "text-red-600"
                    )}>
                      {passwordMessage}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                  >
                    {changingPassword ? "Mise à jour..." : "Mettre à jour le mot de passe"}
                  </button>
                </form>
              </div>
            </TabsContent>


          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}