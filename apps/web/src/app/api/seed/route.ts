import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

const MOCK_DB = {
  products: [
    {
      id: 'rosa-malee',
      name: 'Rosa Malee (Rose Jasmine)',
      summary: 'Elegant slide slippers featuring beautiful pink rose fabric flower motifs.',
      description: 'Step into grace and comfort with the Rosa Malee slides. Handcrafted with delicate pink rose fabric flower motifs set on comfortable, padded straps.',
      basePrice: 2950,
      categoryIds: ['c1'],
      images: [decodeURIComponent('https://res.cloudinary.com/don5ltush/image/upload/v1781510078/%E0%B6%BB%E0%B7%9D%E0%B7%83_%E0%B6%B8%E0%B6%BD%E0%B7%93_dv9qpi.jpg')],
      status: 'published',
      isBestSeller: true,
      isFeatured: true,
      totalSold: 120,
      averageRating: 4.8,
      reviewCount: 45,
      seo: { title: 'Rosa Malee Slipper - Hush Craft', description: 'Handcrafted rose flower slide slippers', keywords: ['rosa malee', 'slippers', 'hush craft'] }
    },
    {
      id: 'dam-lily-malee',
      name: 'Dam Lily Malee (Purple Lily)',
      summary: 'Stunning deep purple lily flower accents set on elegant black straps.',
      description: 'Elegant and bold, the Dam Lily Malee slippers feature deep purple fabric lilies with rhinestone centers, mounted on high-quality black straps.',
      basePrice: 3100,
      categoryIds: ['c2'],
      images: [decodeURIComponent('https://res.cloudinary.com/don5ltush/image/upload/v1781510078/%E0%B6%AF%E0%B6%B8%E0%B7%8A_%E0%B6%BD%E0%B7%92%E0%B6%BD%E0%B7%93_%E0%B6%B8%E0%B6%BD%E0%B7%92_biadon.jpg')],
      status: 'published',
      isBestSeller: true,
      isFeatured: true,
      totalSold: 85,
      averageRating: 4.9,
      reviewCount: 32,
      seo: { title: 'Dam Lily Malee - Hush Craft', description: 'Purple lily flower mules', keywords: ['purple lily', 'mules', 'slippers'] }
    },
    {
      id: 'nil-samanalee',
      name: 'Nil Samanalee (Blue Butterfly)',
      summary: 'Exquisite blue butterfly-style strap accents with soft sole bedding.',
      description: 'Feel light as a butterfly with our Nil Samanalee sandals. Features gorgeous blue butterfly wing-inspired accents and a cushioned, non-slip base.',
      basePrice: 2800,
      categoryIds: ['c3'],
      images: [decodeURIComponent('https://res.cloudinary.com/don5ltush/image/upload/v1781510077/%E0%B6%B1%E0%B7%92%E0%B6%BD%E0%B7%8A_%E0%B7%83%E0%B6%B8%E0%B6%B1%E0%B6%BD%E0%B7%93_awiu92.jpg')],
      status: 'published',
      isBestSeller: false,
      isFeatured: true,
      totalSold: 50,
      averageRating: 4.7,
      reviewCount: 18,
      seo: { title: 'Nil Samanalee Sandals - Hush Craft', description: 'Blue butterfly flat sandals', keywords: ['blue butterfly', 'sandals', 'samanalee'] }
    },
    {
      id: 'sudu-malee',
      name: 'Sudu Malee (White Jasmine)',
      summary: 'Pure white floral slides adorned with layered fabric blossoms.',
      description: 'A clean, timeless look. The Sudu Malee slides feature stunning layered white jasmine blossoms on a soft white strap for a clean and elegant finish.',
      basePrice: 2750,
      categoryIds: ['c1'],
      images: [decodeURIComponent('https://res.cloudinary.com/don5ltush/image/upload/v1781510077/%E0%B7%83%E0%B7%94%E0%B6%AF%E0%B7%94_%E0%B6%B8%E0%B6%BD%E0%B7%93_ze5io3.jpg')],
      status: 'published',
      isBestSeller: true,
      isFeatured: true,
      totalSold: 210,
      averageRating: 5.0,
      reviewCount: 88,
      seo: { title: 'Sudu Malee Slipper - Hush Craft', description: 'Pure white floral slipper slides', keywords: ['white jasmine', 'floral slides', 'sudu malee'] }
    },
    {
      id: 'rathu-malee',
      name: 'Rathu Malee (Red Jasmine)',
      summary: 'Vibrant red flat slide sandals with large red fabric flowers.',
      description: 'Make a bold statement with our Rathu Malee slides. Decorated with large, vibrant red fabric flower petals on a comfortable gloss-red base.',
      basePrice: 2850,
      categoryIds: ['c1'],
      images: [decodeURIComponent('https://res.cloudinary.com/don5ltush/image/upload/v1781510076/%E0%B6%BB%E0%B6%AD%E0%B7%94_%E0%B6%B8%E0%B6%BD%E0%B7%93_%EF%B8%8F_xdobzl.jpg')],
      status: 'published',
      isBestSeller: true,
      isFeatured: true,
      totalSold: 150,
      averageRating: 4.8,
      reviewCount: 62,
      seo: { title: 'Rathu Malee - Hush Craft', description: 'Vibrant red flat slide sandals', keywords: ['red sandals', 'floral slides', 'rathu malee'] }
    },
    {
      id: 'lily-malee',
      name: 'Lily Malee (Lily Jasmine)',
      summary: 'Delicate lily design slides combining white and pink highlights.',
      description: 'Beautifully crafted with delicate pink and white fabric lilies. The Lily Malee sandals offer light, summery vibes with soft underfoot cushioning.',
      basePrice: 2990,
      categoryIds: ['c3'],
      images: [decodeURIComponent('https://res.cloudinary.com/don5ltush/image/upload/v1781510076/%E0%B6%BD%E0%B7%92%E0%B6%BD%E0%B7%93_%E0%B6%B8%E0%B6%BD%E0%B7%92_faw1wj.jpg')],
      status: 'published',
      isBestSeller: false,
      isFeatured: false,
      totalSold: 42,
      averageRating: 4.6,
      reviewCount: 15,
      seo: { title: 'Lily Malee - Hush Craft', description: 'Pink and white lily sandals', keywords: ['lily', 'sandals', 'floral'] }
    },
    {
      id: 'dedunu-rainbow',
      name: 'Dedunu (Rainbow)',
      summary: 'Vibrant multicolored floral slides featuring the hues of a rainbow.',
      description: 'Bring joy to your steps with the Dedunu slides. Adorned with multicolored floral accents to brighten any casual outfit.',
      basePrice: 3250,
      categoryIds: ['c3'],
      images: [decodeURIComponent('https://res.cloudinary.com/don5ltush/image/upload/v1781510075/%E0%B6%AF%E0%B7%9A%E0%B6%AF%E0%B7%94%E0%B6%B1%E0%B7%94_zjxfvf.jpg')],
      status: 'published',
      isBestSeller: true,
      isFeatured: true,
      totalSold: 98,
      averageRating: 4.9,
      reviewCount: 29,
      seo: { title: 'Dedunu Rainbow Slides - Hush Craft', description: 'Multicolored floral slides', keywords: ['rainbow', 'slides', 'dedunu', 'multicolored'] }
    },
    {
      id: 'kaha-malee',
      name: 'Kaha Malee (Yellow Jasmine)',
      summary: 'Cheerful yellow floral slides to brighten up sunny days.',
      description: 'Bright and sunny, the Kaha Malee slides feature vibrant yellow fabric blossoms to add a warm, cheerful tone to your style.',
      basePrice: 2700,
      categoryIds: ['c1'],
      images: [decodeURIComponent('https://res.cloudinary.com/don5ltush/image/upload/v1781510074/%E0%B6%9A%E0%B7%84_%E0%B6%B8%E0%B6%BD%E0%B7%93_fif4bh.jpg')],
      status: 'published',
      isBestSeller: false,
      isFeatured: true,
      totalSold: 70,
      averageRating: 4.7,
      reviewCount: 22,
      seo: { title: 'Kaha Malee - Hush Craft', description: 'Yellow floral slide slippers', keywords: ['yellow slides', 'kaha malee', 'floral'] }
    },
    {
      id: 'nil-kumari',
      name: 'Nil Kumari (Blue Princess)',
      summary: 'Royal blue floral slide slippers with sparkling rhinestone centers.',
      description: 'Emanate elegance with the Nil Kumari slides. Features deep royal blue fabric blossoms highlighted by glittering rhinestone centers on a soft black base.',
      basePrice: 3400,
      categoryIds: ['c2'],
      images: [decodeURIComponent('https://res.cloudinary.com/don5ltush/image/upload/v1781510074/%E0%B6%B1%E0%B7%92%E0%B6%BD%E0%B7%8A_%E0%B6%9A%E0%B7%94%E0%B6%B8%E0%B7%8F%E0%B6%BB%E0%B7%92_pz4ofu.jpg')],
      status: 'published',
      isBestSeller: true,
      isFeatured: true,
      totalSold: 135,
      averageRating: 5.0,
      reviewCount: 54,
      seo: { title: 'Nil Kumari - Hush Craft', description: 'Royal blue princess floral slides', keywords: ['blue princess', 'royal blue', 'slides', 'nil kumari'] }
    },
    {
      id: 'kalu-samanalee',
      name: 'Kalu Samanalee (Black Butterfly)',
      summary: 'Sleek black butterfly-style strap design. Bold and versatile.',
      description: 'Simple yet bold, the Kalu Samanalee flat slides feature sleek black butterfly strap details that match beautifully with any outfit.',
      basePrice: 2900,
      categoryIds: ['c2'],
      images: [decodeURIComponent('https://res.cloudinary.com/don5ltush/image/upload/v1781510073/%E0%B6%9A%E0%B6%BD%E0%B7%94_%E0%B7%83%E0%B6%B8%E0%B6%B1%E0%B6%BD%E0%B7%93_p3haln.jpg')],
      status: 'published',
      isBestSeller: false,
      isFeatured: false,
      totalSold: 64,
      averageRating: 4.6,
      reviewCount: 20,
      seo: { title: 'Kalu Samanalee - Hush Craft', description: 'Black butterfly slides', keywords: ['black butterfly', 'mules', 'kalu samanalee'] }
    },
    {
      id: 'suriyakanthi-sunflower',
      name: 'Suriyakanthi (Sunflower)',
      summary: 'Beautiful sunflower-styled strap sandals that bring cheer to your walk.',
      description: 'Handcrafted with bright yellow and black sunflower motifs, the Suriyakanthi sandals offer positive, sunny vibes and premium sole comfort.',
      basePrice: 3150,
      categoryIds: ['c1'],
      images: [decodeURIComponent('https://res.cloudinary.com/don5ltush/image/upload/v1781510073/%E0%B7%83%E0%B7%96%E0%B6%BC%E0%B7%92%E0%B6%BA%E0%B6%9A%E0%B7%8F%E0%B6%B1%E0%B7%8A%E0%B6%AD%E0%B7%92_ba4kda.jpg')],
      status: 'published',
      isBestSeller: true,
      isFeatured: true,
      totalSold: 110,
      averageRating: 4.8,
      reviewCount: 42,
      seo: { title: 'Suriyakanthi Sunflower - Hush Craft', description: 'Sunflower strap sandals', keywords: ['sunflower', 'sandals', 'suriyakanthi'] }
    },
    {
      id: 'rosa-pata-malee',
      name: 'Rosa Pata Malee (Pink Petal)',
      summary: 'Soft pink floral slides with delicate layers of plush petals.',
      description: 'The Rosa Pata Malee slides offer premium comfort with highly detailed layered pink petals, set on a cushioned white base.',
      basePrice: 2950,
      categoryIds: ['c1'],
      images: [decodeURIComponent('https://res.cloudinary.com/don5ltush/image/upload/v1781510073/%E0%B6%BB%E0%B7%9D%E0%B7%83_%E0%B6%B4%E0%B7%8F%E0%B6%A7_%E0%B6%B8%E0%B6%BD%E0%B7%93_sys2lk.jpg')],
      status: 'published',
      isBestSeller: false,
      isFeatured: true,
      totalSold: 78,
      averageRating: 4.7,
      reviewCount: 26,
      seo: { title: 'Rosa Pata Malee - Hush Craft', description: 'Pink petal floral slides', keywords: ['pink slides', 'rosa pata medium', 'petals'] }
    },
    {
      id: 'aluth-malee',
      name: 'Aluth Malee (New Blossom)',
      summary: 'Modern blossom slide design with fresh colors and sleek sole.',
      description: 'A fresh addition to our floral catalog, Aluth Malee features a modern pastel blossom design on a flexible, highly durable flat sole.',
      basePrice: 3000,
      categoryIds: ['c3'],
      images: [decodeURIComponent('https://res.cloudinary.com/don5ltush/image/upload/v1781510073/%E0%B6%85%E0%B6%BD%E0%B7%94%E0%B6%AD%E0%B7%8A_%E0%B6%B8%E0%B6%BD%E0%B7%93_mpzrbh.jpg')],
      status: 'published',
      isBestSeller: false,
      isFeatured: true,
      totalSold: 30,
      averageRating: 4.5,
      reviewCount: 9,
      seo: { title: 'Aluth Malee - Hush Craft', description: 'New blossom flat slides', keywords: ['aluth malee', 'slides', 'slipper'] }
    },
    {
      id: 'neelamanee-sapphire',
      name: 'Neelamanee (Sapphire)',
      summary: 'Rich sapphire-blue flower mules combining plush comfort and depth.',
      description: 'Named after the precious sapphire, the Neelamanee mules feature dense, rich blue velvet-like flowers on thick, premium-padded straps.',
      basePrice: 3300,
      categoryIds: ['c2'],
      images: [decodeURIComponent('https://res.cloudinary.com/don5ltush/image/upload/v1781510072/%E0%B6%B1%E0%B7%93%E0%B6%B4%E0%B6%B8%E0%B6%B1%E0%B7%93_gi9q7s.jpg')],
      status: 'published',
      isBestSeller: true,
      isFeatured: true,
      totalSold: 145,
      averageRating: 5.0,
      reviewCount: 61,
      seo: { title: 'Neelamanee Sapphire Slides - Hush Craft', description: 'Blue sapphire floral mules', keywords: ['neelamanee', 'sapphire', 'mules', 'blue slides'] }
    },
    {
      id: 'sudu-malee-lily',
      name: 'Sudu Malee (Pure White Lily)',
      summary: 'Elegant white jasmine slipper slides with premium cushioned soles.',
      description: 'A luxurious variation of our white jasmine line, using double-layered strap fabric and high-resiliency sole cushioning.',
      basePrice: 2750,
      categoryIds: ['c1'],
      images: [decodeURIComponent('https://res.cloudinary.com/don5ltush/image/upload/v1781510072/%E0%B7%83%E0%B7%94%E0%B6%AF%E0%B7%94_%E0%B6%B8%E0%B6%BD%E0%B7%93_utvadp.jpg')],
      status: 'published',
      isBestSeller: false,
      isFeatured: false,
      totalSold: 88,
      averageRating: 4.8,
      reviewCount: 31,
      seo: { title: 'Sudu Malee White Lily - Hush Craft', description: 'White lily floral slides', keywords: ['white lily', 'slides', 'sudu malee'] }
    },
    {
      id: 'komala-liya',
      name: 'Komala Liya (Graceful Lady)',
      summary: 'Delicate slides with stylish pink and cream floral accents.',
      description: 'Designed for grace and poise, the Komala Liya slides feature delicate light pink and cream fabric blossoms with built-in sole arch support.',
      basePrice: 3100,
      categoryIds: ['c3'],
      images: [decodeURIComponent('https://res.cloudinary.com/don5ltush/image/upload/v1781510072/%E0%B6%9A%E0%B7%9C%E0%B6%B8%E0%B6%BD_%E0%B6%BD%E0%B7%92%E0%B6%B8%E0%B7%8F_%EF%B8%8F_p9wftr.jpg')],
      status: 'published',
      isBestSeller: true,
      isFeatured: true,
      totalSold: 112,
      averageRating: 4.9,
      reviewCount: 40,
      seo: { title: 'Komala Liya - Hush Craft', description: 'Graceful lady floral slides', keywords: ['komala liya', 'sandals', 'slides'] }
    },
    {
      id: 'hush-classic-gold',
      name: 'Hush Classic Gold',
      summary: 'Traditional gold-tinted floral sandal slide for premium style.',
      description: 'Elegant golden hues on handcrafted fabric flowers. Perfect for festive celebrations, matching luxury with comfortable walkability.',
      basePrice: 3200,
      categoryIds: ['c1'],
      images: ['https://res.cloudinary.com/don5ltush/image/upload/v1781510072/700987729_1346539884323674_2260041146287108164_n_amullt.jpg'],
      status: 'published',
      isBestSeller: true,
      isFeatured: false,
      totalSold: 93,
      averageRating: 4.8,
      reviewCount: 37,
      seo: { title: 'Hush Classic Gold - Hush Craft', description: 'Gold floral sandal slides', keywords: ['gold slides', 'classic gold', 'slippers'] }
    },
    {
      id: 'sudu-malee-ii',
      name: 'Sudu Malee II (White Jasmine II)',
      summary: 'Refined white flower slides with updated strap aesthetics.',
      description: 'The second edition of our classic white flower slides, updated with softer strap contours and premium under-foot support.',
      basePrice: 2800,
      categoryIds: ['c1'],
      images: [decodeURIComponent('https://res.cloudinary.com/don5ltush/image/upload/v1781510071/%E0%B7%83%E0%B7%94%E0%B6%AF%E0%B7%94_%E0%B6%B8%E0%B6%BD%E0%B7%93_II_iecx8f.jpg')],
      status: 'published',
      isBestSeller: false,
      isFeatured: true,
      totalSold: 48,
      averageRating: 4.7,
      reviewCount: 16,
      seo: { title: 'Sudu Malee II - Hush Craft', description: 'Updated white flower slides', keywords: ['sudu malee ii', 'white slides'] }
    },
    {
      id: 'midnight-crimson',
      name: 'Midnight Crimson Slides',
      summary: 'Deep red roses set on black straps for romantic aesthetics.',
      description: 'Contrast deep red fabric roses against a solid black strap for a romantic, gothic-chic look. Handcrafted with dense petal layers.',
      basePrice: 3150,
      categoryIds: ['c2'],
      images: ['https://res.cloudinary.com/don5ltush/image/upload/v1781510071/690687907_1339773455000317_330609780595289063_n_jyw8ph.jpg'],
      status: 'published',
      isBestSeller: true,
      isFeatured: true,
      totalSold: 160,
      averageRating: 4.9,
      reviewCount: 72,
      seo: { title: 'Midnight Crimson - Hush Craft', description: 'Red roses black strap slides', keywords: ['midnight crimson', 'red rose slides', 'gothic floral'] }
    },
    {
      id: 'punchi-samanalee',
      name: 'Punchi Samanalee (Little Butterfly)',
      summary: 'Cute, small butterfly-patterned slipper slides for light wear.',
      description: 'A playful design featuring small, cute butterfly wing shapes on a lightweight base. Ideal for quick errands and indoor wear.',
      basePrice: 2650,
      categoryIds: ['c3'],
      images: [decodeURIComponent('https://res.cloudinary.com/don5ltush/image/upload/v1781510071/%E0%B6%B4%E0%B7%94%E0%B6%82%E0%B6%A0%E0%B7%93_%E0%B7%83%E0%B6%B8%E0%B6%B1%E0%B6%BD%E0%B7%92_qf7otl.jpg')],
      status: 'published',
      isBestSeller: false,
      isFeatured: false,
      totalSold: 55,
      averageRating: 4.6,
      reviewCount: 14,
      seo: { title: 'Punchi Samanalee - Hush Craft', description: 'Small butterfly slipper slides', keywords: ['punchi samanalee', 'little butterfly', 'slides'] }
    }
  ],
  categories: [
    { id: 'c1', name: 'Classic', slug: 'classic', productCount: 8, image: 'https://res.cloudinary.com/don5ltush/image/upload/v1781510078/රෝස_මලී_dv9qpi.jpg' },
    { id: 'c2', name: 'Mules', slug: 'mules', productCount: 6, image: 'https://res.cloudinary.com/don5ltush/image/upload/v1781510074/නිල්_කුමාරි_pz4ofu.jpg' },
    { id: 'c3', name: 'Sandals', slug: 'sandals', productCount: 6, image: 'https://res.cloudinary.com/don5ltush/image/upload/v1781510077/නිල්_සමනලී_awiu92.jpg' },
  ]
};

