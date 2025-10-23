import { useState, useEffect, useMemo, useCallback } from 'react';
import { ArrowLeft, Search, Trash2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { List } from 'react-window';
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
    const loadFoods = async () => {
      try {
        setLoading(true);
        const foods = await localFoodService.getAllFoods();
        setAllFoods(foods);
      } catch (error) {
        console.error('Error loading foods:', error);
        toast({
          title: "Error",
          description: "Failed to load food database",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadFoods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter foods based on search query
  const filteredFoods = useMemo(() => {
    if (!searchQuery.trim()) {
      return allFoods;
    }

    const query = searchQuery.toLowerCase().trim();
    return allFoods.filter(food => {
      const name = food.name.toLowerCase();
      const brand = food.brand?.toLowerCase() || '';
      return name.includes(query) || brand.includes(query);
    });
  }, [allFoods, searchQuery]);

  // Handle delete
  const handleDelete = useCallback(async (foodId: string, foodName: string) => {
    // Only allow deleting custom foods
    if (!foodId.startsWith('custom-')) {
      toast({
        title: "Cannot Delete",
        description: "Only custom foods can be deleted",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await localFoodService.deleteCustomFood(foodId);
      
      if (result.success) {
        // Remove from local state
        setAllFoods(prev => prev.filter(f => f.id !== foodId));
        toast({
          title: "Deleted",
          description: `"${foodName}" removed from database`
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBack = () => {
    navigate('/food-tracker');
  };

  // Row renderer for virtualized list
  const Row = useCallback(({ index, style }: { index: number; style?: React.CSSProperties }) => {
    const food = filteredFoods[index];
    if (!food) return null;
    const isCustom = food.id.startsWith('custom-');
    
    return (
      <div style={style} className="px-1 py-1">
        <Card 
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
              disabled={!isCustom}
              variant="ghost"
              size="sm"
              className={`flex-shrink-0 ${
                isCustom 
                  ? 'text-red-400 hover:text-red-300 hover:bg-red-950' 
                  : 'text-slate-600 cursor-not-allowed'
              }`}
              data-testid={`button-delete-${food.id}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </div>
    );
  }, [filteredFoods, handleDelete]);

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
              Showing {filteredFoods.length.toLocaleString()} of {allFoods.length.toLocaleString()} foods
            </>
          )}
        </div>

        {/* Food List */}
        <div className="pb-24">
          {loading ? (
            <div className="text-center text-slate-400 py-12">
              Loading food database...
            </div>
          ) : filteredFoods.length === 0 ? (
            <div className="text-center text-slate-400 py-12">
              {searchQuery ? 'No foods found matching your search' : 'No foods in database'}
            </div>
          ) : (
            <List
              rowHeight={160}
              rowCount={filteredFoods.length}
              rowComponent={Row}
              rowProps={{}}
              defaultHeight={window.innerHeight - 280}
              style={{ width: '100%' }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
