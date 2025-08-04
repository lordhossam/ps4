"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { playSound } from './audio-controller';
import { addSession, deleteSession, getSessions, startTimer, stopTimer, getRunningSession } from '@/lib/actions';
import type { ConsoleData, Session } from '@/lib/types';
import { Calculator, Clock, Loader2, Play, Redo, Square, Trash2, Watch } from 'lucide-react';

interface ConsoleTrackerProps {
  consoleData: ConsoleData;
}

export function ConsoleTracker({ consoleData }: ConsoleTrackerProps) {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const [runningSession, setRunningSession] = useState<Session | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [lastResult, setLastResult] = useState<{ duration: number; price: number } | null>(null);

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [completed, running] = await Promise.all([
        getSessions(consoleData.name),
        getRunningSession(consoleData.name)
      ]);
      setSessions(completed);
      setRunningSession(running);
    } catch (error) {
      toast({ title: "Error loading console data", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [consoleData.name, toast]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Poll running session every 10 seconds for real-time sync
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAllData();
    }, 10000); // 10 seconds
    return () => clearInterval(interval);
  }, [fetchAllData]);


  useEffect(() => {
    if (runningSession && runningSession.start_time) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      
      const sessionStartTime = new Date(runningSession.start_time).getTime();
      const updateElapsedTime = () => {
        setElapsedTime(Date.now() - sessionStartTime);
      };
      
      updateElapsedTime(); // Call once immediately to avoid 1-second delay
      timerIntervalRef.current = setInterval(updateElapsedTime, 1000);

    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      setElapsedTime(0);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [runningSession]);


  const formatTime = (ms: number) => {
    if (ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const handleToggleTimer = async () => {
    setIsSubmitting(true);
    playSound('timer');
    try {
      if (runningSession) {
        const stoppedSession = await stopTimer(runningSession.id);
        setLastResult({ duration: stoppedSession.duration || 0, price: stoppedSession.price || 0 });
        toast({ title: `${consoleData.name} session stopped`, description: `Price: ${stoppedSession.price?.toFixed(2)} EGP` });
        setRunningSession(null);
        setSessions(prev => [stoppedSession, ...prev]);
      } else {
        if (isSubmitting) return;
        const newSession = await startTimer(consoleData.name);
        setRunningSession(newSession);
        toast({ title: `${consoleData.name} session started` });
        setLastResult(null);
      }
    } catch (error: any) {
      toast({ title: "Error", description: `Operation failed: ${error.message}`, variant: "destructive" });
      await fetchAllData();
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCalculate = async () => {
    if (!startTime || !endTime) {
        toast({ title: "Error", description: "Please enter a start and end time.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    playSound('calculate');
    
    const today = new Date().toISOString().slice(0, 10);
    const start = new Date(`${today}T${startTime}:00`);
    let end = new Date(`${today}T${endTime}:00`);

    if (end < start) {
        end.setDate(end.getDate() + 1);
    }

    try {
        const newSession = await addSession({
            console_name: consoleData.name,
            start_time: start.toISOString(),
            end_time: end.toISOString(),
        });
        setLastResult({ duration: newSession.duration || 0, price: newSession.price || 0 });
        toast({ title: "Session successfully recorded and calculated" });
        setSessions(prev => [newSession, ...prev]);
        handleReset();
    } catch (error) {
      toast({ title: "Error", description: "Failed to save session.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (sessionId: string) => {
    try {
      await deleteSession(sessionId);
      toast({ title: "Session deleted" });
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete session.", variant: "destructive" });
    }
  };
  
  const handleReset = () => {
    setStartTime('');
    setEndTime('');
    if(!runningSession) {
      setLastResult(null);
    }
  };
  
  const isTimerRunning = !!runningSession;

  if (isLoading) {
    return (
        <Card className={`bg-card/80 backdrop-blur-sm border-t-4 shadow-lg transition-all duration-300 hover:shadow-primary/20 ${consoleData.color}`}>
            <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                    <consoleData.icon className="h-7 w-7" />
                    <span>{consoleData.name}</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center items-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className={`bg-card/80 backdrop-blur-sm border-t-4 shadow-lg transition-all duration-300 hover:shadow-primary/20 ${consoleData.color}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-2xl font-bold">
          <consoleData.icon className="h-7 w-7" />
          <span>{consoleData.name}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor={`start-${consoleData.name}`}><Clock className="inline-block mr-1 h-4 w-4" /> Start Time</Label>
              <Input id={`start-${consoleData.name}`} type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} disabled={isTimerRunning || isSubmitting} />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`end-${consoleData.name}`}><Clock className="inline-block mr-1 h-4 w-4" /> End Time</Label>
              <Input id={`end-${consoleData.name}`} type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} disabled={isTimerRunning || isSubmitting} />
            </div>
          </div>
          
          {isTimerRunning && (
            <div className="text-center font-mono text-4xl p-2 bg-muted rounded-lg tracking-wider">
                <Watch className="inline-block mr-2 h-8 w-8" /> {formatTime(elapsedTime)}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            <Button onClick={handleToggleTimer} className="bg-gradient-to-r from-primary to-secondary text-white" disabled={isSubmitting || (isTimerRunning && !runningSession)}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : (isTimerRunning ? <Square className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />)}
              {isTimerRunning ? 'Stop' : 'Start'}
            </Button>
            <Button onClick={handleCalculate} disabled={isSubmitting || isTimerRunning}>
              {isSubmitting && !isTimerRunning ? <Loader2 className="animate-spin" /> : <Calculator className="mr-2 h-4 w-4" />}
              Calculate
            </Button>
            <Button onClick={handleReset} variant="outline" disabled={isSubmitting || isTimerRunning}>
              <Redo className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>

          {lastResult && !isTimerRunning && (
            <div className="p-3 bg-muted rounded-lg text-sm space-y-2 animate-fade-in">
              <p><strong>Duration:</strong> {lastResult.duration.toFixed(2)} hours</p>
              <p className='font-bold'><strong>Price:</strong> {lastResult.price.toFixed(2)} EGP</p>
            </div>
          )}
        </div>
        
        <Separator className="my-6" />

        <div>
          <h3 className="font-bold mb-4">Completed Sessions Log</h3>
          {sessions.length > 0 ? (
            <div className="space-y-3 max-h-48 overflow-y-auto p-1">
              {sessions.map(session => (
                <div
                  key={session.id}
                  className="flex flex-col gap-1 p-3 bg-muted/60 rounded-lg shadow-sm relative"
                >
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span role="img" aria-label="date">🗓️</span>
                    {new Date(session.created_at).toLocaleDateString('en-US')} |
                    {session.start_time ? new Date(session.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute:'2-digit' }) : '--:--'}
                    {" - "}
                    {session.end_time ? new Date(session.end_time).toLocaleTimeString('en-US', { hour: '2-digit', minute:'2-digit' }) : '--:--'}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span role="img" aria-label="duration">⏳</span>
                    Duration: <span className="font-bold">{session.duration?.toFixed(2) ?? '--'} h</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span role="img" aria-label="price">💰</span>
                    Price: <span className="font-bold">{session.price?.toFixed(2) ?? '--'} EGP</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 text-destructive/70 hover:text-destructive"
                    onClick={() => handleDelete(session.id)}
                  >
                    <span role="img" aria-label="delete">🗑️</span>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground text-sm py-4">No completed sessions logged yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
