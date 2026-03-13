import { Badge } from "@/components/ui/badge";
import { Radio, Wifi, WifiOff } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RealtimeIndicatorProps {
  isConnected: boolean;
  eventCount: number;
  onReset?: () => void;
}

export function RealtimeIndicator({ isConnected, eventCount, onReset }: RealtimeIndicatorProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={onReset}
          >
            <div className="flex items-center gap-1.5">
              {isConnected ? (
                <>
                  <Radio className="w-3.5 h-3.5 text-cla-success animate-pulse" />
                  <span className="text-xs text-cla-success">Live</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Offline</span>
                </>
              )}
            </div>
            {eventCount > 0 && (
              <Badge 
                variant="secondary" 
                className="bg-primary/20 text-primary text-xs px-1.5 py-0"
              >
                +{eventCount}
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {isConnected 
              ? `Real-time updates active. ${eventCount} new events.${eventCount > 0 ? ' Click to reset counter.' : ''}` 
              : 'Connecting to real-time updates...'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
