import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  current: number;
  total: number;
  onChange: (page: number) => void;
}

const Pagination = ({ current, total, onChange }: PaginationProps) => {
  if (total <= 1) return null;

  const pages: (number | "...")[] = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - 1 && i <= current + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <div className="flex items-center justify-center gap-1.5 py-6">
      <button
        disabled={current === 1}
        onClick={() => onChange(current - 1)}
        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-30"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`e-${i}`} className="px-2 text-muted-foreground">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`min-w-[36px] rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              current === p
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        disabled={current === total}
        onClick={() => onChange(current + 1)}
        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-30"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
};

export default Pagination;
