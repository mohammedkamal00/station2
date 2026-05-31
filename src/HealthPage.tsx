import { useEffect, useState } from "react";
import { getSupabaseClient } from "./lib/supabase";

export default function HealthPage() {
  const [status, setStatus] = useState("Checking...");

  useEffect(() => {
    const check = async () => {
      try {
        const supabase = getSupabaseClient();

        const { error } = await supabase
          .from("health_check")
          .select("id")
          .limit(1);

        if (error) {
          setStatus("Supabase health check failed");
        } else {
          setStatus("OK - Supabase is active");
        }
      } catch {
        setStatus("Supabase health check failed");
      }
    };

    check();
  }, []);

  return <div>{status}</div>;
}