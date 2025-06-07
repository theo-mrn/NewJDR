"use client"

import React, { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Search, Plus, Users, Clock, Globe, Loader2, Lock, Unlock } from "lucide-react"
import { db, auth } from "@/lib/firebase"
import { collection, addDoc, doc, getDoc, updateDoc, arrayUnion, onSnapshot, query, orderBy, getDocs, where } from "firebase/firestore"
import { onAuthStateChanged, User } from "firebase/auth"
import { useRouter } from "next/navigation"
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

// Fonction pour générer un code de room aléatoire
const generateRoomCode = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export default function RoomPage() {
  const router = useRouter()
  const [otpValue, setOtpValue] = useState("")
  const [newRoomName, setNewRoomName] = useState("")
  const [newRoomDescription, setNewRoomDescription] = useState("")
  const [maxPlayers, setMaxPlayers] = useState("4")
  const [isPrivate, setIsPrivate] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [rooms, setRooms] = useState<Room[]>([])
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Écouter l'état d'authentification
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setAuthLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Écouter les rooms en temps réel
  useEffect(() => {
    const roomsRef = collection(db, "rooms")
    const q = query(roomsRef, orderBy("createdAt", "desc"))
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const roomsData: Room[] = []
      snapshot.forEach((doc) => {
        roomsData.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        } as Room)
      })
      setRooms(roomsData)
    })

    return () => unsubscribe()
  }, [])

  // Filtrer les rooms selon la recherche (seulement les rooms publiques)
  useEffect(() => {
    const publicRooms = rooms.filter(room => !room.isPrivate)
    
    if (searchQuery.trim() === "") {
      setFilteredRooms(publicRooms)
    } else {
      const filtered = publicRooms.filter(room => 
        room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredRooms(filtered)
    }
  }, [searchQuery, rooms])

  const handleCreateRoom = async () => {
    if (newRoomName.trim() && user?.uid) {
      setLoading(true)
      try {
        const roomCode = generateRoomCode()
        const roomData = {
          name: newRoomName,
          description: newRoomDescription,
          maxPlayers: parseInt(maxPlayers),
          players: [user.uid],
          createdAt: new Date(),
          status: "waiting" as const,
          roomCode: roomCode,
          isPrivate: isPrivate
        }

        const docRef = await addDoc(collection(db, "rooms"), roomData)
        console.log("Room créée avec ID:", docRef.id, "Code:", roomCode)
        toast.success(`Room créée avec succès !`, {
          description: `Code de la room: ${roomCode}`
        })
        
        // Reset du formulaire
        setNewRoomName("")
        setNewRoomDescription("")
      } catch (error) {
        console.error("Erreur lors de la création de la room:", error)
        toast.error("Erreur lors de la création de la room")
      } finally {
        setLoading(false)
      }
    }
  }

  const handleJoinRoom = async () => {
    if (otpValue.length === 6 && user?.uid) {
      setLoading(true)
      try {
        // Chercher la room par code
        const roomsRef = collection(db, "rooms")
        const snapshot = await getDocs(query(roomsRef, where("roomCode", "==", otpValue)))
        
        if (snapshot.empty) {
          toast.error("Code de room invalide")
          return
        }

        const roomDoc = snapshot.docs[0]
        const roomData = roomDoc.data() as Room
        
        if (roomData.players.includes(user.uid)) {
          toast.warning("Vous êtes déjà dans cette room")
          return
        }

        if (roomData.players.length >= roomData.maxPlayers) {
          toast.error("Cette room est pleine")
          return
        }

        // Ajouter le joueur à la room
        await updateDoc(doc(db, "rooms", roomDoc.id), {
          players: arrayUnion(user.uid)
        })

        toast.success("Vous avez rejoint la room avec succès !")
        setOtpValue("")
        // Rediriger vers la page de la room
        router.push(`/room/${roomDoc.id}`)
      } catch (error) {
        console.error("Erreur lors de la connexion à la room:", error)
        toast.error("Erreur lors de la connexion à la room")
      } finally {
        setLoading(false)
      }
    }
  }

  const handleJoinPublicRoom = async (roomId: string) => {
    if (!user?.uid) return
    
    setLoading(true)
    try {
      const roomRef = doc(db, "rooms", roomId)
      const roomSnap = await getDoc(roomRef)
      
      if (!roomSnap.exists()) {
        toast.error("Room introuvable")
        return
      }

      const roomData = roomSnap.data() as Room

      if (roomData.players.includes(user.uid)) {
        toast.warning("Vous êtes déjà dans cette room")
        return
      }

      if (roomData.players.length >= roomData.maxPlayers) {
        toast.error("Cette room est pleine")
        return
      }

      await updateDoc(roomRef, {
        players: arrayUnion(user.uid)
      })

      toast.success("Vous avez rejoint la room avec succès !")
      // Rediriger vers la page de la room
      router.push(`/room/${roomId}`)
    } catch (error) {
      console.error("Erreur lors de la connexion à la room:", error)
      toast.error("Erreur lors de la connexion à la room")
    } finally {
      setLoading(false)
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

  // Affichage de chargement pendant l'authentification
  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
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
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">Gestion des Rooms</h1>
          <p className="text-muted-foreground text-lg mb-8">
            Vous devez être connecté pour accéder aux rooms
          </p>
          <Button onClick={() => window.location.href = '/login'}>
            Se connecter
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2">Gestion des Rooms</h1>
        <p className="text-muted-foreground text-lg">
          Créez, rejoignez ou découvrez des parties de jeu de rôle
        </p>
      </div>

      <Tabs defaultValue="join" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="join" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Rejoindre
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Créer
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Découvrir
          </TabsTrigger>
        </TabsList>

        {/* Section Rejoindre une Room */}
        <TabsContent value="join">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Users className="h-5 w-5" />
                Rejoindre une Room
              </CardTitle>
              <CardDescription>
                Entrez le code à 6 caractères de la room que vous souhaitez rejoindre
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <InputOTP
                  maxLength={6}
                  value={otpValue}
                  onChange={setOtpValue}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
                <p className="text-sm text-muted-foreground text-center">
                  Le code est fourni par le créateur de la room
                </p>
              </div>
              <Button 
                onClick={handleJoinRoom}
                disabled={otpValue.length !== 6 || loading || !user?.uid}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connexion...
                  </>
                ) : (
                  "Rejoindre la Room"
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Section Créer une Room */}
        <TabsContent value="create">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Créer une Nouvelle Room
              </CardTitle>
              <CardDescription>
                Configurez votre partie et invitez vos amis à vous rejoindre
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="roomName" className="text-sm font-medium">
                    Nom de la Room *
                  </label>
                  <Input
                    id="roomName"
                    placeholder="Aventure Épique"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="maxPlayers" className="text-sm font-medium">
                    Nombre maximum de joueurs
                  </label>
                  <Input
                    id="maxPlayers"
                    type="number"
                    min="2"
                    max="12"
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <Input
                  id="description"
                  placeholder="Décrivez votre partie..."
                  value={newRoomDescription}
                  onChange={(e) => setNewRoomDescription(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {isPrivate ? (
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Unlock className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <Label htmlFor="private-switch" className="text-sm font-medium">
                      Room privée
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {isPrivate 
                        ? "Seuls les joueurs avec le code peuvent rejoindre" 
                        : "Visible dans la recherche publique"
                      }
                    </p>
                  </div>
                </div>
                <Switch
                  id="private-switch"
                  checked={isPrivate}
                  onCheckedChange={setIsPrivate}
                />
              </div>

              <Button 
                onClick={handleCreateRoom}
                disabled={!newRoomName.trim() || loading || !user?.uid}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer la Room
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Section Rechercher des Rooms */}
        <TabsContent value="search">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Découvrir des Rooms Publiques
                </CardTitle>
                <CardDescription>
                  Trouvez des parties ouvertes et rejoignez d&apos;autres joueurs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par nom ou description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRooms.map(room => (
                <Card key={room.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{room.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {room.description || "Aucune description"}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {room.players.length}/{room.maxPlayers} joueurs
                      </span>
                      <span className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(room.status)}`} />
                        {getStatusText(room.status)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {room.createdAt.toLocaleDateString()}
                      </span>
                    </div>

                    <Button 
                      onClick={() => {
                        if (room.players.includes(user?.uid || "")) {
                          // Si déjà dans la room, rediriger directement
                          router.push(`/room/${room.id}`)
                        } else {
                          // Sinon, rejoindre la room
                          handleJoinPublicRoom(room.id)
                        }
                      }}
                      disabled={room.players.length >= room.maxPlayers || room.status === "finished" || loading || !user?.uid}
                      className="w-full"
                      variant={room.status === "waiting" ? "default" : "outline"}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Connexion...
                        </>
                      ) : !user?.uid ? (
                        "Connexion requise"
                      ) : room.players.includes(user.uid) ? (
                        "Entrer dans la room"
                      ) : room.status === "waiting" ? (
                        "Rejoindre"
                      ) : room.status === "playing" ? (
                        "Observer"
                      ) : (
                        "Terminée"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredRooms.length === 0 && rooms.length > 0 && (
              <Card className="text-center py-8">
                <CardContent>
                  <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Aucune room trouvée pour votre recherche.
                  </p>
                </CardContent>
              </Card>
            )}

            {rooms.length === 0 && (
              <Card className="text-center py-8">
                <CardContent>
                  <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Aucune room disponible pour le moment.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Soyez le premier à créer une room !
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
