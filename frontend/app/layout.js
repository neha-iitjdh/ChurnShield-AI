/**
 * Root Layout - Wraps all pages
 * This is like the "skeleton" of your website
 */

export const metadata = {
  title: 'ChurnShield AI',
  description: 'Predict customer churn with machine learning',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
