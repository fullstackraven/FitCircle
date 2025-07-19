
import { useState, useEffect } from 'react';
import { ChevronLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMeasurements } from '@/hooks/use-measurements';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';

interface MeasurementFieldConfig {
  key: keyof import('@/hooks/use-measurements').MeasurementData;
  label: string;
  unit: string;
  category: string;
}

const measurementFields: MeasurementFieldConfig[] = [
  { key: 'weight', label: 'Weight', unit: 'lbs', category: 'Body' },
  { key: 'height', label: 'Height', unit: 'in', category: 'Body' },
  { key: 'bodyFat', label: 'Body Fat', unit: '%', category: 'Body' },
  { key: 'neck', label: 'Neck', unit: 'in', category: 'Circumference' },
  { key: 'chest', label: 'Chest', unit: 'in', category: 'Circumference' },
  { key: 'waist', label: 'Waist', unit: 'in', category: 'Circumference' },
  { key: 'hips', label: 'Hips', unit: 'in', category: 'Circumference' },
  { key: 'bicepLeft', label: 'Bicep (L)', unit: 'in', category: 'Arms' },
  { key: 'bicepRight', label: 'Bicep (R)', unit: 'in', category: 'Arms' },
  { key: 'forearmLeft', label: 'Forearm (L)', unit: 'in', category: 'Arms' },
  { key: 'forearmRight', label: 'Forearm (R)', unit: 'in', category: 'Arms' },
  { key: 'thighLeft', label: 'Thigh (L)', unit: 'in', category: 'Legs' },
  { key: 'thighRight', label: 'Thigh (R)', unit: 'in', category: 'Legs' },
  { key: 'calfLeft', label: 'Calf (L)', unit: 'in', category: 'Legs' },
  { key: 'calfRight', label: 'Calf (R)', unit: 'in', category: 'Legs' },
];

export default function MeasurementsPage() {
  const [, navigate] = useLocation();
  const { addMeasurement, getLatestValue, getValueTrend, getChartData } = useMeasurements();
  
  const [inputValues, setInputValues] = useState<{ [key: string]: string }>({});
  const [showGraphs, setShowGraphs] = useState(false);

  useEffect(() => {
    // Load latest values
    const initialValues: { [key: string]: string } = {};
    measurementFields.forEach(field => {
      const latestValue = getLatestValue(field.key);
      initialValues[field.key] = latestValue?.toString() || '';
    });
    setInputValues(initialValues);
  }, []);

  const handleInputChange = (key: string, value: string) => {
    setInputValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    // Save measurements with history
    measurementFields.forEach(field => {
      const value = parseFloat(inputValues[field.key]);
      if (!isNaN(value) && value > 0) {
        addMeasurement(field.key, value);
      }
    });
    
    navigate('/');
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-400" />;
      default: return <Minus className="w-4 h-4 text-slate-400" />;
    }
  };

  const categorizedFields = measurementFields.reduce((acc, field) => {
    if (!acc[field.category]) acc[field.category] = [];
    acc[field.category].push(field);
    return acc;
  }, {} as { [category: string]: MeasurementFieldConfig[] });

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: 'hsl(222, 47%, 11%)' }}>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/')}
            className="text-slate-400 hover:text-white transition-colors flex items-center space-x-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <h1 className="text-xl font-semibold">Measurements</h1>
          <div className="w-16"></div>
        </div>

        {/* Body Measures Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <Scale className="w-5 h-5" />
            <span>Body Measures</span>
          </h2>
          
          <div className="bg-slate-800 rounded-lg p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Weight</label>
              <Input
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g., 70kg or 154lbs"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Height</label>
              <Input
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="e.g., 5'10 or 178cm"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Body Fat %</label>
              <Input
                value={bodyFat}
                onChange={(e) => setBodyFat(e.target.value)}
                placeholder="e.g., 15%"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>
        </div>

        {/* Circumferences Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Circumferences</h2>
          
          <div className="bg-slate-800 rounded-lg p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Neck</label>
              <Input
                value={neck}
                onChange={(e) => setNeck(e.target.value)}
                placeholder="e.g., 15 inches"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Chest</label>
              <Input
                value={chest}
                onChange={(e) => setChest(e.target.value)}
                placeholder="e.g., 42 inches"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Waist</label>
              <Input
                value={waist}
                onChange={(e) => setWaist(e.target.value)}
                placeholder="e.g., 32 inches"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Hips</label>
              <Input
                value={hips}
                onChange={(e) => setHips(e.target.value)}
                placeholder="e.g., 38 inches"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Bicep</label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={bicepLeft}
                  onChange={(e) => setBicepLeft(e.target.value)}
                  placeholder="Left (e.g., 14 inches)"
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <Input
                  value={bicepRight}
                  onChange={(e) => setBicepRight(e.target.value)}
                  placeholder="Right (e.g., 14 inches)"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Forearm</label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={forearmLeft}
                  onChange={(e) => setForearmLeft(e.target.value)}
                  placeholder="Left (e.g., 11 inches)"
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <Input
                  value={forearmRight}
                  onChange={(e) => setForearmRight(e.target.value)}
                  placeholder="Right (e.g., 11 inches)"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Thigh</label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={thighLeft}
                  onChange={(e) => setThighLeft(e.target.value)}
                  placeholder="Left (e.g., 22 inches)"
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <Input
                  value={thighRight}
                  onChange={(e) => setThighRight(e.target.value)}
                  placeholder="Right (e.g., 22 inches)"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Calf</label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={calfLeft}
                  onChange={(e) => setCalfLeft(e.target.value)}
                  placeholder="Left (e.g., 15 inches)"
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <Input
                  value={calfRight}
                  onChange={(e) => setCalfRight(e.target.value)}
                  placeholder="Right (e.g., 15 inches)"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <Button 
          onClick={handleSave}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          Save Measurements
        </Button>
      </div>
    </div>
  );
}
