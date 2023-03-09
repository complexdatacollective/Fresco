import React, { ChangeEvent, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Text } from '@codaco/ui';
import { trpcReact } from '@/utils/trpc/trpc';


const Users=() => {
  const [userName, setUserName]=useState('');
  const [email, setEmail]=useState('');

  // Gives access to helpers: https://trpc.io/docs/useContext#helpers
  const utils = trpcReact.useContext();

  const { 
    data: users,
    isLoading: isUsersLoading,
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
  } = trpcReact.user.create.useMutation({
    onMutate: async (newUser) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await utils.user.all.cancel()

      // Snapshot the current value
      const previousUsers=utils.user.all.getData();

      // The User type requires additional properties that are not included in the
      // mutation input. These will be generated in the backend, but we need to
      // add them here so that the type is valid.
      const newUserWithMeta={
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
      const previousUsers=utils.user.all.getData();

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

  const handleDeleteUser=(id: number) => {
    deleteUser(id);
  }

  const handleSubmit=() => {
    createUser({
      name: userName,
      email: email,
    });
    setUserName('');
  }


  return (
  <div
    style= {{
      background: 'var(--color-slate-blue)',
      padding: '1.2rem 3.6rem',
    }}
  >
    <h1>Users</h1>
    <div
      style={{
        display: 'inline-flex',
        width: '100%',
      }}
    >
    <Text
      label="Enter a username"
      placeholder= "Enter a user name"
      input={{
        value: userName,
        onChange: (e: ChangeEvent<HTMLInputElement>) => setUserName(e.target.value),
      }}
    />
    <Text
      label="Enter an email address"
      placeholder= "Enter an email address"
      input={{
        value: email,
        onChange: (e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value),
      }}
    />
    </div>
    <Button onClick={ handleSubmit } disabled={!userName || !email}>Add user </Button>
      <AnimatePresence initial={ false} >
        <ul>
          { users && users.map((user, index) => (
            <motion.li
              key={`user-${user.name}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              layout
              >
                { user.name } - { user.email } <Button size="small" onClick={() => handleDeleteUser(user.id)}>Delete</Button>
            </motion.li>
          ))}
        </ul>
    </AnimatePresence>
  </div>
  );
};

export default Users;
