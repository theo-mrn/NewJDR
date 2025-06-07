"use client"

import { useCharacter, useCharacterStats } from '@/contexts/CharacterContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import { User, Heart, Shield, Sword, Target, Sparkles, Zap, Dice6 } from 'lucide-react'
import Image from 'next/image'

export function SelectedCharacterDisplay() {
  const { selectedCharacter } = useCharacter()
  const stats = useCharacterStats()

  if (!selectedCharacter || !stats) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">
            Aucun personnage sélectionné
          </h3>
          <p className="text-sm text-muted-foreground">
            Sélectionnez un personnage pour voir ses informations détaillées
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* En-tête avec informations principales */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Image du personnage */}
            <div className="flex-shrink-0">
              {stats.image ? (
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary relative">
                  <Image
                    src={stats.image}
                    alt={stats.name}
                    fill={true}
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center border-4 border-primary">
                  <User className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Informations principales */}
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">{stats.name}</h1>
                <p className="text-lg text-muted-foreground">Joué par {stats.player}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="default" className="text-sm">
                  {stats.race}
                </Badge>
                <Badge variant="secondary" className="text-sm">
                  {stats.profile}
                </Badge>
                <Badge variant="outline" className="text-sm">
                  Niveau {stats.level}
                </Badge>
                <Badge variant="outline" className="text-sm">
                  {stats.hitDie}
                </Badge>
              </div>

              {/* Stats vitales */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <Heart className="h-5 w-5 text-red-500" />
                  <div>
                    <div className="text-2xl font-bold text-red-600">{stats.PV}</div>
                    <div className="text-xs text-muted-foreground">Points de Vie</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <Shield className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{stats.Defense}</div>
                    <div className="text-xs text-muted-foreground">Défense</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">{stats.INIT}</div>
                    <div className="text-xs text-muted-foreground">Initiative</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <Dice6 className="h-5 w-5 text-purple-500" />
                  <div>
                    <div className="text-lg font-bold text-purple-600">{stats.hitDie}</div>
                    <div className="text-xs text-muted-foreground">Dé de Vie</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Caractéristiques */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Caractéristiques
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { name: 'Force', key: 'FOR', value: stats.FOR, mod: stats.FOR_MOD, color: 'red' },
              { name: 'Dextérité', key: 'DEX', value: stats.DEX, mod: stats.DEX_MOD, color: 'green' },
              { name: 'Constitution', key: 'CON', value: stats.CON, mod: stats.CON_MOD, color: 'orange' },
              { name: 'Intelligence', key: 'INT', value: stats.INT, mod: stats.INT_MOD, color: 'blue' },
              { name: 'Sagesse', key: 'SAG', value: stats.SAG, mod: stats.SAG_MOD, color: 'purple' },
              { name: 'Charisme', key: 'CHA', value: stats.CHA, mod: stats.CHA_MOD, color: 'pink' },
            ].map((stat) => (
              <div key={stat.key} className="p-4 border rounded-lg text-center space-y-2">
                <div className="text-sm font-medium text-muted-foreground">{stat.name}</div>
                <div className="text-3xl font-bold">{stat.value}</div>
                <div className={`text-sm font-semibold ${
                  stat.mod >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.mod >= 0 ? '+' : ''}{stat.mod}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Compétences de combat */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sword className="h-5 w-5" />
            Compétences de Combat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
              <Sword className="h-8 w-8 text-red-500" />
              <div>
                <div className="text-2xl font-bold text-red-600">{stats.Contact}</div>
                <div className="text-sm text-muted-foreground">Combat au Contact</div>
                <div className="text-xs text-muted-foreground">Basé sur la Force</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <Target className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.Distance}</div>
                <div className="text-sm text-muted-foreground">Combat à Distance</div>
                <div className="text-xs text-muted-foreground">Basé sur la Dextérité</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
              <Sparkles className="h-8 w-8 text-purple-500" />
              <div>
                <div className="text-2xl font-bold text-purple-600">{stats.Magie}</div>
                <div className="text-sm text-muted-foreground">Attaque Magique</div>
                <div className="text-xs text-muted-foreground">Basé sur le Charisme</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informations techniques */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Informations Techniques</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID:</span>
                <span className="font-mono">{selectedCharacter.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <span>{selectedCharacter.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rayon de visibilité:</span>
                <span>{selectedCharacter.visibilityRadius}px</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Position X:</span>
                <span>{selectedCharacter.x}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Position Y:</span>
                <span>{selectedCharacter.y}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Créé le:</span>
                <span>{new Date(selectedCharacter.createdAt).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exemples d'utilisation du contexte */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">
                         💡 Exemples d&apos;utilisation du contexte
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-2 font-mono bg-muted/30 p-4 rounded">
          <div>
            <span className="text-blue-600">useCharacterStats()</span>
            <span className="text-muted-foreground">.FOR</span> → {stats.FOR}
          </div>
          <div>
            <span className="text-blue-600">useCharacterStats()</span>
            <span className="text-muted-foreground">.CON_MOD</span> → {stats.CON_MOD}
          </div>
          <div>
            <span className="text-blue-600">useCharacterStat(</span>
                         <span className="text-green-600">&apos;name&apos;</span>
            <span className="text-blue-600">)</span> → {stats.name}
          </div>
          <div>
            <span className="text-blue-600">useCharacter()</span>
            <span className="text-muted-foreground">.selectedCharacter?.PV</span> → {selectedCharacter.PV}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 