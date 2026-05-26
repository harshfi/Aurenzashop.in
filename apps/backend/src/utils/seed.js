/**
 * Production-style seed for Aurenza single-brand fashion store.
 *
 * Usage:
 *  npm run seed --workspace=@aurenza/backend
 *
 * Optional env:
 *  RESET_CATALOG=true          -> clears existing products/categories/collections/coupons before seeding
 *  SEED_ADMIN_NAME=...
 *  SEED_ADMIN_EMAIL=...
 *  SEED_ADMIN_PASSWORD=...
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const Category = require('../models/Category');
const Collection = require('../models/Collection');

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const slugify = (value = '') => String(value)
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 150);

const ensureUniqueSlug = (baseSlug, usedSlugs) => {
  if (!usedSlugs.has(baseSlug)) {
    usedSlugs.add(baseSlug);
    return baseSlug;
  }

  let counter = 2;
  let next = `${baseSlug}-${counter}`;
  while (usedSlugs.has(next)) {
    counter += 1;
    next = `${baseSlug}-${counter}`;
  }
  usedSlugs.add(next);
  return next;
};

const categories = [
  {
    name: 'Sarees',
    slug: 'sarees',
    description: 'Banarasi, silk, organza, georgette and celebration-ready sarees crafted for premium occasions.',
    image: '/uploads/categories/sarees/cover.webp',
    displayOrder: 1,
  },
  {
    name: 'Lehengas',
    slug: 'lehengas',
    description: 'Bridal and festive lehengas with contemporary silhouettes and intricate artisan detailing.',
    image: '/uploads/categories/lehengas/cover.webp',
    displayOrder: 2,
  },
  {
    name: 'Kurtas & Kurta Sets',
    slug: 'kurtas-kurta-sets',
    description: 'Straight, anarkali, palazzo and printed kurta sets designed for elevated everyday dressing.',
    image: '/uploads/categories/kurtas-kurta-sets/cover.webp',
    displayOrder: 3,
  },
  {
    name: 'Gowns',
    slug: 'gowns',
    description: 'Evening, festive and designer gowns with refined drape and premium finishing.',
    image: '/uploads/categories/gowns/cover.webp',
    displayOrder: 4,
  },
  {
    name: 'Fusion Wear',
    slug: 'fusion-wear',
    description: 'Indo-western co-ords, jacket sets and modern festive edits for statement dressing.',
    image: '/uploads/categories/fusion-wear/cover.webp',
    displayOrder: 5,
  },
  {
    name: 'Dupattas & Accessories',
    slug: 'dupattas-accessories',
    description: 'Embroidered dupattas and occasion accessories to complete premium ethnic looks.',
    image: '/uploads/categories/dupattas-accessories/cover.webp',
    displayOrder: 6,
  },
  {
    name: 'Seasonal & Special Collections',
    slug: 'seasonal-special',
    description: 'Wedding edits, festive capsules, limited drops and curated seasonal highlights.',
    image: '/uploads/categories/seasonal-special/cover.webp',
    displayOrder: 7,
  },
];

const collections = [
  {
    name: 'Wedding Edit',
    slug: 'wedding-edit',
    description: 'Signature silhouettes and celebratory craftsmanship for sangeet, haldi and reception dressing.',
    bannerImage: '/uploads/collections/wedding-edit/banner.webp',
    tags: ['wedding', 'premium', 'occasion'],
    isFeatured: true,
    displayOrder: 1,
  },
  {
    name: 'Festive Glow',
    slug: 'festive-glow',
    description: 'Rich jewel tones and intricate work inspired by modern festive celebrations.',
    bannerImage: '/uploads/collections/festive-glow/banner.webp',
    tags: ['festive', 'new-season'],
    isFeatured: true,
    displayOrder: 2,
  },
  {
    name: 'New Arrivals',
    slug: 'new-arrivals',
    description: 'Freshly launched Aurenza pieces in couture-inspired and contemporary ethnic forms.',
    bannerImage: '/uploads/collections/new-arrivals/banner.webp',
    tags: ['new-arrival', 'trending'],
    isFeatured: true,
    displayOrder: 3,
  },
  {
    name: 'Bestseller Picks',
    slug: 'bestseller-picks',
    description: 'Most-loved Aurenza styles with trusted fit, finish and customer ratings.',
    bannerImage: '/uploads/collections/bestseller-picks/banner.webp',
    tags: ['bestseller', 'popular'],
    isFeatured: true,
    displayOrder: 4,
  },
  {
    name: 'Evening Luxe',
    slug: 'evening-luxe',
    description: 'Elegant drapes and evening-ready silhouettes for elevated social occasions.',
    bannerImage: '/uploads/collections/evening-luxe/banner.webp',
    tags: ['gowns', 'evening'],
    isFeatured: false,
    displayOrder: 5,
  },
  {
    name: 'Royal Heritage',
    slug: 'royal-heritage',
    description: 'Classic weaves and traditional embellishments interpreted for modern wardrobes.',
    bannerImage: '/uploads/collections/royal-heritage/banner.webp',
    tags: ['heritage', 'artisan'],
    isFeatured: false,
    displayOrder: 6,
  },
];

const reviewLines = [
  'The embroidery quality is outstanding and the product looked exactly like the photos.',
  'Premium fabric, neat finishing, and a very flattering silhouette for festive events.',
  'Received many compliments at my event. Great fit and smooth delivery experience.',
  'Color depth and craftsmanship are beautiful. Definitely feels like a luxury purchase.',
  'The drape and comfort are excellent. Packaging and quality control were impressive.',
  'Aurenza support helped quickly with sizing, and the final fit was perfect.',
];

const colors = ['Maroon', 'Emerald Green', 'Navy Blue', 'Ivory', 'Black', 'Rose Gold', 'Wine', 'Mustard', 'Beige', 'Pink', 'Lavender'];

const mediaPools = {
  sarees: [
    'https://images.unsplash.com/photo-1610030469668-8e9f3529d4b8?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1583391733956-6c78276477e8?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1610030630330-3d3fa7a2f00f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1610189008079-7f3e3d527969?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1608496921412-d7f7f9f4f1f7?auto=format&fit=crop&w=1200&q=80',
  ],
  lehengas: [
    'https://images.unsplash.com/photo-1623605931891-d5b95ee98459?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1621184455862-c163dfb30e0f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1621184348462-7f9f00f96f4b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1621184755868-8f3f7dd1c99f?auto=format&fit=crop&w=1200&q=80',
  ],
  'kurtas-kurta-sets': [
    'https://images.unsplash.com/photo-1618244972963-dbad68f5f5f0?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1618244973070-7f72f4e4a4aa?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1618244973213-5884a74147fc?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1618244972904-a12c772316ae?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1618244973425-8fe1c3d317f0?auto=format&fit=crop&w=1200&q=80',
  ],
  gowns: [
    'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1495385794356-15371f348c31?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=1200&q=80',
  ],
  'fusion-wear': [
    'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1464863979621-258859e62245?auto=format&fit=crop&w=1200&q=80',
  ],
  'dupattas-accessories': [
    'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1608042314453-ae338d80c427?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=80',
  ],
  'seasonal-special': [
    'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1607813480360-9e4f1fb1e0b6?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1521120098171-0400b4ec1319?auto=format&fit=crop&w=1200&q=80',
  ],
};

const productBlueprints = [
  {
    category: 'sarees',
    count: 24,
    subcategories: ['Banarasi Saree', 'Silk Saree', 'Organza Saree', 'Georgette Saree', 'Festive Saree', 'Party Wear Saree', 'Embroidered Saree'],
    collections: ['Wedding Edit', 'Festive Glow', 'Royal Heritage', 'Bestseller Picks'],
    names: ['Noor', 'Zarina', 'Aabha', 'Veda', 'Samaira', 'Mehr', 'Ira', 'Aaliya', 'Myra', 'Kiara', 'Rhea', 'Anaya'],
    styles: ['Zari Banarasi', 'Handloom Katan Silk', 'Floral Organza', 'Sequin Georgette', 'Antique Weave', 'Thread Embroidered', 'Mirror Work'],
    materials: ['Banarasi Silk', 'Katan Silk', 'Organza', 'Georgette', 'Tissue Silk'],
    occasions: ['Wedding', 'Festive', 'Reception', 'Engagement'],
    sleeveTypes: ['Sleeveless', 'Half Sleeve', 'Elbow Sleeve'],
    necklines: ['Sweetheart', 'V-Neck', 'Boat Neck'],
    sizes: ['Free Size'],
    priceRange: [2499, 13999],
    fit: 'Graceful Drape',
    workTypes: ['Zari Weave', 'Resham Embroidery', 'Sequin Work', 'Threadwork'],
  },
  {
    category: 'lehengas',
    count: 14,
    subcategories: ['Bridal Lehenga', 'Festive Lehenga', 'Designer Lehenga', 'Embroidered Lehenga', 'Contemporary Lehenga'],
    collections: ['Wedding Edit', 'Festive Glow', 'Evening Luxe'],
    names: ['Aarohi', 'Misha', 'Tara', 'Pihu', 'Ridhima', 'Saisha', 'Naira', 'Sana'],
    styles: ['Velvet Bridal', 'Mirror Embellished', 'Panelled Silk', 'Flared Couture', 'Zari Heritage'],
    materials: ['Raw Silk', 'Velvet', 'Net', 'Silk Blend'],
    occasions: ['Wedding', 'Reception', 'Sangeet'],
    sleeveTypes: ['Sleeveless', 'Half Sleeve', 'Full Sleeve'],
    necklines: ['Sweetheart', 'Square Neck', 'V-Neck'],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    priceRange: [5999, 25999],
    fit: 'Structured Fit',
    workTypes: ['Zardozi', 'Mirror Work', 'Cutdana Work', 'Resham Embroidery'],
  },
  {
    category: 'kurtas-kurta-sets',
    count: 16,
    subcategories: ['Straight Kurta', 'Anarkali Set', 'Palazzo Set', 'Festive Kurta Set', 'Printed Kurta Set'],
    collections: ['New Arrivals', 'Festive Glow', 'Bestseller Picks'],
    names: ['Kiara', 'Vaani', 'Diya', 'Aashi', 'Nysa', 'Mira', 'Trisha', 'Ishita'],
    styles: ['Floral Printed', 'Threadwork Yoke', 'Panelled Anarkali', 'Gota Detail', 'Contemporary Palazzo'],
    materials: ['Cotton Silk', 'Rayon', 'Chanderi', 'Muslin'],
    occasions: ['Festive', 'Day Occasion', 'Family Celebration'],
    sleeveTypes: ['Three Quarter Sleeve', 'Half Sleeve', 'Sleeveless'],
    necklines: ['Round Neck', 'Keyhole Neck', 'Mandarin Neck'],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    priceRange: [1999, 8999],
    fit: 'Comfort Fit',
    workTypes: ['Print', 'Resham Detail', 'Gota Patti', 'Foil Print'],
  },
  {
    category: 'gowns',
    count: 12,
    subcategories: ['Party Gown', 'Evening Gown', 'Festive Gown', 'Designer Gown'],
    collections: ['Evening Luxe', 'Wedding Edit', 'New Arrivals'],
    names: ['Aisha', 'Elara', 'Nyla', 'Mina', 'Raina', 'Saira', 'Meher'],
    styles: ['Draped Satin', 'Corset Panelled', 'Sequin Evening', 'Layered Tulle'],
    materials: ['Satin', 'Tulle', 'Crepe', 'Velvet Blend'],
    occasions: ['Party', 'Reception', 'Cocktail'],
    sleeveTypes: ['Sleeveless', 'Cape Sleeve', 'Full Sleeve'],
    necklines: ['Sweetheart', 'Boat Neck', 'Halter Neck'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    priceRange: [3499, 16999],
    fit: 'Tailored Fit',
    workTypes: ['Sequin Work', 'Drape Styling', 'Stone Detail', 'Beadwork'],
  },
  {
    category: 'fusion-wear',
    count: 12,
    subcategories: ['Indo-Western Set', 'Jacket Set', 'Co-ord Set', 'Modern Ethnic Fusion'],
    collections: ['New Arrivals', 'Festive Glow', 'Evening Luxe'],
    names: ['Riva', 'Tisha', 'Meira', 'Yana', 'Shanaya', 'Mysha', 'Alina'],
    styles: ['Cape Co-ord', 'Asymmetric Jacket', 'Drape Pant Set', 'Modern Kurta Co-ord'],
    materials: ['Crepe', 'Silk Blend', 'Linen Blend', 'Viscose'],
    occasions: ['Festive', 'Party', 'Statement Daywear'],
    sleeveTypes: ['Sleeveless', 'Three Quarter Sleeve', 'Full Sleeve'],
    necklines: ['V-Neck', 'Round Neck', 'Square Neck'],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    priceRange: [2299, 10999],
    fit: 'Contemporary Fit',
    workTypes: ['Foil Print', 'Threadwork', 'Mirror Detail', 'Hand Embellishment'],
  },
  {
    category: 'dupattas-accessories',
    count: 10,
    subcategories: ['Embroidered Dupatta', 'Designer Dupatta', 'Ethnic Accessory'],
    collections: ['Festive Glow', 'Bestseller Picks', 'Royal Heritage'],
    names: ['Noor', 'Safa', 'Maira', 'Zoya', 'Inaya', 'Meher'],
    styles: ['Scallop Dupatta', 'Mirror Border Dupatta', 'Festive Potli', 'Temple Jewelry Set'],
    materials: ['Organza', 'Silk Blend', 'Net', 'Vegan Leather', 'Alloy Metal'],
    occasions: ['Festive', 'Wedding', 'Occasion Styling'],
    sleeveTypes: ['NA'],
    necklines: ['NA'],
    sizes: ['One Size'],
    priceRange: [999, 6999],
    fit: 'NA',
    workTypes: ['Thread Embroidery', 'Mirror Work', 'Hand Detail'],
  },
  {
    category: 'seasonal-special',
    count: 12,
    subcategories: ['Wedding Collection', 'Festive Collection', 'New Arrival', 'Bestseller Collection'],
    collections: ['Wedding Edit', 'Festive Glow', 'New Arrivals', 'Bestseller Picks'],
    names: ['Aarini', 'Viha', 'Ruhani', 'Suhana', 'Tia', 'Sena'],
    styles: ['Limited Edition Set', 'Couture Capsule', 'Runway Inspired Edit', 'Signature Occasion Ensemble'],
    materials: ['Silk Blend', 'Velvet', 'Organza', 'Chanderi'],
    occasions: ['Wedding', 'Festive', 'Premium Occasion'],
    sleeveTypes: ['Sleeveless', 'Half Sleeve', 'Three Quarter Sleeve'],
    necklines: ['V-Neck', 'Round Neck', 'Sweetheart'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    priceRange: [2999, 18999],
    fit: 'Premium Tailored Fit',
    workTypes: ['Artisanal Embroidery', 'Zari Work', 'Handcrafted Detail'],
  },
];

const buildMediaPaths = (category, idx) => {
  const folder = `/uploads/products/${category}/product-${String(idx + 1).padStart(3, '0')}`;
  const pool = mediaPools[category] || mediaPools['seasonal-special'];
  const gallery = [0, 1, 2, 3, 4].map((offset) => {
    const source = pool[(idx + offset) % pool.length];
    return `${source}&sig=${category}-${idx + 1}-${offset}`;
  });

  return {
    imageFolder: folder,
    mainImage: gallery[0],
    hoverImage: gallery[1],
    galleryImages: gallery,
  };
};

const buildVariants = ({ category, sizes }, productCode, colorSeed) => {
  const chosenColors = [
    colors[colorSeed % colors.length],
    colors[(colorSeed + 3) % colors.length],
    colors[(colorSeed + 6) % colors.length],
  ];

  const maxSizes = category === 'sarees' || category === 'dupattas-accessories' ? 1 : Math.min(6, sizes.length);
  const chosenSizes = sizes.slice(0, maxSizes);

  const variants = [];

  chosenSizes.forEach((size, sizeIdx) => {
    chosenColors.forEach((color, colorIdx) => {
      const stock = rand(0, 18);
      variants.push({
        sku: `AUR-${productCode}-${size.replace(/\s+/g, '').toUpperCase()}-${color.replace(/\s+/g, '').slice(0, 3).toUpperCase()}`,
        sizeOrDimension: size,
        color,
        additionalPrice: sizeIdx === 0 ? colorIdx * 120 : (sizeIdx * 140) + (colorIdx * 80),
        stockCount: stock,
        reorderThreshold: 4,
        stockStatus: stock <= 0 ? 'out-of-stock' : stock <= 4 ? 'low-stock' : 'in-stock',
      });
    });
  });

  return variants;
};

const buildReviews = (countSeed) => {
  const average = Number((4.1 + Math.random() * 0.8).toFixed(1));
  const reviewCount = rand(24, 420);
  const sampleCount = rand(3, 5);

  const reviews = Array.from({ length: sampleCount }).map((_, idx) => ({
    user: new mongoose.Types.ObjectId(),
    rating: rand(4, 5),
    comment: reviewLines[(countSeed + idx) % reviewLines.length],
    date: new Date(Date.now() - rand(5, 180) * 24 * 60 * 60 * 1000),
  }));

  return {
    ratings: {
      average,
      count: reviewCount,
    },
    reviews,
  };
};

const buildProductData = () => {
  const products = [];
  const usedSlugs = new Set();
  let globalIndex = 0;

  productBlueprints.forEach((blueprint) => {
    for (let i = 0; i < blueprint.count; i += 1) {
      const nameToken = blueprint.names[i % blueprint.names.length];
      const styleToken = blueprint.styles[i % blueprint.styles.length];
      const subcategory = blueprint.subcategories[i % blueprint.subcategories.length];
      const collection = blueprint.collections[i % blueprint.collections.length];
      const material = blueprint.materials[i % blueprint.materials.length];
      const workType = blueprint.workTypes[i % blueprint.workTypes.length];
      const occasion = blueprint.occasions[i % blueprint.occasions.length];
      const sleeveType = blueprint.sleeveTypes[i % blueprint.sleeveTypes.length];
      const neckline = blueprint.necklines[i % blueprint.necklines.length];

      const title = `Aurenza ${nameToken} ${styleToken} ${subcategory}`;
      const slug = ensureUniqueSlug(slugify(title), usedSlugs);
      const productCode = `${blueprint.category.slice(0, 3).toUpperCase()}${String(globalIndex + 1).padStart(4, '0')}`;

      const basePrice = rand(blueprint.priceRange[0], blueprint.priceRange[1]);
      const compareAtPrice = Math.round(basePrice * (1 + rand(10, 36) / 100));
      const discountPercentage = Math.round(((compareAtPrice - basePrice) / compareAtPrice) * 100);

      const media = buildMediaPaths(blueprint.category, i);
      const variants = buildVariants({ category: blueprint.category, sizes: blueprint.sizes }, productCode, i + globalIndex);
      const inventoryTotal = variants.reduce((sum, variant) => sum + variant.stockCount, 0);

      const { ratings, reviews } = buildReviews(globalIndex);

      const featured = globalIndex % 5 === 0;
      const bestseller = globalIndex % 3 === 0;
      const newArrival = globalIndex % 4 === 0;
      const festiveSpecial = ['sarees', 'lehengas', 'seasonal-special'].includes(blueprint.category) && globalIndex % 2 === 0;
      const trending = globalIndex % 6 === 0;
      const editorPick = globalIndex % 7 === 0;

      const shortDescription = `${subcategory} in ${material} with ${workType.toLowerCase()} for ${occasion.toLowerCase()} dressing.`;
      const description = `${title} is crafted in premium ${material} with ${workType.toLowerCase()} and a ${blueprint.fit.toLowerCase()} silhouette. Designed for ${occasion.toLowerCase()} occasions, it offers elevated comfort, refined drape, and signature Aurenza finishing details.`;

      const inventoryStatus = inventoryTotal <= 0 ? 'out-of-stock' : inventoryTotal <= 18 ? 'low-stock' : 'in-stock';

      products.push({
        title,
        slug,
        sku: `AUR-${productCode}`,
        shortDescription,
        description,
        brand: 'Aurenza',
        category: blueprint.category,
        subcategory,
        collection,
        material,
        season: blueprint.category === 'seasonal-special' ? 'Festive 2026' : 'Core 2026',
        gender: blueprint.category === 'dupattas-accessories' ? 'unisex' : 'women',
        basePrice,
        compareAtPrice,
        discountPercentage,
        taxIncluded: true,
        images: media.galleryImages,
        mainImage: media.mainImage,
        hoverImage: media.hoverImage,
        galleryImages: media.galleryImages,
        imageFolder: media.imageFolder,
        variants,
        totalStock: inventoryTotal,
        reorderThreshold: 10,
        inventoryStatus,
        productStatus: 'active',
        tags: [
          blueprint.category,
          subcategory.toLowerCase(),
          collection.toLowerCase().replace(/\s+/g, '-'),
          occasion.toLowerCase().replace(/\s+/g, '-'),
          material.toLowerCase().replace(/\s+/g, '-'),
          'aurenza',
          'premium-fashion',
        ],
        attributes: {
          fabric: material,
          fit: blueprint.fit,
          workType,
          embroideryDetails: workType,
          occasion,
          sleeveType,
          neckline,
          washCare: 'Dry clean recommended. Store in breathable garment cover.',
          countryOfOrigin: 'India',
        },
        seo: {
          metaTitle: `${title} | Aurenza`,
          metaDescription: `${title} by Aurenza. Premium ${subcategory.toLowerCase()} crafted in ${material.toLowerCase()} for ${occasion.toLowerCase()} styling.`,
          keywords: [
            'Aurenza',
            subcategory,
            material,
            occasion,
            collection,
            'premium ethnic fashion',
          ],
        },
        ratings,
        reviews,
        featured,
        bestseller,
        newArrival,
        festiveSpecial,
        trending,
        editorPick,
      });

      globalIndex += 1;
    }
  });

  return products;
};

const coupons = [
  {
    code: 'WELCOME10',
    type: 'percent',
    value: 10,
    minOrderAmount: 1999,
    maxDiscountAmount: 1500,
    usageLimit: 10000,
    usagePerUser: 1,
    startsAt: new Date('2026-01-01T00:00:00.000Z'),
    endsAt: new Date('2026-12-31T23:59:59.000Z'),
    isActive: true,
    applicableCategories: [],
    applicableBrands: ['Aurenza'],
    description: 'Welcome benefit for first purchase on Aurenza.',
  },
  {
    code: 'FESTIVE20',
    type: 'percent',
    value: 20,
    minOrderAmount: 4999,
    maxDiscountAmount: 3000,
    usageLimit: 4000,
    usagePerUser: 2,
    startsAt: new Date('2026-08-01T00:00:00.000Z'),
    endsAt: new Date('2026-12-31T23:59:59.000Z'),
    isActive: true,
    applicableCategories: ['sarees', 'lehengas', 'seasonal-special'],
    applicableBrands: ['Aurenza'],
    description: 'Festive season savings on premium celebration styles.',
  },
  {
    code: 'AURENZA15',
    type: 'percent',
    value: 15,
    minOrderAmount: 3499,
    maxDiscountAmount: 2200,
    usageLimit: 6000,
    usagePerUser: 3,
    startsAt: new Date('2026-01-01T00:00:00.000Z'),
    endsAt: new Date('2026-12-31T23:59:59.000Z'),
    isActive: true,
    applicableCategories: ['kurtas-kurta-sets', 'fusion-wear', 'gowns'],
    applicableBrands: ['Aurenza'],
    description: 'Seasonal premium savings across core Aurenza collections.',
  },
  {
    code: 'FIRSTORDER',
    type: 'flat',
    value: 500,
    minOrderAmount: 2499,
    maxDiscountAmount: null,
    usageLimit: 10000,
    usagePerUser: 1,
    startsAt: new Date('2026-01-01T00:00:00.000Z'),
    endsAt: new Date('2026-12-31T23:59:59.000Z'),
    isActive: true,
    applicableCategories: [],
    applicableBrands: ['Aurenza'],
    description: 'Flat welcome discount for first order shoppers.',
  },
];

const seedAdmin = async () => {
  const adminName = process.env.SEED_ADMIN_NAME || process.env.ADMIN_NAME || 'Aurenza Admin';
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || '';

  const existingAdmins = await Admin.countDocuments();

  if (!adminEmail || !adminPassword) {
    if (existingAdmins > 0) {
      console.log('Admin seed credentials not provided. Existing admin account retained.');
      return;
    }

    throw new Error('Missing SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD (or ADMIN_EMAIL/ADMIN_PASSWORD) for initial admin creation.');
  }

  const existingAdmin = await Admin.findOne({ email: adminEmail }).select('+password');
  if (!existingAdmin) {
    await Admin.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
    });
    console.log(`Admin created: ${adminEmail}`);
  } else {
    existingAdmin.name = adminName;
    if (process.env.UPDATE_SEED_ADMIN_PASSWORD === 'true') {
      existingAdmin.password = adminPassword;
    }
    await existingAdmin.save();
    console.log(`Admin updated: ${adminEmail}`);
  }
};

const upsertCategories = async () => {
  const ops = categories.map((category) => ({
    updateOne: {
      filter: { slug: category.slug },
      update: { $set: category },
      upsert: true,
    },
  }));

  if (ops.length) await Category.bulkWrite(ops);
  console.log(`Categories synced: ${categories.length}`);
};

const upsertCollections = async () => {
  const ops = collections.map((collection) => ({
    updateOne: {
      filter: { slug: collection.slug },
      update: { $set: collection },
      upsert: true,
    },
  }));

  if (ops.length) await Collection.bulkWrite(ops);
  console.log(`Collections synced: ${collections.length}`);
};

const upsertCoupons = async () => {
  const ops = coupons.map((coupon) => ({
    updateOne: {
      filter: { code: coupon.code },
      update: {
        $set: coupon,
        $setOnInsert: { usedCount: 0 },
      },
      upsert: true,
    },
  }));

  if (ops.length) await Coupon.bulkWrite(ops);
  console.log(`Coupons synced: ${coupons.length}`);
};

const upsertProducts = async () => {
  const data = buildProductData();

  const ops = data.map((product) => ({
    replaceOne: {
      filter: { slug: product.slug },
      replacement: product,
      upsert: true,
    },
  }));

  if (ops.length) await Product.bulkWrite(ops, { ordered: false });

  console.log(`Products synced: ${data.length}`);

  if (process.env.PRUNE_OLD_PRODUCTS === 'true') {
    const allSlugs = data.map((item) => item.slug);
    const pruneResult = await Product.deleteMany({ slug: { $nin: allSlugs } });
    console.log(`Pruned old products: ${pruneResult.deletedCount}`);
  }
};

const seedDatabase = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is required for seeding.');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const shouldReset = process.env.RESET_CATALOG === 'true';
    if (shouldReset) {
      console.log('RESET_CATALOG=true -> clearing products, categories, collections, coupons...');
      await Promise.all([
        Product.deleteMany({}),
        Category.deleteMany({}),
        Collection.deleteMany({}),
        Coupon.deleteMany({}),
      ]);
    }

    await seedAdmin();
    await upsertCategories();
    await upsertCollections();
    await upsertCoupons();
    await upsertProducts();

    const [productCount, categoryCount, collectionCount, couponCount] = await Promise.all([
      Product.countDocuments({}),
      Category.countDocuments({}),
      Collection.countDocuments({}),
      Coupon.countDocuments({}),
    ]);

    console.log(`Seed complete -> products: ${productCount}, categories: ${categoryCount}, collections: ${collectionCount}, coupons: ${couponCount}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
};

seedDatabase();
