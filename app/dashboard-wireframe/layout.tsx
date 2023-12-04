import React from 'react';
import Sidebar from './_components/Sidebar';
import Header from './_components/Header';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-full bg-white">
      {/* Html should be used instead of div */}
      <main className="h-full">
        <Header />
        <Sidebar />
        {children}
      </main>
      {/* body should be used instead of main */}
    </div>
  );
};

export default Layout;
