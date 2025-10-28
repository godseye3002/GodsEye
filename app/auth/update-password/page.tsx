"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Box,
  Button,
  Divider,
  FormControl,
  FormHelperText,
  Input,
  Sheet,
  Stack,
  Typography,
  IconButton,
} from "@mui/joy";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const mismatch = useMemo(() => password && confirm && password !== confirm, [password, confirm]);
  const weak = useMemo(() => (password?.length ?? 0) < 8, [password]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mismatch || weak || !password) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const { error: updErr } = await supabase.auth.updateUser({ password });
      if (updErr) {
        const raw = (updErr.message || "").toLowerCase();
        const friendly = raw.includes("password") || weak
          ? "Please choose a stronger password and try again."
          : raw.includes("rate limit")
          ? "Too many attempts. Please wait a moment and try again."
          : "We couldn't update your password right now. Please try again.";
        setError(friendly);
        return;
      }
      router.replace("/auth");
    } catch (e) {
      setError("We couldn't update your password right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box suppressHydrationWarning sx={{ minHeight: "100dvh", display: "grid", placeItems: "center", px: 2 }}>
      <Sheet
        variant="outlined"
        sx={{
          width: "100%",
          maxWidth: 520,
          p: { xs: 2.2, md: 3 },
          borderRadius: 3,
          borderColor: "rgba(46, 212, 122, 0.24)",
          background: "linear-gradient(135deg, rgba(12,18,26,0.96), rgba(9,13,21,0.92))",
          boxShadow: "0 48px 160px rgba(0,0,0,0.55)",
        }}
      >
        <Stack spacing={2.2} component="form" onSubmit={onSubmit} autoComplete="off">
          <Typography level="h4" sx={{ color: "#F2F5FA", fontWeight: 700 }}>
            Update your password
          </Typography>

          {error && (
            <Typography level="body-sm" sx={{ color: "#FF8A8F" }}>
              {error}
            </Typography>
          )}

          <FormControl>
            <Typography level="body-sm" sx={{ color: "rgba(226,230,240,0.9)", mb: 0.6 }}>
              New password
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1} suppressHydrationWarning>
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter a new password"
                name="new-password"
                autoComplete="new-password"
                slotProps={{ input: { suppressHydrationWarning: true } as any }}
                sx={{ flex: 1 }}
              />
              <IconButton
                variant="soft"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "🙈" : "👁️"}
              </IconButton>
            </Stack>
            <FormHelperText sx={{ color: weak && password ? "#FF8A8F" : "rgba(162,167,180,0.75)" }}>
              Use at least 8 characters.
            </FormHelperText>
          </FormControl>

          <FormControl>
            <Typography level="body-sm" sx={{ color: "rgba(226,230,240,0.9)", mb: 0.6 }}>
              Confirm password
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1} suppressHydrationWarning>
              <Input
                type={showConfirm ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter the new password"
                name="confirm-password"
                autoComplete="new-password"
                slotProps={{ input: { suppressHydrationWarning: true } as any }}
                sx={{ flex: 1 }}
              />
              <IconButton
                variant="soft"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? "Hide confirm" : "Show confirm"}
              >
                {showConfirm ? "🙈" : "👁️"}
              </IconButton>
            </Stack>
            {mismatch && (
              <FormHelperText sx={{ color: "#FF8A8F" }}>
                Passwords do not match.
              </FormHelperText>
            )}
          </FormControl>

          <Divider sx={{ color: "rgba(162, 167, 180, 0.6)", my: 0.6 }}>security</Divider>

          <Button
            type="submit"
            disabled={isSubmitting || weak || mismatch || !password || !confirm}
            sx={{
              mt: 0.4,
              backgroundColor: "#2ED47A",
              color: "#0D0F14",
              fontWeight: 600,
              fontSize: "1.02rem",
              py: 1,
              "&:hover": { backgroundColor: "#26B869", transform: "translateY(-1px)" },
            }}
          >
            Update password
          </Button>
        </Stack>
      </Sheet>
    </Box>
  );
}
