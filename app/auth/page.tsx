"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Divider,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  Sheet,
  Stack,
  Typography,
  Modal,
  ModalDialog,
  ModalClose,
  IconButton,
} from "@mui/joy";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

const restrictedDomains = [
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "aol.com",
  "icloud.com",
  "protonmail.com",
];

type AuthMode = "signup" | "signin";

export default function AuthPage() {
  const router = useRouter();
  const { user, loading, signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const [hasHydrated, setHasHydrated] = useState(false);
  const [mode, setMode] = useState<AuthMode>("signup");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [isAgencyOwner, setIsAgencyOwner] = useState(false);
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("");
  const [signUpName, setSignUpName] = useState("");
  const [signUpCompany, setSignUpCompany] = useState("");
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [showAccountExistsDialog, setShowAccountExistsDialog] = useState(false);
  const [accountExistsEmail, setAccountExistsEmail] = useState<string>("");
  const [passwordResetSent, setPasswordResetSent] = useState<string | null>(null);
  const [showPasswordResetDialog, setShowPasswordResetDialog] = useState(false);

  const signUpEmailError = useMemo(() => {
    if (!signUpEmail) return "";
    const domain = signUpEmail.split("@")[1]?.toLowerCase();
    if (!domain) {
      return "Please enter a valid email address.";
    }
    if (!isAgencyOwner && restrictedDomains.includes(domain)) {
      return "Use a professional work email, or toggle the agency owner option.";
    }
    return "";
  }, [signUpEmail, isAgencyOwner]);

  const signUpPasswordMismatch = useMemo(() => {
    if (!signUpPassword || !signUpConfirmPassword) return "";
    if (signUpPassword !== signUpConfirmPassword) {
      return "Passwords do not match.";
    }
    return "";
  }, [signUpPassword, signUpConfirmPassword]);

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (signUpEmailError || signUpPasswordMismatch) return;

    setIsSubmitting(true);
    setAuthError(null);
    try {
      const { error, alreadyExists } = await signUpWithEmail(
        signUpEmail,
        signUpPassword,
        signUpName || undefined
      );
      
      if (alreadyExists) {
        setMode('signin');
        setSignInEmail(signUpEmail);
        setAuthError('This email is already registered. Please sign in or use “Forgot your password?”.');
        return;
      }

      if (error) {
        console.error('Sign up error:', error);
        const raw = ((error as any)?.message || '').toLowerCase();
        // Common Supabase messages: "User already registered", "duplicate key value violates unique constraint"
        const isExisting = raw.includes('already registered') || raw.includes('duplicate') || raw.includes('exists') || raw.includes('already in use');
        if (isExisting) {
          setMode('signin');
          setSignInEmail(signUpEmail);
          setAuthError('This email is already registered. Please sign in or use “Forgot your password?”.');
          return;
        }
        const friendly = raw.includes('rate limit')
          ? 'Too many attempts. Please wait a moment and try again.'
          : 'We couldn\'t create your account right now. Please try again.';
        setAuthError(friendly);
        return;
      }
      
      setShowConfirmationDialog(true);
    } catch (err) {
      console.error('Unexpected error:', err);
      setAuthError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setAuthError(null);
    try {
      const { error } = await signInWithEmail(signInEmail, signInPassword);
      
      if (error) {
        const raw = ((error as any)?.message || '').toLowerCase();
        const isInvalid = raw.includes('invalid') || raw.includes('credential');
        if (isInvalid) {
          console.debug('Sign in: invalid credentials');
          setAuthError('Email or password is incorrect.');
          return;
        }
        if (raw.includes('rate limit')) {
          console.warn('Sign in: rate limited');
          setAuthError('Too many attempts. Please wait a moment and try again.');
          return;
        }
        console.error('Sign in error:', error);
        setAuthError('We couldn\'t sign you in right now. Please try again.');
        return;
      }
      
      // Success - redirect to products
      router.push("/products");
    } catch (err) {
      console.error('Unexpected error:', err);
      setAuthError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsSubmitting(true);
    setAuthError(null);
    try {
      const { error } = await signInWithGoogle();
      
      if (error) {
        console.error('Google auth error:', error);
        const errorMessage = error && typeof error === 'object' && 'message' in error 
          ? (error as { message: string }).message 
          : 'Failed to sign in with Google.';
        setAuthError(errorMessage);
        setIsSubmitting(false);
      }
      // Redirect happens automatically via callback
    } catch (err) {
      console.error('Unexpected error:', err);
      setAuthError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!signInEmail) {
      setAuthError('Enter your email to receive a password reset link.');
      return;
    }
    try {
      setIsSubmitting(true);
      setAuthError(null);
      setPasswordResetSent(null);
      const { error } = await supabase.auth.resetPasswordForEmail(signInEmail, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) {
        const raw = ((error as any)?.message || '').toLowerCase();
        const friendly = raw.includes('rate limit')
          ? 'We\'ve received too many requests. Please wait and try again.'
          : 'We couldn\'t send a reset link right now. Please try again.';
        setAuthError(friendly);
        return;
      }
      setPasswordResetSent(`We\'ve sent a reset link to ${signInEmail}. Check your inbox and spam folder.`);
      setShowPasswordResetDialog(true);
    } catch (e) {
      setAuthError('Failed to send reset link. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (hasHydrated && !loading && user) {
      router.replace("/products");
    }
  }, [hasHydrated, loading, user, router]);

  if (!hasHydrated) {
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
        <Typography level="title-lg" sx={{ color: "rgba(242, 245, 250, 0.72)" }}>
          Initializing secure access...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "stretch",
        background:
          "radial-gradient(circle at 20% 20%, rgba(46, 212, 122, 0.16), transparent 55%), #050609",
        color: "#F2F5FA",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          flex: { xs: "1 1 100%", lg: "0 0 41%" },
          px: { xs: 2.2, sm: 3.8, lg: 4.8 },
          py: { xs: 3, sm: 4.4 },
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 2.1,
        }}
      >
        <Box sx={{ maxWidth: 420 }}>
          <Typography
            level="h1"
            sx={{
              fontSize: { xs: "2.05rem", sm: "2.45rem", lg: "2.9rem" },
              fontWeight: 800,
              mb: 1.1,
              letterSpacing: "-0.03em",
            }}
          >
            Welcome to GodsEye
          </Typography>
          <Typography level="body-md" sx={{ color: "rgba(162, 167, 180, 0.84)", mb: 1.25 }}>
            Secure access for product leaders and growth teams. Create an account with
            your professional email or connect with Google to unlock AI-powered product
            intelligence.
          </Typography>
          <Stack direction="column" spacing={1} sx={{ mt: 0.85 }}>
            <Box>
              <Typography level="body-sm" sx={{ color: "rgba(162, 167, 180, 0.68)", fontWeight: 600 }}>
                Professional access includes
              </Typography>
              <ul
                style={{
                  margin: "4px 0 0 14px",
                  padding: 0,
                  color: "rgba(242, 245, 250, 0.8)",
                  lineHeight: 1.45,
                  fontSize: "0.95rem",
                }}
              >
                <li>Strategic alerts for AI search visibility</li>
                <li>Competitive product benchmarks</li>
                <li>Team collaboration permissions</li>
              </ul>
            </Box>
            <Typography level="body-xs" sx={{ color: "rgba(162, 167, 180, 0.6)" }}>
              Agency partners without a corporate domain can toggle the agency owner
              option during sign up.
            </Typography>
          </Stack>
        </Box>
      </Box>

      <Box
        sx={{
          flex: { xs: "1 1 100%", lg: "0 0 59%" },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: { xs: 2.1, sm: 3.9, lg: 5.2 },
          py: { xs: 3.2, sm: 4.5 },
          background:
            "linear-gradient(135deg, rgba(16, 21, 28, 0.98), rgba(9, 12, 20, 0.96))",
          boxShadow: "-40px 0 120px rgba(0, 0, 0, 0.45)",
        }}
      >
        <Sheet
          variant="soft"
          sx={{
            width: "100%",
            maxWidth: { xs: 480, md: 560 },
            borderRadius: 18,
            border: "1px solid rgba(46, 212, 122, 0.18)",
            background:
              "linear-gradient(135deg, rgba(12, 16, 24, 0.96), rgba(18, 24, 32, 0.92))",
            backdropFilter: "blur(14px)",
            px: { xs: 1.9, sm: 2.6 },
            pt: { xs: 1.9, sm: 2.5 },
            pb: { xs: 0.9, sm: 1.4 },
            boxShadow: "0 34px 96px rgba(5, 8, 12, 0.58)",
            display: "flex",
            flexDirection: "column",
            gap: 1.6,
            minHeight: { xs: 430, sm: 480, md: 520 },
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              display: "flex",
              backgroundColor: "transparent",
              borderRadius: "11px",
              border: "none",
              padding: 0,
              gap: 0.4,
              transition: "border-color 0.2s ease",
            }}
          >
            <Button
              onClick={() => setMode("signup")}
              size="md"
              variant={mode === "signup" ? "solid" : "plain"}
              sx={{
                flex: 1,
                fontWeight: 600,
                backgroundColor:
                  mode === "signup" ? "rgba(46, 212, 122, 0.15)" : "transparent",
                color: mode === "signup" ? "#2ED47A" : "rgba(162, 167, 180, 0.85)",
              }}
            >
              Sign Up
            </Button>
            <Button
              onClick={() => setMode("signin")}
              size="md"
              variant={mode === "signin" ? "solid" : "plain"}
              sx={{
                flex: 1,
                fontWeight: 600,
                backgroundColor:
                  mode === "signin" ? "rgba(46, 212, 122, 0.15)" : "transparent",
                color: mode === "signin" ? "#2ED47A" : "rgba(162, 167, 180, 0.85)",
              }}
            >
              Sign In
            </Button>
          </Box>

          <Button
            onClick={handleGoogleAuth}
            size="md"
            variant="outlined"
            disabled={isSubmitting}
            sx={{
              borderColor: "rgba(242, 245, 250, 0.18)",
              color: "rgba(242, 245, 250, 0.92)",
              fontWeight: 600,
              backgroundColor: "rgba(15, 18, 24, 0.72)",
              display: "flex",
              gap: 1.1,
              "&:hover": {
                borderColor: "rgba(46, 212, 122, 0.4)",
                backgroundColor: "rgba(15, 18, 24, 0.9)",
              },
              transition: "all 0.2s ease",
            }}
          >
            <Box
              component="svg"
              viewBox="0 0 24 24"
              sx={{
                width: 22,
                height: 22,
              }}
            >
              <path
                d="M21.8 12.227c0-.742-.067-1.455-.191-2.145H12v4.056h5.56c-.24 1.258-.97 2.324-2.067 3.042v2.528h3.342c1.953-1.8 3.065-4.454 3.065-7.481z"
                fill="#4285F4"
              />
              <path
                d="M12 22c2.772 0 5.096-.917 6.795-2.492l-3.342-2.528c-.928.623-2.118.994-3.453.994-2.656 0-4.904-1.794-5.709-4.205H2.82v2.64C4.504 19.64 7.981 22 12 22z"
                fill="#34A853"
              />
              <path
                d="M6.291 13.769A5.994 5.994 0 015.97 12c0-.613.105-1.206.321-1.769V7.591H2.82A9.96 9.96 0 001 12c0 1.564.37 3.045 1.82 4.409l3.471-2.64z"
                fill="#FBBC04"
              />
              <path
                d="M12 5.5c1.508 0 2.858.518 3.919 1.534l2.94-2.94C16.984 2.047 14.756 1 12 1 7.98 1 4.504 3.36 2.82 7.591l3.471 2.64C7.095 8.82 9.344 7.023 12 7.023z"
                fill="#EA4335"
              />
            </Box>
            Continue with Google
          </Button>

          <Divider sx={{ color: "rgba(162, 167, 180, 0.6)", my: -0.3 }}>
            or use email
          </Divider>

          {authError && (
            <Box
              sx={{
                p: 1.5,
                borderRadius: "8px",
                backgroundColor: "rgba(243, 91, 100, 0.12)",
                border: "1px solid rgba(243, 91, 100, 0.3)",
              }}
            >
              <Typography level="body-sm" sx={{ color: "#F35B64" }}>
                {authError}
              </Typography>
            </Box>
          )}

          {mode === "signup" ? (
            <Stack component="form" spacing={1.2} onSubmit={handleSignUp}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "minmax(0,1fr) minmax(0,1fr)" },
                  gap: 1,
                  alignItems: "start",
                  width: "100%",
                }}
              >
                <FormControl required sx={{ minWidth: 0, width: "100%" }}>
                  <FormLabel>Full name</FormLabel>
                  <Input
                    size="lg"
                    placeholder="Ada Lovelace"
                    value={signUpName}
                    onChange={(event) => setSignUpName(event.target.value)}
                    sx={{
                      backgroundColor: "rgba(12, 16, 24, 0.75)",
                      borderColor: "rgba(46, 212, 122, 0.18)",
                      width: "100%",
                    }}
                  />
                </FormControl>

                <FormControl required sx={{ minWidth: 0, width: "100%" }}>
                  <FormLabel>Company</FormLabel>
                  <Input
                    size="lg"
                    placeholder="GodsEye Labs"
                    value={signUpCompany}
                    onChange={(event) => setSignUpCompany(event.target.value)}
                    sx={{
                      backgroundColor: "rgba(12, 16, 24, 0.75)",
                      borderColor: "rgba(46, 212, 122, 0.18)",
                      width: "100%",
                    }}
                  />
                </FormControl>

                <FormControl required error={Boolean(signUpEmailError)} sx={{ minWidth: 0, width: "100%" }}>
                  <FormLabel>Work email</FormLabel>
                  <Input
                    size="lg"
                    type="email"
                    placeholder="you@company.com"
                    value={signUpEmail}
                    onChange={(event) => setSignUpEmail(event.target.value)}
                    sx={{
                      backgroundColor: "rgba(12, 16, 24, 0.75)",
                      borderColor: signUpEmailError
                        ? "rgba(243, 91, 100, 0.45)"
                        : "rgba(46, 212, 122, 0.18)",
                      width: "100%",
                    }}
                  />
                  {signUpEmailError ? (
                    <FormHelperText sx={{ mt: 0.35, fontSize: "0.86rem" }}>
                      {signUpEmailError}
                    </FormHelperText>
                  ) : null}
                </FormControl>

                <FormControl required sx={{ minWidth: 0, width: "100%" }}>
                  <FormLabel>Password</FormLabel>
                  <Input
                    size="lg"
                    type="password"
                    placeholder="Create a secure password"
                    value={signUpPassword}
                    onChange={(event) => setSignUpPassword(event.target.value)}
                    sx={{
                      backgroundColor: "rgba(12, 16, 24, 0.75)",
                      borderColor: "rgba(46, 212, 122, 0.18)",
                      width: "100%",
                    }}
                  />
                </FormControl>

                <FormControl
                  required
                  error={Boolean(signUpPasswordMismatch)}
                  sx={{
                    minWidth: 0,
                    width: "100%",
                    gridColumn: { xs: "1 / -1", sm: "1 / -1" },
                  }}
                >
                  <FormLabel>Confirm password</FormLabel>
                  <Input
                    size="lg"
                    type="password"
                    placeholder="Confirm your password"
                    value={signUpConfirmPassword}
                    onChange={(event) => setSignUpConfirmPassword(event.target.value)}
                    sx={{
                      backgroundColor: "rgba(12, 16, 24, 0.75)",
                      borderColor: signUpPasswordMismatch
                        ? "rgba(243, 91, 100, 0.45)"
                        : "rgba(46, 212, 122, 0.18)",
                      width: "100%",
                    }}
                  />
                  {signUpPasswordMismatch ? (
                    <FormHelperText sx={{ mt: 0.35, fontSize: "0.86rem" }}>
                      {signUpPasswordMismatch}
                    </FormHelperText>
                  ) : null}
                </FormControl>
              </Box>

              <Checkbox
                checked={isAgencyOwner}
                onChange={(event) => setIsAgencyOwner(event.target.checked)}
                label="I'm an agency partner without a corporate email"
                sx={{
                  color: "rgba(162, 167, 180, 0.72)",
                  fontSize: "0.92rem",
                  "& .MuiCheckbox-checkbox": {
                    borderRadius: "6px",
                    border: "1px solid rgba(46, 212, 122, 0.5)",
                    backgroundColor: "rgba(12, 16, 24, 0.65)",
                  },
                  "&:hover .MuiCheckbox-checkbox": {
                    borderColor: "rgba(46, 212, 122, 0.75)",
                  },
                  "&.Mui-checked .MuiCheckbox-checkbox": {
                    backgroundColor: "#2ED47A",
                    borderColor: "#2ED47A",
                  },
                }}
              />

              <Button
                type="submit"
                size="md"
                variant="solid"
                disabled={
                  isSubmitting ||
                  Boolean(signUpEmailError) ||
                  Boolean(signUpPasswordMismatch) ||
                  !signUpEmail ||
                  !signUpPassword ||
                  !signUpConfirmPassword
                }
                sx={{
                  mt: 0.1,
                  backgroundColor: "#2ED47A",
                  color: "#0D0F14",
                  fontWeight: 600,
                  fontSize: "1.02rem",
                  py: 0.95,
                  "&:hover": {
                    backgroundColor: "#26B869",
                    transform: "translateY(-1px)",
                  },
                }}
              >
                Create account
              </Button>
            </Stack>
          ) : (
            <Stack
              component="form"
              spacing={3.45}
              onSubmit={handleSignIn}
              sx={{ width: "100%" }}
            >
              <FormControl required>
                <FormLabel>Email</FormLabel>
                <Input
                  size="lg"
                  type="email"
                  placeholder="you@company.com"
                  value={signInEmail}
                  onChange={(event) => setSignInEmail(event.target.value)}
                  sx={{
                    backgroundColor: "rgba(12, 16, 24, 0.75)",
                    borderColor: "rgba(46, 212, 122, 0.18)",
                  }}
                />
              </FormControl>

              <FormControl required>
                <FormLabel>Password</FormLabel>
                <Input
                  size="lg"
                  type="password"
                  placeholder="Enter your password"
                  value={signInPassword}
                  onChange={(event) => setSignInPassword(event.target.value)}
                  sx={{
                    backgroundColor: "rgba(12, 16, 24, 0.75)",
                    borderColor: "rgba(46, 212, 122, 0.18)",
                  }}
                />
              </FormControl>

              <Button
                type="submit"
                size="md"
                variant="solid"
                disabled={isSubmitting || !signInEmail || !signInPassword}
                sx={{
                  mt: 0.4,
                  backgroundColor: "#2ED47A",
                  color: "#0D0F14",
                  fontWeight: 600,
                  fontSize: "1.02rem",
                  py: 0.95,
                  "&:hover": {
                    backgroundColor: "#26B869",
                    transform: "translateY(-1px)",
                  },
                }}
              >
                Sign in
              </Button>

              <Button
                variant="plain"
                size="sm"
                sx={{
                  alignSelf: "center",
                  color: "rgba(162, 167, 180, 0.75)",
                  textDecoration: "underline",
                  textUnderlineOffset: 6,
                  "&:hover": {
                    color: "#2ED47A",
                  },
                }}
                onClick={() => {
                  setMode("signup");
                }}
              >
                Need an account? Sign up here
              </Button>

              <Button
                variant="plain"
                size="sm"
                sx={{ alignSelf: "center", color: "rgba(162, 167, 180, 0.75)", textDecoration: "underline", textUnderlineOffset: 6, mt: -1 }}
                onClick={handleForgotPassword}
                disabled={isSubmitting}
              >
                Forgot your password?
              </Button>

              {passwordResetSent && (
                <Typography level="body-sm" sx={{ color: "rgba(46, 212, 122, 0.85)", textAlign: "center" }}>
                  {passwordResetSent}
                </Typography>
              )}
            </Stack>
          )}
        </Sheet>
      </Box>
      <Modal
        open={showConfirmationDialog}
        onClose={() => setShowConfirmationDialog(false)}
        slotProps={{
          backdrop: {
            sx: {
              backdropFilter: "blur(16px)",
              backgroundColor: "rgba(5, 8, 12, 0.72)",
            },
          },
        }}
      >
        <ModalDialog
          variant="outlined"
          sx={{
            background: "linear-gradient(135deg, rgba(12, 18, 26, 0.96), rgba(9, 13, 21, 0.92))",
            border: "1px solid rgba(46, 212, 122, 0.24)",
            borderRadius: "24px",
            boxShadow: "0 48px 160px rgba(0, 0, 0, 0.55)",
            width: "100%",
            maxWidth: 420,
            p: 3,
            gap: 1.6,
          }}
        >
          <ModalClose variant="plain" sx={{ color: "rgba(242, 245, 250, 0.65)" }} />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <IconButton
              size="lg"
              variant="soft"
              sx={{
                borderRadius: "999px",
                backgroundColor: "rgba(46, 212, 122, 0.16)",
                border: "1px solid rgba(46, 212, 122, 0.32)",
                color: "#2ED47A",
              }}
            >
              <Box
                component="span"
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: "#2ED47A",
                  boxShadow: "0 0 18px rgba(46, 212, 122, 0.55)",
                  display: "inline-block",
                }}
              />
            </IconButton>
            <Typography level="title-lg" sx={{ fontWeight: 700, color: "#F2F5FA" }}>
              Verify your email
            </Typography>
          </Box>
          <Typography level="body-sm" sx={{ color: "rgba(199, 205, 218, 0.82)", lineHeight: 1.7 }}>
            We just sent a confirmation link to <strong>{signUpEmail}</strong>. Please check your
            inbox (and spam folder) to activate your account. You can return here after verifying.
          </Typography>
          <Stack direction="row" spacing={1.5} justifyContent="flex-end">
            <Button
              variant="outlined"
              color="neutral"
              onClick={() => setShowConfirmationDialog(false)}
              sx={{
                borderRadius: "999px",
                borderColor: "rgba(226, 230, 240, 0.2)",
                color: "rgba(226, 230, 240, 0.85)",
                minWidth: 120,
              }}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setShowConfirmationDialog(false);
                router.push("/auth?mode=signin");
              }}
              sx={{
                borderRadius: "999px",
                backgroundColor: "#2ED47A",
                color: "#0D0F14",
                fontWeight: 600,
                minWidth: 140,
                boxShadow: "0 18px 48px rgba(46, 212, 122, 0.38)",
                '&:hover': {
                  backgroundColor: "#26B869",
                },
              }}
            >
              Go to sign in
            </Button>
          </Stack>
        </ModalDialog>
      </Modal>

      {/* Account exists modal: offer sign-in or Google linking */}
      <Modal
        open={showAccountExistsDialog}
        onClose={() => setShowAccountExistsDialog(false)}
        slotProps={{
          backdrop: {
            sx: {
              backdropFilter: "blur(16px)",
              backgroundColor: "rgba(5, 8, 12, 0.72)",
            },
          },
        }}
      >
        <ModalDialog
          variant="outlined"
          sx={{
            background: "linear-gradient(135deg, rgba(12, 18, 26, 0.96), rgba(9, 13, 21, 0.92))",
            border: "1px solid rgba(46, 212, 122, 0.24)",
            borderRadius: "24px",
            boxShadow: "0 48px 160px rgba(0, 0, 0, 0.55)",
            width: "100%",
            maxWidth: 480,
            p: 3,
            gap: 1.6,
          }}
        >
          <ModalClose variant="plain" sx={{ color: "rgba(242, 245, 250, 0.65)" }} />
          <Typography level="title-lg" sx={{ fontWeight: 700, color: "#F2F5FA", mb: 0.5 }}>
            Account already exists
          </Typography>
          <Typography level="body-sm" sx={{ color: "rgba(199, 205, 218, 0.9)", lineHeight: 1.7 }}>
            An account is already registered with <strong>{accountExistsEmail}</strong>.
            You can sign in with your email and password, or continue with Google to link access.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} sx={{ mt: 1.5, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => {
                setShowAccountExistsDialog(false);
                setMode('signin');
                setSignInEmail(accountExistsEmail);
              }}
              sx={{
                borderRadius: '999px',
                borderColor: 'rgba(226, 230, 240, 0.2)',
                color: 'rgba(226, 230, 240, 0.92)'
              }}
            >
              Go to Sign In
            </Button>
            <Button
              onClick={() => {
                setShowAccountExistsDialog(false);
                handleGoogleAuth();
              }}
              sx={{
                borderRadius: '999px',
                backgroundColor: '#2ED47A',
                color: '#0D0F14',
                fontWeight: 600,
                minWidth: 160,
                boxShadow: '0 18px 48px rgba(46, 212, 122, 0.38)',
                '&:hover': { backgroundColor: '#26B869' }
              }}
            >
              Continue with Google
            </Button>
          </Stack>
        </ModalDialog>
      </Modal>

      {/* Password reset confirmation modal */}
      <Modal
        open={showPasswordResetDialog}
        onClose={() => setShowPasswordResetDialog(false)}
        slotProps={{
          backdrop: {
            sx: {
              backdropFilter: "blur(16px)",
              backgroundColor: "rgba(5, 8, 12, 0.72)",
            },
          },
        }}
      >
        <ModalDialog
          variant="outlined"
          sx={{
            background: "linear-gradient(135deg, rgba(12, 18, 26, 0.96), rgba(9, 13, 21, 0.92))",
            border: "1px solid rgba(46, 212, 122, 0.24)",
            borderRadius: "24px",
            boxShadow: "0 48px 160px rgba(0, 0, 0, 0.55)",
            width: "100%",
            maxWidth: 480,
            p: 3,
            gap: 1.6,
          }}
        >
          <ModalClose variant="plain" sx={{ color: "rgba(242, 245, 250, 0.65)" }} />
          <Typography level="title-lg" sx={{ fontWeight: 700, color: "#F2F5FA", mb: 0.5 }}>
            Password reset link sent
          </Typography>
          <Typography level="body-sm" sx={{ color: "rgba(199, 205, 218, 0.9)", lineHeight: 1.7 }}>
            {passwordResetSent || 'We\'ve sent a reset link to your email address. Please check your inbox (and spam folder) to continue.'}
          </Typography>
          <Stack direction="row" spacing={1.2} sx={{ mt: 1.5, justifyContent: 'flex-end' }}>
            <Button
              onClick={() => setShowPasswordResetDialog(false)}
              sx={{
                borderRadius: '999px',
                backgroundColor: '#2ED47A',
                color: '#0D0F14',
                fontWeight: 600,
                minWidth: 120,
                boxShadow: '0 18px 48px rgba(46, 212, 122, 0.38)',
                '&:hover': { backgroundColor: '#26B869' }
              }}
            >
              Got it
            </Button>
          </Stack>
        </ModalDialog>
      </Modal>
    </Box>
  );
}
