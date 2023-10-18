import Link from 'next/link';

export default function NotFound() {
  return (
    <div>
      <h1>404 - Page Not Found</h1>
      <p>
        Go back to the <Link href="/">Dashboard</Link>
      </p>
    </div>
  );
}
