"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";
import { WidgetCard } from "@/components/molecules/WidgetCard";
import type { LeaveBalance } from "@/types/leave";

const COLORS = ["var(--color-info)", "var(--color-warning)", "var(--color-success)", "var(--color-muted-light)"];

export function LeaveTypeChart({ balances }: { balances: LeaveBalance[] }) {
  const data = balances.filter((balance) => balance.used > 0).map((balance) => ({ name: balance.type, value: balance.used }));

  return (
    <WidgetCard title="Leave Taken by Type" icon={PieChartIcon}>
      {data.length === 0 ? (
        <p className="py-16 text-center text-fs-base text-muted">No leave taken yet this year.</p>
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2} isAnimationActive={false}>
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "var(--color-surface-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </WidgetCard>
  );
}
