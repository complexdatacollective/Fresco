import { useState, ChangeEvent } from 'react';
import { Spinner, Button, ProtocolCard } from '@codaco/ui';
import { trpcReact, trpcVanilla } from '@/utils/trpc/trpc';
import { useMutation } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { actionCreators as dialogActions } from '@/ducks/modules/dialogs';
import { Dialog } from '@/ducks/modules/dialogs';
import type { AppDispatch } from '@/ducks/store';
import { useLocation } from 'wouter';

const Protocols = () => {
  const [file, setFile] = useState<File>();

  const dispatch = useDispatch() as AppDispatch; // We need to use this custom type everywhere we use the useDispatch hook.
  const openDialog = (dialog: Dialog) => dispatch(dialogActions.openDialog(dialog));

  const confirmOverwriteProtocol = () => new Promise<void>((resolve, reject) => {
    openDialog({
      type: 'Warning',
      title: 'Overwrite existing protocol?',
      message: 'A protocol with this hash already exists. Are you sure you want to overwrite it?',
      confirmLabel: 'Overwrite Existing Protocol',
      onConfirm: () => {
        resolve();
      },
      onCancel: () => {
        reject();
      },
    });
  });

  // https://tanstack.com/query/v4/docs/react/reference/useMutation
  const {
    mutate: uploadProtocol,
    isLoading: isUploadingProtocol,
    reset: resetUploadProtocol,
  } = useMutation({
    mutationFn: async (formData: FormData) => {
      return fetch('http://127.0.0.1:3001/api/protocols', {
        method: 'POST',
        body: formData,
      }).then((response) => response.json());
    },
  })

  const {
    data: protocols,
    isLoading: isLoadingProtocols,
  } = trpcReact.protocols.all.useQuery();

  const [location, navigate] = useLocation();

  
  // TODO: Obviously this all needs to be moved somewhere sensible...
  const handleCreateProtocol = async () => {
    if (!file) {
      return;
    }

    // Compute a hash of the file using the browser's crypto API
    const hash = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
    
    // convert result to hex string
    const hashAsHexString = Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
    console.log(hashAsHexString);

    // Check if a protocol exists with this hash
    const existing = await trpcVanilla.protocols.byHash.query(hashAsHexString);

    if (existing) {
      // Check if the protocol has in progress interview sessions



      // If it does, open a dialog to confirm the user wants to overwrite it
      try {
        await confirmOverwriteProtocol();
      } catch (err) {
        // If the user cancels, reset the file input
        setFile(undefined);
        return;
      }
    }
    // FormData is how we send files to the backend
    const formData = new FormData();
    formData.append('protocolFile', file);
    uploadProtocol(formData, {
      onSuccess: (data) => {
        console.log(data)

        // If the mutation fails, check for validation errors
        if (!data.success) {
          const handleConfirmError = () => {
                // Reset the mutation state, and the file input
                setFile(undefined);
                resetUploadProtocol();
              }

          if (data.schemaErrors && data.dataErrors) {
            const Message = () => (
              <>
                <p>Your protocol file failed validation. See below for the specific problems we found. This is often caused by attempting to open a protocol file authored in an incompatible version of Architect.</p>
              </>
            );

            openDialog({
              type: 'Error',
              title: 'Invalid Protocol File',
              message: <Message />,
              additionalInfo: [...data.schemaErrors, ...data.dataErrors].join(' \n'),
              onConfirm: handleConfirmError,
            });

            return;
          }

          // If there are no validation errors, show a generic error dialog
          openDialog({
            type: 'Error',
            title: 'Error Uploading Protocol',
            message: data.error,
            additionalInfo: data.error,
            onConfirm: handleConfirmError,
          });
        }
      },
      onError: (err: unknown) => {
        const errorObj = err as Error;

        // If the request fails, show an error dialog
        openDialog({
          type: 'Error',
          title: 'Error Uploading Protocol',
          message: 'There was an error uploading your protocol. Please see the message below for more details.',
          additionalInfo: errorObj.toString(),
        });
      },
    })
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <section
      style={{
        background: 'var(--color-tomato)',
        padding: '1.2rem 3.6rem',
      }}
    >
      <h1>Protocols</h1>
      {isLoadingProtocols && <Spinner />}
      <ul>
        {protocols?.map((protocol) => (
          <li key={protocol.hash}>
            <ProtocolCard
              name={protocol.name}
              schemaVersion={protocol.schemaVersion}
              importedAt={protocol.importedAt}
              lastModified={protocol.lastModified}
              description={protocol.description!}
              onClickHandler={() => {
                navigate(`/interview/${protocol.hash}`)
              }}
              condensed
            />
          </li>
        ))}
      </ul>
      <input
        type="file"
        accept=".netcanvas"
        onChange={handleFileChange}
        key={file ? file.name : 'empty'}
      />
      <div>{file && `${file.name} - ${file.type}`}</div>
      <Button onClick={handleCreateProtocol} disabled={!file || isUploadingProtocol}>
        Upload
      </Button>
    </section>
  )
}

export default Protocols;
