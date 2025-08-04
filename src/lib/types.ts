export interface Session {
  id: string;
  console_name: string;
  start_time: string;
  end_time: string | null;
  duration: number | null;
  price: number | null;
  created_at: string;
  status: 'running' | 'completed';
}

export interface ConsoleData {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export type Period = 'daily' | 'weekly' | 'monthly';

export interface ConsoleReport {
  totalDuration: number;
  totalPrice: number;
  sessionCount: number;
}

export interface SettlementReport {
  period: Period;
  startDate: Date;
  endDate: Date;
  consoles: {
    [consoleName: string]: ConsoleReport;
  };
  grandTotalDuration: number;
  grandTotalPrice: number;
  grandTotalSessionCount: number;
}
