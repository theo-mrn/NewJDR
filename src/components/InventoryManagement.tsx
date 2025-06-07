'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Search, 
  Plus, 
  Sword, 
  Shield, 
  Beaker, 
  Coins, 
  Apple, 
  Package,
  Edit2,
  Trash2,
  Star,
  StarOff,
  Zap,
  DicesIcon,
  Eye,
  EyeOff
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, collection, onSnapshot, updateDoc, setDoc, deleteDoc, addDoc, getDoc } from 'firebase/firestore';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  description?: string;
  damage?: string;
  equipped?: boolean;
  favorite?: boolean;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

interface ItemBonus {
  [key: string]: number;
}

interface InventoryManagementProps {
  playerName: string;
  roomId: string;
}

interface PredefinedItem {
  name: string;
  description: string;
  damage?: string;
  defense?: string;
  effect?: string;
  value?: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  category?: string;
}

interface ItemsData {
  weapons: {
    melee: PredefinedItem[];
    ranged: PredefinedItem[];
  };
  armor: PredefinedItem[];
  consumables: PredefinedItem[];
  currency: PredefinedItem[];
  food: PredefinedItem[];
  misc: PredefinedItem[];
}

const CATEGORIES = {
  'weapons': { label: 'Armes', icon: Sword, color: 'text-red-400' },
  'armor': { label: 'Armures', icon: Shield, color: 'text-blue-400' },
  'consumables': { label: 'Consommables', icon: Beaker, color: 'text-green-400' },
  'currency': { label: 'Monnaies', icon: Coins, color: 'text-yellow-400' },
  'food': { label: 'Nourriture', icon: Apple, color: 'text-emerald-400' },
  'misc': { label: 'Divers', icon: Package, color: 'text-purple-400' }
};

const RARITY_STYLES = {
  common: 'border-gray-500/30 bg-gray-500/10',
  uncommon: 'border-green-500/30 bg-green-500/10',
  rare: 'border-blue-500/30 bg-blue-500/10',
  epic: 'border-purple-500/30 bg-purple-500/10',
  legendary: 'border-orange-500/30 bg-orange-500/10'
};

