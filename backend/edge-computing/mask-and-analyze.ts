import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";

// CONSTANTS - Environment variables are injected at runtime
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

const ALLOWED_ORIGINS = new Set([
    "https://patcheai.com",
    "http://localhost:3000", // Dev environment
]);

const ALLOWED_POSES = new Set(["front", "left", "right", "back"]);
const MAX_IMAGE_BYTES = 6 * 1024 * 1024; // 6MB limit

// --- Helper Functions ---

function cors(req: Request) {
    const origin = req.headers.get("origin");
    const allowOrigin = !origin ? "*" : (ALLOWED_ORIGINS.has(origin) ? origin : "null");

    return {
        "Access-Control-Allow-Origin": allowOrigin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
        "Access-Control-Max-Age": "86400",
        "Cache-Control": "no-store",
    };
}

async function checkRateLimit(client: any, userId: string, limit: number) {
    // Implementation omitted for brevity - simulates Redis/Postgres based rate limiting
    // In production, this checks a 'daily_scan_counts' table row for the user.
    return true;
}

// ... Additional helper functions for image processing would reside here ...

/**
 * Main Edge Function Handler
 * 
 * Process flow:
 * 1. Authenticate user via JWT.
 * 2. Enforce Rate Limits.
 * 3. Validate Payload (Multipart form-data images).
 * 4. Audit Log: Log "Analysis Started".
 * 5. Pre-process images (MIME validation, Size checks).
 * 6. Send to AI Vision Model with strict privacy prompts.
 * 7. Clean & Normalize AI Output.
 * 8. Audit Log: Log "Analysis Completed".
 * 9. Return JSON response.
 */
Deno.serve(async (req) => {
    // 1. Handle CORS Preflight
    if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: cors(req) });
    }

    const requestId = crypto.randomUUID();

    try {
        // 2. Authentication
        const auth = req.headers.get("authorization") ?? "";
        const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: { headers: { Authorization: auth } },
            auth: { persistSession: false },
        });

        const { data: { user } } = await supabaseUser.auth.getUser();
        if (!user) {
            return json(req, { error: "Unauthorized", requestId }, 401);
        }

        // 3. Rate Limiting
        // Industrial IoT pattern: Throttle high-cost operations at the edge
        try {
            await checkRateLimit(supabaseUser, user.id, 15);
        } catch (error: any) {
            console.warn(`[RateLimit] User ${user.id} exceeded quota.`);
            return json(req, { error: "Daily limit exceeded", requestId }, 429);
        }

        // 4. Input Validation
        const ct = req.headers.get("content-type") || "";
        if (!ct.toLowerCase().includes("multipart/form-data")) {
            return json(req, { error: "Expected multipart/form-data", requestId }, 415);
        }

        // 5. Initialize Administrative Client for Auditing
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
            auth: { persistSession: false },
        });

        // 6. Audit Logging - START
        await supabaseAdmin.from("audit_logs").insert({
            event_type: "processing_started",
            actor_id: user.id,
            action: "mask_and_analyze",
            metadata: { request_id: requestId, source: "edge_function" },
        });

        // 7. Process Form Data & Images
        const formData = await req.formData();
        const images: any[] = [];

        // ... (Image validation logic: checks magic bytes for security, ensures valid MIME types) ...

        // 8. AI Analysis with Privacy-First Prompts
        // We strictly instruct the model to ignore PII/face/tattoos and focus only on biometrics.
        const tools = [
            {
                type: "function",
                function: {
                    name: "emit_biometric_data",
                    description: "Return biometric estimates from anonymized photos.",
                    parameters: { /* schema definition */ }
                }
            }
        ];

        // ... (OpenAI fetch logic) ...

        // 9. Audit Logging - COMPLETE
        await supabaseAdmin.from("audit_logs").insert({
            event_type: "processing_completed",
            actor_id: user.id,
            action: "mask_and_analyze",
            metadata: { request_id: requestId, success: true },
        });

        return json(req, { success: true, data: "Analysis Complete", requestId }, 200);

    } catch (e) {
        console.error(`[EdgeError] Request ${requestId} failed:`, e);
        return json(req, { error: "Internal Server Error", requestId }, 500);
    }
});

function json(req: Request, payload: any, status = 200) {
    return new Response(JSON.stringify(payload), {
        status,
        headers: { ...cors(req), "Content-Type": "application/json" },
    });
}
