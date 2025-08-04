"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSettlementReport } from "@/lib/actions";
import type { SettlementReport, Period } from "@/lib/types";
import { Loader2, BarChart2 } from "lucide-react";

interface ReportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportSheet({ open, onOpenChange }: ReportSheetProps) {
  const [report, setReport] = useState<SettlementReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("daily");

  useEffect(() => {
    if (open) {
      fetchReport(period);
    }
  }, [open, period]);

  const fetchReport = async (newPeriod: Period) => {
    setIsLoading(true);
    try {
      const reportData = await getSettlementReport(newPeriod);
      setReport(reportData);
    } catch (error) {
      console.error("Failed to fetch report:", error);
      setReport(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod as Period);
  };

  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`;
  };

  const ReportContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
    }

    if (!report || report.grandTotalSessionCount === 0) {
      return (
        <div className="text-center py-10">
          <p className="text-muted-foreground">No completed sessions found for this period.</p>
        </div>
      );
    }
    
    const consoleNames = Object.keys(report.consoles).sort();

    return (
      <div className="space-y-6">
        {consoleNames.map((name) => (
            <div key={name}>
                <h3 className="font-bold text-lg mb-2 text-primary">{name} Summary</h3>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Total Sessions</TableHead>
                            <TableHead>Total Hours</TableHead>
                            <TableHead className="text-right">Total Revenue</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell>{report.consoles[name].sessionCount}</TableCell>
                            <TableCell>{formatHours(report.consoles[name].totalDuration)}</TableCell>
                            <TableCell className="text-right font-mono">{report.consoles[name].totalPrice.toFixed(2)} EGP</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        ))}
        
        <div className="pt-4">
             <h3 className="font-bold text-xl mb-3 text-center text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Grand Total Summary</h3>
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Total Sessions</TableHead>
                        <TableHead>Total Hours</TableHead>
                        <TableHead className="text-right">Total Revenue</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow className="bg-muted/50 font-bold">
                        <TableCell>{report.grandTotalSessionCount}</TableCell>
                        <TableCell>{formatHours(report.grandTotalDuration)}</TableCell>
                        <TableCell className="text-right font-mono">{report.grandTotalPrice.toFixed(2)} EGP</TableCell>
                    </TableRow>
                </TableBody>
             </Table>
        </div>
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl lg:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl flex items-center gap-2">
            <BarChart2 className="h-6 w-6" />
            Settlement Reports
          </SheetTitle>
          <SheetDescription>
            View daily, weekly, and monthly summaries of all sessions.
          </SheetDescription>
        </SheetHeader>
        <div className="my-4">
          <Tabs value={period} onValueChange={handlePeriodChange}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <ReportContent />

        <SheetFooter className="mt-6">
          <p className="text-xs text-muted-foreground text-center w-full">
            Report generated on: {new Date().toLocaleString('en-US')}
          </p>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
