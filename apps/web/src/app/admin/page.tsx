'use client';

import { useState, useEffect } from 'react';
import {
  ShoppingCart, TrendingUp, Package, Users,
  AlertTriangle, Clock, CheckCircle2, DollarSign,
  ArrowUpRight, ArrowDownRight, MoreHorizontal, Loader2
} from '@/components/MaterialIcons';
import { db } from '@/lib/firebase';
import { collection, getDocs, limit, query, orderBy } from 'firebase/firestore';
import Link from 'next/link';

const STATUS_STYLES: Record<string, string> = {
  pending: 'px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300',
  confirmed: 'px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider border border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300',
  processing: 'px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider border border-purple-300 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300',
  packed: 'px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider border border-indigo-300 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300',
  dispatched: 'px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider border border-cyan-300 dark:border-cyan-800 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300',
  delivered: 'px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider border border-teal-300 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300',
  completed: 'px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider border border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-950/40 text-green-800 dark:text-green-300',
  cancelled: 'px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300',
  returned: 'px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider border border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300'
};

function KpiCard({
  icon, label, value, subValue
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
}) {
  return (
    <div className="bg-card rounded-3xl border border-border p-6 hover:border-primary/30 hover:shadow-lg transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white border border-rose-300 shadow-sm text-primary">
          {icon}
        </div>
      </div>
      <p className="text-3xl font-extrabold text-foreground tracking-tight">{value}</p>
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-2">{label}</p>
      {subValue && <p className="text-xs text-muted-foreground mt-1 font-medium">{subValue}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [kpi, setKpi] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    monthRevenue: 0,
    pendingOrders: 0,
    lowStockItems: 0,
    totalCustomers: 0,
    totalProducts: 0,
    monthOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        // 1. Fetch Orders
        const ordersSnap = await getDocs(collection(db, 'orders'));
        const ordersList: any[] = [];
        let totalRev = 0;
        let pendingCount = 0;
        let currentMonthRev = 0;
        let currentMonthCount = 0;

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); // 0-indexed

        ordersSnap.docs.forEach((doc) => {
          const data = doc.data();
          const orderDate = data.createdAt?.seconds 
            ? new Date(data.createdAt.seconds * 1000) 
            : data.createdAt 
            ? new Date(data.createdAt) 
            : new Date();

          const total = Number(data.total) || 0;
          const status = data.orderStatus || data.status || 'pending';

          ordersList.push({
            id: doc.id,
            customerName: data.customerDetails?.fullName || 'Guest Customer',
            total,
            orderStatus: status,
            createdAt: orderDate,
          });

          // Calculations for stats
          if (status !== 'cancelled') {
            totalRev += total;

            if (orderDate.getFullYear() === currentYear && orderDate.getMonth() === currentMonth) {
              currentMonthRev += total;
              currentMonthCount++;
            }
          }

          if (status === 'pending') {
            pendingCount++;
          }
        });

        // Sort orders for recent display
        ordersList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setRecentOrders(ordersList.slice(0, 5));

        // 2. Fetch Customers/Users
        const usersSnap = await getDocs(collection(db, 'users'));
        const customersCount = usersSnap.size;

        // 3. Fetch Products for Stock Status
        const productsSnap = await getDocs(collection(db, 'products'));
        let productsCount = 0;
        let lowStockCount = 0;

        productsSnap.docs.forEach((doc) => {
          const data = doc.data();
          if (data.status === 'published') {
            productsCount++;
          }

          // Count low stock items inside variants
          const variants = data.variants || [];
          variants.forEach((v: any) => {
            const isLowStock = v.status === 'low_stock' || v.status === 'out_of_stock' || (v.quantity !== undefined && v.quantity <= (v.threshold || 5));
            if (isLowStock) {
              lowStockCount++;
            }
          });
        });

        setKpi({
          totalOrders: ordersSnap.size,
          totalRevenue: totalRev,
          monthRevenue: currentMonthRev,
          pendingOrders: pendingCount,
          lowStockItems: lowStockCount,
          totalCustomers: customersCount,
          totalProducts: productsCount,
          monthOrders: currentMonthCount,
        });

      } catch (err) {
        console.error('Failed to load dashboard statistics:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
        <Loader2 size={36} className="text-primary animate-spin" />
        <p className="text-sm font-medium">Aggregating live store statistics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground font-serif">Store Overview</h1>
        <p className="text-muted-foreground text-sm mt-1">Real-time metrics synced directly with Firebase Firestore.</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          icon={<ShoppingCart size={20} className="text-primary" />}
          label="Total Orders"
          value={kpi.totalOrders.toLocaleString()}
          subValue={`+${kpi.monthOrders} this month`}
        />
        <KpiCard
          icon={<DollarSign size={20} className="text-primary" />}
          label="Monthly Revenue"
          value={`LKR ${(kpi.monthRevenue / 1000).toFixed(1)}k`}
          subValue={`Total: LKR ${(kpi.totalRevenue / 1000).toFixed(0)}k`}
        />
        <KpiCard
          icon={<Clock size={20} className="text-primary" />}
          label="Pending Orders"
          value={kpi.pendingOrders.toString()}
          subValue="Requires action"
        />
        <KpiCard
          icon={<AlertTriangle size={20} className="text-primary" />}
          label="Low Stock Items"
          value={kpi.lowStockItems.toString()}
          subValue="Restock variants"
        />
        <KpiCard
          icon={<Users size={20} className="text-primary" />}
          label="Registered Users"
          value={kpi.totalCustomers.toLocaleString()}
          subValue="In customer database"
        />
        <KpiCard
          icon={<Package size={20} className="text-primary" />}
          label="Active Products"
          value={kpi.totalProducts.toString()}
          subValue="Published catalog"
        />
        <KpiCard
          icon={<TrendingUp size={20} className="text-primary" />}
          label="Gross Revenue"
          value={`LKR ${(kpi.totalRevenue / 1000000).toFixed(2)}M`}
          subValue="Excluding cancelled"
        />
        <KpiCard
          icon={<CheckCircle2 size={20} className="text-primary" />}
          label="Month Orders"
          value={kpi.monthOrders.toString()}
          subValue="Placed in current month"
        />
      </div>

      {/* Recent orders table */}
      <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <h2 className="font-serif font-bold text-lg text-foreground">Recent Orders</h2>
          <Link href="/admin/orders" className="text-xs text-primary hover:underline font-bold uppercase tracking-wider">
            View All Orders →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/35 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                <th className="text-left px-6 py-4">Order ID</th>
                <th className="text-left px-4 py-4">Customer</th>
                <th className="text-left px-4 py-4">Amount</th>
                <th className="text-left px-4 py-4">Status</th>
                <th className="text-left px-4 py-4">Date Placed</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(order => (
                <tr
                  key={order.id}
                  className="border-b border-border/40 last:border-0 hover:bg-secondary/20 transition-colors"
                >
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs font-semibold text-foreground">{order.id}</span>
                  </td>
                  <td className="px-4 py-4 text-sm text-foreground font-medium">{order.customerName}</td>
                  <td className="px-4 py-4 text-sm font-bold text-primary">
                    LKR {order.total.toLocaleString()}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full ${STATUS_STYLES[order.orderStatus] || 'px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border border-border bg-secondary text-muted-foreground'}`}>
                      {order.orderStatus}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-xs text-muted-foreground">
                    {order.createdAt.toLocaleDateString('en-LK', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-muted-foreground text-sm font-medium">
                    No orders placed yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
