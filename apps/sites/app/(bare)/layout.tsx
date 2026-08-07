/**
 * Bare article layout — no SnapForge header/footer so article_css
 * (nav/footer/body rules) cannot collide with site chrome.
 */
export default function BareLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
