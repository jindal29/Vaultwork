import React from 'react'
import { Outlet } from 'react-router-dom'
import { Navbar } from '../common/Navbar'
import { Footer } from '../common/Footer'
import { SupabaseBanner } from '../common/SupabaseBanner'

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#101413] text-[#F4F5F1]">
      <SupabaseBanner />
      <Navbar />
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
