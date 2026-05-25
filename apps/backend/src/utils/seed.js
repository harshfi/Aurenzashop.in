/**
 * Seed Script — Creates the initial Admin user and Dummy Products
 * Run: npm run seed (from apps/backend)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const Product = require('../models/Product');

const dummyProducts = [
  {
    title: "Aurenza Classic Cotton Shirt",
    description: "Tailored from 100% long-staple organic cotton, this shirt offers unparalleled softness and breathability. Perfect for casual or business wear, finished with premium mother-of-pearl buttons.",
    basePrice: 1899,
    category: "clothing",
    images: [
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1621072156002-e2fcc103e86e?auto=format&fit=crop&w=600&q=80"
    ],
    variants: [
      { sku: "CLO-SHT-S-WHT", sizeOrDimension: "S", color: "White", additionalPrice: 0, stockCount: 15 },
      { sku: "CLO-SHT-M-WHT", sizeOrDimension: "M", color: "White", additionalPrice: 0, stockCount: 25 },
      { sku: "CLO-SHT-L-WHT", sizeOrDimension: "L", color: "White", additionalPrice: 0, stockCount: 20 },
      { sku: "CLO-SHT-XL-WHT", sizeOrDimension: "XL", color: "White", additionalPrice: 100, stockCount: 10 }
    ],
    ratings: { average: 4.8, count: 5 }
  },
  {
    title: "Aurenza Premium Linen Trousers",
    description: "Crafted from the finest linen, these lightweight trousers feature a relaxed fit and an adjustable drawcord elastic waistband. A summer essential designed for effortless styling.",
    basePrice: 2499,
    category: "clothing",
    images: [
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=600&q=80"
    ],
    variants: [
      { sku: "CLO-TRS-S-BEG", sizeOrDimension: "S", color: "Beige", additionalPrice: 0, stockCount: 10 },
      { sku: "CLO-TRS-M-BEG", sizeOrDimension: "M", color: "Beige", additionalPrice: 0, stockCount: 18 },
      { sku: "CLO-TRS-L-BEG", sizeOrDimension: "L", color: "Beige", additionalPrice: 0, stockCount: 12 }
    ],
    ratings: { average: 4.5, count: 3 }
  },
  {
    title: "Aurenza Silk Kurta",
    description: "An elegant Indian traditional wear designed with woven Banarasi silk threads. Features subtle gold-embellished collars and cuffs. Ideal for festivals and wedding receptions.",
    basePrice: 4299,
    category: "clothing",
    images: [
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80"
    ],
    variants: [
      { sku: "CLO-KRT-M-GLD", sizeOrDimension: "M", color: "Gold", additionalPrice: 0, stockCount: 8 },
      { sku: "CLO-KRT-L-GLD", sizeOrDimension: "L", color: "Gold", additionalPrice: 0, stockCount: 12 },
      { sku: "CLO-KRT-XL-GLD", sizeOrDimension: "XL", color: "Gold", additionalPrice: 200, stockCount: 6 }
    ],
    ratings: { average: 4.9, count: 8 }
  },
  {
    title: "Vintage Floral Wallpaper",
    description: "Featuring soft watercolor roses and lush foliage, this wallpaper adds a romantic, timeless accent to any bedroom or parlor space. Pre-pasted, scrubbable, and easy to strip.",
    basePrice: 3499,
    category: "wallpaper",
    images: [
      "https://images.unsplash.com/photo-1616628182509-c6cd7f8bdad8?auto=format&fit=crop&w=600&q=80"
    ],
    variants: [
      { sku: "WPP-FLO-10X10", sizeOrDimension: "10 x 10 ft", color: "Multi", additionalPrice: 0, stockCount: 20 },
      { sku: "WPP-FLO-12X10", sizeOrDimension: "12 x 10 ft", color: "Multi", additionalPrice: 500, stockCount: 15 }
    ],
    ratings: { average: 4.6, count: 12 }
  },
  {
    title: "Modern Geometric Accent Mural",
    description: "Introduce a sleek Scandinavian aesthetic with this minimal monochrome polygon wallpaper design. Highlights abstract angles and subtle concrete textures.",
    basePrice: 3899,
    category: "wallpaper",
    images: [
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80"
    ],
    variants: [
      { sku: "WPP-GEO-10X10", sizeOrDimension: "10 x 10 ft", color: "Grey", additionalPrice: 0, stockCount: 30 },
      { sku: "WPP-GEO-12X10", sizeOrDimension: "12 x 10 ft", color: "Grey", additionalPrice: 600, stockCount: 25 }
    ],
    ratings: { average: 4.7, count: 9 }
  },
  {
    title: "Abstract Gold Foil Wallpaper",
    description: "Inject luxury into your lobbies or dining rooms. Embellished with mock gold-leaf strokes against deep obsidian backing. Truly stands out under accent downlighting.",
    basePrice: 4899,
    category: "wallpaper",
    images: [
      "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80"
    ],
    variants: [
      { sku: "WPP-GLD-10X10", sizeOrDimension: "10 x 10 ft", color: "Gold/Black", additionalPrice: 0, stockCount: 10 },
      { sku: "WPP-GLD-12X10", sizeOrDimension: "12 x 10 ft", color: "Gold/Black", additionalPrice: 800, stockCount: 8 }
    ],
    ratings: { average: 5.0, count: 14 }
  }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aurenza');
    console.log('Connected to MongoDB');

    // 1. Seed Admin User
    const existingAdmin = await Admin.findOne({ email: 'admin@aurenzashop.in' });
    if (!existingAdmin) {
      const admin = await Admin.create({
        name: 'Hemlata Dubey',
        email: 'admin@aurenzashop.in',
        password: 'Aurenza@2024',
      });
      console.log('✅ Admin user seeded successfully! (Aurenza@2024)');
    } else {
      console.log('ℹ️ Admin user already exists. Skipping admin seed.');
    }

    // 2. Seed Products
    console.log('Cleaning existing products...');
    await Product.deleteMany({});

    console.log('Seeding dummy products...');
    const createdProducts = await Product.create(dummyProducts);
    console.log(`✅ Seeded ${createdProducts.length} dummy products successfully!`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Database seed failed:', error.message);
    process.exit(1);
  }
};

seedDatabase();
