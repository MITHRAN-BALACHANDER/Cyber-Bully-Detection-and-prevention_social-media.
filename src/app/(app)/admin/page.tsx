'use client';

import { Card } from '@/components/ui';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const demo = [
  { name: 'Mon', dau: 1200, posts: 320, reports: 4 },
  { name: 'Tue', dau: 1420, posts: 410, reports: 3 },
  { name: 'Wed', dau: 1550, posts: 460, reports: 7 },
  { name: 'Thu', dau: 1730, posts: 520, reports: 2 },
  { name: 'Fri', dau: 1910, posts: 610, reports: 8 },
  { name: 'Sat', dau: 1840, posts: 570, reports: 5 },
  { name: 'Sun', dau: 2020, posts: 690, reports: 6 },
];

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white/5 border border-white/5 p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <div className="mx-auto w-full max-w-[980px]">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Premium analytics dashboard (demo chart wiring with Recharts).
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="DAU" value="2,020" />
        <Stat label="Posts/day" value="690" />
        <Stat label="New users" value="118" />
        <Stat label="Churn" value="2.1%" />
        <Stat label="Toxicity flags" value="14" />
        <Stat label="Reports" value="6" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-4">
          <div className="text-sm font-semibold">Weekly activity</div>
          <div className="mt-1 text-xs text-muted-foreground">
            DAU and posts with glass-card styling.
          </div>

          <div className="mt-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={demo} barSize={18}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'rgba(249,250,251,0.65)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(249,250,251,0.65)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(17,24,39,0.85)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 16,
                    color: '#F9FAFB',
                    backdropFilter: 'blur(12px)',
                  }}
                />
                <Bar dataKey="dau" fill="#6366F1" radius={[10, 10, 0, 0]} />
                <Bar dataKey="posts" fill="#06B6D4" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm font-semibold">Risk signals</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Reports + toxicity flags (placeholder).
          </div>
          <div className="mt-4 space-y-3">
            {[
              { k: 'Spam reports', v: '6' },
              { k: 'Harassment', v: '3' },
              { k: 'NSFW', v: '2' },
              { k: 'Other', v: '3' },
            ].map((x) => (
              <div key={x.k} className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2">
                <div className="text-sm text-muted-foreground">{x.k}</div>
                <div className="text-sm font-semibold">{x.v}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

