import { Link } from "react-router-dom";

const categories = ["Todos", "Novinhas", "Amadoras", "Cornos", "Onlyfans", "Vazados", "Lésbicas", "Pack", "Putaria"];

interface CategoryFilterProps {
  active: string;
  onChange: (cat: string) => void;
}

const CategoryFilter = ({ active, onChange }: CategoryFilterProps) => (
  <nav aria-label="Categorias" className="flex gap-2 overflow-x-auto pb-1">
    {categories.map((cat) => (
      <Link
        key={cat}
        to={cat === "Todos" ? "/" : `/categorias/${encodeURIComponent(cat)}`}
        onClick={(e) => {
          e.preventDefault();
          onChange(cat);
        }}
        className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
          active === cat
            ? "bg-primary/15 text-primary ring-1 ring-primary/30"
            : "bg-secondary text-muted-foreground hover:text-foreground"
        }`}
      >
        {cat}
      </Link>
    ))}
  </nav>
);

export default CategoryFilter;
