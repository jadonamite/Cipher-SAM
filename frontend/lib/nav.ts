export type NavLink = { href: string; label: string }

const generateNavLinks = (): NavLink[] => [
  { href: '/dashboard',       label: 'Dashboard' },
  { href: '/subscriptions',   label: 'Subscriptions' },
  { href: '/recommendations', label: 'Recommendations' },
  { href: '/agent',           label: 'Agent' },
  { href: '/audit',           label: 'Audit' },
  { href: '/policies',        label: 'Policies' },
]

export const NAV_LINKS = generateNavLinks()