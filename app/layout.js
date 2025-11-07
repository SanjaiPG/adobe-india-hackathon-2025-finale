import { AppStateProvider } from './components/AppStateContext'

export const metadata = {
    title: "Snipply",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body><AppStateProvider>
                {children}
            </AppStateProvider></body>
        </html>
    );
}