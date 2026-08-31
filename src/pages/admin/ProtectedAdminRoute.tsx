import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabase";

export default function ProtectedAdminRoute() {
  const location = useLocation();
  const [status, setStatus] = useState<"loading" | "allowed" | "denied">(
    "loading",
  );

  useEffect(() => {
    let active = true;

    async function checkAccess() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        if (active) setStatus("denied");
        return;
      }

      const { data, error } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!active) return;

      if (error || !data) {
        setStatus("denied");
        return;
      }

      setStatus("allowed");
    }

    checkAccess();

    return () => {
      active = false;
    };
  }, [location.pathname]);

  if (status === "loading") {
    return (
      <div className="admin-loading">
        <p>Checking admin access...</p>
      </div>
    );
  }

  if (status === "denied") {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
