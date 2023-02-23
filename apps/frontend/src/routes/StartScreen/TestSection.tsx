import { useState, ChangeEvent, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Spinner, Button } from '@codaco/ui';
import Section from './Section';
import { trpcReact } from '@/utils/trpc/trpc';
import { useQueryClient } from '@tanstack/react-query';
import { getQueryKey } from '@trpc/react-query';


const TestSection = () => {
  const [file, setFile] = useState<File>();

  const [userName, setUserName] = useState('');

  // Gives access to helpers: https://trpc.io/docs/useContext#helpers
  const utils = trpcReact.useContext();

  const { 
    data: users,
    isFetching,
    isLoading,
    error,    
  } = trpcReact.user.all.useQuery();

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
    isError: isCreateUserError,
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
    isError: isDeleteUserError,
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
        <button onClick={handleSubmit}>Add user</button>
        {isCreateUserError && <p>Error creating user</p>}
        {error && <p>{error.message}</p>}
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
                {user.name} - {user.email} <Button disabled={isDeletingUser} size="small" onClick={() => handleDeleteUser(user.id)}>Delete</Button>
              </motion.li>
            ))}
          </ul>
        </AnimatePresence>
        {isLoading && <Spinner />}
        {isFetching || isCreatingUser || isDeletingUser && !isLoading && <Spinner small />}
      </div>
      {/* <motion.section
        style={{
          background: 'var(--color-tomato)',
          padding: '1.2rem 3.6rem',
        }}
      >
        <h1>API Test</h1>
        <h2>Platform: {platform}</h2>
        {isLoading && <Spinner />}
        {isError && <p>{guardedError}</p>}
        {isSuccess && (
          <ul>
            {protocols.map((protocol: Protocol) => (
              <li key={protocol.name}>{protocol.name}</li>
            ))}
            {isFetching && <Spinner />}
          </ul>
        )}
      </motion.section>
      <section
        style={{
          background: 'var(--color-tomato)',
          padding: '1.2rem 3.6rem',
        }}
      >
        <h1>Add protocol</h1>
        <input
          type="file"
          accept=".netcanvas"
          onChange={handleFileChange}
        />
        <div>{file && `${file.name} - ${file.type}`}</div>
        <button
          onClick={handleCreateProtocol}
          disabled={isAddingProtocol}
        >
          Upload
        </button>
      </section> */}
    </Section>
  );
};



TestSection.propTypes = {
};

TestSection.defaultProps = {
};

export default TestSection;
