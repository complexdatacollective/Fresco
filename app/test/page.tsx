import { signOutAction } from '../_actions/session';
import { trpcRscHTTP } from '../_trpc/server';

export default async function Page() {
  // const session = await trpcRscHTTP.session.get.query();
  const session = {};
  return (
    <>
      <pre>
        <code>{JSON.stringify(session, null, 2)}</code>
      </pre>
      {/* <form action={signOutAction}>
        <button type="submit">Sign out</button>
      </form> */}
    </>
  );
}
