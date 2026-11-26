import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://ohdrlicuxttbhmvpixex.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_PlIWM7f0Dt2XTp0JQT0VKg_pCI42X5m";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);