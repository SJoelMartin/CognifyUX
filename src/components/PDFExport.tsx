import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

interface PDFExportProps {
  summary: {
    overallScore: number;
    totalSessions: number;
    totalSignals: number;
    hotspotCount: number;
    scoreTrend: number;
  };
  hotspots: Array<{
    id: string;
    selector: string;
    page: string;
    signalType: string;
    severity: 'low' | 'medium' | 'high';
    occurrences: number;
    description: string;
    suggestion: string;
  }>;
  pages: Array<{
    page: string;
    avgScore: number;
    sessionCount: number;
    signalCount: number;
    trend: number;
  }>;
  timeRange: string;
}

export function PDFExport({ summary, hotspots, pages, timeRange }: PDFExportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const getScoreLabel = (score: number): string => {
    if (score <= 20) return "Low";
    if (score <= 40) return "Mild";
    if (score <= 70) return "Moderate";
    return "High";
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 20;

      // Header
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("Cognitive Load Analysis Report", pageWidth / 2, yPos, { align: "center" });
      
      yPos += 10;
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(128, 128, 128);
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPos, { align: "center" });
      doc.text(`Time Range: ${timeRange}`, pageWidth / 2, yPos + 6, { align: "center" });
      
      // Executive Summary
      yPos += 25;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Executive Summary", 20, yPos);
      
      yPos += 12;
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      
      // Summary cards
      const summaryData = [
        ["Overall CL Score", `${summary.overallScore} (${getScoreLabel(summary.overallScore)})`],
        ["Total Sessions", summary.totalSessions.toString()],
        ["Signals Detected", summary.totalSignals.toString()],
        ["Active Hotspots", hotspots.length.toString()],
        ["Score Trend", `${summary.scoreTrend >= 0 ? '+' : ''}${summary.scoreTrend}%`],
      ];

      autoTable(doc, {
        startY: yPos,
        head: [["Metric", "Value"]],
        body: summaryData,
        theme: "grid",
        headStyles: { fillColor: [0, 217, 255], textColor: [0, 0, 0] },
        margin: { left: 20, right: 20 },
      });

      // Top Hotspots
      yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Top UX Hotspots", 20, yPos);

      if (hotspots.length > 0) {
        const hotspotData = hotspots.slice(0, 5).map((h, idx) => [
          (idx + 1).toString(),
          h.signalType,
          h.severity.toUpperCase(),
          h.occurrences.toString(),
          h.suggestion.substring(0, 50) + (h.suggestion.length > 50 ? '...' : ''),
        ]);

        autoTable(doc, {
          startY: yPos + 8,
          head: [["#", "Issue Type", "Severity", "Occurrences", "Recommendation"]],
          body: hotspotData,
          theme: "grid",
          headStyles: { fillColor: [0, 217, 255], textColor: [0, 0, 0] },
          columnStyles: {
            0: { cellWidth: 10 },
            2: { cellWidth: 25 },
            3: { cellWidth: 25 },
          },
          margin: { left: 20, right: 20 },
        });
      } else {
        yPos += 10;
        doc.setFontSize(11);
        doc.setFont("helvetica", "italic");
        doc.text("No hotspots detected in this time period.", 20, yPos);
      }

      // Page Performance
      yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY + 15 || yPos + 20;
      
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Page Performance Analysis", 20, yPos);

      if (pages.length > 0) {
        const pageData = pages.slice(0, 10).map(p => [
          p.page,
          p.avgScore.toString(),
          getScoreLabel(p.avgScore),
          p.sessionCount.toString(),
          p.signalCount.toString(),
          `${p.trend >= 0 ? '+' : ''}${p.trend}%`,
        ]);

        autoTable(doc, {
          startY: yPos + 8,
          head: [["Page", "Score", "Level", "Sessions", "Signals", "Trend"]],
          body: pageData,
          theme: "grid",
          headStyles: { fillColor: [0, 217, 255], textColor: [0, 0, 0] },
          margin: { left: 20, right: 20 },
        });
      }

      // Recommendations
      yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY + 15 || yPos + 20;
      
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Prioritized Recommendations", 20, yPos);

      yPos += 12;
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");

      const recommendations = hotspots.slice(0, 5).map((h, idx) => ({
        priority: idx + 1,
        issue: h.signalType,
        location: h.selector,
        suggestion: h.suggestion,
      }));

      if (recommendations.length > 0) {
        recommendations.forEach((rec, idx) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          
          doc.setFont("helvetica", "bold");
          doc.text(`${rec.priority}. ${rec.issue}`, 25, yPos);
          yPos += 6;
          doc.setFont("helvetica", "normal");
          doc.setTextColor(100, 100, 100);
          doc.text(`Location: ${rec.location}`, 30, yPos);
          yPos += 5;
          doc.setTextColor(0, 0, 0);
          
          const lines = doc.splitTextToSize(`Action: ${rec.suggestion}`, pageWidth - 55);
          doc.text(lines, 30, yPos);
          yPos += lines.length * 5 + 8;
        });
      } else {
        doc.text("No critical issues requiring immediate action.", 25, yPos);
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Page ${i} of ${pageCount} | Cognitive Load Analyzer`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" }
        );
      }

      // Save
      doc.save(`cla-report-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("Report exported successfully!");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Failed to export report");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="gap-2"
      onClick={exportToPDF}
      disabled={isExporting}
    >
      {isExporting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileDown className="w-4 h-4" />
      )}
      Export
    </Button>
  );
}
