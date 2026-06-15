"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const firebaseAdmin_1 = require("../config/firebaseAdmin");
class DashboardController {
    /**
     * GET /api/v1/admin/dashboard/stats — aggregate KPIs for the admin dashboard
     */
    static async getStats(req, res, next) {
        try {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
            const [ordersSnap, pendingSnap, lowStockSnap, monthOrdersSnap, lastMonthOrdersSnap, customersSnap, productsSnap] = await Promise.all([
                // All time totals
                firebaseAdmin_1.db.collection('orders').where('isDeleted', '==', false).get(),
                // Pending orders
                firebaseAdmin_1.db.collection('orders')
                    .where('isDeleted', '==', false)
                    .where('orderStatus', '==', 'pending')
                    .get(),
                // Low stock items
                firebaseAdmin_1.db.collection('inventory')
                    .where('status', 'in', ['low_stock', 'out_of_stock'])
                    .get(),
                // This month's orders
                firebaseAdmin_1.db.collection('orders')
                    .where('isDeleted', '==', false)
                    .where('createdAt', '>=', startOfMonth)
                    .get(),
                // Last month's orders (for comparison)
                firebaseAdmin_1.db.collection('orders')
                    .where('isDeleted', '==', false)
                    .where('createdAt', '>=', startOfLastMonth)
                    .where('createdAt', '<=', endOfLastMonth)
                    .get(),
                // Total customers
                firebaseAdmin_1.db.collection('customers').get(),
                // Total published products
                firebaseAdmin_1.db.collection('products')
                    .where('status', '==', 'published')
                    .where('isDeleted', '==', false)
                    .get()
            ]);
            // Calculate revenue
            const totalRevenue = ordersSnap.docs.reduce((sum, doc) => {
                const data = doc.data();
                return data.orderStatus !== 'cancelled' ? sum + (data.total || 0) : sum;
            }, 0);
            const monthRevenue = monthOrdersSnap.docs.reduce((sum, doc) => {
                const data = doc.data();
                return data.orderStatus !== 'cancelled' ? sum + (data.total || 0) : sum;
            }, 0);
            const lastMonthRevenue = lastMonthOrdersSnap.docs.reduce((sum, doc) => {
                const data = doc.data();
                return data.orderStatus !== 'cancelled' ? sum + (data.total || 0) : sum;
            }, 0);
            const revenueGrowth = lastMonthRevenue > 0
                ? ((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
                : 100;
            // Recent orders (last 10)
            const recentOrdersSnap = await firebaseAdmin_1.db.collection('orders')
                .where('isDeleted', '==', false)
                .orderBy('createdAt', 'desc')
                .limit(10)
                .get();
            const recentOrders = recentOrdersSnap.docs.map(doc => ({
                id: doc.id,
                customerName: doc.data().customerDetails?.fullName,
                total: doc.data().total,
                orderStatus: doc.data().orderStatus,
                createdAt: doc.data().createdAt
            }));
            return res.status(200).json({
                success: true,
                data: {
                    kpi: {
                        totalOrders: ordersSnap.size,
                        totalRevenue,
                        monthRevenue,
                        revenueGrowth: Math.round(revenueGrowth * 10) / 10,
                        pendingOrders: pendingSnap.size,
                        lowStockItems: lowStockSnap.size,
                        totalCustomers: customersSnap.size,
                        totalProducts: productsSnap.size,
                        monthOrders: monthOrdersSnap.size,
                        lastMonthOrders: lastMonthOrdersSnap.size
                    },
                    recentOrders
                }
            });
        }
        catch (err) {
            return next(err);
        }
    }
    /**
     * GET /api/v1/admin/dashboard/revenue-chart — daily revenue for last 30 days
     */
    static async getRevenueChart(req, res, next) {
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const ordersSnap = await firebaseAdmin_1.db.collection('orders')
                .where('isDeleted', '==', false)
                .where('orderStatus', '!=', 'cancelled')
                .where('createdAt', '>=', thirtyDaysAgo)
                .orderBy('createdAt', 'asc')
                .get();
            // Group by day
            const dailyMap = {};
            ordersSnap.docs.forEach(doc => {
                const data = doc.data();
                const date = data.createdAt?.toDate
                    ? data.createdAt.toDate().toISOString().slice(0, 10)
                    : new Date(data.createdAt).toISOString().slice(0, 10);
                if (!dailyMap[date]) {
                    dailyMap[date] = { date, revenue: 0, orders: 0 };
                }
                dailyMap[date].revenue += data.total || 0;
                dailyMap[date].orders += 1;
            });
            const chartData = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));
            return res.status(200).json({ success: true, data: { chartData } });
        }
        catch (err) {
            return next(err);
        }
    }
}
exports.DashboardController = DashboardController;
//# sourceMappingURL=dashboardController.js.map