import { AppStateProvider } from './components/AppStateContext'

export const metadata = {
    title: "Adobe India Hackathon 2025 Finale - Ritzy",
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