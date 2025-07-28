import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useSupplements } from '@/hooks/use-supplements';
import type { InsertSupplement } from '@shared/schema';

interface AddSupplementDialogProps {
  onSupplementAdded?: () => void;
}

export function AddSupplementDialog({ onSupplementAdded }: AddSupplementDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [measurementType, setMeasurementType] = useState('');
  const [amount, setAmount] = useState('');
  
  const { createSupplement, isCreatingSupplement } = useSupplements();

  const measurementTypes = [
    { value: 'pills', label: 'Pills/Capsules' },
    { value: 'mg', label: 'mg (milligrams)' },
    { value: 'g', label: 'g (grams)' },
    { value: 'ml', label: 'ml (milliliters)' },
    { value: 'oz', label: 'oz (ounces)' },
    { value: 'tsp', label: 'tsp (teaspoons)' },
    { value: 'tbsp', label: 'tbsp (tablespoons)' },
    { value: 'drops', label: 'Drops' },
    { value: 'scoops', label: 'Scoops' },
    { value: 'sachets', label: 'Sachets/Packets' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !measurementType || !amount.trim()) {
      return;
    }

    const supplementData: InsertSupplement = {
      name: name.trim(),
      measurementType,
      amount: parseInt(amount, 10) || 1,
    };

    createSupplement(supplementData, {
      onSuccess: () => {
        setName('');
        setMeasurementType('');
        setAmount('');
        setIsOpen(false);
        onSupplementAdded?.();
      },
    });
  };

  const handleCancel = () => {
    setName('');
    setMeasurementType('');
    setAmount('');
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          size="sm" 
          className="bg-orange-500 hover:bg-orange-600 text-white rounded-full w-8 h-8 p-0"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Add New Supplement</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="supplement-name" className="text-sm font-medium text-slate-300">
              Supplement Name
            </Label>
            <Input
              id="supplement-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Vitamin D3, Fish Oil"
              className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="measurement-type" className="text-sm font-medium text-slate-300">
              Measurement Type
            </Label>
            <Select value={measurementType} onValueChange={setMeasurementType} required>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Select measurement type" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                {measurementTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value} className="text-white hover:bg-slate-600">
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium text-slate-300">
              Amount/Quantity
            </Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g., 2 (for 2 pills), 1000 (for 1000mg)"
              className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              min="1"
              required
            />
          </div>

          <div className="flex space-x-2 pt-4">
            <Button 
              type="submit" 
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
              disabled={isCreatingSupplement || !name.trim() || !measurementType || !amount.trim()}
            >
              {isCreatingSupplement ? 'Adding...' : 'Add Supplement'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}