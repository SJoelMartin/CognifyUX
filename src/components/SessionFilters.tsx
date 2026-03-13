import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Filter, X, ArrowUpDown } from "lucide-react";

export interface SessionFiltersState {
  scoreRange: [number, number];
  deviceType: string;
  signalCountMin: number;
  sortBy: 'score' | 'duration' | 'signals' | 'timestamp';
  sortOrder: 'asc' | 'desc';
}

interface SessionFiltersProps {
  filters: SessionFiltersState;
  onFiltersChange: (filters: SessionFiltersState) => void;
  onReset: () => void;
}

export const defaultFilters: SessionFiltersState = {
  scoreRange: [0, 100],
  deviceType: 'all',
  signalCountMin: 0,
  sortBy: 'timestamp',
  sortOrder: 'desc',
};

export const SessionFilters = ({ filters, onFiltersChange, onReset }: SessionFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasActiveFilters = 
    filters.scoreRange[0] > 0 || 
    filters.scoreRange[1] < 100 || 
    filters.deviceType !== 'all' ||
    filters.signalCountMin > 0;

  const updateFilter = <K extends keyof SessionFiltersState>(
    key: K, 
    value: SessionFiltersState[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const getScoreBandLabel = (min: number, max: number) => {
    if (min === 0 && max <= 20) return "Low";
    if (min <= 21 && max <= 40) return "Mild";
    if (min <= 41 && max <= 70) return "Moderate";
    if (min >= 71) return "High";
    return `${min}-${max}`;
  };

  return (
    <div className="space-y-3">
      {/* Filter Toggle */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="gap-2"
        >
          <Filter className="w-4 h-4" />
          Filters
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              Active
            </Badge>
          )}
        </Button>
        
        <div className="flex items-center gap-2">
          <Select 
            value={filters.sortBy} 
            onValueChange={(v) => updateFilter('sortBy', v as SessionFiltersState['sortBy'])}
          >
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="timestamp">Time</SelectItem>
              <SelectItem value="score">Score</SelectItem>
              <SelectItem value="duration">Duration</SelectItem>
              <SelectItem value="signals">Signals</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            <ArrowUpDown className={`w-4 h-4 ${filters.sortOrder === 'asc' ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-4">
          {/* Score Range */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Score Range</label>
              <span className="text-xs text-muted-foreground">
                {getScoreBandLabel(filters.scoreRange[0], filters.scoreRange[1])} ({filters.scoreRange[0]} - {filters.scoreRange[1]})
              </span>
            </div>
            <Slider
              value={filters.scoreRange}
              min={0}
              max={100}
              step={5}
              onValueChange={(value) => updateFilter('scoreRange', value as [number, number])}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Low (0-20)</span>
              <span>Mild (21-40)</span>
              <span>Moderate (41-70)</span>
              <span>High (71-100)</span>
            </div>
          </div>

          {/* Device Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Device Type</label>
            <Select 
              value={filters.deviceType} 
              onValueChange={(v) => updateFilter('deviceType', v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All devices" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Devices</SelectItem>
                <SelectItem value="desktop">Desktop</SelectItem>
                <SelectItem value="tablet">Tablet</SelectItem>
                <SelectItem value="mobile">Mobile</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Minimum Signals */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Minimum Signals</label>
              <span className="text-xs text-muted-foreground">{filters.signalCountMin}+</span>
            </div>
            <Slider
              value={[filters.signalCountMin]}
              min={0}
              max={20}
              step={1}
              onValueChange={(value) => updateFilter('signalCountMin', value[0])}
              className="py-2"
            />
          </div>

          {/* Reset */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={onReset} className="gap-2 w-full">
              <X className="w-4 h-4" />
              Reset Filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
