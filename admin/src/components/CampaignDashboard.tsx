import { useQuery } from '@tanstack/react-query'
import { Bar, BarChart, CartesianGrid, Cell, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Camera, Globe, Mail, MessageCircle, MessageSquare, TrendingUp, Users } from 'lucide-react'
import { adminApi } from '@/api/admin'
import { Badge } from '@/components/ui/Badge'

const STATUS_COLORS: Record<string, string> = {
  draft: '#a49dbb', scheduled: '#f2a93b', sending: '#f2a93b',
  sent: '#7c3aed', partially_sent: '#9b5cf6', failed: '#d64545',
}

export function CampaignDashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['campaign-analytics'], queryFn: adminApi.campaignAnalytics })

  if (isLoading || !data) {
    return <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 p-6 text-ink-300 animate-pulse">Loading dashboard...</div>
  }

  const { overview, by_status, recent_campaign, contact_growth, contacts_summary } = data

  const donutData = [
    { name: 'With email', value: contacts_summary.with_email },
    { name: 'No email', value: contacts_summary.without_email },
  ]

  const statusData = Object.entries(by_status)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({ status: status.replace('_', ' '), count, color: STATUS_COLORS[status] }))

  return (
    <div className="flex flex-col gap-4">
      {/* Overview stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {(
          [
            { label: 'Campaigns', value: overview.total_campaigns, Icon: Users },
            { label: 'Recipients', value: overview.total_recipients, Icon: Users },
            { label: 'Emails', value: overview.emails_sent, Icon: Mail },
            { label: 'WhatsApp', value: overview.whatsapp_sent, Icon: MessageCircle },
            { label: 'SMS', value: overview.sms_sent, Icon: MessageSquare },
            { label: 'Facebook', value: overview.facebook_posts, Icon: Globe },
            { label: 'Instagram', value: overview.instagram_posts, Icon: Camera },
          ] satisfies { label: string; value: number; Icon: React.ComponentType<{ className?: string }> }[]
        ).map(({ label, value, Icon }) => (
          <div key={label} className="rounded-xl bg-rice-50 border border-ink-100/60 p-3">
            <div className="flex items-center gap-1.5 text-ink-300 text-[11px]">
              <Icon className="h-3.5 w-3.5" /> {label}
            </div>
            <p className="text-lg font-bold text-ink-500 mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent campaign delivery */}
        <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 p-4">
          <h3 className="text-sm font-semibold text-ink-500 mb-3">Recent Campaign</h3>
          {recent_campaign ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-ink-500 truncate">{recent_campaign.name}</p>
                <Badge status={recent_campaign.status === 'sent' ? 'active' : 'approved'} label={recent_campaign.status.replace('_', ' ')} />
              </div>
              <p className="text-xs text-ink-300 mb-2">{recent_campaign.total_recipients} recipients</p>
              <div className="h-2 w-full rounded-full bg-ink-100 overflow-hidden flex">
                <div className="bg-forest-600 h-full" style={{ width: `${recent_campaign.delivery_rate}%` }} />
                <div className="bg-chili-500 h-full" style={{ width: `${recent_campaign.total_recipients ? (recent_campaign.failed_count / recent_campaign.total_recipients) * 100 : 0}%` }} />
              </div>
              <div className="flex items-center justify-between mt-2 text-xs">
                <span className="flex items-center gap-1 text-forest-600"><TrendingUp className="h-3 w-3" /> {recent_campaign.delivery_rate}% delivered</span>
                <span className="text-chili-600">{recent_campaign.failed_count} failed</span>
              </div>
            </>
          ) : (
            <p className="text-ink-300 text-sm text-center py-8">No campaigns sent yet.</p>
          )}
        </div>

        {/* Campaigns by status */}
        <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 p-4">
          <h3 className="text-sm font-semibold text-ink-500 mb-3">Campaigns by Status</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={statusData} layout="vertical" margin={{ left: 8 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="status" width={80} tick={{ fontSize: 11, fill: '#6b6480' }} />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-ink-300 text-sm text-center py-8">No campaigns yet.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Contact growth chart */}
        <div className="lg:col-span-2 rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 p-4">
          <h3 className="text-sm font-semibold text-ink-500 mb-3">Contact Growth (last 6 weeks)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={contact_growth}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ece7f7" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6b6480' }} />
              <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#6b6480' }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#6b6480' }} />
              <Tooltip />
              <Bar yAxisId="left" dataKey="new_contacts" name="New contacts" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="total_contacts" name="Total contacts" stroke="#db8f1f" strokeWidth={2} dot={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Marketing contacts donut */}
        <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 p-4">
          <h3 className="text-sm font-semibold text-ink-500 mb-3">Contacts Reachable</h3>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={donutData} dataKey="value" innerRadius={35} outerRadius={55} paddingAngle={3}>
                <Cell fill="#7c3aed" />
                <Cell fill="#ece7f7" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-1 mt-1 text-xs">
            <span className="flex items-center gap-1.5 text-ink-500"><span className="h-2 w-2 rounded-full bg-forest-600" /> With email — {contacts_summary.with_email}</span>
            <span className="flex items-center gap-1.5 text-ink-400"><span className="h-2 w-2 rounded-full bg-ink-100" /> No email — {contacts_summary.without_email}</span>
            <p className="text-ink-300 mt-1">{contacts_summary.new_last_30_days} new customers in last 30 days</p>
          </div>
        </div>
      </div>
    </div>
  )
}
