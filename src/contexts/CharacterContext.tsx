"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Interface pour le personnage
export interface SelectedCharacter {
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
  Contact: number
  Distance: number
  Magie: number
  INIT: number
  devie: string
  userId: string
  roomId: string
  createdAt: string
  type: string
  visibilityRadius: number
  x: number
  y: number
}

// Interface pour le contexte
interface CharacterContextType {
  selectedCharacter: SelectedCharacter | null
  setSelectedCharacter: (character: SelectedCharacter | null) => void
  calculateModifier: (value: number) => number
  clearStoredCharacter: () => void
  isLoading: boolean
}

// Création du contexte
const CharacterContext = createContext<CharacterContextType | undefined>(undefined)

// Clé pour le localStorage
const STORAGE_KEY = 'selectedCharacter'

// Fonction pour valider la structure du personnage
const isValidCharacter = (character: unknown): character is SelectedCharacter => {
  if (!character || typeof character !== 'object' || character === null) {
    return false
  }
  
  const obj = character as Record<string, unknown>
  
  return (
    typeof obj.id === 'string' &&
    typeof obj.Nomperso === 'string' &&
    typeof obj.roomId === 'string' &&
    typeof obj.FOR === 'number' &&
    typeof obj.DEX === 'number' &&
    typeof obj.CON === 'number' &&
    typeof obj.INT === 'number' &&
    typeof obj.SAG === 'number' &&
    typeof obj.CHA === 'number'
  )
}

// Provider du contexte
export function CharacterProvider({ children }: { children: ReactNode }) {
  const [selectedCharacter, setSelectedCharacter] = useState<SelectedCharacter | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Restaurer les données du localStorage au chargement
  useEffect(() => {
    try {
      const savedCharacter = localStorage.getItem(STORAGE_KEY)
      if (savedCharacter) {
        const parsedCharacter = JSON.parse(savedCharacter)
        if (isValidCharacter(parsedCharacter)) {
          setSelectedCharacter(parsedCharacter)
        } else {
          console.warn('Données de personnage invalides dans le localStorage, suppression...')
          localStorage.removeItem(STORAGE_KEY)
        }
      }
    } catch (error) {
      console.error('Erreur lors de la restauration du personnage:', error)
      // Nettoyer le localStorage en cas de données corrompues
      localStorage.removeItem(STORAGE_KEY)
    } finally {
      setIsInitialized(true)
    }
  }, [])

  // Sauvegarder les données dans le localStorage quand elles changent
  useEffect(() => {
    if (!isInitialized) return // Ne pas sauvegarder pendant l'initialisation
    
    try {
      if (selectedCharacter) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedCharacter))
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du personnage:', error)
    }
  }, [selectedCharacter, isInitialized])

  const calculateModifier = (value: number) => Math.floor((value - 10) / 2)

  const clearStoredCharacter = () => {
    setSelectedCharacter(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  const value = {
    selectedCharacter,
    setSelectedCharacter,
    calculateModifier,
    clearStoredCharacter,
    isLoading: !isInitialized,
  }

  return (
    <CharacterContext.Provider value={value}>
      {children}
    </CharacterContext.Provider>
  )
}

// Hook custom pour utiliser le contexte
export function useCharacter() {
  const context = useContext(CharacterContext)
  if (context === undefined) {
    throw new Error('useCharacter must be used within a CharacterProvider')
  }
  return context
}

// Fonctions utilitaires pour accéder facilement aux stats
export function useCharacterStats() {
  const { selectedCharacter, calculateModifier } = useCharacter()
  
  if (!selectedCharacter) {
    return null
  }

  return {
    // Stats de base
    FOR: selectedCharacter.FOR,
    DEX: selectedCharacter.DEX,
    CON: selectedCharacter.CON,
    INT: selectedCharacter.INT,
    SAG: selectedCharacter.SAG,
    CHA: selectedCharacter.CHA,
    
    // Modificateurs
    FOR_MOD: calculateModifier(selectedCharacter.FOR),
    DEX_MOD: calculateModifier(selectedCharacter.DEX),
    CON_MOD: calculateModifier(selectedCharacter.CON),
    INT_MOD: calculateModifier(selectedCharacter.INT),
    SAG_MOD: calculateModifier(selectedCharacter.SAG),
    CHA_MOD: calculateModifier(selectedCharacter.CHA),
    
    // Autres stats
    PV: selectedCharacter.PV,
    Defense: selectedCharacter.Defense,
    Contact: selectedCharacter.Contact,
    Distance: selectedCharacter.Distance,
    Magie: selectedCharacter.Magie,
    INIT: selectedCharacter.INIT,
    
    // Infos générales
    name: selectedCharacter.Nomperso,
    player: selectedCharacter.Nomjoueur,
    race: selectedCharacter.Race,
    profile: selectedCharacter.Profile,
    level: selectedCharacter.level,
    image: selectedCharacter.imageURL,
    hitDie: selectedCharacter.devie,
  }
} 