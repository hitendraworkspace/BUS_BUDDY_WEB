import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Fleet Buddy - Comprehensive Fleet Management Platform',
  description: 'Run your fleet on autopilot with live tracking, trip management, MDVR video, ADAS/DMS alerts, and maintenance in one simple dashboard. Available on Web, Android, and iOS.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}

