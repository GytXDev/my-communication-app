import './globals.css';
import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: 'My Communication App',
  description: 'Application de communication Next.js 13 + Firebase',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
