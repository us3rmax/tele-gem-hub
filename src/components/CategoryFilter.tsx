const categories = ["Todos", "Crypto", "NFTs", "DeFi", "Trading", "Airdrops", "Play2Earn", "Web3", "Metaverse"];

interface CategoryFilterProps {
  active: string;
  onChange: (cat: string) => void;
}

const CategoryFilter = ({ active, onChange }: CategoryFilterProps) => (
  <div className="flex gap-2 overflow-x-auto pb-1">
    {categories.map((cat) => (
      <button
        key={cat}
        onClick={() => onChange(cat)}
        className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
          active === cat
            ? "bg-primary/15 text-primary ring-1 ring-primary/30"
            : "bg-secondary text-muted-foreground hover:text-foreground"
        }`}
      >
        {cat}
      </button>
    ))}
  </div>
);

export default CategoryFilter;
