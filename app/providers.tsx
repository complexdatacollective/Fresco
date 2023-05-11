"use client";

import { type PropsWithChildren, useState, type ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { NextIntlClientProvider } from "next-intl";

export default async function Providers({
  children
}: PropsWithChildren): ReactElement {
  const [queryClient] = useState(() => new QueryClient());

// need to get locale from somewhere. hard coded for now
const locale = 'en'

const messages = (await import(`../messages/${locale}.json`)).default;


  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
