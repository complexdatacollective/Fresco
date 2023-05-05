import Link from "next/link";
import Button from "~/ui/components/Button";

export default function Home() {
  return (
    <main>
      <Link href="/signup">
        <Button>Sign Up</Button>
      </Link>
      <Button>Sign In</Button>
    </main>
  );
}
