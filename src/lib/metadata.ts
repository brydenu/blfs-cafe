import type { Metadata } from "next";

export const CUSTOMER_APP_NAME = "BioLife Cafe";
export const ADMIN_APP_NAME = "BaristaOS";

export function pageTitle(title: string): Metadata {
  return { title };
}
