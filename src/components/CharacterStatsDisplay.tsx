"use client"

import { useCharacter, useCharacterStats } from '@/contexts/CharacterContext'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip'
import { db } from '@/lib/firebase'
import { doc, updateDoc, collection, onSnapshot } from 'firebase/firestore'
import Image from 'next/image'
import { 
  Heart, 
  Shield, 
  Scroll,
  Edit3,
  Save,
  User,
  Package
} from 'lucide-react'
import { useState, useEffect } from 'react'
import type { SelectedCharacter } from '@/contexts/CharacterContext'
import InventoryManagement from './InventoryManagement'

export function CharacterStatsDisplay() {
  const { selectedCharacter, setSelectedCharacter } = useCharacter()
  const stats = useCharacterStats()
  const [isEditing, setIsEditing] = useState(false)
  const [editedStats, setEditedStats] = useState<SelectedCharacter | null>(selectedCharacter)
  const [isSaving, setIsSaving] = useState(false)
  const [showInventory, setShowInventory] = useState(false)
  const [activeBonuses, setActiveBonuses] = useState<Record<string, number>>({})

  // Récupérer les bonus actifs de l'inventaire
  useEffect(() => {
    if (!selectedCharacter?.roomId || !stats?.name) return;

    const bonusRef = collection(db, `Bonus/${selectedCharacter.roomId}/${stats.name}`);
    
    const unsubscribe = onSnapshot(bonusRef, (snapshot) => {
      const totalBonuses: Record<string, number> = {};
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.active) {
          // Additionner tous les bonus actifs
          ['FOR', 'DEX', 'CON', 'INT', 'SAG', 'CHA', 'PV', 'Defense', 'Contact', 'Distance', 'Magie'].forEach(stat => {
            if (data[stat] && data[stat] !== 0) {
              totalBonuses[stat] = (totalBonuses[stat] || 0) + data[stat];
            }
          });
        }
      });
      
      setActiveBonuses(totalBonuses);
    });

    return () => unsubscribe();
  }, [selectedCharacter?.roomId, stats?.name]);

  // Fonction pour calculer les stats avec les bonus
  const getStatWithBonus = (statName: string, baseValue: number) => {
    const bonus = activeBonuses[statName] || 0;
    return baseValue + bonus;
  };

  // Fonction pour calculer le modificateur avec bonus
  const getModifierWithBonus = (statName: string, baseValue: number) => {
    const totalValue = getStatWithBonus(statName, baseValue);
    return Math.floor((totalValue - 10) / 2);
  };

  if (!selectedCharacter || !stats) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#2a2a2a] flex items-center justify-center border border-[#3a3a3a]">
            <Scroll className="w-10 h-10 text-[#a0a0a0]" />
          </div>
          <h2 className="text-xl font-semibold text-[#c0a0a0] mb-2">
            Aucun Personnage Sélectionné
          </h2>
          <p className="text-[#a0a0a0]">
            Choisissez un héros pour voir sa fiche
          </p>
        </div>
      </div>
    )
  }

  const handleSave = async () => {
    if (!editedStats || !selectedCharacter.id || !selectedCharacter.roomId) return
    
    setIsSaving(true)
    try {
      // Référence au document du personnage dans Firestore
      const characterRef = doc(db, `rooms/${selectedCharacter.roomId}/characters`, selectedCharacter.id)
      
      // Préparer les données à sauvegarder
      const dataToUpdate = {
        Nomperso: editedStats.Nomperso,
        FOR: editedStats.FOR,
        DEX: editedStats.DEX,
        CON: editedStats.CON,
        INT: editedStats.INT,
        SAG: editedStats.SAG,
        CHA: editedStats.CHA,
        Contact: editedStats.Contact,
        Distance: editedStats.Distance,
        Magie: editedStats.Magie,
        Defense: editedStats.Defense,
        PV: editedStats.PV,
        level: editedStats.level,
        Profile: editedStats.Profile,
        Race: editedStats.Race,
        devie: editedStats.devie
      }
      
      // Sauvegarder dans Firestore
      await updateDoc(characterRef, dataToUpdate)
      
      // Mettre à jour le contexte local
      setSelectedCharacter(editedStats)
      setIsEditing(false)
      
      console.log('Personnage sauvegardé avec succès!')
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      // Optionnel : ajouter une notification d'erreur à l'utilisateur
    } finally {
      setIsSaving(false)
    }
  }

  const handleStatChange = (stat: string, value: string) => {
    if (!editedStats) return
    setEditedStats(prev => prev ? ({
      ...prev,
      [stat]: isNaN(Number(value)) ? value : Number(value)
    }) : prev)
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-[#242424] rounded-lg shadow-2xl p-6 space-y-6">
          
          <div className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6">
            
            {/* Portrait */}
            <div className="flex-shrink-0">
              <div className="w-48 h-48 rounded-lg overflow-hidden bg-[#2a2a2a] border border-[#3a3a3a]">
                {stats.image ? (
                  <Image 
                    src={stats.image} 
                    alt={stats.name}
                    width={192}
                    height={192}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-24 h-24 text-[#a0a0a0]" />
                  </div>
                )}
              </div>
            </div>
            
            {/* Informations */}
            <div className="flex-grow space-y-4">
              
              {/* En-tête */}
              <div className="bg-[#2a2a2a] p-4 rounded-lg border border-[#3a3a3a]">
                <div className="flex justify-between items-start mb-2">
                  {isEditing ? (
                    <Input 
                      value={editedStats?.Nomperso || ''}
                      onChange={(e) => handleStatChange('Nomperso', e.target.value)}
                      className="text-2xl font-bold bg-[#242424] border-[#3a3a3a] text-[#c0a0a0]"
                    />
                  ) : (
                    <h2 className="text-2xl font-bold text-[#c0a0a0]">{stats.name}</h2>
                  )}
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => setShowInventory(!showInventory)}
                      size="sm"
                      className="bg-[#3a3a3a] hover:bg-[#4a4a4a] text-[#c0a0a0] border-[#4a4a4a]"
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Inventaire
                    </Button>
                    <Button 
                      onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                      disabled={isSaving}
                      size="sm"
                      className="bg-[#3a3a3a] hover:bg-[#4a4a4a] text-[#c0a0a0] border-[#4a4a4a] disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-[#c0a0a0] border-t-transparent" />
                          Sauvegarde...
                        </>
                      ) : isEditing ? (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Sauvegarder
                        </>
                      ) : (
                        <>
                          <Edit3 className="w-4 h-4 mr-2" />
                          Modifier
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Niveau: <span className="text-[#a0a0a0]">{stats.level}</span></div>
                  <div>Race: <span className="text-[#a0a0a0]">{stats.race}</span></div>
                  <div>Profil: <span className="text-[#a0a0a0]">{stats.profile}</span></div>
                  <div>Dé de vie: <span className="text-[#a0a0a0]">{stats.hitDie}</span></div>
                </div>
              </div>

              {/* Caractéristiques */}
              <TooltipProvider>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { name: 'FOR', baseValue: stats.FOR },
                    { name: 'DEX', baseValue: stats.DEX },
                    { name: 'CON', baseValue: stats.CON },
                    { name: 'INT', baseValue: stats.INT },
                    { name: 'SAG', baseValue: stats.SAG },
                    { name: 'CHA', baseValue: stats.CHA }
                  ].map((ability) => {
                    const totalValue = getStatWithBonus(ability.name, ability.baseValue);
                    const totalModifier = getModifierWithBonus(ability.name, ability.baseValue);
                    const bonus = activeBonuses[ability.name] || 0;
                    
                    return (
                      <Tooltip key={ability.name}>
                        <TooltipTrigger>
                          <div className="bg-[#2a2a2a] p-2 rounded-lg border border-[#3a3a3a]">
                            <div className="text-[#c0a0a0] font-semibold">{ability.name}</div>
                            <div className={`text-2xl font-bold ${totalModifier >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {totalModifier >= 0 ? '+' : ''}{totalModifier}
                            </div>
                            {isEditing ? (
                              <Input 
                                value={ability.baseValue}
                                onChange={(e) => handleStatChange(ability.name, e.target.value)}
                                className="text-sm text-center bg-[#242424] border-[#3a3a3a] text-[#a0a0a0] h-6 mt-1"
                              />
                            ) : (
                              <div className="text-sm text-[#a0a0a0]">
                                {totalValue}
                                {bonus !== 0 && (
                                  <span className="text-green-400 ml-1">
                                    ({ability.baseValue}{bonus >= 0 ? '+' : ''}{bonus})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-[#2a2a2a] text-[#c0a0a0] border-[#3a3a3a]">
                          <p>Valeur de base: {ability.baseValue}</p>
                          {bonus !== 0 && <p>Bonus d&apos;équipement: {bonus >= 0 ? '+' : ''}{bonus}</p>}
                          <p>Valeur totale: {totalValue}</p>
                          <p>Modificateur: {totalModifier >= 0 ? '+' : ''}{totalModifier}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </TooltipProvider>

              {/* PV et CA */}
              <div className="bg-[#2a2a2a] p-4 rounded-lg border border-[#3a3a3a] flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Heart className="text-red-500" size={24} />
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold text-[#d4d4d4]">
                      {getStatWithBonus('PV', stats.PV)} / {getStatWithBonus('PV', stats.PV)}
                    </span>
                    {activeBonuses['PV'] && (
                      <span className="text-xs text-green-400">
                        (Base: {stats.PV} + {activeBonuses['PV']})
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="text-blue-500" size={24} />
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold text-[#d4d4d4]">
                      {getStatWithBonus('Defense', stats.Defense)}
                    </span>
                    {activeBonuses['Defense'] && (
                      <span className="text-xs text-green-400">
                        (Base: {stats.Defense} + {activeBonuses['Defense']})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Aptitudes de combat */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { name: 'Contact', baseValue: stats.Contact },
                  { name: 'Distance', baseValue: stats.Distance },
                  { name: 'Magie', baseValue: stats.Magie }
                ].map((stat) => {
                  const totalValue = getStatWithBonus(stat.name, stat.baseValue);
                  const bonus = activeBonuses[stat.name] || 0;
                  
                  return (
                    <div key={stat.name} className="bg-[#2a2a2a] p-4 rounded-lg border border-[#3a3a3a] text-center">
                      <h3 className="text-lg font-semibold text-[#c0a0a0] mb-1">{stat.name}</h3>
                      {isEditing ? (
                        <Input 
                          value={stat.baseValue}
                          onChange={(e) => handleStatChange(stat.name, e.target.value)}
                          className="text-2xl font-bold text-center bg-[#242424] border-[#3a3a3a] text-[#d4d4d4]"
                        />
                      ) : (
                        <div className="flex flex-col items-center">
                          <span className="text-2xl font-bold text-[#d4d4d4]">{totalValue}</span>
                          {bonus !== 0 && (
                            <span className="text-xs text-green-400">
                              (Base: {stat.baseValue} + {bonus})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        </div>

        {/* Inventaire */}
        {showInventory && (
          <div className="mt-6">
            <InventoryManagement 
              playerName={stats.name}
              roomId={selectedCharacter.roomId || 'default'}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// Hook utilitaire pour accéder rapidement à une stat spécifique
export function useCharacterStat(statName: keyof ReturnType<typeof useCharacterStats>) {
  const stats = useCharacterStats()
  return stats ? stats[statName] : null
} 