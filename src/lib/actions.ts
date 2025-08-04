'use server';

import { supabase } from './supabaseClient';
import type { Session, SettlementReport, Period } from './types';
import { revalidatePath } from 'next/cache';
import { startOfDay, startOfWeek, startOfMonth, endOfDay, endOfWeek, endOfMonth } from 'date-fns';

const calculatePrice = (durationHours: number): number => {
  const totalMinutes = Math.round(durationHours * 60);
  if (totalMinutes < 10) return 0; // لا يتم احتساب أي سعر إذا كانت أقل من 10 دقائق
  let price = 0;
  let minutesLeft = totalMinutes;

  // شريحة الساعة (40-60 دقيقة = 25 جنيه)
  while (minutesLeft >= 40) {
    price += 25;
    minutesLeft -= 60;
  }

  // شريحة النصف ساعة (20-30 دقيقة = 15 جنيه)
  if (minutesLeft >= 20 && minutesLeft <= 30) {
    price += 15;
    minutesLeft -= 30;
  }

  // شريحة الربع ساعة (10-15 دقيقة = 10 جنيه)
  if (minutesLeft >= 10 && minutesLeft <= 15) {
    price += 10;
    minutesLeft -= 15;
  }

  // تجاهل الدقائق الأقل من 10 (لا تُحسب)
  return price;
};

export async function getSessions(consoleName: string): Promise<Session[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('console_name', consoleName)
    .eq('status', 'completed')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase getSessions error:', error.message);
    throw new Error(`Failed to get completed sessions: ${error.message}`);
  }
  return data || [];
}

export async function addSession(session: Omit<Session, 'id' | 'created_at' | 'status' | 'duration' | 'price'> & {end_time: string}): Promise<Session> {
    const startTime = new Date(session.start_time);
    const endTime = new Date(session.end_time);
    const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    const price = calculatePrice(durationHours);

    const newSession = {
        ...session,
        duration: durationHours,
        price: price,
        status: 'completed'
    };
    
    const { data, error } = await supabase.from('sessions').insert(newSession).select().single();

    if (error || !data) {
        console.error('Supabase addSession error:', error?.message);
        throw new Error(`Failed to add session: ${error?.message}`);
    }
    revalidatePath('/', 'page');
    return data;
}

export async function deleteSession(sessionId: string): Promise<{ success: boolean }> {
  const { error } = await supabase.from('sessions').delete().eq('id', sessionId);
  
  if (error) {
    console.error('Supabase deleteSession error:', error.message);
    throw new Error(`Failed to delete session: ${error.message}`);
  }
  revalidatePath('/', 'page');
  return { success: true };
}

export async function clearAllSessions(): Promise<{ success: boolean }> {
  const { error } = await supabase.from('sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  if (error) {
    console.error('Supabase clearAllSessions error:', error.message);
    throw new Error(`Failed to clear sessions: ${error.message}`);
  }
  revalidatePath('/', 'page');
  return { success: true };
}

export async function getAllSessions(): Promise<Session[]> {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase getAllSessions error:', error.message);
      throw new Error(`Failed to get all sessions: ${error.message}`);
    }
    return data || [];
}

export async function startTimer(consoleName: string): Promise<Session> {
  const newSession = {
    console_name: consoleName,
    start_time: new Date().toISOString(),
    status: 'running',
  };
  
  const { data, error } = await supabase.from('sessions').insert(newSession).select().single();

  if (error || !data) {
    console.error('Supabase startTimer error:', error?.message);
    throw new Error(`Failed to start timer: ${error?.message}`);
  }
  revalidatePath('/', 'page');
  return data;
}

