import React from 'react'
import Image from 'next/image'
export default function NotfoundPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
        <Image src="/notfound.png" alt="404" width={500} height={500} />
    </div>
  )
}
