import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotfoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4 text-center">
      <Image
        src="/notfound.png"
        alt="Page not found"
        width={500}
        height={500}
        priority
        style={{ width: "auto", height: "auto", maxWidth: "100%", maxHeight: "50vh" }}
      />
      <h1 className="text-2xl font-bold">Page Not Found</h1>
      <p className="text-muted-foreground">The page you are looking for does not exist.</p>
      <Button render={<Link href="/" />}>
        Return Home
      </Button>
    </div>
  )
}
