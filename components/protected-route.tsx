"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Box, Typography, Button, Stack } from "@mui/joy";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stalled, setStalled] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  // If verifying takes too long, show recovery actions instead of hanging
  useEffect(() => {
    if (!loading) {
      setStalled(false);
      return;
    }
    const t = setTimeout(() => setStalled(true), 6500);
    return () => clearTimeout(t);
  }, [loading]);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 20% 20%, rgba(46, 212, 122, 0.16), transparent 55%), #050609",
          color: "#F2F5FA",
        }}
      >
        <Stack spacing={2} sx={{ alignItems: "center" }}>
          <Typography level="title-lg" sx={{ color: "rgba(242, 245, 250, 0.72)" }}>
            Verifying authentication...
          </Typography>
          {stalled && (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Button variant="outlined" onClick={() => router.refresh()}>Retry</Button>
              <Button onClick={() => router.push("/auth")}>Go to Sign In</Button>
            </Stack>
          )}
        </Stack>
      </Box>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
