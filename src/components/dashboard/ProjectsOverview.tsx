import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { projectsByStatus } from '@/data/mockData';

const COLORS = [
  'hsl(var(--info))',
  'hsl(var(--primary))',
  'hsl(var(--warning))',
  'hsl(var(--chart-4))',
  'hsl(var(--success))',
  'hsl(var(--muted-foreground))',
];

export default function ProjectsOverview() {
  return (
    <div className="bg-card rounded-xl border border-border/50 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Projects by Status</h3>
        <p className="text-sm text-muted-foreground">Distribution across pipeline stages</p>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={projectsByStatus} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <YAxis
              type="category"
              dataKey="status"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              width={90}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              formatter={(value: number, name: string) => [value, name === 'count' ? 'Projects' : 'Value']}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {projectsByStatus.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
