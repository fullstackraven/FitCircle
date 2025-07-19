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
    let savedCount = 0;
    let hasValidData = false;
    
    // Check if we have any valid input data first
    measurementFields.forEach(field => {
      const value = parseFloat(inputValues[field.key]);
      if (!isNaN(value) && value > 0) {
        hasValidData = true;
      }
    });
    
    if (!hasValidData) {
      alert('Please enter at least one valid measurement before saving.');
      return;
    }
    
    // Save measurements with history
    measurementFields.forEach(field => {
      const value = parseFloat(inputValues[field.key]);
      if (!isNaN(value) && value > 0) {
        try {
          addMeasurement(field.key, value);
          savedCount++;
        } catch (error) {
          console.error(`Error saving ${field.key}:`, error);
        }
      }
    });
    
    if (savedCount > 0) {
      // Show success feedback but stay on measurements page
      alert(`Successfully saved ${savedCount} measurement${savedCount > 1 ? 's' : ''}!`);
    } else {
      alert('Failed to save measurements. Please try again.');
    }
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
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-slate-300 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <h1 className="text-xl font-semibold">Measurements</h1>
          <button
            onClick={() => setShowGraphs(!showGraphs)}
            className="text-sm bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded"
          >
            {showGraphs ? 'Input' : 'Graphs'}
          </button>
        </div>

        {!showGraphs ? (
          /* Input Mode */
          <div className="space-y-6">
            {Object.entries(categorizedFields).map(([category, fields]) => (
              <section key={category} className="bg-slate-800 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4 text-white">{category}</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  {fields.map(field => (
                    <div key={field.key}>
                      <Label htmlFor={field.key} className="text-slate-300 flex items-center space-x-2">
                        <span>{field.label}</span>
                        {getLatestValue(field.key) && getTrendIcon(getValueTrend(field.key))}
                      </Label>
                      <Input
                        id={field.key}
                        type="number"
                        value={inputValues[field.key] || ''}
                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                        placeholder={`${field.unit}`}
                        className="bg-slate-700 border-slate-600 text-white mt-1"
                      />
                      {getLatestValue(field.key) && (
                        <div className="text-xs text-slate-400 mt-1">
                          Last: {getLatestValue(field.key)}{field.unit}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}
            
            <Button
              onClick={handleSave}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium"
            >
              Save Measurements
            </Button>
          </div>
        ) : (
          /* Graph Mode */
          <div className="space-y-6">
            <div className="flex overflow-x-auto space-x-4 pb-4">
              {measurementFields
                .filter(field => getChartData(field.key).length > 0)
                .map(field => {
                  const chartData = getChartData(field.key).map(entry => ({
                    date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    value: entry.value
                  }));

                  return (
                    <div key={field.key} className="flex-shrink-0 w-80 bg-slate-800 rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-2 text-white flex items-center space-x-2">
                        <span>{field.label}</span>
                        {getTrendIcon(getValueTrend(field.key))}
                      </h3>
                      <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <XAxis 
                              dataKey="date" 
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 10, fill: '#94a3b8' }}
                            />
                            <YAxis 
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 10, fill: '#94a3b8' }}
                              domain={chartData.length === 1 ? ['dataMin - 5', 'dataMax + 5'] : ['auto', 'auto']}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="value" 
                              stroke="#3b82f6" 
                              strokeWidth={2}
                              dot={{ r: 5, fill: '#3b82f6' }}
                              connectNulls={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-2 text-sm text-slate-400">
                        Latest: {getLatestValue(field.key)}{field.unit} | 
                        {chartData.length} data point{chartData.length > 1 ? 's' : ''}
                        {chartData.length === 1 && (
                          <div className="text-xs text-blue-400 mt-1">
                            Add more entries to see trend line
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
            
            {measurementFields.filter(field => getChartData(field.key).length > 0).length === 0 && (
              <div className="text-center text-slate-500 py-12">
                <div className="text-6xl mb-4">📈</div>
                <h3 className="text-lg font-semibold mb-2">No Trend Data Yet</h3>
                <p className="text-sm">Add measurements over time to see trend graphs here</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}