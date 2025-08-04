"use client";

import { useState, useEffect } from 'react';
import { Gamepad2, File, Wallet, Loader2, BookCheck } from "lucide-react";
import { ConsoleTracker } from "@/components/console-tracker";
import { AudioController, playSound } from "@/components/audio-controller";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { ConsoleData, SettlementReport } from "@/lib/types";
import { getAllSessions, clearAllSessions, stopTimersAndGetReport } from "@/lib/actions";
import { generateSessionPDF } from "@/lib/pdf-generator";
import { ReportSheet } from '@/components/report-sheet';
import { ControllerInventory } from '@/components/controller-inventory';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from '@/lib/supabaseClient';
import { SessionStats } from '@/components/session-stats';

export default function Home() {
  const { toast } = useToast();
  const [isClearing, setIsClearing] = useState(false);
  const [clearVersion, setClearVersion] = useState(0);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isShiftEndDialogOpen, setIsShiftEndDialogOpen] = useState(false);
  const [dailyReportSummary, setDailyReportSummary] = useState<SettlementReport | null>(null);
  const [consoleList, setConsoleList] = useState<ConsoleData[]>([]);
  const [loadingConsoles, setLoadingConsoles] = useState(true);
  const [errorConsoles, setErrorConsoles] = useState<string | null>(null);

  useEffect(() => {
    const fetchConsoles = async () => {
      setLoadingConsoles(true);
      setErrorConsoles(null);
      const { data, error } = await supabase.from('consoles').select('*');
      if (error) {
        setErrorConsoles('Failed to load consoles.');
        setLoadingConsoles(false);
        return;
      }
      setConsoleList(data || []);
      setLoadingConsoles(false);
    };
    fetchConsoles();
  }, [clearVersion]);

  const handleGeneratePDF = async () => {
    playSound('pdf');
    toast({ title: "Generating PDF report...", description: "This might take a moment." });
    try {
      const allSessions = await getAllSessions();
      if(allSessions.filter(s => s.status === 'completed').length === 0) {
        toast({ title: "No Completed Sessions", description: "Cannot generate an empty PDF report.", variant: "destructive" });
        return;
      }
      generateSessionPDF(allSessions);
      toast({ title: "Report generated successfully!", variant: "default" });
    } catch (error) {
      console.error("PDF Generation Error:", error);
      toast({ title: "Error", description: "Failed to generate PDF report.", variant: "destructive" });
    }
  };

  const handleEndShift = async () => {
    setIsClearing(true);
    playSound('timer');
    try {
      await clearAllSessions();
      setClearVersion(v => v + 1);
      toast({ title: "Shift Ended Successfully", description: "All records have been cleared for the new shift.", variant: "default" });
    } catch (error) {
      console.error("End Shift Error:", error);
      toast({ title: "Error", description: "Failed to end the shift.", variant: "destructive" });
    } finally {
      setIsClearing(false);
      setIsShiftEndDialogOpen(false);
      setDailyReportSummary(null);
    }
  };
  
  const handleOpenReports = () => {
    playSound('calculate');
    setIsReportOpen(true);
  };
  
  const handleOpenShiftEndDialog = async () => {
    setIsClearing(true);
    setDailyReportSummary(null);
    try {
      const report = await stopTimersAndGetReport();
      setDailyReportSummary(report);
      setIsShiftEndDialogOpen(true);
    } catch(e) {
      toast({ title: "Error", description: "Failed to stop timers and fetch the daily report.", variant: "destructive" });
      setClearVersion(v => v + 1); // Rerender trackers if there was an error
    } finally {
        setIsClearing(false);
    }
  };
  
  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`;
  };

  return (
    <>
      <main className="container mx-auto p-4 md:p-8 min-h-screen">
        <SessionStats />
        <header className="text-center mb-8 animate-fade-in-down">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
            <Gamepad2 className="inline-block h-10 w-10 mb-2" /> PS4 - Cash
          </h1>
          <p className="text-muted-foreground mt-2">
            PlayStation Session Management & Cashier System
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {loadingConsoles ? (
            <div className="col-span-4 text-center py-8"><Loader2 className="animate-spin mx-auto" /> Loading consoles...</div>
          ) : errorConsoles ? (
            <div className="col-span-4 text-center text-red-500 py-8">{errorConsoles}</div>
          ) : (
            consoleList.map((console, index) => (
              <div key={`${console.name}-${clearVersion}`} style={{ animationDelay: `${index * 100}ms` }} className="animate-fade-in-up">
                <ConsoleTracker
                  consoleData={{ ...console, icon: Gamepad2 }}
                />
              </div>
            ))
          )}
        </div>

        <div className="my-8 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <ControllerInventory />
        </div>
        
        <footer className="flex justify-center items-center flex-wrap gap-4 mt-10 pb-8 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
          <Button onClick={handleOpenReports} size="lg" className="rounded-full shadow-lg shadow-secondary/30 bg-gradient-to-r from-secondary to-blue-400 hover:from-secondary/90 hover:to-blue-400/90 text-white">
             <BookCheck className="mr-2 h-5 w-5" />
             View Reports
          </Button>
          <Button onClick={handleGeneratePDF} size="lg" className="rounded-full shadow-lg shadow-primary/30">
            <File className="mr-2 h-5 w-5" />
            Save Sessions as PDF
          </Button>
          <Dialog open={isShiftEndDialogOpen} onOpenChange={(isOpen) => {
            setIsShiftEndDialogOpen(isOpen);
            if (!isOpen) {
              setDailyReportSummary(null);
              // If user cancels, we need to re-render the trackers to show the stopped timers
              setClearVersion(v => v + 1);
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenShiftEndDialog} variant="destructive" size="lg" className="rounded-full shadow-lg shadow-destructive/30" disabled={isClearing}>
                {isClearing ? <Loader2 className="animate-spin"/> : <Wallet className="mr-2 h-5 w-5" />}
                End Shift
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>End of Shift Report (Daily)</DialogTitle>
                <DialogDescription>
                  Are you sure you want to end the shift? This will permanently delete all records. This is a summary of your daily revenue.
                </DialogDescription>
              </DialogHeader>
              {dailyReportSummary ? (
                <div className="max-h-[50vh] overflow-y-auto my-4">
                  {dailyReportSummary.grandTotalSessionCount > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Console</TableHead>
                        <TableHead>Sessions</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(dailyReportSummary.consoles).map(([name, data]) => (
                        <TableRow key={name}>
                          <TableCell className="font-medium">{name}</TableCell>
                          <TableCell>{data.sessionCount}</TableCell>
                          <TableCell>{formatHours(data.totalDuration)}</TableCell>
                          <TableCell className="text-right font-mono">{data.totalPrice.toFixed(2)} EGP</TableCell>
                        </TableRow>
                      ))}
                        <TableRow className="bg-muted font-bold text-lg">
                            <TableCell>Grand Total</TableCell>
                            <TableCell>{dailyReportSummary.grandTotalSessionCount}</TableCell>
                            <TableCell>{formatHours(dailyReportSummary.grandTotalDuration)}</TableCell>
                            <TableCell className="text-right font-mono">{dailyReportSummary.grandTotalPrice.toFixed(2)} EGP</TableCell>
                        </TableRow>
                    </TableBody>
                  </Table>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No completed sessions for today.</p>
                  )}
                </div>
              ) : <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsShiftEndDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleEndShift} disabled={isClearing || !dailyReportSummary}>
                  {isClearing ? <Loader2 className="animate-spin" /> : "Yes, End Shift"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </footer>

      </main>
      <ReportSheet open={isReportOpen} onOpenChange={setIsReportOpen} />
      <AudioController />
    </>
  );
}
