import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Search, Trash2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { localFoodService, LocalFoodItem } from '@/lib/local-food-service';
import { useToast } from '@/hooks/use-toast';

export default function FoodDatabasePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [allFoods, setAllFoods] = useState<LocalFoodItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

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

  // Handle delete
  const handleDelete = async (foodId: string, foodName: string) => {
    const isCustom = foodId.startsWith('custom-');
    
    try {
      if (isCustom) {
        const result = await localFoodService.deleteCustomFood(foodId);
        
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
      } else {
        // For built-in foods, mark as deleted permanently
        const result = localFoodService.deleteBuiltInFood(foodId);
        
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
        <div className="pb-24 overflow-y-auto max-h-[calc(100vh-300px)]">
          {loading ? (
            <div className="text-center text-slate-400 py-12">
              Loading food database...
            </div>
          ) : filteredFoods.length === 0 ? (
            <div className="text-center text-slate-400 py-12">
              {searchQuery ? 'No foods found matching your search' : 'No foods in database'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFoods.slice(0, 100).map((food) => {
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
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-white truncate" data-testid={`text-name-${food.id}`}>
                            {food.name}
                          </h3>
                          {isCustom && (
                            <span className="px-2 py-0.5 text-xs bg-green-600 text-white rounded-xl">
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

                      {/* Delete Button */}
                      <Button
                        onClick={() => handleDelete(food.id, food.name)}
                        variant="ghost"
                        size="sm"
                        className="flex-shrink-0 text-red-400 hover:text-red-300 hover:bg-red-950"
                        data-testid={`button-delete-${food.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
              {filteredFoods.length > 100 && (
                <div className="text-center text-slate-400 py-4 text-sm">
                  Showing first 100 results. Use search to narrow down.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
