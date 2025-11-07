import "./globals.css"
import { Inter } from "next/font/google"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { AuthProvider } from "@/components/AuthProvider"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "AutoStack – Deploy from GitHub to AWS in Seconds",
  description: "Enterprise-grade DevOps automation made simple.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-white`}>
        <Navbar />
        <main className="pt-20">{children}</main>
        <Footer />
 	<Navbar />
	<AuthProvider>
  	<main className="pt-20">
    	<TransitionWrapper>{children}</TransitionWrapper>
  	</main>
  	<Footer />
	</AuthProvider>
      </body>
    </html>
  )
}

