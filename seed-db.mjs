import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
  authDomain: "hush-crafts.firebaseapp.com",
  projectId: "hush-crafts",
  storageBucket: "hush-crafts.firebasestorage.app",
  messagingSenderId: "533816937760",
  appId: "1:533816937760:web:1ed17c3eea1bea515c9b45"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const MOCK_DB = {
  products: [
    {
      id: 'p1', name: 'Red Floral Sandal', summary: 'Vibrant red flat slide sandals with large fabric flowers.', description: 'Step into elegance with our handcrafted Red Floral Sandal. Features a wide strap decorated with beautiful red fabric flowers and a glossy red sole.', basePrice: 2850, categoryIds: ['c1'], images: ['/images/red-sandals.png'], status: 'published', isBestSeller: true, isFeatured: true, totalSold: 120, averageRating: 4.8, reviewCount: 45, seo: { title: '', description: '', keywords: [] }
    },
    {
      id: 'p2', name: 'Midnight Purple Slides', summary: 'Black slide sandals with purple and black fabric flowers.', description: 'Elegant and simple, these black slide sandals feature thin straps decorated with alternating purple and black fabric flowers with rhinestone centers.', basePrice: 3200, categoryIds: ['c2'], images: ['/images/black-sandals.png'], status: 'published', isBestSeller: true, isFeatured: true, totalSold: 85, averageRating: 4.9, reviewCount: 32, seo: { title: '', description: '', keywords: [] }
    },
    {
      id: 'p3', name: 'Rainbow Daisy Flip-Flops', summary: 'White thong sandals with a large rainbow daisy.', description: 'Brighten up your day with these fun white flip-flops featuring clear straps and a single large rainbow-colored daisy at the center.', basePrice: 1950, categoryIds: ['c1'], images: ['/images/rainbow-sandals.png'], status: 'published', isBestSeller: false, isFeatured: true, totalSold: 50, averageRating: 4.6, reviewCount: 18, seo: { title: '', description: '', keywords: [] }
    },
    {
      id: 'p4', name: 'Pearl Pink Mules', summary: 'White slide sandals with pink flowers and pearl centers.', description: 'Our elegant white slide sandals with clear wide straps, beautifully adorned with light pink fabric flowers, each having a small pearl in the center.', basePrice: 3500, categoryIds: ['c3'], images: ['/images/pink-sandals.png'], status: 'published', isBestSeller: true, isFeatured: true, totalSold: 210, averageRating: 5.0, reviewCount: 88, seo: { title: '', description: '', keywords: [] }
    },
    {
      id: 'p5', name: 'Coral Sunrise Flats', summary: 'Elegant flat sandals with a coral flower accent.', description: 'Simple, chic, and comfortable. These coral sunrise flats bring warmth to any outfit.', basePrice: 2200, categoryIds: ['c1'], images: ['/images/red-sandals.png'], status: 'published', isBestSeller: true, isFeatured: true, totalSold: 150, averageRating: 4.7, reviewCount: 62, seo: { title: '', description: '', keywords: [] }
    },
    {
      id: 'p6', name: 'Orchid Dream Sandals', summary: 'Stunning purple strap sandals with orchid motifs.', description: 'Breathe life into your step with the Orchid Dream sandals featuring deep purple hues.', basePrice: 2750, categoryIds: ['c2'], images: ['/images/black-sandals.png'], status: 'published', isBestSeller: true, isFeatured: true, totalSold: 92, averageRating: 4.8, reviewCount: 40, seo: { title: '', description: '', keywords: [] }
    }
  ],
  categories: [
    { id: 'c1', name: 'Classic', slug: 'classic', productCount: 2, image: '/images/red-sandals.png' },
    { id: 'c2', name: 'Mules', slug: 'mules', productCount: 1, image: '/images/black-sandals.png' },
    { id: 'c3', name: 'Sandals', slug: 'sandals', productCount: 1, image: '/images/pink-sandals.png' },
  ]
};

async function seed() {
  console.log("Starting DB seeding...");
  try {
    for (const cat of MOCK_DB.categories) {
      await setDoc(doc(db, "categories", cat.id), cat);
      console.log("Seeded category:", cat.name);
    }

    for (const prod of MOCK_DB.products) {
      const pData = {
        ...prod,
        variants: [
          { id: 'v1', sku: `${prod.id}-36`, price: prod.basePrice, attributes: { size: '36', color: 'Standard' }, status: 'in_stock' },
          { id: 'v2', sku: `${prod.id}-37`, price: prod.basePrice, attributes: { size: '37', color: 'Standard' }, status: 'in_stock' },
          { id: 'v3', sku: `${prod.id}-38`, price: prod.basePrice, attributes: { size: '38', color: 'Standard' }, status: 'low_stock' },
        ]
      };
      await setDoc(doc(db, "products", prod.id), pData);
      console.log("Seeded product:", prod.name);
    }
    console.log("Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seed();
