import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  total: number;
}

interface LineItemFormProps {
  items: LineItem[];
  onItemsChange: (items: LineItem[]) => void;
}

export function LineItemForm({ items, onItemsChange }: LineItemFormProps) {
  const addItem = () => {
    const newItem: LineItem = {
      id: crypto.randomUUID(),
      description: '',
      quantity: 1,
      rate: 0,
      total: 0,
    };
    onItemsChange([...items, newItem]);
  };

  const removeItem = (id: string) => {
    onItemsChange(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    const updatedItems = items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // Recalculate total when quantity or rate changes
        if (field === 'quantity' || field === 'rate') {
          updated.total = updated.quantity * updated.rate;
        }
        return updated;
      }
      return item;
    });
    onItemsChange(updatedItems);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Line Items</h3>
        <Button 
          type="button"
          variant="outline" 
          size="sm" 
          onClick={addItem}
          className="min-h-[44px] touch-manipulation self-start sm:self-auto"
          data-testid="add-line-item"
        >
          <i className="fas fa-plus mr-2"></i>
          Add Item
        </Button>
      </div>

      {items.map((item, index) => (
        <div 
          key={item.id} 
          className="grid grid-cols-12 gap-3 items-end p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-lg"
        >
          <div className="col-span-12 md:col-span-5">
            <Label className="text-sm font-medium">Description</Label>
            <Input
              type="text"
              placeholder="Item description"
              value={item.description}
              onChange={(e) => updateItem(item.id, 'description', e.target.value)}
              className="mt-1 min-h-[44px]"
              data-testid={`description-${index}`}
            />
          </div>
          
          <div className="col-span-4 sm:col-span-6 md:col-span-2">
            <Label className="text-sm font-medium">Qty</Label>
            <Input
              type="number"
              placeholder="1"
              value={item.quantity || ''}
              onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
              className="mt-1 min-h-[44px]"
              min="0"
              step="1"
              data-testid={`quantity-${index}`}
            />
          </div>
          
          <div className="col-span-4 sm:col-span-6 md:col-span-2">
            <Label className="text-sm font-medium">Rate</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={item.rate || ''}
              onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
              className="mt-1 min-h-[44px]"
              min="0"
              step="0.01"
              data-testid={`rate-${index}`}
            />
          </div>
          
          <div className="col-span-2 sm:col-span-8 md:col-span-2">
            <Label className="text-sm font-medium">Total</Label>
            <div 
              className="text-sm font-semibold p-2 bg-white dark:bg-slate-700 rounded border mt-1 min-h-[44px] flex items-center"
              data-testid={`total-${index}`}
            >
              ${item.total.toFixed(2)}
            </div>
          </div>
          
          <div className="col-span-2 sm:col-span-4 md:col-span-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeItem(item.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900 min-h-[44px] w-full touch-manipulation"
              data-testid={`remove-item-${index}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}

      {items.length === 0 && (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
          <i className="fas fa-plus-circle text-2xl mb-2 opacity-50"></i>
          <p className="text-sm sm:text-base">No line items added. Click "Add Item" to get started.</p>
        </div>
      )}
    </div>
  );
}