export async function stopTimer(sessionId: string): Promise<Session> {
  const { data: existingSession, error: fetchError } = await supabase
    .from('sessions')
    .select('start_time')
    .eq('id', sessionId)
    .single();

  if (fetchError || !existingSession) {
    console.error('Supabase stopTimer fetch error:', fetchError?.message);
    throw new Error(`Failed to find session to stop: ${fetchError?.message || 'Session not found'}`);
  }

  const startTime = new Date(existingSession.start_time);
  const endTime = new Date();
  const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
  const price = calculatePrice(durationHours);
  
  const updates = {
    end_time: endTime.toISOString(),
    duration: durationHours,
    price: price,
    status: 'completed',
  };

  const { data, error } = await supabase
    .from('sessions')
    .update(updates)
    .eq('id', sessionId)
    .select()
    .single();

  if (error || !data) {
    console.error('Supabase stopTimer update error:', error?.message);
    throw new Error(`Failed to stop timer: ${error?.message}`);
  }
  revalidatePath('/', 'page');
  return data;
}

async function stopAllRunningTimers(): Promise<void> {
  const { data: runningSessions, error: fetchError } = await supabase
    .from('sessions')
    .select('id, start_time')
    .eq('status', 'running');

  if (fetchError) {
    throw new Error(`Failed to fetch running timers for stopping: ${fetchError.message}`);
  }

  if (!runningSessions || runningSessions.length === 0) {
    return; // No running timers to stop
  }

  const updates = runningSessions.map(session => {
    const startTime = new Date(session.start_time);
    const endTime = new Date();
    const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    const price = calculatePrice(durationHours);

    return {
      ...session,
      end_time: endTime.toISOString(),
      duration: durationHours,
      price,
      status: 'completed',
    };
  });

  for (const session of updates) {
    const { error: updateError } = await supabase
      .from('sessions')
      .update({
        end_time: session.end_time,
        duration: session.duration,
        price: session.price,
        status: session.status,
      })
      .eq('id', session.id);

    if (updateError) {
      console.error(`Failed to stop timer for session ID ${session.id}: ${updateError.message}`);
      throw new Error(`Failed to stop an active timer session: ${updateError.message}`);
    }
  }
}

export async function getRunningSession(consoleName: string): Promise<Session | null> {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('console_name', consoleName)
      .eq('status', 'running')
      .maybeSingle();
      
    if (error) {
        console.error('Supabase getRunningSession error:', error.message);
        throw new Error(`Failed to get running session: ${error.message}`);
    }
    return data;
}


export async function getSettlementReport(period: Period): Promise<SettlementReport> {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = endOfDay(now);

    switch (period) {
        case 'weekly':
            startDate = startOfWeek(now, { weekStartsOn: 1 }); // Assuming week starts on Monday
            endDate = endOfWeek(now, { weekStartsOn: 1 });
            break;
        case 'monthly':
            startDate = startOfMonth(now);
            endDate = endOfMonth(now);
            break;
        case 'daily':
        default:
            startDate = startOfDay(now);
            break;
    }

    const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

    if (error) {
        throw new Error(`Failed to fetch sessions for report: ${error.message}`);
    }

    const report: SettlementReport = {
        period,
        startDate,
        endDate,
        consoles: {},
        grandTotalDuration: 0,
        grandTotalPrice: 0,
        grandTotalSessionCount: 0,
    };

    if (!data) return report;

    for (const session of data) {
        if (!session.console_name) continue;

        if (!report.consoles[session.console_name]) {
            report.consoles[session.console_name] = {
                totalDuration: 0,
                totalPrice: 0,
                sessionCount: 0,
            };
        }

        const consoleReport = report.consoles[session.console_name];
        const duration = session.duration || 0;
        const price = session.price || 0;

        consoleReport.totalDuration += duration;
        consoleReport.totalPrice += price;
        consoleReport.sessionCount += 1;

        report.grandTotalDuration += duration;
        report.grandTotalPrice += price;
        report.grandTotalSessionCount += 1;
    }

    return report;
}

export async function stopTimersAndGetReport(): Promise<SettlementReport> {
    await stopAllRunningTimers();
    revalidatePath('/', 'page');
    const report = await getSettlementReport('daily');
    return report;
}

    