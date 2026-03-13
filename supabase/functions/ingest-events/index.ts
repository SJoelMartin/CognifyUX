import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CLAEvent {
  type: string;
  t: number;
  selector?: string;
  x?: number;
  y?: number;
  velocity?: number;
  depth?: number;
  value?: string;
  from?: string;
  to?: string;
  name?: string;
  data?: Record<string, unknown>;
}

interface CLAPayload {
  session_id: string;
  page: string;
  ts: number;
  events: CLAEvent[];
  meta: {
    ua?: string;
    device?: string;
    viewport?: { width: number; height: number };
  };
}

interface EventData {
  selector?: string;
  x?: number;
  y?: number;
  velocity?: number;
  depth?: number;
  value?: string;
  from?: string;
  to?: string;
  name?: string;
  custom_data?: Record<string, unknown>;
}

interface NormalizedEvent {
  session_id: string;
  page_url: string;
  event_type: string;
  event_data: EventData;
  client_timestamp: number;
  device_type: string;
  viewport_width?: number;
  viewport_height?: number;
  user_agent?: string;
}

interface SuccessResponse {
  success: true;
  count: number;
  message?: string;
}

interface ErrorResponse {
  error: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: CLAPayload = await req.json();
    
    console.log(`[ingest-events] Received ${payload.events.length} events from session ${payload.session_id}`);
    console.log(`[ingest-events] Page: ${payload.page}, Device: ${payload.meta?.device}`);

    // Validate payload
    if (!payload.session_id || !payload.events || !Array.isArray(payload.events)) {
      console.error("[ingest-events] Invalid payload structure");
      return new Response(
        JSON.stringify({ error: "Invalid payload structure" } as ErrorResponse),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Normalize events with server timestamp
    const normalizedEvents: NormalizedEvent[] = payload.events.map((event) => ({
      session_id: payload.session_id,
      page_url: payload.page,
      event_type: event.type,
      event_data: {
        selector: event.selector,
        x: event.x,
        y: event.y,
        velocity: event.velocity,
        depth: event.depth,
        value: event.value,
        from: event.from,
        to: event.to,
        name: event.name,
        custom_data: event.data,
      },
      client_timestamp: payload.ts + event.t,
      device_type: payload.meta?.device || "unknown",
      viewport_width: payload.meta?.viewport?.width,
      viewport_height: payload.meta?.viewport?.height,
      user_agent: payload.meta?.ua,
    }));

    // Insert events into database
    const { data, error } = await supabase
      .from("cla_events")
      .insert(normalizedEvents);

    if (error) {
      console.error("[ingest-events] Database insert error:", error);
      // If table doesn't exist yet, just log and return success
      if (error.code === "42P01") {
        console.log("[ingest-events] Table not created yet, events logged but not stored");
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Events received (table pending migration)",
            count: payload.events.length 
          } as SuccessResponse),
          { 
            status: 200, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
      throw error;
    }

    console.log(`[ingest-events] Successfully stored ${normalizedEvents.length} events`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: normalizedEvents.length 
      } as SuccessResponse),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error: unknown) {
    console.error("[ingest-events] Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message } as ErrorResponse),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
