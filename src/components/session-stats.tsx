import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, Play, CheckCircle2, BarChart2, Clock, DollarSign } from 'lucide-react';

function AnimatedCounter({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = display;
    let end = value;
    if (start === end) return;
    const step = (end - start) / 20;
    let current = start;
    let frame = 0;
    const interval = setInterval(() => {
      frame++;
      current += step;
      if ((step > 0 && current >= end) || (step < 0 && current <= end) || frame >= 20) {
        setDisplay(end);
        clearInterval(interval);
      } else {
        setDisplay(Math.round(current));
      }
    }, 20);
    return () => clearInterval(interval);
  }, [value]);
  return <span>{display}</span>;
}

export function SessionStats() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    running: 0,
    completed: 0,
    totalRevenue: 0,
    totalHours: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      // جلب كل الجلسات
      const { data, error } = await supabase.from('sessions').select('*');
      if (error) {
        setLoading(false);
        return;
      }
      const total = data.length;
      const running = data.filter((s: any) => s.status === 'running').length;
      const completedSessions = data.filter((s: any) => s.status === 'completed');
      const completed = completedSessions.length;
      const totalRevenue = completedSessions.reduce((sum: number, s: any) => sum + (s.price || 0), 0);
      const totalHours = completedSessions.reduce((sum: number, s: any) => sum + (s.duration || 0), 0);
      setStats({ total, running, completed, totalRevenue, totalHours });
      setLoading(false);
    };
    fetchStats();
    const interval = setInterval(fetchStats, 10000); // تحديث كل 10 ثواني
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 animate-fade-in-down">
      <StatCard icon={<BarChart2 className="h-6 w-6 text-blue-500" />} label="Total Sessions" value={stats.total} loading={loading} />
      <StatCard icon={<Play className="h-6 w-6 text-green-500" />} label="Active" value={stats.running} loading={loading} />
      <StatCard icon={<CheckCircle2 className="h-6 w-6 text-primary" />} label="Completed" value={stats.completed} loading={loading} />
      <StatCard icon={<DollarSign className="h-6 w-6 text-yellow-500" />} label="Total Revenue" value={stats.totalRevenue.toFixed(2) + ' EGP'} loading={loading} />
      <StatCard icon={<Clock className="h-6 w-6 text-purple-500" />} label="Total Hours" value={stats.totalHours.toFixed(2)} loading={loading} />
    </div>
  );
}

function StatCard({ icon, label, value, loading }: { icon: React.ReactNode, label: string, value: any, loading: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center bg-card/80 rounded-xl shadow-md p-4 min-h-[90px]">
      <div className="mb-1">{icon}</div>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-2xl font-bold">
        {loading ? <Loader2 className="animate-spin h-5 w-5" /> : value}
      </div>
    </div>
  );
} 