import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useSupplements } from '@/hooks/use-supplements';
import type { InsertSupplement } from '@/hooks/use-supplements';

interface AddSupplementDialogProps {
  onSupplementAdded?: () => void;
}

export function AddSupplementDialog({ onSupplementAdded }: AddSupplementDialogProps) {
  const [name, setName] = useState('');
  const [measurementType, setMeasurementType] = useState('');
  const [amount, setAmount] = useState('');
  const [nameFocused, setNameFocused] = useState(false);
  const [amountFocused, setAmountFocused] = useState(false);
  
  const { createSupplement } = useSupplements();

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

    createSupplement(supplementData);
    setName('');
    setMeasurementType('');
    setAmount('');
    onSupplementAdded?.();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="bg-action-selected hover:bg-action text-on-action rounded-full w-8 h-8 p-0"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-surface border-separator text-strong max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-strong">Add New Supplement</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Add a new supplement to track your daily intake
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="supplement-name" className="text-sm font-medium text-supporting">
              Supplement Name
            </Label>
            <Input
              id="supplement-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
              className="bg-surface-secondary border-control text-strong placeholder-muted-foreground"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="measurement-type" className="text-sm font-medium text-supporting">
              Measurement Type
            </Label>
            <Select value={measurementType} onValueChange={setMeasurementType} required>
              <SelectTrigger className="bg-surface-secondary border-control text-strong">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-surface-secondary border-control">
                {measurementTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value} className="text-strong hover:bg-control-strong">
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium text-supporting">
              Amount/Quantity
            </Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onFocus={() => setAmountFocused(true)}
              onBlur={() => setAmountFocused(false)}
              className="bg-surface-secondary border-control text-strong placeholder-muted-foreground"
              min="1"
              required
            />
          </div>

          <div className="flex space-x-2 pt-4">
            <Button
              type="submit"
              className="flex-1 bg-action-selected hover:bg-action text-on-action"
              disabled={!name.trim() || !measurementType || !amount.trim()}
            >
              Add Supplement
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setName('');
                setMeasurementType('');
                setAmount('');
              }}
              className="flex-1 border-control text-supporting hover:bg-surface-secondary"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}