export default function InventoryManagement({ playerName, roomId }: InventoryManagementProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [itemBonuses, setItemBonuses] = useState<Record<string, ItemBonus>>({});
  const [activeBonusStates, setActiveBonusStates] = useState<Record<string, boolean>>({});
  const [itemsWithBonuses, setItemsWithBonuses] = useState<Set<string>>(new Set());
  const [predefinedItems, setPredefinedItems] = useState<Record<string, PredefinedItem[]>>({});
  
  // Nouveau state pour la recherche dans le dialog
  const [dialogSearchTerm, setDialogSearchTerm] = useState('');
  const [dialogSelectedCategory, setDialogSelectedCategory] = useState('all');
  
  // Dialogs
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [bonusDialogOpen, setBonusDialogOpen] = useState(false);
  const [quantityDialogOpen, setQuantityDialogOpen] = useState(false);
  const [selectedPredefinedItem, setSelectedPredefinedItem] = useState<PredefinedItem | null>(null);
  const [itemQuantity, setItemQuantity] = useState(1);
  
  // Forms
  const [newItem, setNewItem] = useState({ name: '', category: '', quantity: 1, description: '', damage: '' });
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [bonusForm, setBonusForm] = useState({ stat: '', value: '' });
  const [currentBonuses, setCurrentBonuses] = useState<ItemBonus>({});

  const inventoryRef = collection(db, `Inventaire/${roomId}/${playerName}`);

  // Charger les objets prédéfinis depuis Items.json avec la nouvelle structure
  useEffect(() => {
    const loadPredefinedItems = async () => {
      try {
        const response = await fetch('/tabs/Items.json');
        const data: ItemsData = await response.json();
        
        const categorizedItems: Record<string, PredefinedItem[]> = {
          weapons: [],
          armor: [],
          consumables: [],
          currency: [],
          food: [],
          misc: []
        };

        // Traiter les nouvelles données structurées
        if (data.weapons) {
          // Combiner armes de mêlée et à distance
          categorizedItems.weapons = [
            ...data.weapons.melee.map(item => ({ ...item, category: 'weapons' })),
            ...data.weapons.ranged.map(item => ({ ...item, category: 'weapons' }))
          ];
        }

        if (data.armor) {
          categorizedItems.armor = data.armor.map(item => ({ ...item, category: 'armor' }));
        }

        if (data.consumables) {
          categorizedItems.consumables = data.consumables.map(item => ({ ...item, category: 'consumables' }));
        }

        if (data.currency) {
          categorizedItems.currency = data.currency.map(item => ({ ...item, category: 'currency' }));
        }

        if (data.food) {
          categorizedItems.food = data.food.map(item => ({ ...item, category: 'food' }));
        }

        if (data.misc) {
          categorizedItems.misc = data.misc.map(item => ({ ...item, category: 'misc' }));
        }

        setPredefinedItems(categorizedItems);
      } catch (error) {
        console.error('Erreur lors du chargement des objets prédéfinis:', error);
        // Fallback vers des objets par défaut en cas d'erreur
        setPredefinedItems({
          weapons: [
            { name: 'Épée longue', description: 'Une épée polyvalente', damage: '1d8+2', rarity: 'common', category: 'weapons' }
          ],
          armor: [
            { name: 'Armure de cuir', description: 'Armure légère', defense: '+3', rarity: 'common', category: 'armor' }
          ],
          consumables: [
            { name: 'Potion de soin', description: 'Restaure des PV', effect: 'Soigne 1d8 PV', rarity: 'common', category: 'consumables' }
          ],
          currency: [
            { name: 'Pièces d&apos;or', description: 'Monnaie précieuse', value: '1 po', rarity: 'common', category: 'currency' }
          ],
          food: [],
          misc: []
        });
      }
    };

    loadPredefinedItems();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(inventoryRef, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        name: doc.data().message || doc.data().name || 'Objet sans nom'
      } as InventoryItem));
      setInventory(items);
    });
    return () => unsubscribe();
  }, [playerName, roomId]);

  // Charger tous les bonus
  useEffect(() => {
    const loadAllBonuses = async () => {
      const bonusesData: Record<string, ItemBonus> = {};
      const activeStates: Record<string, boolean> = {};
      const itemsWithBonusesSet = new Set<string>();
      
      for (const item of inventory) {
        const bonusRef = doc(db, `Bonus/${roomId}/${playerName}/${item.id}`);
        try {
          const bonusDoc = await getDoc(bonusRef);
          if (bonusDoc.exists()) {
            const data = bonusDoc.data();
            activeStates[item.id] = data.active || false;
            
            // Vérifier si l'objet a des bonus définis (même inactifs)
            const hasBonuses = ['FOR', 'DEX', 'CON', 'INT', 'SAG', 'CHA', 'PV', 'Defense', 'Contact', 'Distance', 'Magie'].some(stat => 
              data[stat] && data[stat] !== 0
            );
            
            if (hasBonuses) {
              itemsWithBonusesSet.add(item.id);
              
              if (data.active) {
                const activeBonuses: ItemBonus = {};
                ['FOR', 'DEX', 'CON', 'INT', 'SAG', 'CHA', 'PV', 'Defense', 'Contact', 'Distance', 'Magie'].forEach(stat => {
                  if (data[stat] && data[stat] !== 0) {
                    activeBonuses[stat] = data[stat];
                  }
                });
                if (Object.keys(activeBonuses).length > 0) {
                  bonusesData[item.id] = activeBonuses;
                }
              }
            }
          } else {
            activeStates[item.id] = false;
          }
        } catch (error) {
          console.error('Erreur lors du chargement des bonus:', error);
          activeStates[item.id] = false;
        }
      }
      
      setItemBonuses(bonusesData);
      setActiveBonusStates(activeStates);
      setItemsWithBonuses(itemsWithBonusesSet);
    };

    if (inventory.length > 0) {
      loadAllBonuses();
    }
  }, [inventory, roomId, playerName]);

  // Charger les bonus de l'objet en cours d'édition
  useEffect(() => {
    if (editingItem) {
      const loadCurrentBonuses = async () => {
        const bonusRef = doc(db, `Bonus/${roomId}/${playerName}/${editingItem.id}`);
        try {
          const bonusDoc = await getDoc(bonusRef);
          if (bonusDoc.exists()) {
            const data = bonusDoc.data();
            setCurrentBonuses(data);
          } else {
            setCurrentBonuses({});
          }
        } catch (error) {
          console.error('Erreur lors du chargement des bonus actuels:', error);
          setCurrentBonuses({});
        }
      };
      loadCurrentBonuses();
    }
  }, [editingItem, roomId, playerName]);

  // Fonction pour ouvrir le dialog de quantité
  const openQuantityDialog = (item: PredefinedItem) => {
    setSelectedPredefinedItem(item);
    setItemQuantity(1);
    setQuantityDialogOpen(true);
  };

  // Actions rapides
  const addQuickItem = async (quantity: number) => {
    if (!selectedPredefinedItem) return;
    
    const item = selectedPredefinedItem;
    const existingItem = inventory.find(i => i.name === item.name && i.category === item.category);
    
    if (existingItem) {
      await updateDoc(doc(inventoryRef, existingItem.id), { 
        quantity: existingItem.quantity + quantity 
      });
    } else {
      // Créer l'objet en filtrant les valeurs undefined
      const itemData: {
        message: string;
        name: string;
        category: string;
        quantity: number;
        equipped: boolean;
        favorite: boolean;
        rarity: string;
        damage?: string;
        description?: string;
      } = {
        message: item.name,
        name: item.name,
        category: item.category || 'misc',
        quantity: quantity,
        equipped: false,
        favorite: false,
        rarity: item.rarity || 'common'
      };

      // Ajouter les champs optionnels seulement s'ils sont définis
      if (item.damage) itemData.damage = item.damage;
      if (item.description) itemData.description = item.description;

      await addDoc(inventoryRef, itemData);
    }
    
    setQuantityDialogOpen(false);
    setSelectedPredefinedItem(null);
    setAddDialogOpen(false);
  };

  // Fonction pour filtrer les objets prédéfinis
  const getFilteredPredefinedItems = () => {
    const filteredItems: Record<string, PredefinedItem[]> = {};
    
    Object.entries(predefinedItems).forEach(([categoryKey, items]) => {
      // Filtrer par catégorie
      if (dialogSelectedCategory === 'all' || dialogSelectedCategory === categoryKey) {
        // Filtrer par recherche
        const searchFiltered = items.filter(item => 
          item.name.toLowerCase().includes(dialogSearchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(dialogSearchTerm.toLowerCase())
        );
        
        if (searchFiltered.length > 0) {
          filteredItems[categoryKey] = searchFiltered;
        }
      }
    });
    
    return filteredItems;
  };

  const createCustomItem = async () => {
    if (!newItem.name || !newItem.category) return;
    
    // Créer l'objet en filtrant les valeurs vides
    const itemData: {
      message: string;
      name: string;
      category: string;
      quantity: number;
      equipped: boolean;
      favorite: boolean;
      rarity: string;
      damage?: string;
      description?: string;
    } = {
      message: newItem.name,
      name: newItem.name,
      category: newItem.category,
      quantity: newItem.quantity,
      equipped: false,
      favorite: false,
      rarity: 'common'
    };

    // Ajouter les champs optionnels seulement s'ils ne sont pas vides
    if (newItem.damage && newItem.damage.trim()) itemData.damage = newItem.damage.trim();
    if (newItem.description && newItem.description.trim()) itemData.description = newItem.description.trim();

    await addDoc(inventoryRef, itemData);
    
    setNewItem({ name: '', category: '', quantity: 1, description: '', damage: '' });
    setAddDialogOpen(false);
  };

  const toggleFavorite = async (item: InventoryItem) => {
    await updateDoc(doc(inventoryRef, item.id), { 
      favorite: !item.favorite 
    });
  };

  const toggleEquipped = async (item: InventoryItem) => {
    await updateDoc(doc(inventoryRef, item.id), { 
      equipped: !item.equipped 
    });
  };

  const deleteItem = async (itemId: string) => {
    await deleteDoc(doc(inventoryRef, itemId));
    // Supprimer aussi les bonus associés
    try {
      await deleteDoc(doc(db, `Bonus/${roomId}/${playerName}/${itemId}`));
    } catch (error) {
      console.error('Erreur lors de la suppression des bonus:', error);
    }
  };

  const openEditDialog = (item: InventoryItem) => {
    setEditingItem(item);
    setEditDialogOpen(true);
  };

  const saveEditedItem = async () => {
    if (!editingItem) return;
    
    await updateDoc(doc(inventoryRef, editingItem.id), {
      message: editingItem.name,
      name: editingItem.name,
      quantity: editingItem.quantity,
      description: editingItem.description,
      damage: editingItem.damage
    });
    
    setEditDialogOpen(false);
    setEditingItem(null);
  };

  const addBonus = async () => {
    if (!editingItem || !bonusForm.stat || !bonusForm.value) return;
    
    const bonusRef = doc(db, `Bonus/${roomId}/${playerName}/${editingItem.id}`);
    await setDoc(bonusRef, {
      [bonusForm.stat]: parseInt(bonusForm.value),
      active: true,
      category: 'Inventaire'
    }, { merge: true });
    
    // Recharger les bonus actuels
    const updatedDoc = await getDoc(bonusRef);
    if (updatedDoc.exists()) {
      setCurrentBonuses(updatedDoc.data());
    }
    
    // Ajouter l'objet au set des objets avec bonus
    setItemsWithBonuses(prev => new Set(prev).add(editingItem.id));
    
    // Activer immédiatement les bonus
    setActiveBonusStates(prev => ({
      ...prev,
      [editingItem.id]: true
    }));
    
    setBonusForm({ stat: '', value: '' });
  };

  const removeBonus = async (stat: string) => {
    if (!editingItem) return;
    
    const bonusRef = doc(db, `Bonus/${roomId}/${playerName}/${editingItem.id}`);
    await updateDoc(bonusRef, {
      [stat]: 0
    });
    
    // Recharger les bonus actuels
    const updatedDoc = await getDoc(bonusRef);
    if (updatedDoc.exists()) {
      setCurrentBonuses(updatedDoc.data());
    }
  };

  const toggleBonusActive = async (itemId: string, currentActiveState: boolean) => {
    const bonusRef = doc(db, `Bonus/${roomId}/${playerName}/${itemId}`);
    const newActiveState = !currentActiveState;
    
    try {
      await updateDoc(bonusRef, {
        active: newActiveState
      });
      
      // Mettre à jour les états locaux immédiatement
      setActiveBonusStates(prev => ({
        ...prev,
        [itemId]: newActiveState
      }));
      
      // Mettre à jour les bonus actifs
      if (newActiveState) {
        // Charger les bonus de cet objet
        const bonusDoc = await getDoc(bonusRef);
        if (bonusDoc.exists()) {
          const data = bonusDoc.data();
          const activeBonuses: ItemBonus = {};
          ['FOR', 'DEX', 'CON', 'INT', 'SAG', 'CHA', 'PV', 'Defense', 'Contact', 'Distance', 'Magie'].forEach(stat => {
            if (data[stat] && data[stat] !== 0) {
              activeBonuses[stat] = data[stat];
            }
          });
          if (Object.keys(activeBonuses).length > 0) {
            setItemBonuses(prev => ({
              ...prev,
              [itemId]: activeBonuses
            }));
          }
        }
      } else {
        // Retirer les bonus de cet objet
        setItemBonuses(prev => {
          const newBonuses = { ...prev };
          delete newBonuses[itemId];
          return newBonuses;
        });
      }
    } catch (error) {
      console.error('Erreur lors du toggle des bonus:', error);
    }
  };

  // Filtrage
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesFavorites = !showFavoritesOnly || item.favorite;
    return matchesSearch && matchesCategory && matchesFavorites;
  });

  return (
    <TooltipProvider>
      <div className="w-full bg-[#242424] rounded-lg border border-[#3a3a3a] text-[#d4d4d4]">
        <div className="p-6 border-b border-[#3a3a3a]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[#c0a0a0] flex items-center gap-2">
              <Package className="w-5 h-5" />
              Inventaire de {playerName}
            </h2>
            
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                    className={`${showFavoritesOnly ? 'bg-yellow-500/20 border-yellow-500/50' : 'bg-[#3a3a3a] border-[#4a4a4a]'} text-[#c0a0a0]`}
                  >
                    {showFavoritesOnly ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-[#2a2a2a] text-[#c0a0a0] border-[#3a3a3a]">
                  {showFavoritesOnly ? 'Afficher tous les objets' : 'Afficher seulement les favoris'}
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    className="bg-[#3a3a3a] hover:bg-[#4a4a4a] text-[#c0a0a0]"
                    onClick={() => setAddDialogOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-[#2a2a2a] text-[#c0a0a0] border-[#3a3a3a]">
                  Ajouter un nouvel objet
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Filtres */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#a0a0a0]" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-[#2a2a2a] border-[#3a3a3a] text-[#d4d4d4]"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48 bg-[#2a2a2a] border-[#3a3a3a] text-[#d4d4d4]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#242424] border-[#3a3a3a]">
                <SelectItem value="all">Toutes catégories</SelectItem>
                {Object.entries(CATEGORIES).map(([key, cat]) => (
                  <SelectItem key={key} value={key}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Liste des objets */}
        <div className="p-6">
          {filteredInventory.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto text-[#a0a0a0] mb-4" />
              <h3 className="text-lg font-medium text-[#c0a0a0] mb-2">Aucun objet trouvé</h3>
              <p className="text-[#a0a0a0]">
                {searchTerm || selectedCategory !== 'all' || showFavoritesOnly
                  ? 'Modifiez vos filtres ou ajoutez des objets'
                  : 'Commencez par ajouter des objets à votre inventaire'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredInventory.map(item => {
                const category = CATEGORIES[item.category as keyof typeof CATEGORIES];
                const Icon = category?.icon || Package;
                const itemBonusesData = itemBonuses[item.id] || {};
                
                return (
                  <Card 
                    key={item.id}
                    className={`bg-[#2a2a2a] border-[#3a3a3a] hover:border-[#4a4a4a] transition-all ${
                      item.equipped ? 'ring-2 ring-blue-500/50' : ''
                    } ${
                      item.favorite ? 'ring-1 ring-yellow-500/50' : ''
                    } ${
                      activeBonusStates[item.id] && itemsWithBonuses.has(item.id) ? 'ring-1 ring-green-500/50' : ''
                    } ${
                      item.rarity && item.rarity !== 'common' ? RARITY_STYLES[item.rarity] : ''
                    }`}
                  >
                    <CardContent className="p-4">
                      {/* En-tête de l'objet */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2 flex-1">
                          <Icon className={`w-5 h-5 ${category?.color || 'text-[#a0a0a0]'}`} />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-[#d4d4d4] truncate">{item.name}</h4>
                            <p className="text-sm text-[#a0a0a0]">x{item.quantity}</p>
                          </div>
                        </div>
                        
                        {/* Actions rapides */}
                        <div className="flex gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleFavorite(item)}
                                className="h-8 w-8 p-0 hover:bg-[#3a3a3a]"
                              >
                                {item.favorite ? 
                                  <Star className="w-4 h-4 text-yellow-500 fill-current" /> : 
                                  <StarOff className="w-4 h-4 text-[#a0a0a0]" />
                                }
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-[#2a2a2a] text-[#c0a0a0] border-[#3a3a3a]">
                              {item.favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                            </TooltipContent>
                          </Tooltip>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleEquipped(item)}
                                className="h-8 w-8 p-0 hover:bg-[#3a3a3a]"
                              >
                                {item.equipped ? 
                                  <Eye className="w-4 h-4 text-blue-500" /> : 
                                  <EyeOff className="w-4 h-4 text-[#a0a0a0]" />
                                }
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-[#2a2a2a] text-[#c0a0a0] border-[#3a3a3a]">
                              {item.equipped ? 'Déséquiper' : 'Équiper'}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>

                      {/* Infos de l'objet */}
                      <div className="space-y-2 mb-4">
                        {item.damage && (
                          <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">
                            <DicesIcon className="w-3 h-3 mr-1" />
                            {item.damage}
                          </Badge>
                        )}
                        
                        {/* Affichage des bonus */}
                        {Object.keys(itemBonusesData).length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(itemBonusesData).map(([stat, value]) => (
                              <Badge 
                                key={stat} 
                                variant="outline" 
                                className={`text-xs ${
                                  activeBonusStates[item.id] 
                                    ? 'bg-green-500/20 text-green-300 border-green-500/50' 
                                    : 'bg-gray-500/10 text-gray-400 border-gray-500/30'
                                }`}
                              >
                                {stat} +{value}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        {item.description && (
                          <p className="text-sm text-[#a0a0a0] line-clamp-2">{item.description}</p>
                        )}
                      </div>

                      {/* Actions principales */}
                      <div className="flex gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(item)}
                              className="flex-1 bg-[#3a3a3a] hover:bg-[#4a4a4a] text-[#c0a0a0] border-[#4a4a4a]"
                            >
                              <Edit2 className="w-3 h-3 mr-1" />
                              Modifier
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-[#2a2a2a] text-[#c0a0a0] border-[#3a3a3a]">
                            Modifier cet objet
                          </TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingItem(item);
                                setBonusDialogOpen(true);
                              }}
                              className="bg-[#3a3a3a] hover:bg-[#4a4a4a] text-[#c0a0a0] border-[#4a4a4a]"
                            >
                              <Zap className="w-3 h-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-[#2a2a2a] text-[#c0a0a0] border-[#3a3a3a]">
                            Gérer les bonus
                          </TooltipContent>
                        </Tooltip>

                        {/* Bouton de toggle pour les bonus actifs */}
                        {itemsWithBonuses.has(item.id) && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleBonusActive(item.id, activeBonusStates[item.id] || false)}
                                className={`${
                                  activeBonusStates[item.id] 
                                    ? 'bg-green-500/20 hover:bg-green-500/30 text-green-300 border-green-500/50' 
                                    : 'bg-gray-500/10 hover:bg-gray-500/20 text-gray-400 border-gray-500/30'
                                }`}
                              >
                                <Zap className={`w-3 h-3 ${activeBonusStates[item.id] ? 'fill-current' : ''}`} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-[#2a2a2a] text-[#c0a0a0] border-[#3a3a3a]">
                              {activeBonusStates[item.id] ? 'Désactiver les bonus' : 'Activer les bonus'}
                            </TooltipContent>
                          </Tooltip>
                        )}
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteItem(item.id)}
                              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-[#2a2a2a] text-[#c0a0a0] border-[#3a3a3a]">
                            Supprimer cet objet
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Dialog d'ajout avec recherche et catégories améliorées */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="bg-[#242424] border-[#3a3a3a] text-[#d4d4d4] !max-w-[95vw] !w-[1400px] !max-h-[90vh] !min-h-[600px] overflow-hidden flex flex-col" style={{ width: '1400px', maxWidth: '95vw', height: '90vh', maxHeight: '90vh' }}>
            <DialogHeader className="flex-shrink-0 pb-4 border-b border-[#3a3a3a]">
              <DialogTitle className="text-xl text-[#c0a0a0] flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Ajouter un objet
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              {/* Barre de recherche et filtres */}
              <div className="flex-shrink-0 py-4 space-y-4">
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#a0a0a0]" />
                    <Input
                      placeholder="Rechercher un objet..."
                      value={dialogSearchTerm}
                      onChange={(e) => setDialogSearchTerm(e.target.value)}
                      className="pl-10 bg-[#2a2a2a] border-[#3a3a3a] text-[#d4d4d4] h-10"
                    />
                  </div>
                  
                  <Select value={dialogSelectedCategory} onValueChange={setDialogSelectedCategory}>
                    <SelectTrigger className="w-56 bg-[#2a2a2a] border-[#3a3a3a] text-[#d4d4d4] h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#242424] border-[#3a3a3a]">
                      <SelectItem value="all">Toutes catégories</SelectItem>
                      {Object.entries(CATEGORIES).map(([key, cat]) => (
                        <SelectItem key={key} value={key}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-8 flex-1 min-h-0 overflow-hidden">
                {/* Objets prédéfinis */}
                <div className="flex-[3] overflow-hidden flex flex-col">
                  <h3 className="font-semibold mb-4 text-[#c0a0a0] flex items-center gap-2 text-lg flex-shrink-0">
                    <Package className="w-5 h-5" />
                    Objets prédéfinis
                  </h3>
                  
                  <div className="overflow-y-auto flex-1 pr-3">
                    <div className="space-y-6">
                      {Object.entries(getFilteredPredefinedItems()).map(([categoryKey, items]) => {
                        const category = CATEGORIES[categoryKey as keyof typeof CATEGORIES];
                        const Icon = category?.icon || Package;
                        
                        return (
                          <div key={categoryKey} className="bg-[#2a2a2a] rounded-xl border border-[#3a3a3a] p-5">
                            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#3a3a3a]">
                              <Icon className={`w-6 h-6 ${category?.color || 'text-[#a0a0a0]'}`} />
                              <h4 className="font-semibold text-[#d4d4d4] text-lg">{category?.label || categoryKey}</h4>
                              <Badge variant="outline" className="ml-auto">
                                {items.length} objet{items.length > 1 ? 's' : ''}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                              {items.map(item => (
                                <div
                                  key={item.name}
                                  className="bg-[#1a1a1a] rounded-lg p-4 hover:bg-[#333] transition-all duration-200 cursor-pointer border border-[#3a3a3a] hover:border-[#4a4a4a] hover:shadow-lg"
                                  onClick={() => openQuantityDialog(item)}
                                >
                                  <div className="flex items-start justify-between mb-3">
                                    <h5 className="font-semibold text-[#d4d4d4] text-sm flex-1 pr-2">{item.name}</h5>
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs flex-shrink-0 ${
                                        item.rarity === 'common' ? 'border-gray-500/50 text-gray-400' :
                                        item.rarity === 'uncommon' ? 'border-green-500/50 text-green-400' :
                                        item.rarity === 'rare' ? 'border-blue-500/50 text-blue-400' :
                                        item.rarity === 'epic' ? 'border-purple-500/50 text-purple-400' :
                                        'border-orange-500/50 text-orange-400'
                                      }`}
                                    >
                                      {item.rarity}
                                    </Badge>
                                  </div>
                                  
                                  <p className="text-xs text-[#a0a0a0] mb-3 line-clamp-2 leading-relaxed">{item.description}</p>
                                  
                                  <div className="flex flex-wrap gap-1">
                                    {item.damage && (
                                      <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30 text-xs">
                                        <DicesIcon className="w-3 h-3 mr-1" />
                                        {item.damage}
                                      </Badge>
                                    )}
                                    {item.defense && (
                                      <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs">
                                        <Shield className="w-3 h-3 mr-1" />
                                        {item.defense}
                                      </Badge>
                                    )}
                                    {item.effect && (
                                      <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30 text-xs">
                                        <Zap className="w-3 h-3 mr-1" />
                                        {item.effect}
                                      </Badge>
                                    )}
                                    {item.value && (
                                      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30 text-xs">
                                        <Coins className="w-3 h-3 mr-1" />
                                        {item.value}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      
                      {Object.keys(getFilteredPredefinedItems()).length === 0 && (
                        <div className="text-center py-16">
                          <Search className="w-16 h-16 mx-auto text-[#a0a0a0] mb-4" />
                          <h4 className="text-[#c0a0a0] font-semibold mb-3 text-lg">Aucun objet trouvé</h4>
                          <p className="text-[#a0a0a0]">
                            Modifiez votre recherche ou créez un objet personnalisé
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Séparateur */}
                <div className="w-px bg-[#3a3a3a] flex-shrink-0"></div>
                
                {/* Objet personnalisé */}
                <div className="flex-1 min-w-0 flex flex-col">
                  <h3 className="font-semibold mb-4 text-[#c0a0a0] flex items-center gap-2 text-lg flex-shrink-0">
                    <Plus className="w-5 h-5" />
                    Créer un objet personnalisé
                  </h3>
                  
                  <div className="space-y-4 flex-1">
                    <div className="bg-[#2a2a2a] rounded-xl border border-[#3a3a3a] p-5">
                      <div className="space-y-4">
                        <div>
                                                     <Label className="text-[#a0a0a0] text-sm font-medium mb-2 block">Nom de l&apos;objet</Label>
                          <Input
                            value={newItem.name}
                            onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                            className="bg-[#1a1a1a] border-[#3a3a3a] text-[#d4d4d4] h-10"
                            placeholder="Ex: Épée enchantée"
                          />
                        </div>
                        
                        <div>
                          <Label className="text-[#a0a0a0] text-sm font-medium mb-2 block">Catégorie</Label>
                          <Select value={newItem.category} onValueChange={(value) => setNewItem(prev => ({ ...prev, category: value }))}>
                            <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-[#d4d4d4] h-10">
                              <SelectValue placeholder="Choisir une catégorie..." />
                            </SelectTrigger>
                            <SelectContent className="bg-[#242424] border-[#3a3a3a]">
                              {Object.entries(CATEGORIES).map(([key, cat]) => {
                                const Icon = cat.icon;
                                return (
                                  <SelectItem key={key} value={key}>
                                    <div className="flex items-center gap-2">
                                      <Icon className={`w-4 h-4 ${cat.color}`} />
                                      {cat.label}
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-[#a0a0a0] text-sm font-medium mb-2 block">Quantité</Label>
                            <Input
                              type="number"
                              min="1"
                              value={newItem.quantity}
                              onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                              className="bg-[#1a1a1a] border-[#3a3a3a] text-[#d4d4d4] h-10"
                            />
                          </div>
                          
                          <div>
                            <Label className="text-[#a0a0a0] text-sm font-medium mb-2 block">Dégâts</Label>
                            <Input
                              value={newItem.damage}
                              onChange={(e) => setNewItem(prev => ({ ...prev, damage: e.target.value }))}
                              className="bg-[#1a1a1a] border-[#3a3a3a] text-[#d4d4d4] h-10"
                              placeholder="1d8+2"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-[#a0a0a0] text-sm font-medium mb-2 block">Description</Label>
                          <Textarea
                            value={newItem.description}
                            onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                            className="bg-[#1a1a1a] border-[#3a3a3a] text-[#d4d4d4] min-h-[100px] resize-none"
                            placeholder="Décrivez les propriétés et l'apparence de l'objet..."
                          />
                        </div>
                        
                        <Button
                          onClick={createCustomItem}
                          disabled={!newItem.name || !newItem.category}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed h-11 font-medium"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                                                     Créer l&apos;objet personnalisé
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog d'édition */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="bg-[#242424] border-[#3a3a3a] text-[#d4d4d4]">
            <DialogHeader>
              <DialogTitle className="text-[#c0a0a0]">Modifier {editingItem?.name}</DialogTitle>
            </DialogHeader>
            
            {editingItem && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#a0a0a0]">Nom</Label>
                  <Input
                    value={editingItem.name}
                    onChange={(e) => setEditingItem(prev => prev ? { ...prev, name: e.target.value } : null)}
                    className="bg-[#2a2a2a] border-[#3a3a3a] text-[#d4d4d4]"
                  />
                </div>
                
                <div>
                  <Label className="text-[#a0a0a0]">Quantité</Label>
                  <Input
                    type="number"
                    value={editingItem.quantity}
                    onChange={(e) => setEditingItem(prev => prev ? { ...prev, quantity: parseInt(e.target.value) || 1 } : null)}
                    className="bg-[#2a2a2a] border-[#3a3a3a] text-[#d4d4d4]"
                  />
                </div>
                
                <div>
                  <Label className="text-[#a0a0a0]">Dégâts</Label>
                  <Input
                    value={editingItem.damage || ''}
                    onChange={(e) => setEditingItem(prev => prev ? { ...prev, damage: e.target.value } : null)}
                    className="bg-[#2a2a2a] border-[#3a3a3a] text-[#d4d4d4]"
                    placeholder="1d8+2"
                  />
                </div>
                
                <div className="col-span-2">
                  <Label className="text-[#a0a0a0]">Description</Label>
                  <Textarea
                    value={editingItem.description || ''}
                    onChange={(e) => setEditingItem(prev => prev ? { ...prev, description: e.target.value } : null)}
                    className="bg-[#2a2a2a] border-[#3a3a3a] text-[#d4d4d4]"
                    rows={3}
                  />
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                className="bg-[#3a3a3a] hover:bg-[#4a4a4a] text-[#c0a0a0] border-[#4a4a4a]"
              >
                Annuler
              </Button>
              <Button
                onClick={saveEditedItem}
                className="bg-[#3a3a3a] hover:bg-[#4a4a4a] text-[#c0a0a0]"
              >
                Sauvegarder
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog des bonus */}
        <Dialog open={bonusDialogOpen} onOpenChange={setBonusDialogOpen}>
          <DialogContent className="bg-[#242424] border-[#3a3a3a] text-[#d4d4d4] max-w-md">
            <DialogHeader>
              <DialogTitle className="text-[#c0a0a0]">Bonus de {editingItem?.name}</DialogTitle>
            </DialogHeader>
            
            {/* Bonus existants */}
            {Object.keys(currentBonuses).filter(key => key !== 'active' && key !== 'category' && currentBonuses[key] !== 0).length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-[#c0a0a0]">Bonus actuels :</h4>
                <div className="space-y-1">
                  {Object.entries(currentBonuses)
                    .filter(([key, value]) => key !== 'active' && key !== 'category' && value !== 0)
                    .map(([stat, value]) => (
                      <div key={stat} className="flex items-center justify-between bg-[#2a2a2a] p-2 rounded">
                        <span className="text-sm text-[#d4d4d4]">{stat}: +{value}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBonus(stat)}
                          className="h-6 w-6 p-0 hover:bg-red-500/20 text-red-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                </div>
              </div>
            )}
            
            {/* Ajouter nouveau bonus */}
            <div className="border-t border-[#3a3a3a] pt-4 space-y-3">
              <h4 className="text-sm font-medium text-[#c0a0a0]">Ajouter un bonus :</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[#a0a0a0] text-xs">Caractéristique</Label>
                  <Select value={bonusForm.stat} onValueChange={(value) => setBonusForm(prev => ({ ...prev, stat: value }))}>
                    <SelectTrigger className="bg-[#2a2a2a] border-[#3a3a3a] text-[#d4d4d4] h-8">
                      <SelectValue placeholder="Choisir..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#242424] border-[#3a3a3a]">
                      {['FOR', 'DEX', 'CON', 'INT', 'SAG', 'CHA', 'PV', 'Defense', 'Contact', 'Distance', 'Magie'].map(stat => (
                        <SelectItem key={stat} value={stat}>{stat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-[#a0a0a0] text-xs">Valeur</Label>
                  <Input
                    type="number"
                    value={bonusForm.value}
                    onChange={(e) => setBonusForm(prev => ({ ...prev, value: e.target.value }))}
                    className="bg-[#2a2a2a] border-[#3a3a3a] text-[#d4d4d4] h-8"
                    placeholder="+2"
                  />
                </div>
              </div>
              
              <Button
                onClick={addBonus}
                disabled={!bonusForm.stat || !bonusForm.value}
                className="w-full bg-[#3a3a3a] hover:bg-[#4a4a4a] text-[#c0a0a0] disabled:opacity-50"
              >
                <Zap className="w-4 h-4 mr-2" />
                Ajouter le bonus
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de quantité */}
        <Dialog open={quantityDialogOpen} onOpenChange={setQuantityDialogOpen}>
          <DialogContent className="bg-[#242424] border-[#3a3a3a] text-[#d4d4d4] max-w-md">
            <DialogHeader>
              <DialogTitle className="text-[#c0a0a0] flex items-center gap-2">
                <Package className="w-5 h-5" />
                Ajouter {selectedPredefinedItem?.name}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {selectedPredefinedItem && (
                <div className="bg-[#2a2a2a] rounded-lg p-4 border border-[#3a3a3a]">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-[#d4d4d4] mb-1">{selectedPredefinedItem.name}</h4>
                      <p className="text-sm text-[#a0a0a0] mb-2">{selectedPredefinedItem.description}</p>
                      
                      <div className="flex flex-wrap gap-1">
                        {selectedPredefinedItem.damage && (
                          <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30 text-xs">
                            <DicesIcon className="w-3 h-3 mr-1" />
                            {selectedPredefinedItem.damage}
                          </Badge>
                        )}
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            selectedPredefinedItem.rarity === 'common' ? 'border-gray-500/50 text-gray-400' :
                            selectedPredefinedItem.rarity === 'uncommon' ? 'border-green-500/50 text-green-400' :
                            selectedPredefinedItem.rarity === 'rare' ? 'border-blue-500/50 text-blue-400' :
                            selectedPredefinedItem.rarity === 'epic' ? 'border-purple-500/50 text-purple-400' :
                            'border-orange-500/50 text-orange-400'
                          }`}
                        >
                          {selectedPredefinedItem.rarity}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div>
                <Label className="text-[#a0a0a0] text-sm font-medium mb-2 block">Quantité à ajouter</Label>
                <Input
                  type="number"
                  min="1"
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                  className="bg-[#2a2a2a] border-[#3a3a3a] text-[#d4d4d4] h-10"
                  autoFocus
                />
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setQuantityDialogOpen(false)}
                  className="flex-1 bg-[#3a3a3a] hover:bg-[#4a4a4a] text-[#c0a0a0] border-[#4a4a4a]"
                >
                  Annuler
                </Button>
                <Button
                  onClick={() => addQuickItem(itemQuantity)}
                  disabled={itemQuantity < 1}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}