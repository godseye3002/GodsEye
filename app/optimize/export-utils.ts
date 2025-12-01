"use client";

import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx";
import jsPDF from "jspdf";
import { OptimizationAnalysis } from "./types";

const formatDateStamp = () => {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
};

const formatSourceSlug = (sourceLabel: string) =>
  sourceLabel
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "analysis";

const safeText = (value: unknown): string => {
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  if (typeof value === "string") {
    return value.trim();
  }
  if (value == null) {
    return "-";
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    return String(value);
  }
};

type HeadingLevelValue = (typeof HeadingLevel)[keyof typeof HeadingLevel];

const createHeading = (text: string, level: HeadingLevelValue) =>
  new Paragraph({
    text,
    heading: level,
    spacing: { after: 200 },
  });

const createLabelValue = (label: string, value: string) =>
  new Paragraph({
    children: [
      new TextRun({ text: `${label}: `, bold: true }),
      new TextRun({ text: value }),
    ],
    spacing: { after: 100 },
  });

const createBullet = (text: string) =>
  new Paragraph({
    text,
    bullet: { level: 0 },
  });

export const exportAnalysisToDocx = async (
  analysis: OptimizationAnalysis,
  sourceLabel = "Perplexity Search Analysis",
  usedQuery?: string | null
) => {
  const doc = new Document({
    sections: [
      {
        children: [
          createHeading("GodsEye AI Search Optimization Report", HeadingLevel.TITLE),
          createHeading(sourceLabel, HeadingLevel.HEADING_1),
          
          // Add used query section if provided
          ...(usedQuery ? [
            createHeading("Search Query Used", HeadingLevel.HEADING_2),
            createLabelValue("Query", safeText(usedQuery)),
          ] : []),
          
          createHeading("Executive Summary", HeadingLevel.HEADING_1),
          createLabelValue("Title", safeText(analysis.executive_summary.title)),
          createLabelValue("Status Overview", safeText(analysis.executive_summary.status_overview)),
          createLabelValue("Strategic Analogy", safeText(analysis.executive_summary.strategic_analogy)),

          createHeading("Client Product Visibility", HeadingLevel.HEADING_1),
          createLabelValue("Status", safeText(analysis.client_product_visibility.status)),
          createLabelValue("Details", safeText(analysis.client_product_visibility.details)),

          createHeading("AI Answer Deconstruction", HeadingLevel.HEADING_1),
          createLabelValue("Dominant Narrative", safeText(analysis.ai_answer_deconstruction.dominant_narrative)),
          createHeading("Key Decision Factors", HeadingLevel.HEADING_2),
          ...analysis.ai_answer_deconstruction.key_decision_factors.map((factor) =>
            createBullet(safeText(factor))
          ),
          createHeading("Trusted Source Analysis", HeadingLevel.HEADING_2),
          createLabelValue("Sources", safeText(analysis.ai_answer_deconstruction.trusted_source_analysis)),

          createHeading("Competitive Landscape", HeadingLevel.HEADING_1),
          ...analysis.competitive_landscape_analysis.map((item, index) => [
            createHeading(`Competitor ${index + 1}`, HeadingLevel.HEADING_2),
            createLabelValue("Name", safeText(item.competitor_name)),
            createLabelValue("Reason for Inclusion", safeText(item.reason_for_inclusion)),
            createLabelValue("Source of Mention", safeText(item.source_of_mention)),
          ]).flat(),

          createHeading("Strategic Gap & Opportunity Analysis", HeadingLevel.HEADING_1),
          createLabelValue("Summary", safeText(analysis.strategic_gap_and_opportunity_analysis.analysis_summary)),
          ...(analysis.strategic_gap_and_opportunity_analysis.if_featured
            ? [
                createHeading("If Featured", HeadingLevel.HEADING_2),
                createLabelValue(
                  "Current Positioning",
                  safeText(analysis.strategic_gap_and_opportunity_analysis.if_featured.current_positioning)
                ),
                createLabelValue(
                  "Opportunities for Improvement",
                  safeText(analysis.strategic_gap_and_opportunity_analysis.if_featured.opportunities_for_improvement)
                ),
              ]
            : []),
          ...(analysis.strategic_gap_and_opportunity_analysis.if_not_featured
            ? [
                createHeading("If Not Featured", HeadingLevel.HEADING_2),
                createLabelValue(
                  "Primary Reasons for Omission",
                  safeText(analysis.strategic_gap_and_opportunity_analysis.if_not_featured.primary_reasons_for_omission)
                ),
                createLabelValue(
                  "Path to Inclusion",
                  safeText(analysis.strategic_gap_and_opportunity_analysis.if_not_featured.path_to_inclusion)
                ),
              ]
            : []),

          createHeading("Actionable Recommendations", HeadingLevel.HEADING_1),
          ...analysis.actionable_recommendations.map((item, index) => [
            createHeading(`Recommendation ${index + 1}`, HeadingLevel.HEADING_2),
            createLabelValue("Recommendation", safeText(item.recommendation)),
            createLabelValue("Action", safeText(item.action)),
          ]).flat(),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `godseye_ai_report_${formatSourceSlug(sourceLabel)}_${formatDateStamp()}.docx`);
};

export const exportAnalysisToPdf = (
  analysis: OptimizationAnalysis,
  sourceLabel = "Perplexity Search Analysis",
  usedQuery?: string | null
) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const marginX = 40;
  const lineHeight = 18;
  const topMargin = 60;
  const bottomMargin = 60;
  const contentWidth = 515;
  const pageHeight = doc.internal.pageSize.getHeight();
  let cursorY = topMargin;

  const ensureSpace = (height: number) => {
    if (cursorY + height > pageHeight - bottomMargin) {
      doc.addPage();
      cursorY = topMargin;
    }
  };

  const addHeading = (text: string, size = 18, spacing = 10) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", "bold");
    const lines = doc.splitTextToSize(text, contentWidth);
    lines.forEach((line: string) => {
      ensureSpace(lineHeight);
      doc.text(line, marginX, cursorY);
      cursorY += lineHeight;
    });
    if (spacing > 0) {
      ensureSpace(spacing);
      cursorY += spacing;
    }
  };

  const addText = (label: string, value: string) => {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    const labelWidth = doc.getTextWidth(`${label}: `);

    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(value || "-", contentWidth - labelWidth);
    const blockHeight = lines.length * lineHeight + 6;
    ensureSpace(blockHeight);

    doc.setFont("helvetica", "bold");
    doc.text(`${label}: `, marginX, cursorY);
    doc.setFont("helvetica", "normal");
    const startX = marginX + labelWidth;
    lines.forEach((line: string, index: number) => {
      doc.text(line, index === 0 ? startX : marginX, cursorY);
      cursorY += lineHeight;
    });
    cursorY += 6;
  };

  const addBulletList = (items: string[]) => {
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    items.forEach((item) => {
      const lines = doc.splitTextToSize(item, contentWidth - 20);
      const blockHeight = lines.length * lineHeight + 4;
      ensureSpace(blockHeight);
      lines.forEach((line: string, index: number) => {
        doc.text(`${index === 0 ? "• " : "  "}${line}`, marginX, cursorY);
        cursorY += lineHeight;
      });
      cursorY += 4;
    });
    ensureSpace(6);
    cursorY += 6;
  };

  addHeading("GodsEye AI Search Optimization Report", 22, 20);
  addHeading(sourceLabel, 16, 12);

  // Add used query section if provided
  if (usedQuery) {
    addHeading("Search Query Used", 13, 4);
    addText("Query", safeText(usedQuery));
  }

  addHeading("Executive Summary", 16, 6);
  addText("Title", safeText(analysis.executive_summary.title));
  addText("Status Overview", safeText(analysis.executive_summary.status_overview));
  addText("Strategic Analogy", safeText(analysis.executive_summary.strategic_analogy));

  addHeading("Client Product Visibility", 16, 6);
  addText("Status", safeText(analysis.client_product_visibility.status));
  addText("Details", safeText(analysis.client_product_visibility.details));

  addHeading("AI Answer Deconstruction", 16, 6);
  addText("Dominant Narrative", safeText(analysis.ai_answer_deconstruction.dominant_narrative));
  addHeading("Key Decision Factors", 13, 4);
  addBulletList(analysis.ai_answer_deconstruction.key_decision_factors.map(safeText));
  addHeading("Trusted Source Analysis", 13, 4);
  addText("Sources", safeText(analysis.ai_answer_deconstruction.trusted_source_analysis));

  addHeading("Competitive Landscape", 16, 6);
  analysis.competitive_landscape_analysis.forEach((item, index) => {
    addHeading(`Competitor ${index + 1}`, 13, 4);
    addText("Name", safeText(item.competitor_name));
    addText("Reason for Inclusion", safeText(item.reason_for_inclusion));
    addText("Source of Mention", safeText(item.source_of_mention));
  });

  addHeading("Strategic Gap & Opportunity Analysis", 16, 6);
  addText("Analysis Summary", safeText(analysis.strategic_gap_and_opportunity_analysis.analysis_summary));
  if (analysis.strategic_gap_and_opportunity_analysis.if_featured) {
    addHeading("If Featured", 13, 4);
    addText(
      "Current Positioning",
      safeText(analysis.strategic_gap_and_opportunity_analysis.if_featured.current_positioning)
    );
    addText(
      "Opportunities for Improvement",
      safeText(analysis.strategic_gap_and_opportunity_analysis.if_featured.opportunities_for_improvement)
    );
  }
  if (analysis.strategic_gap_and_opportunity_analysis.if_not_featured) {
    addHeading("If Not Featured", 13, 4);
    addText(
      "Primary Reasons for Omission",
      safeText(analysis.strategic_gap_and_opportunity_analysis.if_not_featured.primary_reasons_for_omission)
    );
    addText(
      "Path to Inclusion",
      safeText(analysis.strategic_gap_and_opportunity_analysis.if_not_featured.path_to_inclusion)
    );
  }

  addHeading("Actionable Recommendations", 16, 6);
  analysis.actionable_recommendations.forEach((item, index) => {
    addHeading(`Recommendation ${index + 1}`, 13, 4);
    addText("Recommendation", safeText(item.recommendation));
    addText("Action", safeText(item.action));
  });

  doc.save(`godseye_ai_report_${formatSourceSlug(sourceLabel)}_${formatDateStamp()}.pdf`);
};
