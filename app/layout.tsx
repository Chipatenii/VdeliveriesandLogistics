import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LocationProvider } from "@/context/LocationContext";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
    themeColor: "#0b1120",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export const metadata: Metadata = {
    title: "V deliveries and Logistics",
    description: "Lusaka Delivery MVP",
    manifest: "/manifest.json", // For PWA
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "Vdeliveries",
    },
    other: {
        "mobile-web-app-capable": "yes",
    }
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark" suppressHydrationWarning>
            <body className={`${inter.className} bg-black text-white antialiased`}>
                <AuthProvider>
                    <ToastProvider>
                        <LocationProvider>
                            {children}
                        </LocationProvider>
                    </ToastProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
