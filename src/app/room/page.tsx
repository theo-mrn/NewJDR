"use client"

import React, { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Users, Clock, Globe } from "lucide-react"

// Types pour les données de rooms
interface Room {
  id: string
  name: string
  description: string
  playerCount: number
  maxPlayers: number
  gameType: string
  isPrivate: boolean
  createdAt: Date
  status: "waiting" | "playing" | "finished"
}

// Données simulées pour les rooms disponibles
const mockRooms: Room[] = [
  {
    id: "ROOM001",
    name: "Aventure Épique",
    description: "Une campagne de D&D 5e dans un monde fantastique",
    playerCount: 3,
    maxPlayers: 5,
    gameType: "D&D 5e",
    isPrivate: false,
    createdAt: new Date("2024-01-15"),
    status: "waiting"
  },
  {
    id: "ROOM002", 
    name: "Mystères de Cthulhu",
    description: "Enquête horrifique dans l'univers de Lovecraft",
    playerCount: 2,
    maxPlayers: 4,
    gameType: "Call of Cthulhu",
    isPrivate: false,
    createdAt: new Date("2024-01-14"),
    status: "playing"
  },
  {
    id: "ROOM003",
    name: "Galaxie Lointaine",
    description: "Exploration spatiale et aventures sci-fi",
    playerCount: 4,
    maxPlayers: 6,
    gameType: "Starfinder",
    isPrivate: true,
    createdAt: new Date("2024-01-13"),
    status: "waiting"
  }
]

export default function RoomPage() {
  const [otpValue, setOtpValue] = useState("")
  const [newRoomName, setNewRoomName] = useState("")
  const [newRoomDescription, setNewRoomDescription] = useState("")
  const [maxPlayers, setMaxPlayers] = useState("4")
  const [gameType, setGameType] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredRooms, setFilteredRooms] = useState(mockRooms)

  // Filtrer les rooms selon la recherche
  React.useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredRooms(mockRooms)
    } else {
      const filtered = mockRooms.filter(room => 
        room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.gameType.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredRooms(filtered)
    }
  }, [searchQuery])

  const handleCreateRoom = () => {
    if (newRoomName.trim() && gameType.trim()) {
      console.log("Création de room:", {
        name: newRoomName,
        description: newRoomDescription,
        maxPlayers: parseInt(maxPlayers),
        gameType
      })
      // Ici, vous ajouteriez la logique pour créer la room
      alert("Room créée avec succès !")
      setNewRoomName("")
      setNewRoomDescription("")
      setGameType("")
    }
  }

  const handleJoinRoom = () => {
    if (otpValue.length === 6) {
      console.log("Tentative de rejoindre la room:", otpValue)
      // Ici, vous ajouteriez la logique pour rejoindre la room
      alert(`Tentative de rejoindre la room: ${otpValue}`)
    }
  }

  const handleJoinPublicRoom = (roomId: string) => {
    console.log("Rejoindre room publique:", roomId)
    // Ici, vous ajouteriez la logique pour rejoindre une room publique
    alert(`Rejoindre la room: ${roomId}`)
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
                Entrez le code à 6 chiffres de la room que vous souhaitez rejoindre
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
                  Le code est fourni par le maître de jeu
                </p>
              </div>
              <Button 
                onClick={handleJoinRoom}
                disabled={otpValue.length !== 6}
                className="w-full"
                size="lg"
              >
                Rejoindre la Room
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
                  <label htmlFor="gameType" className="text-sm font-medium">
                    Type de Jeu *
                  </label>
                  <Input
                    id="gameType"
                    placeholder="D&D 5e, Pathfinder..."
                    value={gameType}
                    onChange={(e) => setGameType(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <Input
                  id="description"
                  placeholder="Décrivez votre campagne..."
                  value={newRoomDescription}
                  onChange={(e) => setNewRoomDescription(e.target.value)}
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

              <Button 
                onClick={handleCreateRoom}
                disabled={!newRoomName.trim() || !gameType.trim()}
                className="w-full"
                size="lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer la Room
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
                    placeholder="Rechercher par nom, description ou type de jeu..."
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
                          {room.description}
                        </CardDescription>
                      </div>
                      {room.isPrivate && (
                        <Badge variant="secondary" className="ml-2">
                          Privée
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {room.playerCount}/{room.maxPlayers} joueurs
                      </span>
                      <Badge variant="outline">
                        {room.gameType}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {room.createdAt.toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(room.status)}`} />
                        {getStatusText(room.status)}
                      </span>
                    </div>

                    <Button 
                      onClick={() => handleJoinPublicRoom(room.id)}
                      disabled={room.playerCount >= room.maxPlayers || room.status === "finished"}
                      className="w-full"
                      variant={room.status === "waiting" ? "default" : "outline"}
                    >
                                             {room.status === "waiting" ? "Rejoindre" : 
                        room.status === "playing" ? "Observer" : 
                        "Terminée"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredRooms.length === 0 && (
              <Card className="text-center py-8">
                <CardContent>
                  <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Aucune room trouvée pour votre recherche.
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
