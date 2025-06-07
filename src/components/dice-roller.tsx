"use client";

import React, { useState, useEffect } from "react";
import { DiceRoll } from "@dice-roller/rpg-dice-roller";
import { motion, AnimatePresence } from "framer-motion";
import { Dices, RotateCcw, History, Trash2, Plus, Edit, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

// Types
interface RollResult {
  id: string;
  notation: string;
  result: string;
  total: number;
  timestamp: Date;
  output: string;
}

interface DicePreset {
  name: string;
  notation: string;
  description: string;
}

interface Alias {
  name: string;
  value: number;
  description?: string;
}

// Presets de dés communs
const DICE_PRESETS: DicePreset[] = [
  { name: "D20", notation: "1d20", description: "Dé à 20 faces" },
  { name: "D12", notation: "1d12", description: "Dé à 12 faces" },
  { name: "D10", notation: "1d10", description: "Dé à 10 faces" },
  { name: "D8", notation: "1d8", description: "Dé à 8 faces" },
  { name: "D6", notation: "1d6", description: "Dé à 6 faces" },
  { name: "D4", notation: "1d4", description: "Dé à 4 faces" },
  { name: "2D6", notation: "2d6", description: "2 dés à 6 faces" },
  { name: "3D6", notation: "3d6", description: "3 dés à 6 faces" },
  { name: "4D6", notation: "4d6", description: "4 dés à 6 faces" },
  { name: "D20+5", notation: "1d20+5", description: "D20 avec modificateur +5" },
  { name: "2D20", notation: "2d20", description: "Avantage/Désavantage" },
];

export function DiceRoller() {
  const [notation, setNotation] = useState("");
  const [currentResult, setCurrentResult] = useState<RollResult | null>(null);
  const [rollHistory, setRollHistory] = useState<RollResult[]>([]);
  const [isRolling, setIsRolling] = useState(false);
  const [error, setError] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  
  // États pour les alias
  const [aliases, setAliases] = useState<Alias[]>([]);
  const [showAliases, setShowAliases] = useState(false);
  const [newAliasName, setNewAliasName] = useState("");
  const [newAliasValue, setNewAliasValue] = useState("");
  const [newAliasDescription, setNewAliasDescription] = useState("");
  const [editingAlias, setEditingAlias] = useState<string | null>(null);

  // Charger l'historique et les alias depuis localStorage au montage
  useEffect(() => {
    const savedHistory = localStorage.getItem("dice-roll-history");
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setRollHistory(parsed.map((item: { id: string; notation: string; result: string; total: number; timestamp: string; output: string; }) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })));
      } catch (e) {
        console.error("Erreur lors du chargement de l'historique:", e);
      }
    }

    const savedAliases = localStorage.getItem("dice-roll-aliases");
    if (savedAliases) {
      try {
        const parsed = JSON.parse(savedAliases);
        setAliases(parsed);
      } catch (e) {
        console.error("Erreur lors du chargement des alias:", e);
      }
    }
  }, []);

  // Sauvegarder l'historique dans localStorage
  const saveToHistory = (result: RollResult) => {
    const newHistory = [result, ...rollHistory].slice(0, 50); // Garder seulement les 50 derniers
    setRollHistory(newHistory);
    localStorage.setItem("dice-roll-history", JSON.stringify(newHistory));
  };

  // Sauvegarder les alias dans localStorage
  const saveAliases = (aliasesToSave: Alias[]) => {
    setAliases(aliasesToSave);
    localStorage.setItem("dice-roll-aliases", JSON.stringify(aliasesToSave));
  };

  // Remplacer les alias dans une notation
  const replaceAliases = (notation: string): string => {
    let processedNotation = notation;
    aliases.forEach(alias => {
      const regex = new RegExp(`\\b${alias.name.toUpperCase()}\\b`, 'gi');
      processedNotation = processedNotation.replace(regex, alias.value.toString());
    });
    return processedNotation;
  };

  // Ajouter un nouvel alias
  const addAlias = () => {
    if (!newAliasName.trim() || newAliasValue.trim() === "") return;
    
    const aliasName = newAliasName.trim().toUpperCase();
    const aliasValue = parseInt(newAliasValue.trim());
    
    if (isNaN(aliasValue)) {
      setError("La valeur de l'alias doit être un nombre");
      return;
    }

    const newAlias: Alias = {
      name: aliasName,
      value: aliasValue,
      description: newAliasDescription.trim() || undefined
    };

    const updatedAliases = aliases.filter(a => a.name !== aliasName);
    updatedAliases.push(newAlias);
    saveAliases(updatedAliases);

    setNewAliasName("");
    setNewAliasValue("");
    setNewAliasDescription("");
    setError("");
  };

  // Supprimer un alias
  const deleteAlias = (aliasName: string) => {
    const updatedAliases = aliases.filter(a => a.name !== aliasName);
    saveAliases(updatedAliases);
  };

  // Commencer l'édition d'un alias
  const startEditingAlias = (alias: Alias) => {
    setNewAliasName(alias.name);
    setNewAliasValue(alias.value.toString());
    setNewAliasDescription(alias.description || "");
    setEditingAlias(alias.name);
  };

  // Annuler l'édition
  const cancelEditing = () => {
    setNewAliasName("");
    setNewAliasValue("");
    setNewAliasDescription("");
    setEditingAlias(null);
  };

  // Fonction pour formater les détails des dés
  const formatDiceDetails = (roll: DiceRoll): string => {
    try {
      // Parcourir tous les groupes de dés dans le roll
      const details: string[] = [];
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      roll.rolls.forEach((rollGroup: any) => {
        if (rollGroup.rolls && rollGroup.rolls.length > 0) {
          // Vérifier s'il y a des modificateurs (keep highest, keep lowest, etc.)
          const hasModifiers = rollGroup.modifiers && rollGroup.modifiers.length > 0;
          
          if (hasModifiers) {
            // Afficher tous les dés lancés et indiquer lesquels sont gardés
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const diceDisplay = rollGroup.rolls.map((die: any) => {
              const value = die.value || die.result || die;
              const isKept = !die.discarded;
              return isKept ? `**${value}**` : `~~${value}~~`;
            }).join(', ');
            
            details.push(`[${diceDisplay}]`);
          } else {
            // Pas de modificateurs, afficher simplement les résultats
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const diceResults = rollGroup.rolls.map((die: any) => die.value || die.result || die);
            details.push(`[${diceResults.join(', ')}]`);
          }
        }
      });
      
      return details.join(' + ');
    } catch {
      // En cas d'erreur, retourner l'output original
      return roll.output;
    }
  };

  // Fonction principale de lancer de dés
  const rollDice = async (diceNotation?: string) => {
    const originalNotation = diceNotation || notation;
    if (!originalNotation.trim()) {
      setError("Veuillez entrer une notation de dés");
      return;
    }

    setIsRolling(true);
    setError("");

    try {
      // Petit délai pour l'animation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Remplacer les alias dans la notation
      const processedNotation = replaceAliases(originalNotation);
      
      const roll = new DiceRoll(processedNotation);
      
      // Générer les détails formatés des dés
      const diceDetails = formatDiceDetails(roll);
      
      const result: RollResult = {
        id: Date.now().toString(),
        notation: originalNotation, // Garder la notation originale avec les alias
        result: roll.toString(),
        total: roll.total,
        timestamp: new Date(),
        output: `${originalNotation} → ${processedNotation}: ${diceDetails} = ${roll.total}`
      };

      setCurrentResult(result);
      saveToHistory(result);
      
    } catch (err) {
      setError("Notation invalide. Exemples: 1d20, 2d6+3, 4d6kh3, 1d20+CON");
      console.error("Erreur de lancer de dés:", err);
    } finally {
      setIsRolling(false);
    }
  };

  // Effacer l'historique
  const clearHistory = () => {
    setRollHistory([]);
    localStorage.removeItem("dice-roll-history");
  };

  // Reprendre un lancer depuis l'historique
  const rerollFromHistory = (historyItem: RollResult) => {
    setNotation(historyItem.notation);
    rollDice(historyItem.notation);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Dices className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Lanceur de Dés</h1>
        </div>
        <p className="text-muted-foreground">
          Entrez une notation de dés (ex: 1d20, 2d6+3, 4d6kh3, 1d20+CON) ou utilisez les presets
        </p>
      </div>

      {/* Input principal */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={notation}
            onChange={(e) => setNotation(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && rollDice()}
            placeholder="Ex: 1d20+5, 3d6, 2d20kh1..."
            className="flex-1 px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isRolling}
          />
          <motion.button
            onClick={() => rollDice()}
            disabled={isRolling}
            className={cn(
              "px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium",
              "hover:bg-primary/90 transition-colors",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "flex items-center gap-2"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isRolling ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
              >
                <Dices className="h-5 w-5" />
              </motion.div>
            ) : (
              <Dices className="h-5 w-5" />
            )}
            {isRolling ? "Lancement..." : "Lancer"}
          </motion.button>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm"
          >
            {error}
          </motion.div>
        )}
      </div>

      {/* Presets de dés */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Dés rapides</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {DICE_PRESETS.map((preset) => (
            <motion.button
              key={preset.notation}
              onClick={() => rollDice(preset.notation)}
              className={cn(
                "p-3 bg-card border border-border rounded-lg",
                "hover:bg-accent hover:border-accent-foreground/20",
                "transition-colors text-center group"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isRolling}
            >
              <div className="font-bold text-primary">{preset.name}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {preset.notation}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Résultat actuel */}
      <AnimatePresence>
        {currentResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="p-6 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-xl"
          >
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Dices className="h-6 w-6 text-primary" />
                <span className="text-lg font-medium text-muted-foreground">
                  {currentResult.notation}
                </span>
              </div>
              
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="text-6xl font-bold text-primary"
              >
                {currentResult.total}
              </motion.div>
              
              <div className="text-sm text-muted-foreground font-mono">
                {currentResult.output}
              </div>
              
              <div className="flex justify-center gap-2">
                <motion.button
                  onClick={() => rollDice(currentResult.notation)}
                  className="flex items-center gap-1 px-3 py-1 bg-primary/10 hover:bg-primary/20 rounded-lg text-sm transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <RotateCcw className="h-4 w-4" />
                  Relancer
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Historique */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <History className="h-5 w-5" />
            Historique ({rollHistory.length})
          </h3>
          <div className="flex gap-2">
            <motion.button
              onClick={() => setShowHistory(!showHistory)}
              className="px-3 py-1 text-sm bg-card border border-border rounded-lg hover:bg-accent transition-colors"
              whileHover={{ scale: 1.02 }}
            >
              {showHistory ? "Masquer" : "Afficher"}
            </motion.button>
            {rollHistory.length > 0 && (
              <motion.button
                onClick={clearHistory}
                className="px-3 py-1 text-sm bg-destructive/10 text-destructive border border-destructive/20 rounded-lg hover:bg-destructive/20 transition-colors flex items-center gap-1"
                whileHover={{ scale: 1.02 }}
              >
                <Trash2 className="h-3 w-3" />
                Effacer
              </motion.button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 max-h-64 overflow-y-auto"
            >
              {rollHistory.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                                     Aucun lancer dans l&apos;historique
                </div>
              ) : (
                rollHistory.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-3 bg-card border border-border rounded-lg hover:bg-accent transition-colors group"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm bg-primary/10 px-2 py-1 rounded">
                          {item.notation}
                        </span>
                        <span className="font-bold text-lg">
                          {item.total}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {item.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground font-mono mt-1">
                        {item.output}
                      </div>
                    </div>
                    <motion.button
                      onClick={() => rerollFromHistory(item)}
                      className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 bg-primary/10 hover:bg-primary/20 rounded text-xs transition-all"
                      whileHover={{ scale: 1.05 }}
                    >
                      <RotateCcw className="h-3 w-3" />
                      Relancer
                    </motion.button>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Gestion des Alias */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Alias ({aliases.length})
          </h3>
          <motion.button
            onClick={() => setShowAliases(!showAliases)}
            className="px-3 py-1 text-sm bg-card border border-border rounded-lg hover:bg-accent transition-colors"
            whileHover={{ scale: 1.02 }}
          >
            {showAliases ? "Masquer" : "Afficher"}
          </motion.button>
        </div>

        <AnimatePresence>
          {showAliases && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              {/* Formulaire d'ajout/édition d'alias */}
              <div className="p-4 bg-card border border-border rounded-lg space-y-3">
                <h4 className="font-medium">
                  {editingAlias ? `Modifier l'alias ${editingAlias}` : "Ajouter un nouvel alias"}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={newAliasName}
                    onChange={(e) => setNewAliasName(e.target.value.toUpperCase())}
                    placeholder="Nom (ex: CON, FOR, DEX)"
                    className="px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={isRolling}
                  />
                  <input
                    type="number"
                    value={newAliasValue}
                    onChange={(e) => setNewAliasValue(e.target.value)}
                    placeholder="Valeur (ex: 3, -1, 5)"
                    className="px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={isRolling}
                  />
                  <input
                    type="text"
                    value={newAliasDescription}
                    onChange={(e) => setNewAliasDescription(e.target.value)}
                    placeholder="Description (optionnel)"
                    className="px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={isRolling}
                  />
                </div>
                <div className="flex gap-2">
                  <motion.button
                    onClick={addAlias}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isRolling}
                  >
                    <Plus className="h-4 w-4" />
                    {editingAlias ? "Modifier" : "Ajouter"}
                  </motion.button>
                  {editingAlias && (
                    <motion.button
                      onClick={cancelEditing}
                      className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Annuler
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Liste des alias existants */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {aliases.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    Aucun alias défini. Ajoutez des alias comme CON, FOR, DEX...
                  </div>
                ) : (
                  aliases.map((alias, index) => (
                    <motion.div
                      key={alias.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 bg-card border border-border rounded-lg hover:bg-accent transition-colors group"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm bg-primary/10 px-2 py-1 rounded font-bold">
                            {alias.name}
                          </span>
                          <span className="font-bold text-lg">
                            {alias.value >= 0 ? '+' : ''}{alias.value}
                          </span>
                          {alias.description && (
                            <span className="text-xs text-muted-foreground">
                              {alias.description}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <motion.button
                          onClick={() => startEditingAlias(alias)}
                          className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 bg-primary/10 hover:bg-primary/20 rounded text-xs transition-all"
                          whileHover={{ scale: 1.05 }}
                        >
                          <Edit className="h-3 w-3" />
                          Modifier
                        </motion.button>
                        <motion.button
                          onClick={() => deleteAlias(alias.name)}
                          className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 bg-destructive/10 hover:bg-destructive/20 rounded text-xs transition-all text-destructive"
                          whileHover={{ scale: 1.05 }}
                        >
                          <Trash2 className="h-3 w-3" />
                          Supprimer
                        </motion.button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Exemples d'utilisation */}
              {aliases.length > 0 && (
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="text-sm font-medium mb-2">Exemples d&apos;utilisation :</p>
                  <div className="flex flex-wrap gap-2">
                    {aliases.slice(0, 3).map(alias => (
                      <span key={alias.name} className="text-xs bg-primary/10 px-2 py-1 rounded font-mono">
                        1d20+{alias.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 