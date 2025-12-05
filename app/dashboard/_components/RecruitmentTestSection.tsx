'use client';
import type { Participant, Protocol } from '@prisma/client';
import { type Route } from 'next';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { SuperJSON } from 'superjson';
import { Button } from '~/components/ui/Button';
import { SelectField } from '~/lib/form/components/fields/Select';
import {
  type GetParticipantsQuery,
  type GetParticipantsReturnType,
} from '~/queries/participants';
import {
  type GetProtocolsQuery,
  type GetProtocolsReturnType,
} from '~/queries/protocols';

export default function RecruitmentTestSection({
  protocolsPromise,
  participantsPromise,
  allowAnonymousRecruitmentPromise,
}: {
  protocolsPromise: GetProtocolsReturnType;
  participantsPromise: GetParticipantsReturnType;
  allowAnonymousRecruitmentPromise: Promise<boolean>;
}) {
  const rawProtocols = use(protocolsPromise);
  const protocols = SuperJSON.parse<GetProtocolsQuery>(rawProtocols);
  const rawParticipants = use(participantsPromise);
  const participants = SuperJSON.parse<GetParticipantsQuery>(rawParticipants);
  const allowAnonymousRecruitment = use(allowAnonymousRecruitmentPromise);

  const [selectedProtocol, setSelectedProtocol] = useState<Partial<Protocol>>();
  const [selectedParticipant, setSelectedParticipant] = useState<Participant>();

  const router = useRouter();

  useEffect(() => {
    if (allowAnonymousRecruitment) {
      setSelectedParticipant(undefined);
    }
  }, [allowAnonymousRecruitment]);

  const buttonDisabled =
    !selectedProtocol || (!allowAnonymousRecruitment && !selectedParticipant);

  const getInterviewURL = (): Route => {
    if (!selectedParticipant) {
      return `/onboard/${selectedProtocol?.id}` as Route;
    }

    return `/onboard/${selectedProtocol?.id}/?participantIdentifier=${selectedParticipant?.identifier}` as Route;
  };

  return (
    <>
      <div className="mt-6 flex gap-4">
        <SelectField
          name="Protocol"
          options={protocols.map((p) => ({ value: p.id, label: p.name }))}
          onChange={(value) => {
            const protocol = protocols.find(
              (protocol) => protocol.id === value,
            ) as Protocol;

            setSelectedProtocol(protocol);
          }}
          value={selectedProtocol?.id}
          placeholder="Select a Protocol..."
        />
        <SelectField
          name="Participant"
          options={participants.map((p) => ({
            value: p.id,
            label: p.identifier,
          }))}
          onChange={(value) => {
            const participant = participants?.find(
              (participant) => participant.id === value,
            );

            setSelectedParticipant(participant);
          }}
          value={selectedParticipant?.id}
          placeholder="Select a Participant..."
        />
      </div>
      <div className="mt-6 flex gap-2">
        <Button
          disabled={buttonDisabled}
          onClick={() => router.push(getInterviewURL())}
        >
          Start Interview with GET
        </Button>
        <Button
          disabled={buttonDisabled}
          onClick={async () =>
            await fetch(window.location.origin + getInterviewURL(), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                participantIdentifier: selectedParticipant?.identifier,
              }),
            }).then((response) => {
              if (response.redirected) {
                window.location.href = response.url;
              }
            })
          }
        >
          Start Interview with POST
        </Button>
      </div>
    </>
  );
}
