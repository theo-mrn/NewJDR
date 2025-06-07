"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Carousel } from '@/components/blocks/retro-testimonial'
import { Loader2, Users, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { useCharacter, SelectedCharacter } from '@/contexts/CharacterContext'

// Types pour les personnages
interface Character {
  id: string
  Nomperso: string
  Nomjoueur: string
  Race: string
  Profile: string
  level: number
  imageURL?: string
  FOR: number
  DEX: number
  CON: number
  INT: number
  SAG: number
  CHA: number
  PV: number
  Defense: number
  Contact?: number
  Distance?: number
  Magie?: number
  INIT?: number
  devie?: string
  userId: string
  createdAt: string
}

// Composant de carte de personnage (similaire à TestimonialCard)
const CharacterCard = ({
  character,
  index,
  roomId,
  layout = false,
  onCardClose = () => {},
  backgroundImage = "https://images.unsplash.com/photo-1528458965990-428de4b1cb0d?q=80&w=3129&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
}: {
  character: Character
  index: number
  roomId: string
  layout?: boolean
  onCardClose?: () => void
  backgroundImage?: string
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const { setSelectedCharacter } = useCharacter()

  const handleExpand = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsExpanded(true)
  }

  const handleSelectCharacter = () => {
    // Convertir le Character en SelectedCharacter
    const selectedChar: SelectedCharacter = {
      ...character,
      roomId,
      Contact: character.Contact || 0,
      Distance: character.Distance || 0,
      Magie: character.Magie || 0,
      INIT: character.INIT || character.DEX,
      devie: character.devie || 'd12',
      type: 'joueurs',
      visibilityRadius: 150,
      x: 500,
      y: 500
    }
    setSelectedCharacter(selectedChar)
  }

  const handleCollapse = () => {
    setIsExpanded(false)
    onCardClose()
  }

  const calculateModifier = (value: number) => Math.floor((value - 10) / 2)



  return (
    <>
      <AnimatePresence>
        {isExpanded && (
          <div className="fixed inset-0 h-screen overflow-hidden z-50">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-background/80 backdrop-blur-lg h-full w-full fixed inset-0"
              onClick={handleCollapse}
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-4xl mx-auto bg-card border h-full z-[60] p-4 md:p-10 rounded-3xl relative md:mt-10 overflow-y-auto"
            >
              <button
                type="button"
                className="sticky top-4 h-8 w-8 right-0 ml-auto rounded-full flex items-center justify-center bg-primary hover:bg-primary/80 transition-colors focus:outline-none"
                onClick={handleCollapse}
              >
                ✕
              </button>
              
              <div className="space-y-6">
                <div className="text-center space-y-4">
                                     {character.imageURL && (
                     <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-primary relative">
                       <Image
                         src={character.imageURL}
                         alt={character.Nomperso}
                         fill={true}
                         className="object-cover"
                       />
                     </div>
                   )}
                  <h2 className="text-3xl font-bold text-foreground">{character.Nomperso}</h2>
                  <p className="text-xl text-muted-foreground">Joué par {character.Nomjoueur}</p>
                  <div className="flex justify-center gap-4 text-sm">
                    <span className="bg-primary/10 px-3 py-1 rounded-full">{character.Race}</span>
                    <span className="bg-secondary/10 px-3 py-1 rounded-full">{character.Profile}</span>
                    <span className="bg-accent/10 px-3 py-1 rounded-full">Niveau {character.level}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {['FOR', 'DEX', 'CON', 'INT', 'SAG', 'CHA'].map(stat => (
                    <div key={stat} className="bg-muted/50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold">{character[stat as keyof Character] as number}</div>
                      <div className="text-sm text-muted-foreground">{stat}</div>
                      <div className="text-xs">
                        Mod: {calculateModifier(character[stat as keyof Character] as number)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-muted/50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-red-500">{character.PV}</div>
                    <div className="text-sm text-muted-foreground">Points de Vie</div>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-500">{character.Defense}</div>
                    <div className="text-sm text-muted-foreground">Défense</div>
                  </div>
                </div>

                <div className="flex justify-center pt-4">
                  <Link href={`/room/${roomId}/home`}>
                    <Button 
                      className="gap-2 bg-primary hover:bg-primary/90"
                      onClick={handleSelectCharacter}
                    >
                      <Users className="h-4 w-4" />
                      Commencer avec {character.Nomperso}
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.button
        layoutId={layout ? `card-${character.id}` : undefined}
        onClick={handleExpand}
        type="button"
        className="focus:outline-none"
        whileHover={{
          rotateX: 2,
          rotateY: 2,
          rotate: 3,
          scale: 1.02,
          transition: { duration: 0.3, ease: "easeOut" },
        }}
      >
        <div
          className={`${index % 2 === 0 ? "rotate-0" : "-rotate-0"} rounded-3xl bg-card border h-[500px] md:h-[550px] w-80 md:w-96 overflow-hidden flex flex-col items-center justify-center relative z-10 shadow-lg`}
        >
          <div className="absolute opacity-30" style={{ inset: "-1px 0 0" }}>
            <div className="absolute inset-0">
              <Image
                className="block w-full h-full object-center object-cover"
                src={backgroundImage}
                alt="Background layer"
                fill={true}
                style={{
                  filter: 'sepia(0.8) contrast(1.2) brightness(0.8) saturate(0.7)'
                }}
              />
            </div>
          </div>
          
                      <div className="w-[90px] h-[90px] md:w-[150px] md:h-[150px] opacity-80 overflow-hidden rounded-[1000px] border-[3px] border-solid border-border aspect-[1/1] flex-none saturate-[0.2] sepia-[0.46] relative">
            <Image
              className="transition duration-300 rounded-inherit object-cover object-center z-40 blur-0"
              src={character.imageURL || '/default-character.png'}
              alt={character.Nomperso}
              fill={true}
              sizes="(max-width: 768px) 90px, 150px"
            />
            <div className="absolute inset-0 rounded-inherit bg-gradient-to-b from-transparent via-transparent to-black/20 z-50 pointer-events-none"></div>
            <div className="absolute inset-0 rounded-inherit bg-black/10 mix-blend-multiply z-50 pointer-events-none"></div>
          </div>
          
          <motion.p
            layoutId={layout ? `title-${character.id}` : undefined}
            className="text-foreground text-2xl md:text-2xl font-normal text-center [text-wrap:balance] font-serif mt-4 lowercase px-3"
          >
            {character.Race} {character.Profile}
          </motion.p>
          
          <motion.p
            layoutId={layout ? `category-${character.id}` : undefined}
            className="text-foreground text-xl md:text-2xl font-thin font-serif italic text-center mt-5 lowercase"
          >
            {character.Nomperso}.
          </motion.p>
          
          <motion.p
            layoutId={layout ? `category-${character.id}` : undefined}
            className="text-muted-foreground text-base md:text-base font-thin font-serif italic text-center mt-1 lowercase underline underline-offset-8 decoration-1"
          >
            joué par {character.Nomjoueur}
          </motion.p>
        </div>
      </motion.button>
    </>
  )
}

export default function PersonnagesPage() {
  const params = useParams()
  const roomId = params.roomid as string
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        setLoading(true)
        const charactersRef = collection(db, `rooms/${roomId}/characters`)
        const querySnapshot = await getDocs(charactersRef)
        
        const charactersData: Character[] = []
        querySnapshot.forEach((doc) => {
          charactersData.push({ id: doc.id, ...doc.data() } as Character)
        })

        // Trier par date de création (plus récent en premier)
        charactersData.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )

        setCharacters(charactersData)
      } catch (err) {
        console.error('Erreur lors du chargement des personnages:', err)
        setError('Impossible de charger les personnages')
      } finally {
        setLoading(false)
      }
    }

    if (roomId) {
      fetchCharacters()
    }
  }, [roomId])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Chargement des personnages...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-destructive">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Réessayer
          </Button>
        </div>
      </div>
    )
  }

  // Créer les cartes de personnages pour le carousel
  const characterCards = characters.map((character, index) => (
    <CharacterCard
      key={character.id}
      character={character}
      index={index}
      roomId={roomId}
      onCardClose={() => {}}
    />
  ))

  return (
    <div className="min-h-screen bg-background">
      <section className="py-12 bg-background">
        <div className="w-full mx-auto px-4">
          <div className="text-center space-y-4 mb-8">
            <div className="flex items-center justify-center gap-2">
              <Users className="h-8 w-8 text-primary" />
              <h2 className="text-3xl font-bold text-foreground font-serif">
                Personnages de la salle
              </h2>
            </div>
            <p className="text-muted-foreground">
              Découvrez tous les personnages qui participent à cette aventure
            </p>
            <div className="flex justify-center">
              <Link href={`/room/${roomId}/creation`}>
                <Button className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Créer un nouveau personnage
                </Button>
              </Link>
            </div>
          </div>
          
          {characters.length > 0 ? (
            <Carousel items={characterCards} />
          ) : (
            <div className="text-center py-12 space-y-4">
              <Users className="h-16 w-16 text-muted-foreground mx-auto" />
              <h3 className="text-xl font-semibold text-muted-foreground">
                Aucun personnage créé
              </h3>
              <p className="text-muted-foreground">
                Soyez le premier à créer un personnage pour cette salle !
              </p>
              <Link href={`/room/${roomId}/creation`}>
                <Button className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Créer mon personnage
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}