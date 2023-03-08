import { useState, ChangeEvent, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Spinner, Button, ProtocolCard, Text } from '@codaco/ui';
import Section from './Section';
import { trpcReact, trpcVanilla } from '@/utils/trpc/trpc';
import { useMutation } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { actionCreators as dialogActions } from '@/ducks/modules/dialogs';
import { Dialog } from '@/ducks/modules/dialogs';
import type { AppDispatch } from '@/ducks/store';

const TestSection = () => {
  const [file, setFile] = useState<File>();
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch() as AppDispatch; // We need to use this custom type everywhere we use the useDispatch hook.
  const openDialog = (dialog: Dialog) => dispatch(dialogActions.openDialog(dialog));

  // Gives access to helpers: https://trpc.io/docs/useContext#helpers
  const utils = trpcReact.useContext();

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
    data: users,
    isLoading: isUsersLoading,
  } = trpcReact.user.all.useQuery();

  const {
    data: protocols,
    isLoading: isLoadingProtocols,
  } = trpcReact.protocols.all.useQuery();



  /**
   * Create user mutation
   * 
   * This example mutation uses optimistic updates to update the UI immediately
   * while the mutation is in flight. If the mutation fails, the UI is rolled
   * back to the previous state.
   */
  const {
    mutate: createUser,
    isLoading: isCreatingUser,
  } = trpcReact.user.create.useMutation({
    onMutate: async (newUser) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await utils.user.all.cancel()

      // Snapshot the current value
      const previousUsers = utils.user.all.getData();

      // The User type requires additional properties that are not included in the
      // mutation input. These will be generated in the backend, but we need to
      // add them here so that the type is valid.
      const newUserWithMeta = {
        ...newUser,
        id: Number.MAX_VALUE, // Todo: this should be based on the last id in the list since it will autoincrement
        role: null,
      }
    
      // Optimistically update to the new value
      utils.user.all.setData(undefined, (old) => {
        if (!old) {
          return [newUserWithMeta];
        }

        return [newUserWithMeta, ...old]
      } )

      // Return a context object with the snapshotted value
      return { previousUsers }
    },
    onError: (err, newUser, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      console.log("Show an errror dialog here", err);
      utils.user.all.setData(undefined, context?.previousUsers)
    },
    onSettled: () => {
      // On settled happens regardless of success or failure.
      // Invalidate the query to refetch the data
      utils.user.all.invalidate();
    },
  });

  // Delete user mutation, once again using optimistic updates
  const {
    mutate: deleteUser,
    isLoading: isDeletingUser,
  } = trpcReact.user.delete.useMutation({
    onMutate: async (id) => {
      // Cancel any outgoing refetches sso they don't overwrite our optimistic update
      await utils.user.all.cancel()

      // Snapshot the current value
      const previousUsers = utils.user.all.getData();

      // Optimistically update to the new value
      utils.user.all.setData(undefined, (old) => {
        if (!old) {
          return [];
        }

        return old.filter((user) => user.id !== id);
      })

      // Return a context object with the snapshotted value
      return { previousUsers }
    },
    onError: (err, id, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      console.log("Show an errror dialog here", err);
      utils.user.all.setData(undefined, context?.previousUsers)
    },
    onSettled: () => {
      utils.user.all.invalidate();
    },
  });

    useEffect(() => {
      if (isUsersLoading || isCreatingUser || isDeletingUser) {
        setLoading(true);
      } else {
        setLoading(false);
      }
  }, [isUsersLoading, isCreatingUser, isDeletingUser])

  const handleDeleteUser = (id: number) => {
    deleteUser(id);
  }

  const handleSubmit = () => {
    createUser({
      name: userName,
      email: `${userName}@places.com`
    });
    setUserName('');
  }

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
    <Section className="start-screen-section">
      <div
        style={{
          background: 'var(--color-slate-blue)',
          padding: '1.2rem 3.6rem',
        }}
      >
        <h1>Users</h1>
        <Text
          label="Enter a username"
          placeholder="Enter a user name"
          input={{
            value: userName,
            onChange: (e: ChangeEvent<HTMLInputElement>) => setUserName(e.target.value),  
          }}
        />
        <Button onClick={handleSubmit} disabled={!userName}>Add user</Button>
        <AnimatePresence initial={false}>
          <ul>
            {users && users.map((user, index) => (
              <motion.li
                key={`user-${user.name}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                layout
              >
                {user.name} - {user.email} <Button size="small" onClick={() => handleDeleteUser(user.id)}>Delete</Button>
              </motion.li>
            ))}
          </ul>
        </AnimatePresence>
        {loading && <Spinner />}
      </div>
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
    </Section>
  );
};



TestSection.propTypes = {
};

TestSection.defaultProps = {
};

export default TestSection;
