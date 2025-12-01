import { topSellingProducts } from '@/data/mockData';
import { Package } from 'lucide-react';

export default function TopProducts() {
  const maxSales = Math.max(...topSellingProducts.map((p) => p.sales));

  return (
    <div className="bg-card rounded-xl border border-border/50 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Top Selling Products</h3>
        <p className="text-sm text-muted-foreground">Best performers this quarter</p>
      </div>

      <div className="space-y-4">
        {topSellingProducts.map((product, index) => (
          <div key={product.name} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                  <Package className="h-4 w-4 text-accent" />
                </div>
                <span className="text-sm font-medium text-foreground">{product.name}</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground">
                  ${product.revenue.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">{product.sales.toLocaleString()} units</p>
              </div>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-accent/60 transition-all duration-500"
                style={{ width: `${(product.sales / maxSales) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
