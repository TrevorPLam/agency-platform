import './globals.css'
import { Providers } from '../components/providers'

export const metadata = {
  title: 'Agency - Digital Marketing Excellence',
  description: 'Leading digital agency delivering exceptional marketing solutions',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
