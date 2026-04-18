import "dotenv/config";
console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30));
console.log("Service Key exists:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log("Service Key starts with:", process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 30));
