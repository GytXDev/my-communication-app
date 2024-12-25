// app/layout.js
import './global.css'

export const metadata = {
  title: 'My Communication App',
  description: 'Application de communication Next.js 13 + Firebase',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        {children}
      </body>
    </html>
  )
}
