'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3, DollarSign, ShoppingBag, Clock,
  ArrowUpRight, Loader2, Warehouse, User
} from '@/components/MaterialIcons';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7' | '30' | 'all'>('30');
  const [stats, setStats] = useState<any>({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    completedRate: 0,
    dailySales: [], // { date: string, amount: number, count: number }
    districtSales: [], // { district: string, amount: number, count: number }
    categorySales: [], // { category: string, amount: number, qty: number }
    popularItems: [] // { name: string, qty: number, revenue: number }
  });

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true);
      try {
        const ordersSnap = await getDocs(collection(db, 'orders'));
        const productsSnap = await getDocs(collection(db, 'products'));

        const orders = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
        const products = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

        // 1. Filter orders based on time range
        const now = new Date();
        const filteredOrders = orders.filter(o => {
          if (o.orderStatus === 'cancelled' || o.status === 'cancelled') return false;
          
          const orderDate = o.createdAt?.seconds 
            ? new Date(o.createdAt.seconds * 1000) 
            : new Date(o.createdAt || now);

          if (timeRange === '7') {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(now.getDate() - 7);
            return orderDate >= sevenDaysAgo;
          } else if (timeRange === '30') {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(now.getDate() - 30);
            return orderDate >= thirtyDaysAgo;
          }
          return true;
        });

        // 2. Base metrics
        const totalRevenue = filteredOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
        const totalOrders = filteredOrders.length;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        
        const allFilteredOrders = orders.filter(o => {
          const orderDate = o.createdAt?.seconds 
            ? new Date(o.createdAt.seconds * 1000) 
            : new Date(o.createdAt || now);
          if (timeRange === '7') {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(now.getDate() - 7);
            return orderDate >= sevenDaysAgo;
          } else if (timeRange === '30') {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(now.getDate() - 30);
            return orderDate >= thirtyDaysAgo;
          }
          return true;
        });
        const completedCount = allFilteredOrders.filter(o => o.orderStatus === 'completed' || o.status === 'completed' || o.orderStatus === 'delivered' || o.status === 'delivered').length;
        const completedRate = allFilteredOrders.length > 0 ? (completedCount / allFilteredOrders.length) * 100 : 0;

        // 3. Daily Sales calculation (Group by date)
        const dailyMap: Record<string, { amount: number; count: number }> = {};
        // Pre-fill daily map for visual completeness if 7 or 30 days
        const daysToFill = timeRange === '7' ? 7 : timeRange === '30' ? 15 : 10;
        for (let i = daysToFill - 1; i >= 0; i--) {
          const d = new Date();
          d.setDate(now.getDate() - i);
          const dateStr = d.toLocaleDateString('en-LK', { day: '2-digit', month: 'short' });
          dailyMap[dateStr] = { amount: 0, count: 0 };
        }

        filteredOrders.forEach(o => {
          const orderDate = o.createdAt?.seconds 
            ? new Date(o.createdAt.seconds * 1000) 
            : new Date(o.createdAt || now);
          const dateStr = orderDate.toLocaleDateString('en-LK', { day: '2-digit', month: 'short' });
          
          if (dailyMap[dateStr]) {
            dailyMap[dateStr].amount += Number(o.total) || 0;
            dailyMap[dateStr].count += 1;
          } else if (timeRange === 'all') {
            dailyMap[dateStr] = {
              amount: Number(o.total) || 0,
              count: 1
            };
          }
        });

        const dailySales = Object.entries(dailyMap).map(([date, val]) => ({
          date,
          amount: val.amount,
          count: val.count
        }));

        // 4. District Sales
        const districtMap: Record<string, { amount: number; count: number }> = {};
        filteredOrders.forEach(o => {
          const dist = o.shippingAddress?.district || o.district || 'Other';
          if (!districtMap[dist]) {
            districtMap[dist] = { amount: 0, count: 0 };
          }
          districtMap[dist].amount += Number(o.total) || 0;
          districtMap[dist].count += 1;
        });
        const districtSales = Object.entries(districtMap)
          .map(([district, val]) => ({ district, amount: val.amount, count: val.count }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5);

        // 5. Category and Popular Item calculations
        const categoryMap: Record<string, { amount: number; qty: number }> = {
          'Classic': { amount: 0, qty: 0 },
          'Mules': { amount: 0, qty: 0 },
          'Sandals': { amount: 0, qty: 0 }
        };
        const itemsMap: Record<string, { name: string; qty: number; revenue: number }> = {};

        filteredOrders.forEach(o => {
          const items = o.items || [];
          items.forEach((item: any) => {
            const qty = Number(item.quantity) || 0;
            const price = Number(item.price) || 0;
            const itemRevenue = price * qty;

            // Popular Items mapping
            const key = item.productId || item.name;
            if (!itemsMap[key]) {
              itemsMap[key] = { name: item.name, qty: 0, revenue: 0 };
            }
            itemsMap[key].qty += qty;
            itemsMap[key].revenue += itemRevenue;

            // Map item to category using parent products details
            const matchedProd = products.find(p => p.id === item.productId);
            const catId = matchedProd?.categoryIds?.[0] || 'c1';
            let catName = 'Classic';
            if (catId === 'c2') catName = 'Mules';
            if (catId === 'c3') catName = 'Sandals';

            if (!categoryMap[catName]) {
              categoryMap[catName] = { amount: 0, qty: 0 };
            }
            categoryMap[catName].amount += itemRevenue;
            categoryMap[catName].qty += qty;
          });
        });

        const categorySales = Object.entries(categoryMap).map(([category, val]) => ({
          category,
          amount: val.amount,
          qty: val.qty
        }));

        const popularItems = Object.values(itemsMap)
          .sort((a, b) => b.qty - a.qty)
          .slice(0, 5);

        setStats({
          totalRevenue,
          totalOrders,
          avgOrderValue,
          completedRate,
          dailySales,
          districtSales,
          categorySales,
          popularItems
        });

      } catch (err) {
        console.error('Failed to calculate analytics metrics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
        <Loader2 size={36} className="text-primary animate-spin" />
        <p className="text-sm font-medium">Crunching transaction records and building graphs...</p>
      </div>
    );
  }

  // Find max value in daily sales for scaling SVG line chart
  const maxDailySales = Math.max(...stats.dailySales.map((d: any) => d.amount), 1000);
  
  // Calculate SVG line path points
  const width = 600;
  const height = 180;
  const padding = 20;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  
  const points = stats.dailySales.map((d: any, idx: number) => {
    const x = padding + (idx / (stats.dailySales.length - 1)) * chartWidth;
    const y = height - padding - (d.amount / maxDailySales) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-serif">Store Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Detailed breakdown of sales performance, orders, and products.</p>
        </div>

        {/* Time Filter Tabs */}
        <div className="flex bg-card border border-border p-1 rounded-2xl self-start">
          {[
            { label: '7 Days', value: '7' },
            { label: '30 Days', value: '30' },
            { label: 'All Time', value: 'all' },
          ].map(t => (
            <button
              key={t.value}
              onClick={() => setTimeRange(t.value as any)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                timeRange === t.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Total Earnings', value: `LKR ${stats.totalRevenue.toLocaleString()}`, icon: <DollarSign size={20} className="text-primary" /> },
          { label: 'Completed Orders', value: stats.totalOrders.toLocaleString(), icon: <ShoppingBag size={20} className="text-primary" /> },
          { label: 'Avg Order Ticket', value: `LKR ${Math.round(stats.avgOrderValue).toLocaleString()}`, icon: <Clock size={20} className="text-primary" /> },
          { label: 'Conversion Rate', value: `${stats.completedRate.toFixed(1)}%`, icon: <User size={20} className="text-primary" /> }
        ].map((c, idx) => (
          <div key={idx} className="bg-card border border-border rounded-3xl p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{c.label}</span>
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white border border-rose-300 shadow-sm text-primary">
                {c.icon}
              </div>
            </div>
            <p className="text-2xl font-extrabold text-foreground tracking-tight">{c.value}</p>
            <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 dark:text-green-400 mt-2">
              <ArrowUpRight size={12} /> Active performance
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SVG Line Chart */}
        <div className="bg-card border border-border rounded-3xl p-6 lg:col-span-2 space-y-4 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-serif font-bold text-base text-foreground">Sales Revenue Graph</h3>
            <p className="text-xs text-muted-foreground">Tracking daily purchase amounts during the filtered range.</p>
          </div>

          <div className="relative w-full h-[180px] mt-4">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary, #6b21a8)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="var(--color-primary, #6b21a8)" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="var(--color-border, #e2e8f0)" strokeWidth="0.5" strokeDasharray="3" />
              <line x1={padding} y1={height/2} x2={width - padding} y2={height/2} stroke="var(--color-border, #e2e8f0)" strokeWidth="0.5" strokeDasharray="3" />
              <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="var(--color-border, #e2e8f0)" strokeWidth="1" />

              {/* Filled Area */}
              {stats.dailySales.length > 1 && (
                <path
                  d={`M ${padding},${height - padding} L ${points} L ${width - padding},${height - padding} Z`}
                  fill="url(#chartGrad)"
                />
              )}

              {/* Line */}
              {stats.dailySales.length > 1 && (
                <polyline
                  fill="none"
                  stroke="var(--color-primary, #9333ea)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={points}
                  className="transition-all duration-500"
                />
              )}

              {/* Dots */}
              {stats.dailySales.map((d: any, idx: number) => {
                const x = padding + (idx / (stats.dailySales.length - 1)) * chartWidth;
                const y = height - padding - (d.amount / maxDailySales) * chartHeight;
                return (
                  <circle
                    key={idx}
                    cx={x}
                    cy={y}
                    r="4"
                    className="fill-primary stroke-card stroke-2 hover:r-6 transition-all duration-200 cursor-pointer"
                  >
                    <title>{`${d.date}: LKR ${d.amount}`}</title>
                  </circle>
                );
              })}
            </svg>
          </div>

          <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase px-2 pt-2 border-t border-border/50">
            <span>{stats.dailySales[0]?.date || 'Start'}</span>
            <span>{stats.dailySales[Math.floor(stats.dailySales.length/2)]?.date || 'Mid'}</span>
            <span>{stats.dailySales[stats.dailySales.length - 1]?.date || 'End'}</span>
          </div>
        </div>

        {/* Doughnut Category Chart (Visual representation using progress bars) */}
        <div className="bg-card border border-border rounded-3xl p-6 space-y-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-serif font-bold text-base text-foreground">Category Sales</h3>
            <p className="text-xs text-muted-foreground">Distribution of revenue generated per slipper category.</p>
          </div>

          <div className="space-y-4 my-auto">
            {stats.categorySales.map((cat: any) => {
              const pct = stats.totalRevenue > 0 ? (cat.amount / stats.totalRevenue) * 100 : 0;
              return (
                <div key={cat.category} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-foreground">
                    <span className="uppercase tracking-wider text-[10px] text-muted-foreground">{cat.category}</span>
                    <span>LKR {cat.amount.toLocaleString()} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full h-3 bg-secondary rounded-full overflow-hidden border border-border/30">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase">{cat.qty} pairs sold</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Details Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* District Sales horizontal chart */}
        <div className="bg-card border border-border rounded-3xl p-6 space-y-5 shadow-sm">
          <div>
            <h3 className="font-serif font-bold text-base text-foreground">Top Shipping Districts</h3>
            <p className="text-xs text-muted-foreground">Geographic distribution of sales revenue across Sri Lanka.</p>
          </div>

          <div className="space-y-4">
            {stats.districtSales.map((d: any, idx: number) => {
              const maxDistSales = Math.max(...stats.districtSales.map((ds: any) => ds.amount), 1);
              const barWidth = (d.amount / maxDistSales) * 100;
              return (
                <div key={d.district} className="flex items-center gap-2 sm:gap-4">
                  <span className="w-16 sm:w-20 text-xs font-bold text-foreground truncate">{d.district}</span>
                  <div className="flex-1 h-8 bg-secondary rounded-xl overflow-hidden relative border border-border/30">
                    <div
                      className="h-full bg-primary/20 border-r-2 border-primary rounded-xl transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    />
                    <span className="absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 text-[9px] sm:text-[10px] font-bold text-foreground uppercase tracking-wider">
                      LKR {d.amount.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-muted-foreground w-10 sm:w-12 text-right">
                    {d.count} <span className="hidden sm:inline">orders</span>
                  </span>
                </div>
              );
            })}
            {stats.districtSales.length === 0 && (
              <p className="text-center text-xs text-muted-foreground font-medium py-10">No geographical data available yet.</p>
            )}
          </div>
        </div>

        {/* Popular slippers products */}
        <div className="bg-card border border-border rounded-3xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-serif font-bold text-base text-foreground">Top Slipper Models</h3>
            <p className="text-xs text-muted-foreground">Most sold products ranked by order quantities.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground pb-2">
                  <th className="py-2">Product</th>
                  <th className="py-2 text-center">Pairs Sold</th>
                  <th className="py-2 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {stats.popularItems.map((item: any, idx: number) => (
                  <tr key={idx} className="border-b border-border/30 last:border-0 hover:bg-secondary/20 transition-colors">
                    <td className="py-3 text-xs font-bold text-foreground flex items-center gap-2 truncate max-w-[200px]">
                      <span className="w-5 h-5 rounded-lg bg-secondary flex items-center justify-center text-[10px] font-bold text-muted-foreground">{idx+1}</span>
                      {item.name}
                    </td>
                    <td className="py-3 text-xs text-center font-bold text-foreground">{item.qty}</td>
                    <td className="py-3 text-xs text-right font-bold text-primary">LKR {item.revenue.toLocaleString()}</td>
                  </tr>
                ))}
                {stats.popularItems.length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-center py-10 text-xs text-muted-foreground font-medium">
                      No slippers ordered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
