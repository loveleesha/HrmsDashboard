import { Meter } from "@/components/molecules/Meter";
import type { LeaveBalance } from "@/types/leave";

const TYPE_COLOR: Record<string, string> = {
  "Casual Leave": "bg-info",
  "Sick Leave": "bg-warning",
  "Earned Leave": "bg-success",
  "Unpaid Leave": "bg-muted-light",
};

export function LeaveBalanceCards({ balances }: { balances: LeaveBalance[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {balances.map((balance) => {
        const isUnpaid = balance.total === 0;
        const percentUsed = isUnpaid ? 0 : Math.min(100, Math.round((balance.used / balance.total) * 100));

        return (
          <div key={balance.type} className="rounded-xl border border-border bg-surface-card p-4">
            <p className="text-fs-base text-muted">{balance.type}</p>
            <div className="mt-1 flex items-end gap-1.5">
              <span className="text-fs-6xl font-semibold text-ink">{balance.remaining}</span>
              <span className="mb-1 text-fs-base text-muted">
                {isUnpaid ? "days taken" : `/ ${balance.total} days left`}
              </span>
            </div>
            {!isUnpaid && (
              <>
                <Meter value={percentUsed} colorClassName={TYPE_COLOR[balance.type]} className="mt-3" />
                <p className="mt-1 text-fs-sm text-muted-light">{balance.used} days used this year</p>
              </>
            )}
            {isUnpaid && <p className="mt-3 text-fs-sm text-muted-light">No annual cap</p>}
          </div>
        );
      })}
    </div>
  );
}
