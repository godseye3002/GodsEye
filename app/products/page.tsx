"use client";

import { useRouter } from "next/navigation";
import { Box, Typography, Card, IconButton, Tooltip, Modal, ModalDialog, ModalClose, Stack, Button, CircularProgress, Alert, Avatar, Chip } from "@mui/joy";
import MenuIcon from "@mui/icons-material/Menu";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import { useProductStore } from "../optimize/store";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/lib/auth-context";
import { ProductCardSkeleton, UserBadgeSkeleton } from "../components/skeletons";

function ProductsPageContent() {
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isProductsLoading, setIsProductsLoading] = useState(false);
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { user, signOut } = useAuth();
  const {
    products,
    loadProduct,
    resetForm,
    deleteProduct,
    loadProductsFromSupabase,
    deleteProductFromSupabase,
    setUserInfo,
    setUserCredits,
    userInfo,
    userCredits,
  } = useProductStore();
  
  // Load products from Supabase on mount
  useEffect(() => {
    if (!user) return;
    let mounted = true;
    (async () => {
      try {
        if (mounted) setIsProductsLoading(true);
        await loadProductsFromSupabase(user.id);
      } finally {
        if (mounted) setIsProductsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [user, loadProductsFromSupabase]);

  useEffect(() => {
    if (user) {
      setUserInfo({
        name: user.user_metadata?.user_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        email: user.email || 'Unknown',
        avatarUrl: user.user_metadata?.avatar_url || null,
      });
    } else {
      setUserInfo(null);
      setUserCredits(null);
    }
  }, [user, setUserInfo, setUserCredits]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchCredits = async () => {
      if (!user) return;
      try {
        const response = await fetch('/api/analyze/check-credits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        });
        if (!response.ok) throw new Error('Failed to fetch credits');
        const data = await response.json();
        if (typeof data.currentCredits === 'number') {
          setUserCredits(data.currentCredits);
        }
      } catch (error) {
        console.error('Failed to fetch user credits:', error);
      }
    };

    fetchCredits();
  }, [user, setUserCredits]);

  const userInitials = userInfo?.name
    ? userInfo.name
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0]?.toUpperCase())
        .join('')
        .slice(0, 2) || 'U'
    : userInfo?.email?.[0]?.toUpperCase() || 'U';

  const handleAddProduct = () => {
    resetForm();
    router.push("/optimize");
  };

  const handleProductClick = (productId: string) => {
    loadProduct(productId);
    router.push("/optimize");
  };

  const handleDeleteProductClick = (event: React.MouseEvent, productId: string) => {
    event.stopPropagation();
    setProductToDelete(productId);
  };

  const handleConfirmDelete = async () => {
    if (productToDelete && user) {
      setIsDeleting(true);
      setDeleteError(null);
      
      try {
        await deleteProductFromSupabase(productToDelete, user.id);
        setProductToDelete(null);
        setShowSuccessMessage(true);
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => {
          setShowSuccessMessage(false);
        }, 3000);
      } catch (error: any) {
        console.error('Failed to delete product:', error);
        const errorMessage = error?.message || 'Failed to delete product. Please try again.';
        setDeleteError(errorMessage);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleCancelDelete = () => {
    if (!isDeleting) {
      setProductToDelete(null);
      setDeleteError(null);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        backgroundColor: "transparent",
        position: "relative",
        zIndex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        justifyContent: "flex-start",
        pt: { xs: 1, sm: 1.5, md: 2.5 },
        px: { xs: 1.5, sm: 2, md: 3 },
        gap: { xs: 2.5, md: 4.5 },
        pb: { xs: 4, md: 6 },
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 0,
          mb: { xs: 2, md: 3 },
          gap: 2,
          position: "relative",
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <Box component="img" src="/GodsEye.png" alt="GodsEye logo" sx={{ width: 22, height: 22 }} />
          <Typography
            level="h3"
            sx={{
              color: "#F2F5FA",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              fontSize: { xs: "1.5rem", md: "1.75rem" },
            }}
          >
            GodsEye
          </Typography>
        </Box>
        {/* Mobile hamburger */}
        <IconButton
          variant="outlined"
          color="neutral"
          onClick={() => setMobileProfileOpen(true)}
          sx={{ display: { xs: "inline-flex", md: "none" } }}
          aria-label="Open profile menu"
        >
          <MenuIcon />
        </IconButton>
        {userInfo ? (
          <Box
            sx={{
              alignItems: "center",
              gap: 1.25,
              background: "rgba(17, 19, 24, 0.82)",
              border: "1px solid rgba(46, 212, 122, 0.18)",
              borderRadius: "999px",
              padding: "10px 18px",
              boxShadow: "0 18px 44px rgba(0, 0, 0, 0.35)",
              position: "absolute",
              right: 0,
              top: "50%",
              transform: "translateY(-50%)",
              width: "auto",
              maxWidth: { xs: "100%", md: "unset" },
              display: { xs: "none", md: "flex" },
            }}
          >
            <Avatar
              src={userInfo.avatarUrl || undefined}
              sx={{
                width: 40,
                height: 40,
                backgroundColor: "rgba(46, 212, 122, 0.2)",
                color: "#2ED47A",
                fontWeight: 600,
                fontSize: "1rem",
              }}
            >
              {userInitials}
            </Avatar>
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              <Typography level="title-sm" sx={{ color: "#F2F5FA", fontWeight: 600 }}>
                {userInfo.name}
              </Typography>
              <Typography level="body-xs" sx={{ color: "rgba(162, 167, 180, 0.85)" }}>
                {userInfo.email}
              </Typography>
            </Box>

      {/* Mobile profile drawer via portal */}
      {mounted && createPortal(
        <>
          {/* Backdrop */}
          <Box
            onClick={() => setMobileProfileOpen(false)}
            sx={{
              display: { xs: mobileProfileOpen ? "block" : "none", md: "none" },
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(2px)",
              zIndex: 1300,
            }}
          />
          {/* Drawer panel */}
          <Box
            sx={{
              position: "fixed",
              top: 0,
              right: 0,
              height: "100vh",
              width: "80vw",
              maxWidth: 360,
              background: "linear-gradient(135deg, rgba(16, 21, 28, 0.98), rgba(9, 12, 20, 0.96))",
              borderLeft: "1px solid rgba(46, 212, 122, 0.22)",
              boxShadow: "-24px 0 80px rgba(0,0,0,0.5)",
              zIndex: 1401,
              transform: mobileProfileOpen ? "translateX(0)" : "translateX(100%)",
              transition: "transform 0.3s ease",
              display: { xs: "flex", md: "none" },
              flexDirection: "column",
              p: 2.5,
              gap: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography level="title-lg" sx={{ color: "#F2F5FA", fontWeight: 700 }}>Profile</Typography>
              <IconButton variant="outlined" color="neutral" onClick={() => setMobileProfileOpen(false)}>✕</IconButton>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              <Avatar
                src={userInfo?.avatarUrl || undefined}
                sx={{ width: 48, height: 48, backgroundColor: "rgba(46, 212, 0.2, 0.2)", color: "#2ED47A", fontWeight: 600 }}
              >
                {userInitials}
              </Avatar>
              <Box>
                <Typography level="title-sm" sx={{ color: "#F2F5FA", fontWeight: 600 }}>{userInfo?.name || "User"}</Typography>
                <Typography level="body-xs" sx={{ color: "rgba(162, 167, 180, 0.85)" }}>{userInfo?.email || ""}</Typography>
              </Box>
            </Box>
            <Chip
              size="sm"
              variant="soft"
              sx={{
                backgroundColor: "rgba(46, 212, 122, 0.12)",
                color: "#2ED47A",
                fontWeight: 700,
                px: 1,
                height: 28,
                display: "inline-flex",
                alignItems: "center",
                border: "1px solid rgba(46, 212, 122, 0.28)",
                alignSelf: "flex-start",
              }}
            >
              Credits: {typeof userCredits === 'number' ? userCredits : '—'}
            </Chip>
            <Button
              onClick={async () => {
                try {
                  await signOut();
                  setMobileProfileOpen(false);
                  router.push("/auth");
                } catch {}
              }}
              variant="outlined"
              sx={{ alignSelf: "flex-start", borderColor: "rgba(46, 212, 122, 0.28)", color: "#F2F5FA" }}
            >
              Logout
            </Button>
          </Box>
        </>,
        document.body
      )}
            <Chip
              size="sm"
              variant="soft"
              sx={{
                backgroundColor: "rgba(46, 212, 122, 0.12)",
                color: "#2ED47A",
                fontWeight: 700,
                px: 1,
                height: 28,
                display: "flex",
                alignItems: "center",
                border: "1px solid rgba(46, 212, 122, 0.28)",
                '&:hover': { backgroundColor: 'rgba(46, 212, 122, 0.18)', borderColor: 'rgba(46, 212, 122, 0.4)' },
              }}
            >
              Credits: {typeof userCredits === 'number' ? userCredits : '—'}
            </Chip>
            <Chip
              size="sm"
              variant="soft"
              onClick={async () => {
                try {
                  await signOut();
                  router.push("/auth");
                } catch {}
              }}
              sx={{
                height: 28,
                fontWeight: 700,
                cursor: 'pointer',
                backgroundColor: "rgba(46, 212, 122, 0.12)",
                color: "#2ED47A",
                border: "1px solid rgba(46, 212, 122, 0.28)",
                '&:hover': { backgroundColor: 'rgba(46, 212, 122, 0.18)', borderColor: 'rgba(46, 212, 122, 0.4)' },
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                padding: "0 12px",
                fontSize: 13,
              }}
            >
              Logout
              {/* <LogoutIcon sx={{ fontSize: 16 }} /> Logout */}
            </Chip>
          </Box>
        ) : user ? (
          <UserBadgeSkeleton />
        ) : null}
      </Box>

      <Box
        sx={{
          textAlign: "center",
          maxWidth: { xs: 320, sm: 560, md: 720 },
          width: "100%",
          px: { xs: 0, sm: 1, md: 0 },
          mx: "auto",
          alignSelf: "center",
        }}
      >
        <Typography
          level="h1"
          sx={{
            fontSize: { xs: "1.85rem", sm: "2.4rem", md: "3rem" },
            fontWeight: 700,
            mb: { xs: 1.25, md: 2 },
            color: "#F2F5FA",
            letterSpacing: "-0.02em",
            lineHeight: { xs: 1.2, md: 1.15 },
          }}
        >
          Optimize Your Products for AI Search Engines
        </Typography>
        <Typography
          level="body-lg"
          sx={{
            fontSize: { xs: "0.9rem", sm: "1rem", md: "1.1rem" },
            color: "#A2A7B4",
            maxWidth: { xs: 320, sm: 480, md: 540 },
            mx: "auto",
            lineHeight: { xs: 1.55, md: 1.5 },
          }}
        >
          Get discovered by AI-powered search engines like Perplexity, Google AI Overview, and ChatGPT
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(auto-fit, minmax(200px, 1fr))",
            lg: "repeat(4, minmax(0, 1fr))",
          },
          gap: { xs: 1.5, md: 1.75 },
          width: "100%",
          maxWidth: { xs: "100%", sm: 680, md: 1040, lg: 1300, xl: 1380 },
          alignItems: "stretch", 
        }}
      >
        <Card
          variant="outlined"
          sx={{
            width: "100%",
            minHeight: { xs: 162, sm: 182, md: 198 },
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "space-between",
            cursor: "pointer",
            transition: "all 0.3s ease",
            backgroundColor: "rgba(17, 19, 24, 0.96)",
            border: "2px dashed rgba(46, 212, 122, 0.24)",
            borderRadius: "12px",
            p: { xs: 1.5, sm: 2, md: 2.4 },
            gap: { xs: 1.3, md: 1.7 },
            "&:hover": {
              borderColor: "rgba(46, 212, 122, 0.6)",
              backgroundColor: "rgba(20, 23, 29, 0.98)",
              transform: "translateY(-4px)",
              boxShadow: "0 24px 60px rgba(46, 212, 122, 0.18)",
            },
          }}
          onClick={handleAddProduct}
        >
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              backgroundColor: "rgba(46, 212, 122, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.3s ease",
            }}
          >
            <Typography
              sx={{
                fontSize: "1.6rem",
                color: "#2ED47A",
                fontWeight: 300,
                lineHeight: 1,
              }}
            >
              +
            </Typography>
          </Box>
          <Typography
            level="h4"
            sx={{
              color: "#F2F5FA",
              mb: 0.5,
              fontWeight: 600,
              fontSize: { xs: "0.98rem", sm: "1.08rem", md: "1.2rem" },
            }}
          >
            Add New Product
          </Typography>
          <Typography
            level="body-md"
            sx={{
              color: "#A2A7B4",
              textAlign: "left",
              px: 0,
              fontSize: { xs: "0.76rem", md: "0.86rem" },
            }}
          >
            Start optimizing your product for AI search engines
          </Typography>
        </Card>

        {(isProductsLoading && products.length === 0) && (
          <>
            {Array.from({ length: 6 }).map((_, i) => (
              <ProductCardSkeleton key={`skeleton-${i}`} />
            ))}
          </>
        )}
        {products.map((product) => (
          <Card
            key={product.id}
            variant="outlined"
            sx={{
              width: "100%",
              minHeight: { xs: 172, sm: 192, md: 208 },
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              backgroundColor: "rgba(15, 17, 22, 0.92)",
              border: "1px solid rgba(46, 212, 122, 0.12)",
              borderRadius: "12px",
              p: { xs: 1.5, sm: 2, md: 2.4 },
              gap: { xs: 1, md: 1.25 },
              position: "relative",
              cursor: "pointer",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 20px 44px rgba(46, 212, 122, 0.12)",
              },
            }}
            onClick={() => handleProductClick(product.id)}
            role="button"
            tabIndex={0}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  level="title-md"
                  sx={{
                    color: "#F2F5FA",
                    fontWeight: 600,
                    mb: 0.75,
                    maxWidth: "100%",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={product.name}
                >
                  {product.name}
                </Typography>
                <Typography
                  level="body-sm"
                  sx={{
                    color: "#A2A7B4",
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    fontSize: "0.85rem",
                    lineHeight: 1.5,
                  }}
                  title={product.description}
                >
                  {product.description}
                </Typography>
              </Box>
              <Tooltip title="Delete" placement="left" variant="outlined">
                <IconButton
                  aria-label="Delete product"
                  color="danger"
                  size="sm"
                  onClick={(event) => handleDeleteProductClick(event, product.id)}
                  sx={{
                    alignSelf: "flex-start",
                    backgroundColor: "rgba(243, 91, 100, 0.14)",
                    border: "1px solid rgba(243, 91, 100, 0.3)",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      backgroundColor: "rgba(243, 91, 100, 0.22)",
                      borderColor: "rgba(243, 91, 100, 0.45)",
                    },
                  }}
                >
                  <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </Box>
            <Typography
              level="body-xs"
              sx={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "0.75rem" }}
            >
              Saved on {new Date(product.createdAt).toLocaleString()}
            </Typography>
          </Card>
        ))}
      </Box>

      {/* Success Message */}
      {showSuccessMessage && (
        <Box
          sx={{
            position: "fixed",
            top: 24,
            right: 24,
            zIndex: 10000,
            animation: "slideInRight 0.3s ease-out",
            "@keyframes slideInRight": {
              from: { transform: "translateX(400px)", opacity: 0 },
              to: { transform: "translateX(0)", opacity: 1 },
            },
          }}
        >
          <Alert
            startDecorator={<CheckCircleIcon />}
            variant="soft"
            color="success"
            sx={{
              backgroundColor: "rgba(46, 212, 122, 0.16)",
              border: "1px solid rgba(46, 212, 122, 0.32)",
              borderRadius: "12px",
              color: "#2ED47A",
              fontWeight: 600,
              boxShadow: "0 12px 36px rgba(46, 212, 122, 0.24)",
            }}
          >
            Product deleted successfully
          </Alert>
        </Box>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        open={Boolean(productToDelete)}
        onClose={handleCancelDelete}
        slotProps={{ backdrop: { sx: { backdropFilter: "blur(18px)", backgroundColor: "rgba(6, 8, 12, 0.75)" } } }}
      >
        <ModalDialog
          variant="outlined"
          sx={{
            background: "linear-gradient(135deg, rgba(16, 21, 28, 0.98), rgba(9, 12, 20, 0.96))",
            border: "1px solid rgba(46, 212, 122, 0.22)",
            borderRadius: "24px",
            boxShadow: "0 48px 120px rgba(0, 0, 0, 0.55)",
            minWidth: { xs: "auto", sm: 360 },
            maxWidth: 460,
            width: "100%",
            p: 3,
            gap: 2,
            overflow: "hidden",
          }}
        >
          <ModalClose onClick={handleCancelDelete} disabled={isDeleting} />
          
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
            <IconButton
              size="lg"
              variant="soft"
              color="danger"
              sx={{
                borderRadius: "999px",
                backgroundColor: "rgba(243, 91, 100, 0.16)",
                border: "1px solid rgba(243, 91, 100, 0.32)",
                pointerEvents: "none",
              }}
            >
              <WarningIcon />
            </IconButton>
            <Typography level="title-lg" sx={{ color: "#ffffff" }}>
              Delete this product?
            </Typography>
          </Box>
          
          <Typography level="body-sm" sx={{ color: "rgba(242, 245, 250, 0.7)", lineHeight: 1.6 }}>
            This will permanently remove the saved product from your dashboard. This action cannot be undone.
          </Typography>
          
          {deleteError && (
            <Alert
              startDecorator={<WarningIcon />}
              variant="soft"
              color="danger"
              sx={{
                backgroundColor: "rgba(243, 91, 100, 0.12)",
                border: "1px solid rgba(243, 91, 100, 0.3)",
                color: "#F35B64",
              }}
            >
              {deleteError}
            </Alert>
          )}
          
          <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              color="neutral"
              onClick={handleCancelDelete}
              disabled={isDeleting}
              sx={{
                minWidth: 120,
                borderRadius: "999px",
                fontWeight: 600,
                borderColor: "rgba(255, 255, 255, 0.18)",
                color: "#E6E9F0",
                "&:hover": {
                  borderColor: "rgba(255, 255, 255, 0.32)",
                  backgroundColor: "rgba(255, 255, 255, 0.06)",
                },
                "&:disabled": {
                  opacity: 0.5,
                  cursor: "not-allowed",
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              startDecorator={isDeleting ? <CircularProgress size="sm" sx={{ color: "#0D0F14" }} /> : null}
              sx={{
                minWidth: 120,
                borderRadius: "999px",
                fontWeight: 600,
                backgroundColor: "#F35B64",
                color: "#ffffff",
                boxShadow: "0 12px 36px rgba(243, 91, 100, 0.32)",
                "&:hover": {
                  backgroundColor: "#E04A54",
                },
                "&:disabled": {
                  opacity: 0.7,
                  backgroundColor: "#F35B64",
                  cursor: "not-allowed",
                },
              }}
            >
              {isDeleting ? "Deleting..." : "Delete Product"}
            </Button>
          </Stack>
        </ModalDialog>
      </Modal>
    </Box>
  );
}

export default function ProductsPage() {
  return (
    <ProtectedRoute>
      <ProductsPageContent />
    </ProtectedRoute>
  );
}
