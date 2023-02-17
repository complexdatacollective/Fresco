import { useState } from 'react'
import reactLogo from './assets/react.svg'
import './App.css'
import { trpc } from './utils/trpc'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createTRPCReact, getFetch, httpBatchLink, loggerLink } from '@trpc/react-query';
import { AppRouter } from '@codaco/api'
import { ipcLink } from 'electron-trpc/renderer'

const trpcReact = createTRPCReact<AppRouter>();

const AppContent = () => {
  const [userName, setUserName] = useState('');
  const utils = trpc.useContext();

  const { 
    data: users,
    isFetching,
    isLoading,
    error,    
  } = trpc.user.all.useQuery();
  
  const {
    mutate: createUser,
    isLoading: isCreatingUser,
    isError: isCreateUserError,
  } = trpc.user.create.useMutation({
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


  return (
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
  )
}

function App() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // https://react-query.tanstack.com/guides/window-focus-refetching
        // Should set to true for web but false for Electron.
        // This is because on Electron we know the data won't have changed
        // when we weren't looking!
        refetchOnWindowFocus: false,
      },
    },
  }));

  // const [trpcClient] = useState(() => getClient());

    const [trpcClient] = useState(() => {
      
      // Electron
      // return trpcReact.createClient({
      //   links: [loggerLink(), ipcLink()],
      // })

      // Browser
      return trpc.createClient({
        // transformer: superjson,
        links: [
          loggerLink(),
          httpBatchLink({
            url: "http://localhost:3000/api/trpc",
            fetch: async (input, init?) => {
              const fetch = getFetch();
              return fetch(input, {
                ...init,
              });
            },
          }),
        ],
      })

      
    }
  );

  return (
    <trpc.Provider queryClient={queryClient} client={trpcClient}>
      <QueryClientProvider client={queryClient}>
        <div className="App">
          <div>
            <a href="https://vitejs.dev" target="_blank">
              <img src="/vite.svg" className="logo" alt="Vite logo" />
            </a>
            <a href="https://reactjs.org" target="_blank">
              <img src={reactLogo} className="logo react" alt="React logo" />
            </a>
          </div>
          <AppContent />
        </div>
      </QueryClientProvider>
    </trpc.Provider>
  )
}

export default App
