"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Gamepad } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export function ControllerInventory() {
  const [controllersOut, setControllersOut] = useState(0);
  const [totalControllers, setTotalControllers] = useState(16); // Default fallback
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // Fetch inventory from Supabase
  useEffect(() => {
    const fetchInventory = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('controllers_inventory')
        .select('*')
        .single();
      if (error) {
        setError('Failed to load controller inventory.');
        setLoading(false);
        return;
      }
      setControllersOut(data.out);
      setTotalControllers(data.total);
      setLoading(false);
    };
    fetchInventory();
  }, []);

  // Update inventory in Supabase
  const handleControllersOutChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseInt(e.target.value, 10);
    if (isNaN(value) || value < 0) value = 0;
    if (value > totalControllers) value = totalControllers;
    setControllersOut(value);
    setUpdating(true);
    setError(null);
    const { error } = await supabase
      .from('controllers_inventory')
      .update({ out: value, updated_at: new Date().toISOString() })
      .eq('id', 1); // Assuming single row with id=1
    if (error) setError('Failed to update inventory.');
    setUpdating(false);
  };

  const controllersInStock = totalControllers - controllersOut;

  return (
    <Card className="bg-card/80 backdrop-blur-sm shadow-lg hover:shadow-secondary/20 transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-2xl font-bold">
          <Gamepad className="h-7 w-7 text-secondary" />
          <span>Controller Inventory</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-500 py-8">{error}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div className="space-y-2 text-center">
              <Label htmlFor="total-controllers" className="text-lg text-muted-foreground">Total</Label>
              <Input id="total-controllers" type="text" value={totalControllers} disabled className="text-4xl font-bold text-center bg-muted/30" />
            </div>
            <div className="space-y-2 text-center">
              <Label htmlFor="controllers-out" className="text-lg">Controllers Out</Label>
              <Input
                id="controllers-out"
                type="number"
                value={controllersOut}
                onChange={handleControllersOutChange}
                className="text-4xl font-bold text-center border-primary focus-visible:ring-primary"
                min="0"
                max={totalControllers}
                disabled={updating}
              />
              {updating && <div className="text-xs text-muted-foreground">Updating...</div>}
            </div>
            <div className="space-y-2 text-center">
              <Label htmlFor="controllers-in-stock" className="text-lg text-muted-foreground">In Stock</Label>
              <Input id="controllers-in-stock" type="text" value={controllersInStock} disabled className="text-4xl font-bold text-center text-green-400 bg-muted/30" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
