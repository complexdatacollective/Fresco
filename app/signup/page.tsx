"use client";

import { useEffect, useState } from "react";
import { User } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { SignUp } from "~/components/SignUp";
import Table from "~/components/Table";

export default function Page() {
  const [users, setUsers] = useState<User[]>([]);
  // Get users from next api
  const { data } = useQuery(["users"], () =>
    fetch("/api/users").then((res) => res.json())
  );

  useEffect(() => {
    if (data) {
      // wrangle the format a bit, so it works with <Table />
      setUsers(
        data.data.map((user: User) => {
          return [user.id, user.name, user.email];
        })
      );
    }
  }, [data]);

  return (
    <div className="flex flex-col">
      <div className="w-full p-10">
        <Table columns={["ID", "Name", "Email"]} rows={users} />
      </div>
      <div className="flex items-center justify-center">
        <SignUp />
      </div>
    </div>
  );
}
