import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface RealtimeEvent {
  id: string;
  session_id: string;
  event_type: string;
  page_url: string;
  client_timestamp: number;
}

export function useRealtimeAnalytics() {
  const [isConnected, setIsConnected] = useState(false);
  const [recentEvents, setRecentEvents] = useState<RealtimeEvent[]>([]);
  const [eventCount, setEventCount] = useState(0);
  const queryClient = useQueryClient();

  const handleNewEvent = useCallback((payload: { new: RealtimeEvent }) => {
    const newEvent = payload.new;
    
    setRecentEvents(prev => {
      const updated = [newEvent, ...prev].slice(0, 10); // Keep last 10
      return updated;
    });
    
    setEventCount(prev => prev + 1);
    
    // Invalidate analytics query to refresh data
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
  }, [queryClient]);

  useEffect(() => {
    const channel = supabase
      .channel('cla-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cla_events',
        },
        handleNewEvent
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsConnected(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [handleNewEvent]);

  const resetEventCount = useCallback(() => {
    setEventCount(0);
    toast.info("Event counter reset");
  }, []);

  return {
    isConnected,
    recentEvents,
    eventCount,
    resetEventCount,
  };
}
