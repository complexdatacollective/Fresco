import type { NextRequest } from 'next/server';
import { getServerSession } from '~/utils/auth';
import type { Session } from 'lucia';

const createInnerTRPCContext = ({
  session,
  request,
}: {
  session: Session | null;
  request: NextRequest;
}) => {
  return {
    request,
    session,
  };
};

export const createTRPCContext = async (req: NextRequest) => {
  return createInnerTRPCContext({
    request: req,
    session: await getServerSession(),
  });
};
