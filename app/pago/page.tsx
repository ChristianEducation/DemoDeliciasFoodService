import PasarelaPago from "@/components/PasarelaPago"

export default function PagoPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Realizar Pago</h1>
        <PasarelaPago />
      </div>
    </main>
  )
}
