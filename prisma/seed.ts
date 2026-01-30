import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // 1. CLEANUP
  await prisma.modifier.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.savedOrder.deleteMany()
  await prisma.order.deleteMany()
  await prisma.product.deleteMany()
  await prisma.ingredient.deleteMany()
  await prisma.user.deleteMany()
  
  // 2. SEED INGREDIENTS
  console.log('🥛 Seeding Ingredients...')

  // Milks
  await prisma.ingredient.createMany({
    data: [
      { name: 'Whole', category: 'milk', rank: 1 },
      { name: 'Nonfat', category: 'milk', rank: 2 },
      { name: '2%', category: 'milk', rank: 3 },
      { name: 'Half and Half (Breve)', category: 'milk', rank: 4 },
      { name: 'Oat', category: 'milk', priceMod: 0.75, rank: 5 },
      { name: 'Almond', category: 'milk', priceMod: 0.75, rank: 6 },
      { name: 'Soy', category: 'milk', priceMod: 0.75, rank: 7 },
    ]
  })

  // Syrups
  await prisma.ingredient.createMany({
    data: [
      // --- POPULAR / RANKED ---
      { name: 'Vanilla', category: 'syrup', rank: 1 },
      { name: 'Caramel', category: 'syrup', rank: 2 },
      { name: 'Mocha', category: 'syrup', rank: 3 },
      { name: 'White Mocha', category: 'syrup', rank: 4 },
      { name: 'Hazelnut', category: 'syrup', rank: 5 },
      { name: 'Sugar Free Vanilla', category: 'syrup', rank: 6 },
      { name: 'Pumpkin Spice', category: 'syrup', rank: 7 }, 

      // --- STANDARD (Rank 0) ---
      { name: 'English Toffee', category: 'syrup', rank: 0 },
      { name: 'Brown Sugar Cinnamon', category: 'syrup', rank: 0 },
      { name: 'Lavender', category: 'syrup', rank: 0 },
      { name: 'Pistachio', category: 'syrup', rank: 0 },
      { name: 'Peppermint', category: 'syrup', rank: 0 },
      { name: 'Cardamom', category: 'syrup', rank: 0 },
      { name: 'Cane Sugar', category: 'syrup', rank: 0 },
      { name: 'Coconut', category: 'syrup', rank: 0 },
      { name: 'Blackberry', category: 'syrup', rank: 0 },
      { name: 'Cherry', category: 'syrup', rank: 0 },
      { name: 'Strawberry', category: 'syrup', rank: 0 },
      { name: 'Peach', category: 'syrup', rank: 0 },
      { name: 'Raspberry', category: 'syrup', rank: 0 },
      { name: 'Passion Fruit', category: 'syrup', rank: 0 },
      { name: 'Mango', category: 'syrup', rank: 0 },
      
      { name: 'Sugar Free Caramel', category: 'syrup', rank: 0 },
      { name: 'Sugar Free Hazelnut', category: 'syrup', rank: 0 },
      { name: 'Sugar Free Chocolate', category: 'syrup', rank: 0 },
      { name: 'Sugar Free White Chocolate', category: 'syrup', rank: 0 },
      { name: 'Sugar Free Peppermint', category: 'syrup', rank: 0 },
      { name: 'Sugar Free Cinnamon Dolce', category: 'syrup', rank: 0 },
    ]
  })

  // Toppings
  await prisma.ingredient.createMany({
    data: [
      { name: 'Caramel Drizzle', category: 'topping', priceMod: 0.50, rank: 1 },
      { name: 'Chocolate Drizzle', category: 'topping', priceMod: 0.50, rank: 2 },
      { name: 'Whipped Cream', category: 'topping', rank: 3 },
      { name: 'Cinnamon', category: 'topping', rank: 0 },
      { name: 'Nutmeg', category: 'topping', rank: 0 },
      { name: 'Salt', category: 'topping', rank: 0 },
    ]
  })

  // Tea Bags
  await prisma.ingredient.createMany({
    data: [
      { name: 'Matcha', category: 'tea', rank: 1 },
      { name: 'Earl Grey', category: 'tea', rank: 2 },
      { name: 'Green', category: 'tea', rank: 3 },
      { name: 'Peppermint', category: 'tea', rank: 4 },
      { name: 'Decaf Earl Grey', category: 'tea', rank: 0 },
      { name: 'Assam (Black Tea)', category: 'tea', rank: 0 },
      { name: 'Peach (Herbal)', category: 'tea', rank: 0 },
      { name: 'Spiced Peach (Herbal)', category: 'tea', rank: 0 },
      { name: 'Ginger Peach (Herbal)', category: 'tea', rank: 0 },
      { name: 'Tazo Zen', category: 'tea', rank: 0 },
      { name: 'Tazo Refresh Mint', category: 'tea', rank: 0 },
      { name: 'Tazo Wild Sweet Orange', category: 'tea', rank: 0 },
      { name: 'Bengal Spice', category: 'tea', rank: 0 },
      { name: 'Blueberry Superfruit', category: 'tea', rank: 0 },
    ]
  })

  // Packet Sweeteners
  await prisma.ingredient.createMany({
    data: [
      { name: 'Sugar in the Raw', category: 'sweetener' },
      { name: 'White Sugar', category: 'sweetener' },
      { name: 'Stevia', category: 'sweetener' },
      { name: 'Splenda', category: 'sweetener' },
    ]
  })

  // Other ingredients (Matcha scoops, Chai concentrate, etc.)
  await prisma.ingredient.createMany({
    data: [
      { name: 'Matcha Scoops', category: 'other', rank: 1 },
      { name: 'Chai Concentrate', category: 'other', rank: 2 },
    ]
  })

  // 3. SEED MENU
  console.log('☕ Seeding Menu...')
  
  const products = [
      // COFFEE
      { 
        name: 'Americano', 
        description: 'Espresso shots and water', 
        category: 'coffee',
        defaultShots: 2,
        requiresMilk: false
      },
      { 
        name: 'Latte', 
        description: 'Espresso shots with milk', 
        category: 'coffee',
        defaultShots: 2,
        requiresMilk: true
      },
      { 
        name: 'Cappuccino', 
        description: 'Espresso with extra foam (hot only)', 
        category: 'coffee',
        defaultShots: 2,
        requiresMilk: true,
        forceTemperature: 'Hot'
      },
      { 
        name: 'Espresso', 
        description: 'Straight shots of espresso', 
        category: 'coffee',
        defaultShots: 2,
        requiresMilk: false
      },
      { 
        name: 'Cortado', 
        description: 'Equal parts espresso and milk', 
        category: 'coffee',
        defaultShots: 2,
        requiresMilk: true,
        forceTemperature: 'Hot'
      },
      { 
        name: 'Caramel Macchiato', 
        description: 'Vanilla, milk, espresso and caramel', 
        category: 'coffee',
        defaultShots: 2,
        requiresMilk: true
      },
      
      // TEA
      { 
        name: 'London Fog Tea Latte', 
        description: 'Earl grey tea with vanilla syrup and milk', 
        category: 'tea',
        defaultShots: 0,
        requiresMilk: true
      },
      { 
        name: 'Matcha Latte', 
        description: 'Matcha tea and milk', 
        category: 'tea',
        defaultShots: 0,
        requiresMilk: true
      },
      { 
        name: 'Tea', 
        description: 'Steeped tea (Hot or Iced)', 
        category: 'tea',
        defaultShots: 0,
        requiresMilk: false
      },
      { 
        name: 'Chai Latte', 
        description: 'Spiced chai with milk', 
        category: 'tea',
        defaultShots: 0,
        requiresMilk: true
      },

      // OTHER
      { 
        name: 'Italian Soda', 
        description: 'Flavored syrup and sparkling water', 
        category: 'other',
        defaultShots: 0,
        requiresMilk: false,
        forceTemperature: 'Iced'
      },
      { 
        name: 'Hot Chocolate', 
        description: 'Mocha syrup and steamed milk', 
        category: 'other',
        defaultShots: 0,
        requiresMilk: true,
        forceTemperature: 'Hot'
      },
      { 
        name: 'Steamer', 
        description: 'Steamed milk and syrup', 
        category: 'other',
        defaultShots: 0,
        requiresMilk: true,
        forceTemperature: 'Hot'
      },
  ];

  for (const p of products) {
    await prisma.product.create({ data: p })
  }

  // 4. SEED USERS
  console.log('👤 Seeding Users...')
  
  const hashedPassword = await bcrypt.hash('secret123', 10);
  
  // Admin User
  await prisma.user.create({
    data: {
      email: 'admin@biolifecafe.com',
      passwordHash: hashedPassword, 
      firstName: 'Admin',
      role: 'admin'
    }
  })

  // Regular Demo User
  const demoUser = await prisma.user.create({
    data: {
      email: 'user@example.com',
      passwordHash: hashedPassword, 
      firstName: 'Demo User',
      role: 'customer'
    }
  })

  // 5. SEED FAVORITES
  console.log('⭐ Seeding Favorite Drink...');
  
  const latte = await prisma.product.findFirst({ where: { name: 'Latte' } });
  const oatMilk = await prisma.ingredient.findFirst({ where: { name: 'Oat' } });
  const vanilla = await prisma.ingredient.findFirst({ where: { name: 'Vanilla' } });

  if (demoUser && latte && oatMilk && vanilla) {
    await prisma.savedOrder.create({
      data: {
        userId: demoUser.id,
        productId: latte.id,
        name: "My Morning Fuel",
        configuration: JSON.stringify({
          shots: 2, 
          milkId: oatMilk.id,
          modifiers: { [vanilla.id]: 2 } 
        })
      }
    });
    console.log('   -> Added "My Morning Fuel" for user@example.com');
  }

  console.log('✅ Seed finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })