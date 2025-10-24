import { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowLeft, Search, Trash2, Pencil, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocation } from 'wouter';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { localFoodService, LocalFoodItem, FoodUnit } from '@/lib/local-food-service';
import { useToast } from '@/hooks/use-toast';

const ITEMS_PER_PAGE = 100;

export default function FoodDatabasePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [allFoods, setAllFoods] = useState<LocalFoodItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingFood, setEditingFood] = useState<LocalFoodItem | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Load all foods on mount
  useEffect(() => {
    let isMounted = true;
    
    const loadFoods = async () => {
      try {
        const foods = await localFoodService.getAllFoods();
        const customFoods = foods.filter(f => f.id.startsWith('custom-'));
        console.log('Food Database: Loaded', foods.length, 'total foods,', customFoods.length, 'custom foods');
        if (customFoods.length > 0) {
          console.log('Custom foods:', customFoods);
        }
        if (isMounted) {
          setAllFoods(foods);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading foods:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadFoods();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter foods based on search query and sort custom foods first
  const filteredFoods = useMemo(() => {
    let foods = allFoods;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      foods = allFoods.filter(food => {
        const name = food.name.toLowerCase();
        const brand = food.brand?.toLowerCase() || '';
        return name.includes(query) || brand.includes(query);
      });
    }
    
    // Sort: custom foods first, then alphabetically by name
    return foods.sort((a, b) => {
      const aIsCustom = a.id.startsWith('custom-');
      const bIsCustom = b.id.startsWith('custom-');
      
      if (aIsCustom && !bIsCustom) return -1;
      if (!aIsCustom && bIsCustom) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [allFoods, searchQuery]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredFoods.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedFoods = filteredFoods.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Scroll to top when page changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [currentPage]);

  // Handle delete
  const handleDelete = async (foodId: string, foodName: string) => {
    try {
      const result = await localFoodService.deleteFood(foodId);
      
      if (result.success) {
        setAllFoods(prev => prev.filter(f => f.id !== foodId));
        toast({
          title: "Deleted",
          description: `"${foodName}" permanently removed`
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete food",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting food:', error);
      toast({
        title: "Error",
        description: "Failed to delete food",
        variant: "destructive"
      });
    }
  };

  // Handle edit
  const handleEdit = (food: LocalFoodItem) => {
    setEditingFood({ ...food });
    setEditDialogOpen(true);
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!editingFood) return;

    try {
      const result = await localFoodService.updateFood(editingFood.id, {
        name: editingFood.name,
        brand: editingFood.brand,
        quantity: editingFood.quantity,
        unit: editingFood.unit,
        calories: editingFood.calories,
        carbs: editingFood.carbs,
        protein: editingFood.protein,
        fat: editingFood.fat,
        fiber: editingFood.fiber,
        sugar: editingFood.sugar,
        sodium: editingFood.sodium,
        saturatedFat: editingFood.saturatedFat,
        potassium: editingFood.potassium,
        cholesterol: editingFood.cholesterol,
        vitaminA: editingFood.vitaminA,
        vitaminC: editingFood.vitaminC,
        calcium: editingFood.calcium,
        iron: editingFood.iron
      });

      if (result.success && result.food) {
        setAllFoods(prev => prev.map(f => f.id === editingFood.id ? result.food! : f));
        setEditDialogOpen(false);
        setEditingFood(null);
        toast({
          title: "Updated",
          description: `"${result.food.name}" has been updated`
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update food",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating food:', error);
      toast({
        title: "Error",
        description: "Failed to update food",
        variant: "destructive"
      });
    }
  };

  const handleBack = () => {
    navigate('/food-tracker');
  };

  return (
    <div className="fitcircle-page">
      <div className="fitcircle-container">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleBack}
            className="text-slate-400 hover:text-white transition-colors"
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="fitcircle-page-title">Food Database</h1>
          <div className="w-5" /> {/* Spacer for alignment */}
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search foods..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-white placeholder-slate-400 rounded-xl"
              data-testid="input-search"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="mb-4 text-sm text-slate-400 text-center">
          {loading ? (
            'Loading...'
          ) : (
            <>
              {filteredFoods.length.toLocaleString()} foods total ({allFoods.filter(f => f.id.startsWith('custom-')).length} custom)
            </>
          )}
        </div>

        {/* Food List */}
        <div ref={scrollContainerRef} className="pb-24 overflow-y-auto max-h-[calc(100vh-300px)]">
          {loading ? (
            <div className="text-center text-slate-400 py-12">
              Loading food database...
            </div>
          ) : filteredFoods.length === 0 ? (
            <div className="text-center text-slate-400 py-12">
              {searchQuery ? 'No foods found matching your search' : 'No foods in database'}
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {paginatedFoods.map((food) => {
                const isCustom = food.id.startsWith('custom-');
                
                return (
                  <Card 
                    key={food.id}
                    className="p-4 bg-slate-800 border-slate-700 rounded-xl"
                    data-testid={`card-food-${food.id}`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      {/* Food Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-medium text-white" data-testid={`text-name-${food.id}`}>
                            {food.name}
                          </h3>
                          {isCustom && (
                            <span className="px-2 py-0.5 text-xs bg-green-600 text-white rounded-xl flex-shrink-0">
                              Custom
                            </span>
                          )}
                        </div>
                        {food.brand && (
                          <p className="text-sm text-slate-400 truncate mb-2" data-testid={`text-brand-${food.id}`}>
                            {food.brand}
                          </p>
                        )}
                        
                        {/* Macros */}
                        <div className="flex flex-wrap gap-2 text-xs">
                          <div className="px-2 py-1 bg-slate-700 rounded-xl" data-testid={`text-calories-${food.id}`}>
                            <span className="text-slate-400">Cal:</span> <span className="text-white font-medium">{food.calories}</span>
                          </div>
                          <div className="px-2 py-1 bg-slate-700 rounded-xl" data-testid={`text-carbs-${food.id}`}>
                            <span className="text-slate-400">C:</span> <span className="text-white font-medium">{food.carbs}g</span>
                          </div>
                          <div className="px-2 py-1 bg-slate-700 rounded-xl" data-testid={`text-protein-${food.id}`}>
                            <span className="text-slate-400">P:</span> <span className="text-white font-medium">{food.protein}g</span>
                          </div>
                          <div className="px-2 py-1 bg-slate-700 rounded-xl" data-testid={`text-fat-${food.id}`}>
                            <span className="text-slate-400">F:</span> <span className="text-white font-medium">{food.fat}g</span>
                          </div>
                        </div>
                        
                        {/* Serving Size */}
                        <div className="text-xs text-slate-500 mt-2">
                          Per {food.quantity}{food.unit}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          onClick={() => handleEdit(food)}
                          variant="ghost"
                          size="sm"
                          className="text-blue-400 hover:text-blue-300 hover:bg-blue-950"
                          data-testid={`button-edit-${food.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(food.id, food.name)}
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-950"
                          data-testid={`button-delete-${food.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
              </div>

              {/* Pagination Controls - appears at bottom of list */}
              {totalPages > 1 && (
                <div className="mt-8 mb-4 flex items-center justify-center gap-4">
                  <Button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-white disabled:opacity-30"
                    data-testid="button-prev-page"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <span className="font-medium text-white">{currentPage}</span>
                    <span>•••</span>
                    <span>{totalPages}</span>
                  </div>
                  
                  <Button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-white disabled:opacity-30"
                    data-testid="button-next-page"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Food</DialogTitle>
          </DialogHeader>
          
          {editingFood && (
            <div className="space-y-4 mt-4">
              {/* Name */}
              <div>
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={editingFood.name}
                  onChange={(e) => setEditingFood({ ...editingFood, name: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  data-testid="input-edit-name"
                />
              </div>

              {/* Brand */}
              <div>
                <Label htmlFor="edit-brand">Brand</Label>
                <Input
                  id="edit-brand"
                  value={editingFood.brand || ''}
                  onChange={(e) => setEditingFood({ ...editingFood, brand: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  data-testid="input-edit-brand"
                />
              </div>

              {/* Serving Size */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-quantity">Quantity *</Label>
                  <Input
                    id="edit-quantity"
                    type="number"
                    value={editingFood.quantity}
                    onChange={(e) => setEditingFood({ ...editingFood, quantity: parseFloat(e.target.value) || 0 })}
                    className="bg-slate-800 border-slate-700 text-white"
                    data-testid="input-edit-quantity"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-unit">Unit *</Label>
                  <Select
                    value={editingFood.unit}
                    onValueChange={(value: FoodUnit) => setEditingFood({ ...editingFood, unit: value })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white" data-testid="select-edit-unit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      <SelectItem value="g">g</SelectItem>
                      <SelectItem value="oz">oz</SelectItem>
                      <SelectItem value="cup">cup</SelectItem>
                      <SelectItem value="piece">piece</SelectItem>
                      <SelectItem value="serving">serving</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Macros */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-calories">Calories *</Label>
                  <Input
                    id="edit-calories"
                    type="number"
                    value={editingFood.calories}
                    onChange={(e) => setEditingFood({ ...editingFood, calories: parseFloat(e.target.value) || 0 })}
                    className="bg-slate-800 border-slate-700 text-white"
                    data-testid="input-edit-calories"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-carbs">Carbs (g) *</Label>
                  <Input
                    id="edit-carbs"
                    type="number"
                    value={editingFood.carbs}
                    onChange={(e) => setEditingFood({ ...editingFood, carbs: parseFloat(e.target.value) || 0 })}
                    className="bg-slate-800 border-slate-700 text-white"
                    data-testid="input-edit-carbs"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-protein">Protein (g) *</Label>
                  <Input
                    id="edit-protein"
                    type="number"
                    value={editingFood.protein}
                    onChange={(e) => setEditingFood({ ...editingFood, protein: parseFloat(e.target.value) || 0 })}
                    className="bg-slate-800 border-slate-700 text-white"
                    data-testid="input-edit-protein"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-fat">Fat (g) *</Label>
                  <Input
                    id="edit-fat"
                    type="number"
                    value={editingFood.fat}
                    onChange={(e) => setEditingFood({ ...editingFood, fat: parseFloat(e.target.value) || 0 })}
                    className="bg-slate-800 border-slate-700 text-white"
                    data-testid="input-edit-fat"
                  />
                </div>
              </div>

              {/* Optional Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-fiber">Fiber (g)</Label>
                  <Input
                    id="edit-fiber"
                    type="number"
                    value={editingFood.fiber || ''}
                    onChange={(e) => setEditingFood({ ...editingFood, fiber: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="bg-slate-800 border-slate-700 text-white"
                    data-testid="input-edit-fiber"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-sugar">Sugar (g)</Label>
                  <Input
                    id="edit-sugar"
                    type="number"
                    value={editingFood.sugar || ''}
                    onChange={(e) => setEditingFood({ ...editingFood, sugar: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="bg-slate-800 border-slate-700 text-white"
                    data-testid="input-edit-sugar"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-sodium">Sodium (mg)</Label>
                  <Input
                    id="edit-sodium"
                    type="number"
                    value={editingFood.sodium || ''}
                    onChange={(e) => setEditingFood({ ...editingFood, sodium: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="bg-slate-800 border-slate-700 text-white"
                    data-testid="input-edit-sodium"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-saturatedFat">Sat Fat (g)</Label>
                  <Input
                    id="edit-saturatedFat"
                    type="number"
                    value={editingFood.saturatedFat || ''}
                    onChange={(e) => setEditingFood({ ...editingFood, saturatedFat: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="bg-slate-800 border-slate-700 text-white"
                    data-testid="input-edit-saturatedFat"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => {
                    setEditDialogOpen(false);
                    setEditingFood(null);
                  }}
                  variant="outline"
                  className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  data-testid="button-save-edit"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
