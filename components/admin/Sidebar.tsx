"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  LayoutDashboard,
  ShoppingCart,
  ChefHat,
  Building2,
  Users,
  UserCheck,
  Megaphone,
  Cookie,
  Banknote,
  Clock,
} from "lucide-react"

const sidebarNavItems = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Gestion de Pedidos",
    href: "/admin/pedidos",
    icon: ShoppingCart,
  },
  {
    title: "Cocina",
    href: "/admin/cocina",
    icon: ChefHat,
  },
  {
    title: "Casinos",
    href: "/admin/casinos",
    icon: Building2,
  },
  {
    title: "Colaciones",
    href: "/admin/colaciones",
    icon: Cookie,
  },
  {
    title: "Finanzas",
    href: "/admin/finanzas",
    icon: Banknote,
  },
  {
    title: "Funcionarios",
    href: "/admin/funcionarios",
    icon: Users,
  },
  {
    title: "Estudiantes",
    href: "/admin/estudiantes",
    icon: UserCheck,
  },
  {
    title: "Minutas",
    href: "/admin/publicar",
    icon: Megaphone,
  },
  {
    title: "Configuración",
    href: "/admin/configuracion",
    icon: Clock,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="pb-12 w-64">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Admin Casino</h2>
          <div className="space-y-1">
            <ScrollArea className="h-[400px]">
              {sidebarNavItems.map((item) => (
                <Button
                  key={item.href}
                  variant={pathname === item.href ? "secondary" : "ghost"}
                  className={cn("w-full justify-start", pathname === item.href && "bg-muted font-medium")}
                  asChild
                >
                  <Link href={item.href}>
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.title}
                  </Link>
                </Button>
              ))}
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  )
}
