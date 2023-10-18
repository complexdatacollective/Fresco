import Link from 'next/link';

export default function InterviewNotFound() {
  return (
    <div className="min-h-screen">
      <h1>404 - Interview Not Found</h1>
      <p> No interview with the provided id was found</p>
      <p>
        Go back to the <Link href="/">Dashboard</Link>
      </p>
    </div>
  );
}
