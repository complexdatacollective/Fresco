import { useState, ChangeEvent, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Spinner, Button } from '@codaco/ui';
import Section from './Section';
import { trpcReact } from '@/utils/trpc/trpc';
import { useMutation } from '@tanstack/react-query';


const TestSection = () => {
  const [file, setFile] = useState<File>();
  const [loading, setLoading] = useState(false);

  const [userName, setUserName] = useState('');

  // Gives access to helpers: https://trpc.io/docs/useContext#helpers
  const utils = trpcReact.useContext();

  // https://tanstack.com/query/v4/docs/react/reference/useMutation
  const {
    mutate: uploadProtocol,
    isLoading: isUploadingProtocol,
  } = useMutation(formData => {
    return fetch('http://127.0.0.1:3001/api/protocols', {
      method: 'POST',
      body: formData,
    })
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
      // Cancel any outgoing refetches sso they don't overwrite our optimistic update
      await utils.user.all.cancel()

      // Snapshot the current value
      const previousUsers = utils.user.all.getData();

      // The User type requires additional properties that are not included in the
      // mutation input. These will be generated in the backend, but we need to
      // add them here so that the type is valid.
      const newUserWithMeta = {
        ...newUser,
        id: 'temp-id',
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

  const handleDeleteUser = (id: string) => {
    deleteUser(id);
  }

  const handleSubmit = () => {
    createUser({
      name: userName,
      email: `${userName}@places.com`
    });
    setUserName('');
  }

  const handleCreateProtocol = async () => {
    if (!file) {
      return;
    }

    console.log(file);

    // FormData is how we send files to the backend
    const formData = new FormData();
    formData.append('protocolFile', file);
    uploadProtocol(formData, {
      onSuccess: (data) => {
        console.log('success', data);
      },
    })
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  // Capture NODE_ENV
  const platform = import.meta.env.VITE_APP_PLATFORM || 'web';

  return (
    <Section className="start-screen-section">
      <div
        style={{
          background: 'var(--color-slate-blue)',
          padding: '1.2rem 3.6rem',
        }}
      >
        <h1>Users</h1>
        <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} />
        <Button onClick={handleSubmit}>Add user</Button>
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
            <li key={protocol.name}>{protocol.name}</li>
          ))}
        </ul>
        <input
          type="file"
          accept=".netcanvas"
          onChange={handleFileChange}
        />
        <div>{file && `${file.name} - ${file.type}`}</div>
        <Button onClick={handleCreateProtocol} disabled={isUploadingProtocol}>
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
