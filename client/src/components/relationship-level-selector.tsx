import { Star, Shield, Heart, Briefcase } from "lucide-react";
import { RELATIONSHIP_LEVELS } from "@/lib/constants";
import { Label } from "@/components/ui/label";

interface RelationshipLevelSelectorProps {
  value?: string;
  onChange: (level: string) => void;
}

const iconMap = {
  star: Star,
  shield: Shield,
  heart: Heart,
  briefcase: Briefcase,
};

const colorMap = {
  emerald: "text-emerald-500 border-gray-200 bg-white hover:bg-gray-50",
  blue: "text-blue-500 border-gray-200 bg-white hover:bg-gray-50",
  rose: "text-rose-500 border-gray-200 bg-white hover:bg-gray-50",
  slate: "text-slate-500 border-gray-200 bg-white hover:bg-gray-50",
};

const selectedColorMap = {
  emerald: "text-emerald-500 bg-emerald-50 border-emerald-300",
  blue: "text-blue-500 bg-blue-50 border-blue-300",
  rose: "text-rose-500 bg-rose-50 border-rose-300",
  slate: "text-slate-500 bg-slate-50 border-slate-300",
};

export function RelationshipLevelSelector({ value = "new", onChange }: RelationshipLevelSelectorProps) {
  return (
    <div className="space-y-3">
      <Label>Relationship Level</Label>
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(RELATIONSHIP_LEVELS).map(([key, level]) => {
          const Icon = iconMap[level.icon as keyof typeof iconMap];
          const isSelected = value === key;
          const colorClass = isSelected 
            ? selectedColorMap[level.color as keyof typeof selectedColorMap]
            : colorMap[level.color as keyof typeof colorMap];

          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={`p-4 rounded-lg border-2 transition-all duration-200 flex flex-col items-center space-y-2 hover:scale-105 ${colorClass}`}
            >
              <Icon size={24} />
              <span className="text-sm font-medium">{level.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}