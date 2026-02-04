'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/features/auth/AuthContext'

export default function IOMSApp() {
  const { currentUser, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (currentUser) {
        // If logged in, go directly to orders
        router.replace('/orders')
      } else {
        // If not logged in, go to login
        router.replace('/login?redirect=/orders')
      }
    }
  }, [currentUser, isLoading, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to IOMS...</p>
      </div>
    </div>
  )
} 
