import React from 'react';
import { Order } from '../../types';
import { formatPHP, formatDateTime } from '../../utils/format';
import { Printer, X } from 'lucide-react';
import { Button } from '../ui/Button';

export interface ThermalReceiptProps {
  order: Order;
  onClose: () => void;
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({ order, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const store = order.store;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70">
      <div className="bg-white rounded-md shadow-xl max-w-sm w-full overflow-hidden border border-slate-300">
        {/* Actions bar (hidden in print) */}
        <div className="no-print flex items-center justify-between px-4 py-3 bg-slate-900 text-white">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Official Receipt Preview
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="emerald"
              size="sm"
              icon={<Printer className="w-4 h-4" />}
              onClick={handlePrint}
            >
              Print Receipt
            </Button>
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Thermal Receipt (80mm width standard) */}
        <div
          id="thermal-receipt"
          className="p-6 bg-white text-slate-900 font-mono text-xs leading-tight max-h-[80vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-400">
            <div className="flex justify-center mb-1">
              <img
                src="/logo.png"
                alt="Daumar Grocery Store"
                className="w-16 h-16 rounded-full object-cover grayscale contrast-125"
              />
            </div>
            <h2 className="font-bold text-sm tracking-wider uppercase">
              {store?.store_name || 'DAUMAR GROCERY STORE'}
            </h2>
            <p className="text-[11px] text-slate-600">Branch: {store?.branch_code || 'BGC-01'}</p>
            <p className="text-[10px] text-slate-600">{store?.address}</p>
            <p className="text-[10px] text-slate-600">Tel: {store?.phone}</p>
            <p className="text-[10px] font-semibold text-slate-800">
              VAT-REG TIN: {store?.vat_tin || '123-456-789-00000'}
            </p>
            {store?.receipt_header && (
              <p className="text-[10px] text-slate-500 whitespace-pre-line mt-1">
                {store.receipt_header}
              </p>
            )}
          </div>

          {/* Meta Info */}
          <div className="py-2.5 border-b border-dashed border-slate-400 text-[11px] space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Order No:</span>
              <span className="font-bold">{order.order_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date/Time:</span>
              <span>{formatDateTime(order.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Cashier:</span>
              <span>{order.user?.name || 'Cashier'}</span>
            </div>
            {order.customer && (
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span>{order.customer.name}</span>
              </div>
            )}
            {order.customer?.senior_pwd_id && (
              <div className="flex justify-between">
                <span className="text-slate-500">OSCA/PWD ID:</span>
                <span className="font-semibold">{order.customer.senior_pwd_id}</span>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="py-2.5 border-b border-dashed border-slate-400">
            <div className="grid grid-cols-12 text-[10px] font-bold text-slate-500 pb-1 mb-1 border-b border-slate-200 uppercase">
              <span className="col-span-6">Item</span>
              <span className="col-span-2 text-right">Qty</span>
              <span className="col-span-2 text-right">Price</span>
              <span className="col-span-2 text-right">Total</span>
            </div>
            <div className="space-y-1.5">
              {order.items?.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 text-[11px]">
                  <div className="col-span-6 truncate pr-1">
                    {item.product_name}
                  </div>
                  <div className="col-span-2 text-right">{Number(item.quantity).toFixed(0)}</div>
                  <div className="col-span-2 text-right">{Number(item.unit_price).toFixed(2)}</div>
                  <div className="col-span-2 text-right font-medium">
                    {Number(item.total).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals & Discounts */}
          <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
            <div className="flex justify-between text-slate-600">
              <span>Gross Subtotal:</span>
              <span>{formatPHP(order.subtotal)}</span>
            </div>

            {Number(order.discount_amount) > 0 && (
              <div className="flex justify-between font-semibold text-rose-600">
                <span>
                  Discount (
                  {order.discount_type === 'senior_pwd'
                    ? 'Senior/PWD 20%'
                    : order.discount_type}
                  ):
                </span>
                <span>-{formatPHP(order.discount_amount)}</span>
              </div>
            )}

            <div className="flex justify-between font-bold text-sm pt-1 text-slate-900 border-t border-slate-200">
              <span>TOTAL DUE:</span>
              <span>{formatPHP(order.total_amount)}</span>
            </div>
          </div>

          {/* Payments Breakdown (Split Tender Support) */}
          <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
            <div className="text-[10px] font-bold text-slate-500 uppercase">
              Payments Breakdown
            </div>
            {order.payments?.map((p, idx) => (
              <div key={idx} className="flex justify-between">
                <span className="capitalize">
                  {p.payment_method}{' '}
                  {p.reference_no ? `(Ref: ${p.reference_no})` : ''}:
                </span>
                <span>{formatPHP(p.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between pt-1 border-t border-slate-200">
              <span className="text-slate-600">Amount Tendered:</span>
              <span>{formatPHP(order.amount_paid)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900">
              <span>CHANGE:</span>
              <span>{formatPHP(order.change_amount)}</span>
            </div>
          </div>

          {/* BIR Tax Compliance Summary */}
          <div className="py-2.5 border-b border-dashed border-slate-400 text-[10px] space-y-1 text-slate-600">
            <div className="font-bold text-slate-800 uppercase pb-0.5">
              TAX SUMMARY (12% VAT)
            </div>
            <div className="flex justify-between">
              <span>VATable Sales:</span>
              <span>{formatPHP(order.vatable_sales)}</span>
            </div>
            <div className="flex justify-between">
              <span>12% VAT Amount:</span>
              <span>{formatPHP(order.vat_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span>VAT-Exempt Sales:</span>
              <span>{formatPHP(order.vat_exempt_sales)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-3 text-[10px] text-slate-500 space-y-1">
            {store?.receipt_footer ? (
              <p className="whitespace-pre-line">{store.receipt_footer}</p>
            ) : (
              <>
                <p>Thank you for your purchase!</p>
                <p>Items may be exchanged within 7 days with this receipt.</p>
                <p className="font-bold text-slate-700">ISAACPOS | RETAIL POINT OF SALE</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
