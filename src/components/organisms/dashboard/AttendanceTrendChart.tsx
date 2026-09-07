"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CalendarCheck } from "lucide-react";
import { WidgetCard } from "@/components/molecules/WidgetCard";
import type { AttendanceDayPoint } from "@/types/dashboard";

export function AttendanceTrendChart({ data }: { data: AttendanceDayPoint[] }) {
  return (
    <WidgetCard title="Attendance Trend" icon={CalendarCheck}>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: -20, right: 10, top: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="var(--color-muted)" />
            <YAxis tick={{ fontSize: 11 }} stroke="var(--color-muted)" />
            <Tooltip
              contentStyle={{
                background: "var(--color-surface-card)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="present" stackId="a" fill="var(--color-success)" name="Present" radius={[0, 0, 0, 0]} isAnimationActive={false} />
            <Bar dataKey="remote" stackId="a" fill="var(--color-info)" name="Remote" isAnimationActive={false} />
            <Bar dataKey="absent" stackId="a" fill="var(--color-danger)" name="Absent" radius={[4, 4, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </WidgetCard>
  );
}
