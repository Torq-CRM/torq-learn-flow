import { Skeleton } from '@/components/ui/skeleton';
import { useTrainingData } from '@/hooks/useTrainingData';
import { useLocationId } from '@/contexts/LocationContext';

export default function ReportPage() {
  const { locationId } = useLocationId();
  const { subjects, videos, progress, loading } = useTrainingData(locationId);

  if (!locationId) {
    return (
      <p className="text-center mt-12 text-sm" style={{ color: '#64748B' }}>
        Select a location to view progress data.
      </p>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[120px] rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-[300px] rounded-2xl" />
      </div>
    );
  }

  const getSubjectVideos = (sid: string) => videos.filter((v) => v.subject_id === sid);
  const getCompleted = (sid: string) => {
    const ids = getSubjectVideos(sid).map((v) => v.id);
    return progress.filter((p) => p.watched && ids.includes(p.video_id!)).length;
  };

  const totalCompleted = progress.filter((p) => p.watched).length;
  const totalVideos = videos.length;

  const subjectPcts = subjects.map((s) => {
    const total = getSubjectVideos(s.id).length;
    return total > 0 ? getCompleted(s.id) / total : 0;
  });
  const avgProgress = subjectPcts.length > 0 ? Math.round((subjectPcts.reduce((a, b) => a + b, 0) / subjectPcts.length) * 100) : 0;
  const modulesComplete = subjectPcts.filter((p) => p >= 0.8).length;

  const stats = [
    { label: 'Videos Completed', value: totalCompleted, subtitle: 'Across all modules' },
    { label: 'Average Progress', value: `${avgProgress}%`, subtitle: `Across ${subjects.length} subjects` },
    { label: 'Videos Available', value: totalVideos, subtitle: 'Training videos' },
    { label: 'Modules Completed', value: `${modulesComplete}/${subjects.length}`, subtitle: '≥80% threshold' },
  ];

  const hasCompletions = totalCompleted > 0;

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl p-6"
            style={{ background: 'var(--torq-card)', border: '1px solid var(--torq-border)' }}
          >
            <p
              className="font-mono-torq uppercase"
              style={{ fontSize: 11, letterSpacing: 2, color: '#64748B' }}
            >
              {stat.label}
            </p>
            <p className="font-mono-torq font-bold mt-1" style={{ fontSize: 28, color: 'var(--torq-text)' }}>
              {stat.value}
            </p>
            <p className="text-xs mt-1" style={{ color: '#64748B' }}>
              {stat.subtitle}
            </p>
          </div>
        ))}
      </div>

      {/* Report Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--torq-card)', border: '1px solid var(--torq-border)' }}
      >
        {!hasCompletions ? (
          <p className="text-center py-12 text-sm" style={{ color: '#64748B' }}>
            Mark videos as complete to start tracking your progress.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  {['Subject', 'Videos', 'Completed', 'Progress', 'Status'].map((h) => (
                    <th
                      key={h}
                      className="text-left font-mono-torq uppercase px-4 py-3"
                      style={{ fontSize: 11, color: '#64748B', fontWeight: 400 }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject) => {
                  const total = getSubjectVideos(subject.id).length;
                  const completed = getCompleted(subject.id);
                  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

                  let statusLabel: string;
                  let statusBg: string;
                  let statusColor: string;
                  if (pct >= 80) {
                    statusLabel = 'Complete';
                    statusBg = '#DCFCE7';
                    statusColor = '#16A34A';
                  } else if (pct >= 40) {
                    statusLabel = 'In Progress';
                    statusBg = '#FEF3C7';
                    statusColor = '#D97706';
                  } else {
                    statusLabel = 'Not Started';
                    statusBg = '#F1F5F9';
                    statusColor = '#64748B';
                  }

                  return (
                    <tr key={subject.id} style={{ borderTop: '1px solid var(--torq-border)' }}>
                      <td className="px-4 py-3 font-semibold text-sm" style={{ color: 'var(--torq-text)' }}>
                        {subject.title}
                      </td>
                      <td className="px-4 py-3 font-mono-torq text-[13px]">{total}</td>
                      <td className="px-4 py-3 font-mono-torq text-[13px]" style={{ color: 'var(--torq-accent)' }}>
                        {completed}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-[120px] h-1.5 rounded-full" style={{ background: '#F1F5F9' }}>
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${pct}%`, background: 'var(--torq-accent)' }}
                            />
                          </div>
                          <span className="font-mono-torq text-xs">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-xs font-medium px-2 py-1"
                          style={{ background: statusBg, color: statusColor, borderRadius: 10 }}
                        >
                          {statusLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
