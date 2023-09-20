import Link from 'next/link';

export default async function Page() {
  return (
    <>
      <h1>Page</h1>
      <p>
        This page is rendered on the server and the client. It has a{' '}
        <code>getServerSideProps</code> function that fetches data from the
        server.
      </p>
      <p>
        This page uses <code>getServerSideProps</code> to fetch the current
        session from the server. This is useful for pages that require session
        data to render.
      </p>
      <p>
        This page uses <code>useSession()</code> to fetch the current session
        from the client. This is useful for pages that require session data to
        render.
      </p>
      <p>
        <Link href="/dashboard">Eat it</Link>
      </p>
    </>
  );
}
