import Image from "next/image"

export default function LogoHeader() {
  return (
    <div className="absolute top-4 left-4 z-10">
      <Image
        src="/images/delicias-logo.png"
        alt="Delicias Food Service"
        width={120}
        height={48}
        className="object-contain"
      />
    </div>
  )
}
