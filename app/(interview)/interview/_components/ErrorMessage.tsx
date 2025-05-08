interface ErrorMessageProps {
  title: string;
  message: string;
}

export const ErrorMessage = ({ title, message }: ErrorMessageProps) => {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-2 text-2xl font-bold">{title}</div>
        <p className="max-w-md text-lg">{message}</p>
      </div>
    </div>
  );
};
