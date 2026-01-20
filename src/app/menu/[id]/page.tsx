import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import CustomizeForm from "./CustomizeForm"; // <--- Import the new form
import { auth } from "@/auth";

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function ProductPage({ params, searchParams }: Props) {
  const { id } = await Promise.resolve(params); // Next 15 specific
  const session = await auth();

  // 1. Fetch Product
  const product = await prisma.product.findUnique({
    where: { id: parseInt(id) }
  });

  if (!product) notFound();

  // 2. Fetch Ingredients
  // Use isAvailable AND isShowing to hide out of stock and hidden items
  const ingredients = await prisma.ingredient.findMany({
    where: { 
      isAvailable: true,
      isShowing: true
    }, 
    orderBy: { rank: 'desc' }
  });

  // 3. Serialize Product Data (Decimal -> Number for client)
  const serializedProduct = {
    ...product,
    basePrice: product.basePrice.toNumber()
  };

  const serializedIngredients = ingredients.map(i => ({
    ...i,
    priceMod: i.priceMod.toNumber()
  }));

  // 4. Handle Default Name - Fetch full user data and format display name
  let defaultName = "Guest";
  let defaultDisplayName = "Guest";
  let userLastName: string | null = null;
  
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { firstName: true, lastName: true }
    });
    
    if (user?.firstName) {
      defaultName = user.firstName;
      userLastName = user.lastName || null;
      
      // Format: firstName + lastInitial (e.g., "Bryden B")
      if (user.lastName) {
        defaultDisplayName = `${user.firstName} ${user.lastName.charAt(0).toUpperCase()}`;
      } else {
        defaultDisplayName = user.firstName;
      }
    }
  }

  // 5. Handle Favorites Loading (Optional Future Step)
  // If searchParams.favId exists, we could load it here. 
  // For now we pass null.
  let initialConfig = null;

  return (
    <main className="relative min-h-screen flex justify-center p-4 md:p-8 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0 bg-[#004876] fixed">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#32A5DC] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#32A5DC] rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
      </div>

      <div className="relative z-10 w-full">
        <CustomizeForm 
          product={serializedProduct} 
          ingredients={serializedIngredients}
          defaultName={defaultName}
          defaultDisplayName={defaultDisplayName}
          userLastName={userLastName}
          initialConfig={initialConfig}
        />
      </div>
    </main>
  );
}