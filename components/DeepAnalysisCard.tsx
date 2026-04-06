"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SparklesIcon,
  Analytics01Icon,
  CheckmarkCircle02Icon,
  Alert01Icon,
  Clock01Icon
} from "@hugeicons/core-free-icons";
import { startGoogleDeepAnalysis, startPerplexityDeepAnalysis, startChatgptDeepAnalysis } from "@/lib/deepAnalysisApi";
import { useAnalysisListener } from "@/hooks/useAnalysisListener";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

interface DeepAnalysisCardProps {
  engine: 'google' | 'perplexity' | 'chatgpt';
  productId: string;
  analysisHash: string | null;
  isAnalysisUpToDate: boolean;
}

export default function DeepAnalysisCard({
  engine,
  productId,
  analysisHash,
  isAnalysisUpToDate,
}: DeepAnalysisCardProps) {
  if (engine === 'chatgpt' && process.env.NEXT_PUBLIC_CHATGPT_PIPELINE !== 'true') return null;
  const engineLabel = engine === 'google' ? 'Google AI Mode' : engine === 'perplexity' ? 'Perplexity Citations' : 'ChatGPT Context';
  const [isStartingAnalysis, setIsStartingAnalysis] = useState(false);
  const [startAnalysisError, setStartAnalysisError] = useState<string | null>(null);
  const [showStartSuccess, setShowStartSuccess] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const {
    status: liveAnalysisStatus,
    data: latestAnalysisRow,
    setStatus: setLiveAnalysisStatus,
  } = useAnalysisListener(productId, engine);

  const hasAnalysisData = Boolean(analysisHash) || Boolean(latestAnalysisRow);
  const isAnalysisCurrentlyUpToDate = Boolean(isAnalysisUpToDate || latestAnalysisRow);

  // Sync internal UI status when live data changes OR parent props change
  useEffect(() => {
    if (isAnalysisUpToDate || latestAnalysisRow) {
      setLiveAnalysisStatus('completed');
    }
  }, [isAnalysisUpToDate, latestAnalysisRow, setLiveAnalysisStatus]);

  // Initial data check to handle possible race conditions on page load
  useEffect(() => {
    if (!productId) return;
    
    const checkExistingData = async () => {
      const tableMap = {
        google: 'product_analysis_dna_google',
        perplexity: 'product_analysis_dna_perplexity',
        chatgpt: 'product_analysis_dna_chatgpt'
      };
      
      const maxRows = Number(process.env.NEXT_PUBLIC_ANALYTICS_MAX_HASH_ROWS || 5);
      const { data } = await supabase
        .from(tableMap[engine])
        .select('id')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .limit(maxRows);
        
      if (data && data.length > 0) {
        setLiveAnalysisStatus('completed');
      }
    };
    
    checkExistingData();
  }, [productId, engine, setLiveAnalysisStatus]);

  const startDeepAnalysis = async () => {
    if (isStartingAnalysis || liveAnalysisStatus === 'processing' || isAnalysisCurrentlyUpToDate) {
      return;
    }

    try {
      const response = await fetch('https://httpbin.org/get', {
        method: 'HEAD',
        signal: AbortSignal.timeout(3000)
      });
      if (!response.ok) throw new Error('Network check failed');
      setConnectionError(null);
    } catch (err) {
      setConnectionError('Poor internet connection detected. Please check your connection.');
      return;
    }

    let retries = 0;
    const maxRetries = 2;
    const retryDelay = 2000;

    while (retries < maxRetries) {
      try {
        setIsStartingAnalysis(true);
        setStartAnalysisError(null);
        setShowStartSuccess(false);
        setLiveAnalysisStatus('processing');

        if (engine === 'google') {
          await startGoogleDeepAnalysis(productId);
        } else if (engine === 'chatgpt') {
          await startChatgptDeepAnalysis(productId);
        } else {
          await startPerplexityDeepAnalysis(productId);
        }

        setShowStartSuccess(true);
        setTimeout(() => setShowStartSuccess(false), 5000);
        break;

      } catch (err) {
        retries++;
        if (retries >= maxRetries) {
          const message = err instanceof Error ? err.message : 'Failed to start deep analysis';
          setStartAnalysisError(message);
          setLiveAnalysisStatus('completed');
        } else {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      } finally {
        setIsStartingAnalysis(false);
      }
    }
  };

  return (
    <Card className="bg-card border-emerald-500/20 shadow-lg overflow-hidden relative">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <HugeiconsIcon icon={SparklesIcon} className="size-5 text-emerald-500" strokeWidth={2} />
          </div>
          <CardTitle className="text-xl font-bold text-foreground">Deep Analysis</CardTitle>
        </div>

        <div className="flex items-center gap-2">
          {hasAnalysisData ? (
            isAnalysisCurrentlyUpToDate ? (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1.5 py-1 px-2.5 font-semibold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Up to date
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 gap-1.5 py-1 px-2.5 font-semibold">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Update Required
              </Badge>
            )
          ) : (
            <Badge variant="outline" className="bg-zinc-500/10 text-zinc-400 border-zinc-500/20 gap-1.5 py-1 px-2.5 font-semibold">
              <HugeiconsIcon icon={Clock01Icon} className="size-3" />
              Not Started
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-muted/30 border border-emerald-500/10 text-sm leading-relaxed text-muted-foreground group hover:border-emerald-500/20 transition-colors">
            <p className="font-medium text-foreground/80">
              Citation Selectability Audit
            </p>
            <p className="mt-1.5 text-xs font-medium">
              Deep analysis helps audit citations to understand what makes them selectable by <span className="text-emerald-500/80 font-medium">{engineLabel}</span> and other AI search engines.
            </p>
          </div>

          <Button
            size="lg"
            className={cn(
              "w-full font-bold shadow-lg transition-all duration-300 active:scale-95",
              isAnalysisCurrentlyUpToDate
                ? "bg-emerald-500/5 text-emerald-500/40 border border-emerald-500/20 cursor-not-allowed"
                : "bg-emerald-500 hover:bg-emerald-600 text-emerald-950 shadow-emerald-500/20"
            )}
            onClick={startDeepAnalysis}
            disabled={isStartingAnalysis || liveAnalysisStatus === 'processing' || isAnalysisCurrentlyUpToDate}
          >
            {isAnalysisCurrentlyUpToDate ? (
              <>
                <HugeiconsIcon icon={CheckmarkCircle02Icon} className="mr-2 size-5" strokeWidth={2.5} />
                Strategy Up to Date
              </>
            ) : (
              <>
                <HugeiconsIcon icon={Analytics01Icon} className="mr-2 size-5 group-hover:rotate-12 transition-transform" strokeWidth={2.5} />
                {isStartingAnalysis ? 'Initialising…' : liveAnalysisStatus === 'processing' ? 'Processing…' : hasAnalysisData ? 'Update Analysis' : 'Start Deep Analysis'}
              </>
            )}
          </Button>
        </div>

        {/* Feedback Section */}
        <div className="space-y-2">
          {liveAnalysisStatus === 'processing' && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-amber-500">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <p className="text-xs font-semibold">Analyzing… (Typically 2-5 minutes)</p>
            </div>
          )}

          {showStartSuccess && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-emerald-500 text-xs font-semibold animate-in fade-in slide-in-from-top-1">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4 shrink-0" strokeWidth={2.5} />
              Request accepted. Notification will appear when ready.
            </div>
          )}

          {startAnalysisError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/5 border border-red-500/20 text-red-500 text-xs font-semibold">
              <HugeiconsIcon icon={Alert01Icon} className="size-4 shrink-0" strokeWidth={2.5} />
              {startAnalysisError}
            </div>
          )}

          {connectionError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-amber-500 text-xs font-semibold">
              <HugeiconsIcon icon={Alert01Icon} className="size-4 shrink-0" strokeWidth={2.5} />
              {connectionError}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
