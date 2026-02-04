import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'IOMS - Authentication',
  description: 'Sign in or sign up to access IOMS',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
