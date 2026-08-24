import 'bootstrap/dist/css/bootstrap.min.css';
import '../src/index.css';
import '../src/App.css';

export const metadata = {
  title: 'RaNevra | Stocks Intelligence & Merchant Portal',
  description: 'Real-time NSE Stock Market Intelligence, Intraday Momentum Scanner, and Merchant Portal',
  icons: {
    icon: '/favicon.svg',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}

