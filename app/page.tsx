"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useUserSession } from "@/hooks/useUserSession"
import Image from "next/image"
import { Users, UserCircle, UsersRound, CalendarX, ShieldCheck, Sparkles, ArrowRight, Check, ChevronRight } from "lucide-react"

export default function HomePage() {
  const router = useRouter()
  const { setTipoUsuario } = useUserSession()
  const [selected, setSelected] = useState<string>("apoderado")
  const [hover, setHover] = useState<string | null>(null)

  const handleUserSelection = () => {
    setTipoUsuario(selected as any)
    if (selected === "apoderado") {
      router.push("/apoderado")
    } else if (selected === "funcionario-sin-hijos") {
      router.push("/funcionario")
    } else if (selected === "funcionario-con-hijos") {
      router.push("/funcionario-con-hijos")
    } else {
      router.push("/destinatario")
    }
  }

  const perfiles = [
    {
      id: "apoderado",
      n: "01",
      titulo: "Apoderado",
      tag: "Para padres y tutores",
      descDesktop: "Realiza pedidos de almuerzo para tus hijos en el colegio.",
      descMobile: "Pedidos para tus hijos en el colegio.",
      icon: Users
    },
    {
      id: "funcionario-sin-hijos",
      n: "02",
      titulo: "Funcionario",
      tag: "Personal del colegio",
      descDesktop: "Pedido individual para tu jornada laboral.",
      descMobile: "Pedido individual para tu jornada.",
      icon: UserCircle
    },
    {
      id: "funcionario-con-hijos",
      n: "03",
      titulo: "Funcionario con hijos",
      tag: "Personal con hijos en el colegio",
      descDesktop: "Pedido personal y para tus hijos en un mismo flujo.",
      descMobile: "Personal y para tus hijos a la vez.",
      icon: UsersRound
    }
  ]

  return (
    <div className="min-h-screen relative overflow-hidden font-sans text-[#25243A] bg-[#F0F6FD]">
      
      {/* Fondo plano */}

      {/* Watermark */}
      <div className="absolute -bottom-10 -left-2 lg:-bottom-20 lg:-left-8 z-0 font-serif italic text-[#5B3A9B] opacity-5 pointer-events-none select-none text-[200px] lg:text-[360px] leading-none tracking-tighter">
        d.
      </div>

      {/* TOP UTILITY BAR */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-4 lg:px-10 lg:py-6">
        <div className="hidden lg:flex items-center gap-3 font-mono text-[11px] text-[#7A7990] tracking-[0.12em] uppercase">
          <span className="px-2 py-1 rounded border border-[#DCD0EC] bg-white/70 text-[#5B3A9B] font-semibold">N°01</span>
          <span>Acceso · Identificación</span>
          <span className="w-1 h-1 rounded-full bg-[#B2B1C0]" />
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            Servicio activo
          </span>
        </div>
        <div className="lg:hidden" />
        
        {/* Botón Anular */}
        <Link href="/anular" passHref>
          <button className="inline-flex items-center gap-2 lg:gap-2.5 px-3 py-2 lg:px-4 lg:py-2.5 rounded-full bg-white/55 hover:bg-white/95 border border-[#DCD0EC] hover:border-[#A084D4] text-[#494864] hover:text-[#5B3A9B] text-xs lg:text-[13px] font-medium tracking-tight backdrop-blur-md shadow-[0_4px_14px_-10px_rgba(70,40,120,0.25)] hover:shadow-[0_8px_24px_-16px_#7A52BD,0_0_0_4px_#ECE4F5] transition-all duration-200 group">
            <CalendarX className="w-[14px] h-[14px] lg:w-4 lg:h-4 text-[#7A7990] group-hover:text-[#5B3A9B]" strokeWidth={1.7} />
            <span className="hidden sm:inline">Anular almuerzos</span>
            <span className="sm:hidden">Anular</span>
          </button>
        </Link>
      </div>

      {/* MAIN LAYOUT */}
      <div className="relative z-10 h-full min-h-screen grid grid-cols-1 lg:grid-cols-2 pt-[70px] lg:pt-0">
        
        {/* Divisor vertical desktop */}
        <div className="hidden lg:block absolute left-[46%] top-24 bottom-24 w-px bg-gradient-to-b from-transparent via-[#DCD0EC] to-transparent opacity-70" />

        {/* LEFT COL (Hero) */}
        <div className="flex flex-col justify-start lg:justify-center px-6 lg:px-[72px] pb-6 lg:pb-0 pt-6 lg:pt-0">
          <div className="lg:mb-14 flex justify-center lg:justify-start">
            <Image
              src="/images/delicias-logo.png"
              alt="Delicias"
              width={330}
              height={120}
              className="w-48 lg:w-72 object-contain"
              style={{ mixBlendMode: 'darken' }}
              priority
            />
          </div>

          <div className="inline-flex items-center gap-2.5 mt-6 lg:mt-0 mb-2 lg:mb-3 text-[10px] lg:text-[11px] text-[#5B3A9B] font-semibold tracking-[0.18em] uppercase justify-center lg:justify-start">
            <span className="w-6 lg:w-7 h-px bg-[#7A52BD]" />
            Bienvenido
          </div>

          <h1 className="font-serif text-[38px] lg:text-[76px] leading-[1.0] lg:leading-[0.98] tracking-[-0.028em] text-[#25243A] text-center lg:text-left">
            Selecciona<br />
            tu <em className="text-[#5B3A9B] italic pr-2">perfil</em>.
          </h1>

          <p className="hidden lg:block mt-6 max-w-[440px] text-[18px] text-[#7A7990] leading-[1.55]">
            Elige cómo quieres realizar tu pedido. Cada perfil está pensado para quienes confían en <span className="text-[#494864] font-medium">Delicias</span> todos los días.
          </p>
          <p className="lg:hidden mt-2 text-[13px] text-[#7A7990] leading-[1.45] text-center">
            Elige cómo quieres realizar tu pedido.
          </p>

          <div className="hidden lg:flex items-center gap-3 mt-14 text-xs">
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-white/85 border border-[#DCD0EC] backdrop-blur-md text-[#494864] font-medium shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-[#7A52BD]" strokeWidth={2} />
              Pedido seguro
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-white/85 border border-[#DCD0EC] backdrop-blur-md text-[#494864] font-medium shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#7A52BD]" strokeWidth={2} />
              Servicio institucional
            </div>
          </div>
        </div>

        {/* RIGHT COL (Cards) */}
        <div className="flex flex-col justify-center gap-2.5 lg:gap-3 px-5 lg:px-[72px] pb-8 lg:pb-0">
          
          <div className="flex items-baseline justify-between mb-0.5 lg:mb-1 px-0.5">
            <div className="font-mono text-[9.5px] lg:text-[11px] text-[#7A7990] tracking-[0.14em] uppercase">Perfiles{` `}<span className="hidden lg:inline">disponibles</span></div>
            <div className="font-mono text-[9.5px] lg:text-[11px] text-[#B2B1C0] tracking-[0.06em]">03 opciones</div>
          </div>

          {perfiles.map((p) => {
            const isSelected = selected === p.id
            const isHover = hover === p.id
            const active = isSelected || isHover
            const IconComp = p.icon

            return (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                onMouseEnter={() => setHover(p.id)}
                onMouseLeave={() => setHover(null)}
                className={`relative text-left p-[13px] px-3.5 lg:p-5 lg:px-[22px] rounded-[14px] lg:rounded-[18px] flex items-center gap-3 lg:gap-[18px] transition-all duration-300 cursor-pointer ${
                  isSelected 
                    ? 'bg-gradient-to-b from-white to-white/95 border-[#A084D4] shadow-[0_20px_44px_-22px_#7A52BD,0_0_0_4px_#ECE4F5]' 
                    : isHover
                      ? 'bg-gradient-to-b from-white/95 to-white/90 border-[#A084D4] shadow-[0_18px_40px_-26px_#7A52BD] lg:-translate-x-1'
                      : 'bg-gradient-to-b from-white/80 to-white/65 border-[#DCD0EC] shadow-[0_10px_30px_-22px_rgba(70,40,120,0.3)]'
                }`}
                style={{ backdropFilter: 'blur(14px)' }}
              >
                {/* Indicador morado */}
                {isSelected && (
                  <div className="absolute -left-px top-2.5 bottom-2.5 lg:top-3.5 lg:bottom-3.5 w-[3px] bg-[#5B3A9B] rounded-r-sm" />
                )}

                {/* Número */}
                <div className={`font-serif italic text-[20px] lg:text-[28px] leading-none w-[18px] lg:w-[24px] text-center shrink-0 transition-colors ${active ? 'text-[#5B3A9B]' : 'text-[#B2B1C0]'}`}>
                  {p.n}
                </div>

                {/* Ícono */}
                <div className={`w-[42px] h-[42px] lg:w-[54px] lg:h-[54px] rounded-xl lg:rounded-[14px] flex items-center justify-center shrink-0 transition-all ${
                  active ? 'bg-gradient-to-br from-[#7A52BD] to-[#5B3A9B] border-transparent shadow-[0_8px_20px_-10px_#5B3A9B,inset_0_1px_0_rgba(255,255,255,0.2)]' : 'bg-[#ECE4F5] border-[#DCD0EC]'
                }`}>
                  <IconComp className={`w-[22px] h-[22px] lg:w-[26px] lg:h-[26px] ${active ? 'text-white' : 'text-[#5B3A9B]'}`} strokeWidth={1.7} />
                </div>

                {/* Texto */}
                <div className="flex-1 min-w-0">
                  <div className="hidden lg:block text-[10px] font-semibold text-[#7A52BD] tracking-[0.14em] uppercase mb-1">{p.tag}</div>
                  <div className="text-[15px] lg:text-[19px] font-semibold tracking-[-0.012em] text-[#25243A] mb-0.5 lg:mb-1 leading-[1.2]">{p.titulo}</div>
                  <div className="text-[11.5px] lg:text-[13.5px] text-[#7A7990] leading-[1.35]">
                    <span className="hidden lg:inline">{p.descDesktop}</span>
                    <span className="lg:hidden">{p.descMobile}</span>
                  </div>
                </div>

                {/* Radio */}
                <div className={`w-[26px] h-[26px] lg:w-[36px] lg:h-[36px] rounded-full flex items-center justify-center shrink-0 transition-all border ${
                  isSelected ? 'bg-[#5B3A9B] border-[#A084D4]' : 'bg-transparent border-[#DCD0EC]'
                } ${isHover && !isSelected ? 'border-[#A084D4]' : ''}`}>
                  {isSelected 
                    ? <Check className="w-3 h-3 lg:w-4 lg:h-4 text-white" strokeWidth={2} />
                    : <ChevronRight className="w-3 h-3 lg:w-4 lg:h-4 text-[#7A52BD]" strokeWidth={2} />
                  }
                </div>
              </button>
            )
          })}

          {/* Botón Continuar */}
          <button
            onClick={handleUserSelection}
            className="mt-1.5 lg:mt-4 p-[13px] lg:p-[17px] rounded-[13px] lg:rounded-[14px] bg-gradient-to-b from-[#7A52BD] to-[#5B3A9B] text-white font-semibold text-[13.5px] lg:text-[15px] tracking-[-0.005em] shadow-[0_14px_30px_-12px_#5B3A9B,inset_0_1px_0_rgba(255,255,255,0.22)] flex items-center justify-center gap-2 hover:opacity-95 transition-opacity"
          >
            <span className="lg:hidden">Continuar</span>
            <span className="hidden lg:inline">Continuar como {perfiles.find(p => p.id === selected)?.titulo.toLowerCase()}</span>
            <ArrowRight className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-white" strokeWidth={2.5} />
          </button>

          {/* Footer Mobile */}
          <div className="lg:hidden mt-3 flex items-center justify-between px-1">
            <div className="inline-flex items-center gap-1.5 text-[11px] text-[#7A7990] py-1.5 px-2.5 rounded-full bg-white/60 border border-[#DCD0EC] backdrop-blur-sm font-medium">
              <ShieldCheck className="w-3 h-3 text-[#7A52BD]" strokeWidth={2} />
              Pedido seguro
            </div>
          </div>

        </div>
      </div>
      
    </div>
  )
}
