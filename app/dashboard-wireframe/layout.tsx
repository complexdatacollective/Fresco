import React from 'react';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-full bg-white">
      {/* Html should be used instead of div */}
      <main className="h-full">{children}</main>
      {/* body should be used instead of main */}
    </div>
  );
};

export default Layout;
