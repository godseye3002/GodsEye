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
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Clock01Icon, 
  Analytics01Icon, 
  RefreshIcon, 
  ChartUpIcon,
  InformationCircleIcon,
  Alert01Icon,
  SparklesIcon
} from "@hugeicons/core-free-icons";
import ReactMarkdown from "react-markdown";
import { triggerSovAnalysis } from "@/lib/sovAnalysisApi";
import { useSovSnapshotListener } from "@/hooks/useSovSnapshotListener";
import { OptimizedProduct } from "@/app/optimize/types";
import { cn } from "@/lib/utils";

interface SOVSnapshot {
  id: string;
  product_id: string;
  global_sov_score: number;
  citation_score: number;
  category_relevance: number;
  total_queries_analyzed: number;
  narrative_summary: string;
  engine: 'google' | 'perplexity' | 'chatgpt';
  analyzed_at: string;
}

interface SOVPerformanceCardProps {
  productId: string;
  engine: 'google' | 'perplexity' | 'chatgpt';
  onDeepAnalysisClick?: () => void;
  isDeepAnalysisActive?: boolean;
  product?: OptimizedProduct | null;
}

export default function SOVPerformanceCard({ 
  productId, 
  engine, 
  onDeepAnalysisClick, 
  isDeepAnalysisActive, 
  product 
}: SOVPerformanceCardProps) {
  if (engine === 'chatgpt' && process.env.NEXT_PUBLIC_CHATGPT_PIPELINE !== 'true') return null;
  const [snapshot, setSnapshot] = useState<SOVSnapshot | null>(null);
  const [previousSnapshot, setPreviousSnapshot] = useState<SOVSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTriggeringAnalysis, setIsTriggeringAnalysis] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isSovUpToDate, setIsSovUpToDate] = useState(false);

  const {
    status: liveSovStatus,
    eventNonce,
    markProcessing,
    markCompleted,
  } = useSovSnapshotListener(productId, engine);

  const calculateGrowth = (current: number, previous: number | null) => {
    if (previous === null) return null;
    const change = current - previous;

    if (previous === 0) {
      return {
        change,
        percentageChange: null as number | null,
        isGrowth: change > 0,
        isDecline: change < 0,
        isNeutral: change === 0,
        displayMode: 'points' as const,
      };
    }

    const percentageChange = (change / previous) * 100;
    return {
      change,
      percentageChange,
      isGrowth: change > 0,
      isDecline: change < 0,
      isNeutral: change === 0,
      displayMode: 'percent' as const,
    };
  };

  const ScoreWithGrowth = ({ current, previous, label, getColor }: {
    current: number;
    previous: number | null;
    label: string;
    getColor: (score: number) => string;
  }) => {
    const growth = calculateGrowth(current, previous);
    const color = getColor(current);

    return (
      <div className="flex-1 flex flex-col items-center space-y-3">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
        
        <div className="flex items-baseline gap-1.5">
          <span className="text-4xl font-extrabold tracking-tight" style={{ color }}>{current}%</span>
          {growth && (
            <span className={cn(
              "text-xs font-bold px-1.5 py-0.5 rounded-md",
              growth.isGrowth ? "text-emerald-500 bg-emerald-500/10" : growth.isDecline ? "text-red-500 bg-red-500/10" : "text-muted-foreground bg-muted"
            )}>
              {growth.isNeutral
                ? (growth.displayMode === 'points' ? '+0' : '0.0%')
                : growth.displayMode === 'points'
                  ? (growth.isGrowth
                    ? `+${Math.abs(growth.change).toFixed(0)}`
                    : `-${Math.abs(growth.change).toFixed(0)}`)
                  : (growth.isGrowth
                    ? `+${Math.abs(growth.percentageChange ?? 0).toFixed(1)}%`
                    : `-${Math.abs(growth.percentageChange ?? 0).toFixed(1)}%`)
              }
            </span>
          )}
        </div>

        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(0,0,0,0.2)]"
            style={{ 
              width: `${current}%`, 
              backgroundColor: color 
            }}
          />
        </div>

        {previous !== null && (
          <span className="text-[10px] font-medium text-muted-foreground/60">
            Previous: {previous}%
          </span>
        )}
      </div>
    );
  };

  const fetchSOVData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/sov?productId=${encodeURIComponent(productId)}&engine=${encodeURIComponent(engine)}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          setSnapshot(null);
          setError('No Share of Voice data available.');
        } else {
          setSnapshot(null);
          setError('Failed to load data.');
        }
        return;
      }

      const data = await response.json();

      if (data.latestSnapshot) {
        setSnapshot(data.latestSnapshot);
        setPreviousSnapshot(data.previousSnapshot);
      } else {
        setSnapshot(null);
        setPreviousSnapshot(null);
        setError('No data available.');
      }
    } catch (err) {
      setSnapshot(null);
      setError('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!productId) return;
    fetchSOVData();
  }, [productId, engine]);

  useEffect(() => {
    if (!productId) return;
    fetchSOVData();
  }, [eventNonce]);

  useEffect(() => {
    const checkSovProgress = async () => {
      if (!productId) return;
      try {
        const { checkLatestSovProgress } = await import('@/lib/sovProgressCheck');
        const progress = await checkLatestSovProgress(productId, engine);
        setIsSovUpToDate(progress.status === 'complete');
      } catch (error) {
        setIsSovUpToDate(false);
      }
    };
    checkSovProgress();
  }, [productId, engine, eventNonce]);

  const runSovAnalysis = async () => {
    if (!productId || isTriggeringAnalysis) return;

    setActionError(null);
    setActionSuccess(null);
    setIsTriggeringAnalysis(true);
    setIsSovUpToDate(false);
    markProcessing();

    const result = await triggerSovAnalysis({
      productId,
      engine,
      debug: (process.env.NODE_ENV as string) === 'debug',
    });

    if ('success' in result && result.success) {
      if (result.message) {
        setActionSuccess(result.message + ' (All caught up!)');
        setIsSovUpToDate(true);
        markCompleted();
      } else {
        setActionSuccess('Analysis started. Results will appear in a few minutes.');
      }
      setTimeout(() => setActionSuccess(null), 5000);
    } else {
      setActionError(result.error || 'Failed to start analysis.');
      setIsSovUpToDate(false);
    }
    setIsTriggeringAnalysis(false);
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Just now';
  };

  const getVisibilityColor = (score: number) => score > 50 ? "#10b981" : score > 20 ? "#f59e0b" : "#ef4444";
  const getTrustColor = (score: number) => score > 70 ? "#10b981" : score > 40 ? "#f59e0b" : "#ef4444";
  const getReputationColor = (score: number) => score > 70 ? "#10b981" : score > 30 ? "#f59e0b" : "#ef4444";
  const getEngineColorClass = (engine: string) => engine === 'google' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";

  if (loading) {
    return (
      <Card className="bg-card border-border/40 overflow-hidden">
        <div className="p-6 space-y-6">
          <div className="flex justify-between">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-6 w-1/4" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-24 flex-1" />
            <Skeleton className="h-24 flex-1" />
            <Skeleton className="h-24 flex-1" />
          </div>
          <Skeleton className="h-32 w-full" />
        </div>
      </Card>
    );
  }

  if (error || !snapshot) {
    return (
      <Card className="bg-card border-red-500/20 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-red-500/20" />
        <CardContent className="p-8 space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-red-500 flex items-center gap-2">
              <HugeiconsIcon icon={Alert01Icon} className="size-5" />
              SOV Data Unavailable
            </h3>
            <p className="text-sm text-muted-foreground">
              {error || 'No Share of Voice data available yet.'}
            </p>
            <p className="text-xs text-muted-foreground/60 italic leading-relaxed">
              {!product?.analyses || product.analyses.length === 0
                ? "First complete a baseline analysis (Google or Perplexity) to enable SOV auditing."
                : "Initialise SOV Analysis to begin tracking your presence across high-intent queries."
              }
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button 
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold h-12"
              onClick={runSovAnalysis}
              disabled={isTriggeringAnalysis || (!product?.analyses || product.analyses.length === 0)}
            >
              <HugeiconsIcon icon={Analytics01Icon} className="mr-2 size-5" />
              {isTriggeringAnalysis ? 'Initialising…' : 'Start SOV Analysis'}
            </Button>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger render={<span className="w-full" />}>
                  <Button variant="outline" className="w-full border-muted-foreground/20 text-muted-foreground font-bold h-12 opacity-50 cursor-not-allowed" disabled>
                    <HugeiconsIcon icon={SparklesIcon} className="mr-2 size-5" />
                    Deep Analysis
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-popover text-popover-foreground border-border shadow-xl">
                  <p>Initialise SOV to unlock Deep Analysis</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-emerald-500/20 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 border-b border-border/5">
        <div className="flex items-center gap-3">
          <CardTitle className="text-xl font-bold tracking-tight">Share of Voice</CardTitle>
          <Badge variant="outline" className={cn("capitalize font-bold px-2 py-0.5", getEngineColorClass(snapshot.engine))}>
            {snapshot.engine}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest">
          <HugeiconsIcon icon={Clock01Icon} className="size-3.5" strokeWidth={2.5} />
          {getRelativeTime(snapshot.analyzed_at)}
        </div>
      </CardHeader>

      <CardContent className="pt-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <ScoreWithGrowth
            current={Number(snapshot.global_sov_score)}
            previous={previousSnapshot ? Number(previousSnapshot.global_sov_score) : null}
            label="Visibility"
            getColor={getVisibilityColor}
          />
          <ScoreWithGrowth
            current={Number(snapshot.citation_score)}
            previous={previousSnapshot ? Number(previousSnapshot.citation_score) : null}
            label="Citation Rate"
            getColor={getTrustColor}
          />
          <ScoreWithGrowth
            current={Number(snapshot.category_relevance)}
            previous={previousSnapshot ? Number(previousSnapshot.category_relevance) : null}
            label="Relevance"
            getColor={getReputationColor}
          />
        </div>

        <div className="p-6 rounded-2xl bg-muted/30 border border-emerald-500/10 relative overflow-hidden group/insight">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/insight:opacity-20 transition-opacity">
            <HugeiconsIcon icon={InformationCircleIcon} className="size-12 text-emerald-500" />
          </div>
          
          <div className="prose prose-sm prose-invert max-w-none text-muted-foreground leading-relaxed font-medium">
            <ReactMarkdown>
              {snapshot.narrative_summary}
            </ReactMarkdown>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <Button 
            variant={isDeepAnalysisActive ? "default" : "outline"}
            className={cn(
              "flex-1 h-12 font-bold text-sm transition-all duration-300",
              isDeepAnalysisActive 
                ? "bg-emerald-500 hover:bg-emerald-600 text-emerald-950 shadow-lg shadow-emerald-500/20" 
                : "border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10 hover:border-emerald-500"
            )}
            onClick={onDeepAnalysisClick}
          >
            <HugeiconsIcon icon={SparklesIcon} className="mr-2 size-5" strokeWidth={2.5} />
            Deep Analysis
          </Button>

          <Button 
            className={cn(
              "flex-1 h-12 font-bold text-sm transition-all duration-300",
              isSovUpToDate 
                ? "bg-emerald-600/20 text-emerald-500 border border-emerald-500/30 cursor-default hover:bg-emerald-600/25" 
                : "bg-emerald-500 hover:bg-emerald-600 text-emerald-950 shadow-lg shadow-emerald-500/20"
            )}
            onClick={runSovAnalysis}
            disabled={isTriggeringAnalysis || isSovUpToDate}
          >
            <HugeiconsIcon icon={RefreshIcon} className={cn("mr-2 size-5", isTriggeringAnalysis && "animate-spin")} strokeWidth={2.5} />
            {isTriggeringAnalysis ? 'Processing…' : isSovUpToDate ? 'Up to date' : 'Refresh Analysis'}
          </Button>
        </div>

        <div className="space-y-3">
          {actionSuccess && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-500 text-xs font-bold animate-in fade-in slide-in-from-top-1">
              <HugeiconsIcon icon={ChartUpIcon} className="size-4 shrink-0" strokeWidth={3} />
              {actionSuccess}
            </div>
          )}

          {actionError && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/20 text-red-500 text-xs font-bold animate-in fade-in slide-in-from-top-1">
              <HugeiconsIcon icon={Alert01Icon} className="size-4 shrink-0" strokeWidth={3} />
              {actionError}
            </div>
          )}
        </div>

        <div className="text-center pt-2">
          <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">
            Analysis of {snapshot.total_queries_analyzed} high-intent queries for optimized insight
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
