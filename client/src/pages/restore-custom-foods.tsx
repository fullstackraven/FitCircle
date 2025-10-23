import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { localFoodService } from '@/lib/local-food-service';
import { ArrowLeft } from 'lucide-react';

export default function RestoreCustomFoodsPage() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);

  const customFoods = [
    {
      name: "Eggs",
      brand: "Great Value",
      quantity: 300,
      unit: "g" as const,
      calories: 420,
      carbs: 0,
      protein: 36,
      fat: 30
    },
    {
      name: "Oatmeal",
      brand: "Great Value",
      quantity: 0.5,
      unit: "cup" as const,
      calories: 150,
      carbs: 27,
      protein: 5,
      fat: 3,
      fiber: 4
    },
    {
      name: "Raw Honey",
      brand: "",
      quantity: 21,
      unit: "g" as const,
      calories: 60,
      carbs: 17,
      protein: 0,
      fat: 0
    },
    {
      name: "Whole Carrots",
      brand: "Grimmway Farms",
      quantity: 78,
      unit: "g" as const,
      calories: 30,
      carbs: 7,
      protein: 1,
      fat: 0,
      fiber: 2
    },
    {
      name: "Chicken Breast",
      brand: "Kirkwood",
      quantity: 4,
      unit: "oz" as const,
      calories: 110,
      carbs: 0,
      protein: 23,
      fat: 3
    },
    {
      name: "Sweet Potato",
      brand: "",
      quantity: 150,
      unit: "g" as const,
      calories: 129,
      carbs: 30,
      protein: 2,
      fat: 0
    },
    {
      name: "Spring Mix",
      brand: "Aldi",
      quantity: 1,
      unit: "cup" as const,
      calories: 30,
      carbs: 4,
      protein: 3,
      fat: 0
    },
    {
      name: "Strawberries",
      brand: "",
      quantity: 85,
      unit: "g" as const,
      calories: 27,
      carbs: 7,
      protein: 1,
      fat: 0
    },
    {
      name: "Blueberries",
      brand: "",
      quantity: 85,
      unit: "g" as const,
      calories: 48,
      carbs: 12,
      protein: 1,
      fat: 0
    },
    {
      name: "Kalamata Olive - pitted",
      brand: "",
      quantity: 6,
      unit: "piece" as const,
      calories: 70,
      carbs: 0,
      protein: 0,
      fat: 8
    },
    {
      name: "Blue Cheese",
      brand: "",
      quantity: 14,
      unit: "g" as const,
      calories: 50,
      carbs: 0,
      protein: 3,
      fat: 4
    },
    {
      name: "Super Zero Yogurt - Nonfat Greek",
      brand: "Friendly Farms",
      quantity: 170,
      unit: "g" as const,
      calories: 100,
      carbs: 7,
      protein: 19,
      fat: 0
    },
    {
      name: "Whey Protein - Double Rich Chocolate",
      brand: "Optimum Nutrition",
      quantity: 93,
      unit: "g" as const,
      calories: 360,
      carbs: 9,
      protein: 72,
      fat: 5,
      fiber: 3
    },
    {
      name: "PB Fit",
      brand: "",
      quantity: 32,
      unit: "g" as const,
      calories: 120,
      carbs: 12,
      protein: 16,
      fat: 4,
      fiber: 4
    },
    {
      name: "Whole Milk",
      brand: "",
      quantity: 480,
      unit: "g" as const,
      calories: 292,
      carbs: 23,
      protein: 15,
      fat: 16
    }
  ];

  const handleRestore = async () => {
    setIsRestoring(true);
    setStatus('Restoring custom foods...');

    let successCount = 0;
    let errorCount = 0;

    for (const food of customFoods) {
      try {
        const result = await localFoodService.addCustomFood(food);
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
          console.error(`Failed to add ${food.name}:`, result.error);
        }
      } catch (error) {
        errorCount++;
        console.error(`Error adding ${food.name}:`, error);
      }
    }

    setStatus(`Successfully restored ${successCount} custom foods!${errorCount > 0 ? ` (${errorCount} errors)` : ''}`);
    setIsRestoring(false);

    setTimeout(() => {
      navigate('/food-database');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            onClick={() => navigate('/food-tracker')}
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Restore Custom Foods</h1>
        </div>

        <div className="bg-slate-900 rounded-xl p-6 mb-6">
          <p className="text-slate-300 mb-4">
            This will restore {customFoods.length} custom foods to your database.
          </p>

          <div className="mb-4 text-sm text-slate-400">
            <p className="font-semibold mb-2">Foods to be restored:</p>
            <ul className="list-disc list-inside space-y-1 max-h-96 overflow-y-auto">
              {customFoods.map((food, idx) => (
                <li key={idx}>
                  {food.name} {food.brand && `- ${food.brand}`} ({food.quantity}{food.unit})
                </li>
              ))}
            </ul>
          </div>

          <Button
            onClick={handleRestore}
            disabled={isRestoring}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isRestoring ? 'Restoring...' : 'Restore All Custom Foods'}
          </Button>

          {status && (
            <div className={`mt-4 p-3 rounded-xl text-sm text-center ${
              status.includes('Success')
                ? 'bg-green-900/50 text-green-300 border border-green-700'
                : 'bg-blue-900/50 text-blue-300 border border-blue-700'
            }`}>
              {status}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
