"use client"

import MenusList from "./MenusList"
import type { Menu } from "@/lib/types"

interface MenuColacionesProps {
  onAddToCart?: (menu: Menu, cantidad: number) => void
}

export default function MenuColaciones({ onAddToCart }: MenuColacionesProps) {
  return <MenusList tipo="colacion" onAddToCart={onAddToCart} />
}
