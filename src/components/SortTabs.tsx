import { Clock, Eye, ThumbsUp, Flame } from "lucide-react";

const tabs = [
  { id: "recentes", label: "Recentes", icon: Clock },
  { id: "vistos", label: "Mais vistos", icon: Eye },
  { id: "votados", label: "Mais votados", icon: ThumbsUp },
  { id: "hot", label: "Em alta", icon: Flame },
];

interface SortTabsProps {
  active: string;
  onChange: (id: string) => void;
}

const SortTabs = ({ active, onChange }: SortTabsProps) => (
  <div className="flex gap-2 overflow-x-auto scrollbar-hide">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => onChange(tab.id)}
        className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          active === tab.id
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-muted-foreground hover:text-foreground"
        }`}
      >
        <tab.icon className="h-3.5 w-3.5" />
        {tab.label}
      </button>
    ))}
  </div>
);

export default SortTabs;
