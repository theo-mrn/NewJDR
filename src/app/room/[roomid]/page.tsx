"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Users, Settings, Play, Copy, Check, ArrowLeft, Loader2, Edit, Lock, Unlock, UserMinus } from "lucide-react"
import { db, auth } from "@/lib/firebase"
import { doc, updateDoc, onSnapshot, deleteDoc, arrayRemove, getDoc } from "firebase/firestore"
import { onAuthStateChanged, User } from "firebase/auth"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"

// Types pour les données de rooms
interface Room {
  id: string
  name: string
  description: string
  maxPlayers: number
  players: string[]
  createdAt: Date
  status: "waiting" | "playing" | "finished"
  roomCode: string
  isPrivate: boolean
}

export default function RoomDetailPage() {
  const params = useParams()
  const router = useRouter()
  const roomId = params.roomid as string

  const [room, setRoom] = useState<Room | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editMaxPlayers, setEditMaxPlayers] = useState("")
  const [playersInfo, setPlayersInfo] = useState<Record<string, {displayName: string, email: string}>>({})
  const [editIsPrivate, setEditIsPrivate] = useState(false)
  const [removePlayerDialogOpen, setRemovePlayerDialogOpen] = useState(false)
  const [playerToRemove, setPlayerToRemove] = useState<string | null>(null)

  // Écouter l'état d'authentification
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setAuthLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Écouter les changements de la room en temps réel
  useEffect(() => {
    if (!roomId) return

    const roomRef = doc(db, "rooms", roomId)
    const unsubscribe = onSnapshot(roomRef, (doc) => {
      if (doc.exists()) {
        const roomData = {
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        } as Room
        setRoom(roomData)
        
        // Mettre à jour les valeurs d'édition quand la room change
        setEditName(roomData.name)
        setEditDescription(roomData.description || "")
        setEditMaxPlayers(roomData.maxPlayers.toString())
        setEditIsPrivate(roomData.isPrivate || false)
      } else {
        setRoom(null)
      }
    })

    return () => unsubscribe()
  }, [roomId])

  // Récupérer les informations des joueurs
  useEffect(() => {
    const fetchPlayersInfo = async () => {
      if (!room?.players.length) return

      const playersData: Record<string, {displayName: string, email: string}> = {}
      
      for (const playerId of room.players) {
        try {
          const userDoc = await getDoc(doc(db, "users", playerId))
          if (userDoc.exists()) {
            const userData = userDoc.data()
            playersData[playerId] = {
              displayName: userData.displayName || userData.email || "Utilisateur",
              email: userData.email || ""
            }
          } else {
            // Fallback si le document utilisateur n'existe pas
            playersData[playerId] = {
              displayName: "Utilisateur",
              email: ""
            }
          }
        } catch (error) {
          console.error("Erreur lors de la récupération des données utilisateur:", error)
          playersData[playerId] = {
            displayName: "Utilisateur",
            email: ""
          }
        }
      }
      
      setPlayersInfo(playersData)
    }

    fetchPlayersInfo()
  }, [room?.players])

  const handleCopyCode = async () => {
    if (room?.roomCode) {
      await navigator.clipboard.writeText(room.roomCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleLeaveRoom = async () => {
    if (!user?.uid || !room) return

    setLoading(true)
    try {
      const roomRef = doc(db, "rooms", room.id)
      await updateDoc(roomRef, {
        players: arrayRemove(user.uid)
      })
      
      // Si c'était le dernier joueur, supprimer la room
      if (room.players.length === 1) {
        await deleteDoc(roomRef)
      }

      router.push("/room")
    } catch (error) {
      console.error("Erreur lors de la sortie de la room:", error)
      toast.error("Erreur lors de la sortie de la room")
    } finally {
      setLoading(false)
    }
  }

  const handleStartGame = async () => {
    if (!room) return

    setLoading(true)
    try {
      const roomRef = doc(db, "rooms", room.id)
      await updateDoc(roomRef, {
        status: "playing"
      })
      toast.success("La partie a été démarrée !")
    } catch (error) {
      console.error("Erreur lors du démarrage de la partie:", error)
      toast.error("Erreur lors du démarrage de la partie")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    if (!room || !user?.uid || !isOwner) return

    setLoading(true)
    try {
      const roomRef = doc(db, "rooms", room.id)
      const newMaxPlayers = parseInt(editMaxPlayers)
      
      // Vérifier que le nouveau nombre max est supérieur ou égal au nombre actuel de joueurs
      if (newMaxPlayers < room.players.length) {
        toast.error(`Le nombre maximum de joueurs ne peut pas être inférieur au nombre actuel de joueurs (${room.players.length})`)
        return
      }

      await updateDoc(roomRef, {
        name: editName.trim(),
        description: editDescription.trim(),
        maxPlayers: newMaxPlayers,
        isPrivate: editIsPrivate
      })

      setEditDialogOpen(false)
      toast.success("Paramètres mis à jour avec succès !")
    } catch (error) {
      console.error("Erreur lors de la mise à jour des paramètres:", error)
      toast.error("Erreur lors de la mise à jour des paramètres")
    } finally {
      setLoading(false)
    }
  }

  const handleRemovePlayer = (playerId: string) => {
    if (!room || !user?.uid || !isOwner || playerId === user.uid) return
    setPlayerToRemove(playerId)
    setRemovePlayerDialogOpen(true)
  }

  const confirmRemovePlayer = async () => {
    if (!playerToRemove || !room) return

    setLoading(true)
    try {
      const roomRef = doc(db, "rooms", room.id)
      await updateDoc(roomRef, {
        players: arrayRemove(playerToRemove)
      })
      
      const playerName = getPlayerDisplayName(playerToRemove)
      toast.success(`${playerName} a été retiré de la room`)
    } catch (error) {
      console.error("Erreur lors de la suppression du joueur:", error)
      toast.error("Erreur lors de la suppression du joueur")
    } finally {
      setLoading(false)
      setRemovePlayerDialogOpen(false)
      setPlayerToRemove(null)
    }
  }

  const getStatusColor = (status: Room["status"]) => {
    switch (status) {
      case "waiting": return "bg-green-500"
      case "playing": return "bg-yellow-500"
      case "finished": return "bg-gray-500"
      default: return "bg-gray-500"
    }
  }

  const getStatusText = (status: Room["status"]) => {
    switch (status) {
      case "waiting": return "En attente"
      case "playing": return "En cours"
      case "finished": return "Terminée"
      default: return "Inconnue"
    }
  }

  const getUserInitials = (uid: string) => {
    const playerInfo = playersInfo[uid]
    if (playerInfo?.displayName) {
      const names = playerInfo.displayName.split(' ')
      if (names.length >= 2) {
        return (names[0][0] + names[1][0]).toUpperCase()
      }
      return playerInfo.displayName.substring(0, 2).toUpperCase()
    }
    // Génère des initiales basées sur l'UID pour l'affichage
    const chars = uid.substring(0, 2).toUpperCase()
    return chars
  }

  const getPlayerDisplayName = (uid: string) => {
    return playersInfo[uid]?.displayName || "Chargement..."
  }

  const isOwner = user?.uid === room?.players[0]

  // Affichage de chargement pendant l'authentification
  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Chargement...</span>
        </div>
      </div>
    )
  }

  // Affichage si l'utilisateur n'est pas connecté
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">Accès refusé</h1>
          <p className="text-muted-foreground text-lg mb-8">
            Vous devez être connecté pour accéder à cette room
          </p>
          <Button onClick={() => router.push('/login')}>
            Se connecter
          </Button>
        </div>
      </div>
    )
  }

  // Affichage si la room n'existe pas
  if (room === null) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">Room introuvable</h1>
          <p className="text-muted-foreground text-lg mb-8">
            Cette room n&apos;existe pas ou a été supprimée
          </p>
          <Button onClick={() => router.push('/room')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux rooms
          </Button>
        </div>
      </div>
    )
  }

  // Vérifier si l'utilisateur est dans la room
  if (!room.players.includes(user.uid)) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">Accès refusé</h1>
          <p className="text-muted-foreground text-lg mb-8">
            Vous n&apos;êtes pas autorisé à accéder à cette room
          </p>
          <Button onClick={() => router.push('/room')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux rooms
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-8">
        <Button 
          variant="outline" 
          onClick={() => router.push('/room')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
        
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${getStatusColor(room.status)}`} />
          <Badge variant="outline">
            {getStatusText(room.status)}
          </Badge>
        </div>
      </div>

      {/* Informations de la room */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations principales */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-2xl">{room.name}</CardTitle>
            <CardDescription>
              {room.description || "Aucune description"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Code de la room */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm font-medium">Code de la room</p>
                <p className="text-2xl font-mono font-bold">{room.roomCode}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCode}
                className="flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copié
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copier
                  </>
                )}
              </Button>
            </div>

            {/* Joueurs */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Joueurs ({room.players.length}/{room.maxPlayers})
              </h3>
              <div className="space-y-2">
                {room.players.map((playerId, index) => (
                  <div key={playerId} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <Avatar>
                      <AvatarFallback>
                        {getUserInitials(playerId)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {getPlayerDisplayName(playerId)}
                        {index === 0 && " (Hôte)"}
                        {playerId === user.uid && " (Vous)"}
                      </p>
                    </div>
                    {/* Bouton de suppression pour l'hôte (sauf pour lui-même) */}
                    {isOwner && index !== 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePlayer(playerId)}
                        disabled={loading}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title={`Retirer ${getPlayerDisplayName(playerId)} de la room`}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isOwner && (
              <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={loading}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier les paramètres
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Modifier les paramètres de la room</DialogTitle>
                    <DialogDescription>
                      Seul l&apos;hôte peut modifier ces paramètres.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">Nom de la room</Label>
                      <Input
                        id="edit-name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Nom de la room"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-description">Description</Label>
                      <Input
                        id="edit-description"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Description (optionnelle)"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-max-players">Nombre maximum de joueurs</Label>
                      <Input
                        id="edit-max-players"
                        type="number"
                        min={room.players.length}
                        max="12"
                        value={editMaxPlayers}
                        onChange={(e) => setEditMaxPlayers(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Minimum : {room.players.length} (nombre actuel de joueurs)
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {editIsPrivate ? (
                          <Lock className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <Unlock className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div>
                          <Label htmlFor="edit-private-switch" className="text-sm font-medium">
                            Room privée
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {editIsPrivate 
                              ? "Seuls les joueurs avec le code peuvent rejoindre" 
                              : "Visible dans la recherche publique"
                            }
                          </p>
                        </div>
                      </div>
                      <Switch
                        id="edit-private-switch"
                        checked={editIsPrivate}
                        onCheckedChange={setEditIsPrivate}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setEditDialogOpen(false)}
                      disabled={loading}
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={handleSaveSettings}
                      disabled={loading || !editName.trim()}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sauvegarde...
                        </>
                      ) : (
                        "Sauvegarder"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            {isOwner && room.status === "waiting" && (
              <Button
                onClick={handleStartGame}
                disabled={loading || room.players.length < 2}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Démarrage...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Démarrer la partie
                  </>
                )}
              </Button>
            )}

            {room.status === "playing" && (
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <Play className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                <p className="text-sm font-medium">Partie en cours</p>
                <p className="text-xs text-muted-foreground">
                  La partie a commencé !
                </p>
              </div>
            )}

            <Button
              variant="destructive"
              onClick={handleLeaveRoom}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sortie...
                </>
              ) : (
                "Quitter la room"
              )}
            </Button>

            <div className="text-center text-xs text-muted-foreground">
              Créée le {room.createdAt.toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de confirmation pour supprimer un joueur */}
      <AlertDialog open={removePlayerDialogOpen} onOpenChange={setRemovePlayerDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer un joueur</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir retirer <strong>{playerToRemove ? getPlayerDisplayName(playerToRemove) : ''}</strong> de la room ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemovePlayer}
              className="bg-red-600 hover:bg-red-700"
            >
              Retirer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
