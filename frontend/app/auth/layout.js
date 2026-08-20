// Login/register/reset-password have no unique content to show in search
// results, and indexing them just invites credential-stuffing bots to find
// the login form via Google instead of a direct link.
export const metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }) {
  return children;
}
