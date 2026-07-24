export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-500" role="alert">
      {message}
    </div>
  );
}
