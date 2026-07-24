export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">
      {message}
    </div>
  );
}
