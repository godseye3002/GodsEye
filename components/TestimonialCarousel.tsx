"use client";

import { useState, useEffect } from "react";
import { Box, Typography, Avatar, Card } from "@mui/joy";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import { Testimonial } from "@/app/data/testimonials";

interface Props {
    testimonials: Testimonial[];
    variant?: "landing" | "brochure";
}

export function TestimonialCarousel({ testimonials, variant = "landing" }: Props) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFading, setIsFading] = useState(false);

    useEffect(() => {
        if (testimonials.length <= 1) return;

        const intervalId = setInterval(() => {
            // Start fade out
            setIsFading(true);

            // Wait for fade out to complete before changing data
            setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % testimonials.length);
                // Start fade in
                setIsFading(false);
            }, 500); // 500ms fade duration
        }, 8000); // Change testimonial every 8 seconds

        return () => clearInterval(intervalId);
    }, [testimonials.length]);

    if (!testimonials.length) return null;

    const currentTestimonial = testimonials[currentIndex];

    const getVariantStyles = () => {
        if (variant === "brochure") {
            return {
                cardBg: "rgba(17, 19, 24, 0.6)",
                borderColor: "rgba(46, 212, 122, 0.14)",
                avatarBorder: "2px solid rgba(46, 212, 122, 0.3)",
                avatarBoxShadow: "none",
                p: { xs: 3, md: 4 },
                borderRadius: "16px",
            };
        }
        // landing default
        return {
            cardBg: "rgba(17, 19, 24, 0.6)",
            borderColor: "rgba(46, 212, 122, 0.15)",
            avatarBorder: "2px solid rgba(46, 212, 122, 0.4)",
            avatarBoxShadow: "0 0 15px rgba(46, 212, 122, 0.2)",
            p: { xs: 4, md: 6 },
            borderRadius: "32px",
        };
    };

    const styles = getVariantStyles();

    return (
        <Box sx={{
            maxWidth: variant === "brochure" ? "none" : 1100,
            mx: "auto",
            position: "relative",
            width: "100%",
            overflow: "hidden"
        }}>
            <Box
                sx={{
                    opacity: isFading ? 0 : 1,
                    transition: "opacity 0.5s ease-in-out",
                    width: "100%",
                }}
            >
                <Card
                    variant="outlined"
                    sx={{
                        backgroundColor: styles.cardBg,
                        borderColor: styles.borderColor,
                        p: styles.p,
                        borderRadius: styles.borderRadius,
                        position: "relative",
                        ...(variant === "landing" && {
                            backdropFilter: "blur(10px)",
                            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                            "&:hover": {
                                backgroundColor: "rgba(22, 26, 33, 0.8)",
                                borderColor: "rgba(46, 212, 122, 0.3)",
                                transform: "translateY(-6px)",
                                boxShadow: "0 22px 60px rgba(0, 0, 0, 0.5), 0 0 20px rgba(46, 212, 122, 0.05)",
                            },
                        }),
                    }}
                >
                    {variant === "landing" && (
                        <FormatQuoteIcon
                            sx={{
                                fontSize: 48,
                                color: "rgba(46, 212, 122, 0.2)",
                                position: "absolute",
                                top: 32,
                                right: 32,
                            }}
                        />
                    )}

                    <Typography
                        sx={{
                            color: "#F2F5FA",
                            fontSize: { xs: "1.05rem", md: variant === "landing" ? "1.25rem" : "1.15rem" },
                            lineHeight: 1.7,
                            mb: variant === "landing" ? 6 : 3,
                            fontStyle: "italic",
                            fontWeight: 400,
                            position: "relative",
                            zIndex: 1,
                            letterSpacing: "0.01em",
                            whiteSpace: "pre-wrap",
                        }}
                    >
                        "{currentTestimonial.content}"
                    </Typography>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
                        <Avatar
                            src={currentTestimonial.image}
                            sx={{
                                width: variant === "landing" ? 64 : 56,
                                height: variant === "landing" ? 64 : 56,
                                border: styles.avatarBorder,
                                boxShadow: styles.avatarBoxShadow,
                            }}
                        />
                        <Box>
                            <Typography
                                level={variant === "landing" ? "title-lg" : "title-md"}
                                sx={{
                                    color: "#F2F5FA",
                                    fontWeight: 700,
                                    mb: variant === "landing" ? 0.5 : 0,
                                    fontSize: variant === "landing" ? "1.2rem" : undefined,
                                }}
                            >
                                {currentTestimonial.name}
                            </Typography>
                            <Typography
                                level={variant === "landing" ? "body-md" : "body-sm"}
                                sx={{ color: variant === "landing" ? "#A2A7B4" : "rgba(162, 167, 180, 0.88)", fontWeight: 500 }}
                            >
                                {currentTestimonial.title} @ <Box component="span" sx={{ color: "#2ED47A" }}>{currentTestimonial.company}</Box>
                            </Typography>
                        </Box>
                    </Box>
                </Card>
            </Box>

            {/* Pagination dots (optional, nice for carousels) */}
            {testimonials.length > 1 && (
                <Box sx={{ display: "flex", justifyContent: "center", gap: 1, mt: 3 }}>
                    {testimonials.map((_, idx) => (
                        <Box
                            key={idx}
                            onClick={() => {
                                setIsFading(true);
                                setTimeout(() => {
                                    setCurrentIndex(idx);
                                    setIsFading(false);
                                }, 500);
                            }}
                            sx={{
                                width: currentIndex === idx ? 24 : 8,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: currentIndex === idx ? "#2ED47A" : "rgba(46, 212, 122, 0.2)",
                                cursor: "pointer",
                                transition: "all 0.3s ease",
                            }}
                        />
                    ))}
                </Box>
            )}
        </Box>
    );
}
