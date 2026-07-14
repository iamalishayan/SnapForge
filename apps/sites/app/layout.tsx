// Root layout — reads x-site-domain header, fetches site_config, sets lang attribute and theme class on body
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
