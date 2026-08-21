"use client"

import MenusList from "./MenusList"
import type { Menu } from "@/lib/types"

interface MenuAlmuerzosProps {
  onAddToCart?: (menu: Menu, cantidad: number) => void
}

export default function MenuAlmuerzos({ onAddToCart }: MenuAlmuerzosProps) {
  return <MenusList tipo="almuerzo" onAddToCart={onAddToCart} />
}
