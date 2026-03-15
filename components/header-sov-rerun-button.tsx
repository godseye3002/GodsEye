"use client";

import { useState, useEffect } from "react";
import { Button, Tooltip, Typography } from "@mui/joy";
import RefreshIcon from "@mui/icons-material/Refresh";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { triggerSovAnalysis, SovEngine } from "@/lib/sovAnalysisApi";
import { useSovSnapshotListener } from "@/hooks/useSovSnapshotListener";

interface HeaderSovRerunButtonProps {
    productId: string;
    engine: SovEngine;
}

export function HeaderSovRerunButton({ productId, engine }: HeaderSovRerunButtonProps) {
    const [isTriggering, setIsTriggering] = useState(false);
    const [isUpToDate, setIsUpToDate] = useState(false);

    const { eventNonce, markProcessing, markCompleted } = useSovSnapshotListener(productId, engine);

    const checkProgress = async () => {
        if (!productId) return;
        try {
            const { checkLatestSovProgress } = await import('@/lib/sovProgressCheck');
            const progress = await checkLatestSovProgress(productId, engine);
            setIsUpToDate(progress.status === 'complete');
        } catch (error) {
            console.error('Failed to check SOV progress:', error);
            setIsUpToDate(false);
        }
    };

    useEffect(() => {
        checkProgress();
    }, [productId, engine, eventNonce]);

    const handleRerun = async () => {
        if (!productId || isTriggering) return;

        setIsTriggering(true);
        setIsUpToDate(false);
        markProcessing();

        try {
            const result = await triggerSovAnalysis({
                productId,
                engine,
                debug: process.env.NODE_ENV !== 'production',
            });

            if ('success' in result && result.success) {
                if (result.message) {
                    setIsUpToDate(true);
                    markCompleted();
                }
            } else {
                setIsUpToDate(false);
            }
        } catch (error) {
            console.error('Error rerunning analysis:', error);
            setIsUpToDate(false);
        } finally {
            setIsTriggering(false);
        }
    };

    return (
        <Button
            variant="solid"
            size="sm"
            color={isUpToDate ? "success" : "neutral"}
            startDecorator={isUpToDate ? <CheckCircleOutlineIcon sx={{ fontSize: 18 }} /> : <RefreshIcon sx={{ fontSize: 18 }} />}
            disabled={isTriggering || isUpToDate}
            onClick={handleRerun}
            sx={{
                borderRadius: "999px",
                height: "36px",
                px: 2,
                fontWeight: 600,
                backgroundColor: isUpToDate ? "rgba(46, 212, 122, 0.15)" : "rgba(242, 245, 250, 0.05)",
                color: isUpToDate ? "#2ED47A" : "#F2F5FA",
                border: isUpToDate ? "1px solid rgba(46, 212, 122, 0.3)" : "1px solid rgba(242, 245, 250, 0.15)",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                    backgroundColor: isUpToDate ? "rgba(46, 212, 122, 0.25)" : "rgba(242, 245, 250, 0.1)",
                    borderColor: isUpToDate ? "rgba(46, 212, 122, 0.45)" : "rgba(242, 245, 250, 0.25)",
                },
                "&:disabled": {
                    opacity: 0.8,
                    cursor: isUpToDate ? "default" : "not-allowed",
                    backgroundColor: isUpToDate ? "rgba(46, 212, 122, 0.15)" : "rgba(242, 245, 250, 0.05)",
                    color: isUpToDate ? "#2ED47A" : "rgba(242, 245, 250, 0.4)",
                }
            }}
        >
            {isTriggering ? "Starting..." : isUpToDate ? "Up to date" : "Rerun Analysis"}
        </Button>
    );
}
