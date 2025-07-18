
import { useState, useEffect } from 'react';
import { ArrowLeft, Scale, Ruler } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function MeasurementsPage() {
  const [, navigate] = useLocation();
  
  // Body Measures
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');

  // Circumferences
  const [neck, setNeck] = useState('');
  const [chest, setChest] = useState('');
  const [waist, setWaist] = useState('');
  const [hips, setHips] = useState('');
  const [bicep, setBicep] = useState('');
  const [forearm, setForearm] = useState('');
  const [thigh, setThigh] = useState('');
  const [calf, setCalf] = useState('');

  useEffect(() => {
    // Load saved measurements
    setWeight(localStorage.getItem('fitcircle_weight') || '');
    setHeight(localStorage.getItem('fitcircle_height') || '');
    setBodyFat(localStorage.getItem('fitcircle_body_fat') || '');
    setNeck(localStorage.getItem('fitcircle_neck') || '');
    setChest(localStorage.getItem('fitcircle_chest') || '');
    setWaist(localStorage.getItem('fitcircle_waist') || '');
    setHips(localStorage.getItem('fitcircle_hips') || '');
    setBicep(localStorage.getItem('fitcircle_bicep') || '');
    setForearm(localStorage.getItem('fitcircle_forearm') || '');
    setThigh(localStorage.getItem('fitcircle_thigh') || '');
    setCalf(localStorage.getItem('fitcircle_calf') || '');
  }, []);

  const handleSave = () => {
    // Save body measures
    localStorage.setItem('fitcircle_weight', weight);
    localStorage.setItem('fitcircle_height', height);
    localStorage.setItem('fitcircle_body_fat', bodyFat);
    
    // Save circumferences
    localStorage.setItem('fitcircle_neck', neck);
    localStorage.setItem('fitcircle_chest', chest);
    localStorage.setItem('fitcircle_waist', waist);
    localStorage.setItem('fitcircle_hips', hips);
    localStorage.setItem('fitcircle_bicep', bicep);
    localStorage.setItem('fitcircle_forearm', forearm);
    localStorage.setItem('fitcircle_thigh', thigh);
    localStorage.setItem('fitcircle_calf', calf);
    
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="container mx-auto px-4 py-6 max-w-md">
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

        <div className="space-y-8">
          {/* Body Measures Section */}
          <div className="bg-slate-800 rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Scale className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-semibold">Body Measures</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Weight (lbs/kg)</label>
                <Input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="Enter weight"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Height (ft/cm)</label>
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
                  type="number"
                  value={bodyFat}
                  onChange={(e) => setBodyFat(e.target.value)}
                  placeholder="Enter body fat percentage"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
          </div>

          {/* Circumferences Section */}
          <div className="bg-slate-800 rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Ruler className="w-5 h-5 text-green-400" />
              <h2 className="text-lg font-semibold">Circumferences</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Neck (in)</label>
                <Input
                  type="number"
                  value={neck}
                  onChange={(e) => setNeck(e.target.value)}
                  placeholder="0.0"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Chest (in)</label>
                <Input
                  type="number"
                  value={chest}
                  onChange={(e) => setChest(e.target.value)}
                  placeholder="0.0"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Waist (in)</label>
                <Input
                  type="number"
                  value={waist}
                  onChange={(e) => setWaist(e.target.value)}
                  placeholder="0.0"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Hips (in)</label>
                <Input
                  type="number"
                  value={hips}
                  onChange={(e) => setHips(e.target.value)}
                  placeholder="0.0"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Bicep (in)</label>
                <Input
                  type="number"
                  value={bicep}
                  onChange={(e) => setBicep(e.target.value)}
                  placeholder="0.0"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Forearm (in)</label>
                <Input
                  type="number"
                  value={forearm}
                  onChange={(e) => setForearm(e.target.value)}
                  placeholder="0.0"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Thigh (in)</label>
                <Input
                  type="number"
                  value={thigh}
                  onChange={(e) => setThigh(e.target.value)}
                  placeholder="0.0"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Calf (in)</label>
                <Input
                  type="number"
                  value={calf}
                  onChange={(e) => setCalf(e.target.value)}
                  placeholder="0.0"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
          </div>

          <Button 
            onClick={handleSave}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Save Measurements
          </Button>
        </div>
      </div>
    </div>
  );
}
