import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { api } from '../../api/client';
import { formatPHP } from '../../utils/format';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { AlertTriangle, ShoppingCart, RefreshCw } from 'lucide-react';

export const StockAlertsView: React.FC<{ onNavigateToPO?: () => void }> = ({ onNavigateToPO }) => {
  const [items, setItems] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/products/low-stock');
      setItems(res.data.items || []);
    } catch (err) {
      console.error('Failed to load low-stock alerts', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Low Stock & Reorder Alerts
            </h1>
            <Badge variant="warning" size="md">
              {items.length} Needs Attention
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Products at or below designated reorder threshold levels
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAlerts}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          {onNavigateToPO && (
            <Button
              variant="primary"
              size="sm"
              onClick={onNavigateToPO}
              icon={<ShoppingCart className="w-3.5 h-3.5" />}
            >
              Create Purchase Order
            </Button>
          )}
        </div>
      </div>

      {items.length === 0 && !isLoading ? (
        <div className="p-12 text-center bg-white rounded-lg border border-slate-200">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <RefreshCw className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-slate-900 text-sm">All Inventory Healthy</h3>
          <p className="text-xs text-slate-500 mt-1">
            There are currently no products at or below their reorder threshold.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold text-[11px]">
                  <th className="py-3 px-4">SKU / Barcode</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Wholesale Cost</th>
                  <th className="py-3 px-4 text-right">Retail SRP</th>
                  <th className="py-3 px-4 text-right">Current Stock</th>
                  <th className="py-3 px-4 text-right">Reorder Threshold</th>
                  <th className="py-3 px-4 text-center">Urgency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((p) => {
                  const stock = parseFloat(p.stock_quantity.toString());
                  const reorder = parseFloat(p.reorder_level.toString());
                  const isOut = stock <= 0;

                  return (
                    <tr key={p.product_id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-600">
                        <div className="font-semibold text-slate-900">{p.sku}</div>
                        <div className="text-[10px] text-slate-400">{p.barcode}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {p.name}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {p.category?.name || '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">
                        {formatPHP(p.cost_price)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                        {formatPHP(p.selling_price)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        <span className={isOut ? 'text-rose-600' : 'text-amber-600'}>
                          {stock} {p.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {reorder} {p.unit}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isOut ? (
                          <Badge variant="danger" dot>
                            Critical Out-of-Stock
                          </Badge>
                        ) : (
                          <Badge variant="warning" dot>
                            Under Threshold
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
