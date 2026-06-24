import { ADMIN_APP_NAME } from "@/lib/metadata";

const ADMIN_PAGE_TITLES: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/queue": "Queue",
  "/admin/history": "Order History",
  "/admin/menu": "Update Menu",
  "/admin/schedule": "Update Schedule",
  "/admin/inventory": "Inventory",
  "/admin/statistics/ingredients": "Ingredient Statistics",
  "/admin/statistics": "Statistics",
  "/admin/communications": "Communications",
  "/admin/suggestions": "Suggestions",
  "/admin/users": "Users",
  "/admin/featured-drinks/new": "New Featured Drink",
  "/admin/featured-drinks/edit": "Edit Featured Drink",
  "/admin/featured-drinks": "Featured Drinks",
  "/admin/observer": "Observer",
};

function getAdminPageName(pathname: string): string {
  if (pathname.startsWith("/admin/history/")) return "Order Details";
  if (pathname.startsWith("/admin/users/")) return "User Details";

  return ADMIN_PAGE_TITLES[pathname] ?? ADMIN_APP_NAME;
}

export function formatAdminTabTitle(pathname: string, drinkCount: number): string {
  const pageName = getAdminPageName(pathname);
  const base =
    pageName === ADMIN_APP_NAME ? ADMIN_APP_NAME : `${pageName} - ${ADMIN_APP_NAME}`;

  if (drinkCount > 0) {
    return `(${drinkCount}) ${base}`;
  }

  return base;
}
