import { KangCageur } from "@/components/ui/kang-cageur";
import { COPY } from "@/lib/constants";

export function LoadingKang({ message = COPY.errors.loading }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-16 text-center">
      <div className="relative flex h-28 w-28 items-center justify-center">
        <span className="absolute inset-0 animate-spin rounded-full border-4 border-teal-100 border-t-teal-500" />
        <span className="absolute inset-2 animate-spin rounded-full border-4 border-transparent border-b-gold-400 [animation-duration:1.6s] [animation-direction:reverse]" />
        <span className="animate-kang-bob">
          <KangCageur pose="clipboard" size={80} />
        </span>
      </div>
      <p className="text-sm font-semibold text-navy-500">{message}</p>
      <div className="flex gap-1.5" aria-hidden="true">
        <span className="h-2 w-2 animate-bounce rounded-full bg-teal-500 [animation-delay:-0.3s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-teal-500 [animation-delay:-0.15s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-teal-500" />
      </div>
    </div>
  );
}
