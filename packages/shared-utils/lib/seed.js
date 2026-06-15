"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = seedDatabase;
const firebaseAdmin_1 = require("../../apps/backend/functions/src/config/firebaseAdmin");
async function seedDatabase() {
    console.log('Starting Firestore local seeding...');
    // 1. Seed Categories
    const categories = [
        { id: 'cat_velvet', name: 'Classic Velvet', slug: 'classic-velvet', description: 'Plush velvet slippers for indoor comfort', isActive: true, order: 1 },
        { id: 'cat_fleece', name: 'Warm Fleece', slug: 'warm-fleece', description: 'Cozy fleece lining for chillier days', isActive: true, order: 2 },
        { id: 'cat_satin', name: 'Satin Chic', slug: 'satin-chic', description: 'Elegant satin straps for summer style', isActive: true, order: 3 }
    ];
    for (const cat of categories) {
        await firebaseAdmin_1.db.collection('categories').doc(cat.id).set({
            ...cat,
            parentId: null,
            image: null,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        console.log(`Seeded category: ${cat.name}`);
    }
    // 2. Seed Coupons
    const coupons = [
        {
            id: 'WELCOME10',
            discountType: 'percentage',
            discountValue: 10,
            minOrderValue: 2000,
            usageLimit: 1000,
            usedCount: 0,
            startDate: new Date(),
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year out
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            id: 'COSY500',
            discountType: 'fixed_amount',
            discountValue: 500,
            minOrderValue: 4000,
            usageLimit: 500,
            usedCount: 0,
            startDate: new Date(),
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        }
    ];
    for (const coupon of coupons) {
        await firebaseAdmin_1.db.collection('coupons').doc(coupon.id).set(coupon);
        console.log(`Seeded coupon: ${coupon.id}`);
    }
    // 3. Seed Products, Variants and Inventory
    const productsList = [
        {
            id: 'prod_velvet_cloud',
            name: 'Velvet Cloud Slippers',
            slug: 'velvet-cloud-slippers',
            description: '<p>Our signature slippers made from premium velvet fabric and double-padded foam insoles for cloud-like comfort.</p>',
            summary: 'Luxuriously soft premium velvet indoor slippers.',
            basePrice: 4200,
            categoryIds: ['cat_velvet'],
            images: [
                'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&q=80&w=600',
                'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=600'
            ],
            status: 'published',
            rating: 4.8,
            reviewCount: 12,
            seo: {
                title: 'Velvet Cloud Slippers | Handmade Slippers Sri Lanka',
                description: 'Shop signature handmade velvet slippers in Sri Lanka. Crafted for extreme comfort.',
                keywords: ['handmade slippers', 'velvet slippers Sri Lanka', 'hush craft']
            },
            variants: [
                { id: 'v_vc_beige_37', sku: 'HC-VC-BG-37', size: '37', color: 'Beige', stock: 15 },
                { id: 'v_vc_beige_38', sku: 'HC-VC-BG-38', size: '38', color: 'Beige', stock: 20 },
                { id: 'v_vc_rose_37', sku: 'HC-VC-RS-37', size: '37', color: 'Rose Gold', stock: 8 },
                { id: 'v_vc_rose_38', sku: 'HC-VC-RS-38', size: '38', color: 'Rose Gold', stock: 12 }
            ]
        },
        {
            id: 'prod_fleece_cozy',
            name: 'Cozy Sherpa Slippers',
            slug: 'cozy-sherpa-slippers',
            description: '<p>Keep your feet warm during cold mornings with our soft Sherpa fleece slippers. Features non-slip rubber soles.</p>',
            summary: 'Sherpa fleece slippers with warm lining.',
            basePrice: 4800,
            categoryIds: ['cat_fleece'],
            images: [
                'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=600'
            ],
            status: 'published',
            rating: 4.9,
            reviewCount: 7,
            seo: {
                title: 'Cozy Sherpa Slippers | Warm Slippers Sri Lanka',
                description: 'Warm and comfortable Sherpa fleece indoor slippers with rubber sole.',
                keywords: ['warm slippers', 'sherpa slippers Sri Lanka']
            },
            variants: [
                { id: 'v_cs_grey_38', sku: 'HC-CS-GY-38', size: '38', color: 'Charcoal Grey', stock: 5 },
                { id: 'v_cs_grey_39', sku: 'HC-CS-GY-39', size: '39', color: 'Charcoal Grey', stock: 10 },
                { id: 'v_cs_white_38', sku: 'HC-CS-WT-38', size: '38', color: 'Ivory White', stock: 2 } // Low stock case
            ]
        }
    ];
    for (const prod of productsList) {
        const { variants, ...prodData } = prod;
        // Save main product
        await firebaseAdmin_1.db.collection('products').doc(prod.id).set({
            ...prodData,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
            isDeleted: false
        });
        // Save variants & inventory items
        for (const v of variants) {
            // 1. Write variant document to product variants subcollection
            await firebaseAdmin_1.db.collection('products').doc(prod.id).collection('variants').doc(v.id).set({
                id: v.id,
                sku: v.sku,
                price: null,
                compareAtPrice: null,
                attributes: {
                    size: v.size,
                    color: v.color
                },
                image: null,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            // 2. Write inventory record to root inventory collection
            await firebaseAdmin_1.db.collection('inventory').doc(v.sku).set({
                id: v.sku,
                productId: prod.id,
                variantId: v.id,
                quantity: v.stock,
                reservedQuantity: 0,
                lowStockThreshold: 5,
                status: v.stock === 0 ? 'out_of_stock' : v.stock <= 5 ? 'low_stock' : 'in_stock',
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }
        console.log(`Seeded product: ${prod.name} with ${variants.length} variations`);
    }
    // 4. Seed basic store settings
    await firebaseAdmin_1.db.collection('settings').doc('store_settings').set({
        values: {
            adminEmail: 'orders@hushcraft.lk',
            storeName: 'Hush Craft Sri Lanka',
            contactPhone: '+94771234567'
        },
        updatedAt: new Date(),
        updatedBy: 'seeder'
    });
    console.log('Seeded store settings.');
    console.log('Firestore seeding completed successfully.');
}
// Check if running directly in node
if (require.main === module) {
    // Set up local environment config if connecting to emulator
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
    seedDatabase().catch(console.error);
}
//# sourceMappingURL=seed.js.map