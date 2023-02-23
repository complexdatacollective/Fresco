import { useState, ChangeEvent, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Spinner } from '@codaco/ui';
import Section from './Section';
import { trpcReact } from '@/utils/trpc/trpc';


const TestSection = () => {
  const [file, setFile] = useState<File>();

  const [userName, setUserName] = useState('');
  const utils = trpcReact.useContext();

  const { 
    data: users,
    isFetching,
    isLoading,
    error,    
  } = trpcReact.user.all.useQuery();
  
  const {
    mutate: createUser,
    isLoading: isCreatingUser,
    isError: isCreateUserError,
  } = trpcReact.user.create.useMutation({
    onSuccess: () => {
      utils.user.all.invalidate(); // https://trpc.io/docs/useContext#query-invalidation
    }
  });

  const handleSubmit = () => {
    createUser({
      name: userName,
      email: `${userName}@places.com`
    });
    setUserName('');
  }

  // Capture NODE_ENV
  const platform = import.meta.env.VITE_APP_PLATFORM || 'web';

  console.log('platform', platform);

  return (
    <Section className="start-screen-section">
      <div>
        <h1>Users</h1>
        <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} />
        <button onClick={handleSubmit}>Add user</button>
        {isCreateUserError && <p>Error creating user</p>}
        {isCreatingUser && <p>Creating user...</p>}
        {isLoading && <p>Loading...</p>}
        {isFetching && <p>Updating...</p>}
        {error && <p>{error.message}</p>}
        <ul>
          {users && users.map((user) => (
            <li key={user.id}>{user.name} - {user.email}</li>
          ))}
        </ul>
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
