"use client";

import { type PropsWithChildren, useState, type ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";

export default function Providers({ children, locale }) {
  const [queryClient] = useState(() => new QueryClient());

  let messages;
  try {
    // messages = (await import(`../../messages/${locale}.json`)).default;
  } catch (error) {
    notFound();
  }

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
