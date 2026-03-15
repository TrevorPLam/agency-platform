import './globals.css'

export const metadata = {
  title: 'Agency Admin - Internal Dashboard',
  description: 'Internal control panel for agency operations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
