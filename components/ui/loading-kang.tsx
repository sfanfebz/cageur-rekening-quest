import { KangCageur } from "@/components/ui/kang-cageur";
import { COPY } from "@/lib/constants";

export function LoadingKang({ message = COPY.errors.loading }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="animate-pulse">
        <KangCageur pose="clipboard" size={96} />
      </div>
      <p className="text-sm font-semibold text-navy-500">{message}</p>
    </div>
  );
}