export async function GET() {
  console.log("Starting DB seeding via API route...");
  try {
    for (const cat of MOCK_DB.categories) {
      await setDoc(doc(db, "categories", cat.id), cat);
      console.log("Seeded category:", cat.name);
    }

    for (const prod of MOCK_DB.products) {
      const pData = {
        ...prod,
        variants: [
          { id: 'v1', sku: `${prod.id}-36`, price: prod.basePrice, quantity: 15, threshold: 5, attributes: { size: '36', color: 'Standard' }, status: 'in_stock' },
          { id: 'v2', sku: `${prod.id}-37`, price: prod.basePrice, quantity: 15, threshold: 5, attributes: { size: '37', color: 'Standard' }, status: 'in_stock' },
          { id: 'v3', sku: `${prod.id}-38`, price: prod.basePrice, quantity: 5, threshold: 5, attributes: { size: '38', color: 'Standard' }, status: 'low_stock' },
        ]
      };
      await setDoc(doc(db, "products", prod.id), pData);
      console.log("Seeded product:", prod.name);
    }
    return NextResponse.json({ success: true, message: "Database seeded successfully with 20 products!" });
  } catch (error: any) {
    console.error("Error seeding database via API route:", error);
    return NextResponse.json({ success: false, error: error.message || error }, { status: 500 });
  }
}
