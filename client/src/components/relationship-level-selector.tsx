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

const getButtonClasses = (color: string, isSelected: boolean) => {
  const baseClasses = "flex-1 p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center space-y-1 hover:scale-105";
  
  if (isSelected) {
    switch (color) {
      case 'emerald':
        return `${baseClasses} text-emerald-600 bg-emerald-50 border-emerald-300 shadow-sm`;
      case 'blue':
        return `${baseClasses} text-blue-600 bg-blue-50 border-blue-300 shadow-sm`;
      case 'rose':
        return `${baseClasses} text-rose-600 bg-rose-50 border-rose-300 shadow-sm`;
      case 'slate':
        return `${baseClasses} text-slate-600 bg-slate-50 border-slate-300 shadow-sm`;
      default:
        return `${baseClasses} text-gray-600 bg-gray-50 border-gray-300 shadow-sm`;
    }
  } else {
    switch (color) {
      case 'emerald':
        return `${baseClasses} text-emerald-400 border-gray-200 bg-white hover:bg-gray-50 hover:text-emerald-500`;
      case 'blue':
        return `${baseClasses} text-blue-400 border-gray-200 bg-white hover:bg-gray-50 hover:text-blue-500`;
      case 'rose':
        return `${baseClasses} text-rose-400 border-gray-200 bg-white hover:bg-gray-50 hover:text-rose-500`;
      case 'slate':
        return `${baseClasses} text-slate-400 border-gray-200 bg-white hover:bg-gray-50 hover:text-slate-500`;
      default:
        return `${baseClasses} text-gray-400 border-gray-200 bg-white hover:bg-gray-50 hover:text-gray-500`;
    }
  }
};

export function RelationshipLevelSelector({ value = "new", onChange }: RelationshipLevelSelectorProps) {
  return (
    <div className="space-y-3">
      <Label>Relationship Level</Label>
      <div className="flex justify-between gap-2">
        {Object.entries(RELATIONSHIP_LEVELS).map(([key, level]) => {
          const Icon = iconMap[level.icon as keyof typeof iconMap];
          const isSelected = value === key;
          
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={getButtonClasses(level.color, isSelected)}
              title={level.label}
            >
              <Icon size={20} />
              <span className="text-xs font-medium hidden sm:block">{level.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}