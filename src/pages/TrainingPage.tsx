import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Pencil, X, Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTrainingData } from '@/hooks/useTrainingData';
import { useLocationId } from '@/contexts/LocationContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export default function TrainingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { locationId } = useLocationId();
  const { isAdmin } = useAuth();
  const { subjects, videos, progress, loading } = useTrainingData(locationId);

  const [addOpen, setAddOpen] = useState(false);
  const [addTitle, setAddTitle] = useState('');
  const [addSummary, setAddSummary] = useState('');
  const [adding, setAdding] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSummary, setEditSummary] = useState('');

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const getSubjectVideos = (subjectId: string) => videos.filter((v) => v.subject_id === subjectId);
  const getCompletedCount = (subjectId: string) => {
    const subjectVideoIds = getSubjectVideos(subjectId).map((v) => v.id);
    return progress.filter((p) => p.watched && subjectVideoIds.includes(p.video_id!)).length;
  };

  const handleAdd = async () => {
    if (!addTitle.trim()) return;
    setAdding(true);
    const maxSort = subjects.length > 0 ? Math.max(...subjects.map((s) => s.sort_order ?? 0)) : 0;
    await supabase.from('training_subjects').insert({
      title: addTitle.trim(),
      summary: addSummary.trim() || null,
      sort_order: maxSort + 1,
      is_active: true,
    });
    queryClient.invalidateQueries({ queryKey: ['training-subjects'] });
    setAddTitle('');
    setAddSummary('');
    setAddOpen(false);
    setAdding(false);
  };

  const handleEditSave = async (id: string) => {
    await supabase.from('training_subjects').update({ title: editTitle, summary: editSummary || null }).eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['training-subjects'] });
    setEditingId(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    // Delete videos & progress for this subject
    const videoIds = videos.filter((v) => v.subject_id === deleteId).map((v) => v.id);
    if (videoIds.length > 0) {
      await supabase.from('training_progress').delete().in('video_id', videoIds);
      await supabase.from('training_videos').delete().eq('subject_id', deleteId);
    }
    await supabase.from('training_subjects').delete().eq('id', deleteId);
    queryClient.invalidateQueries({ queryKey: ['training-subjects'] });
    queryClient.invalidateQueries({ queryKey: ['training-videos'] });
    queryClient.invalidateQueries({ queryKey: ['training-progress', locationId] });
    setDeleteId(null);
  };

  if (loading) {
    return (
      <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[180px] rounded-2xl" />
        ))}
      </div>
    );
  }

  if (subjects.length === 0 && !isAdmin) {
    return (
      <p className="text-center mt-12 text-sm" style={{ color: '#64748B' }}>
        No training modules available yet.
      </p>
    );
  }

  const linkSearch = locationId ? `?location_id=${locationId}` : '';

  return (
    <>
      <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {subjects.map((subject, idx) => {
          const subjectVideos = getSubjectVideos(subject.id);
          const completed = getCompletedCount(subject.id);
          const total = subjectVideos.length;
          const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
          const isEditing = editingId === subject.id;

          return (
            <div
              key={subject.id}
              className="relative rounded-2xl p-6 cursor-pointer"
              style={{
                background: 'var(--torq-card)',
                border: '1px solid var(--torq-border)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                transition: 'box-shadow 0.15s, transform 0.15s',
                animation: `fade-in 0.25s ease-out ${idx * 0.05}s both`,
                opacity: 0,
              }}
              onClick={() => {
                if (!isEditing) navigate(`/training/${subject.id}${linkSearch}`);
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.10)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)';
              }}
            >
              {/* Admin controls */}
              {isAdmin && !isEditing && (
                <div className="absolute top-3 right-3 flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="p-1 rounded hover:bg-gray-100 transition-colors"
                    onClick={() => {
                      setEditingId(subject.id);
                      setEditTitle(subject.title);
                      setEditSummary(subject.summary ?? '');
                    }}
                  >
                    <Pencil size={14} style={{ color: 'var(--torq-muted)' }} />
                  </button>
                  <button className="p-1 rounded hover:bg-red-50 transition-colors" onClick={() => setDeleteId(subject.id)}>
                    <X size={14} style={{ color: 'var(--torq-danger)' }} />
                  </button>
                </div>
              )}

              {/* Top row */}
              <div className="flex items-start justify-between gap-2 mb-2">
                {isEditing ? (
                  <div className="flex-1" onClick={(e) => e.stopPropagation()}>
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="mb-2 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleEditSave(subject.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                    />
                    <Input
                      value={editSummary}
                      onChange={(e) => setEditSummary(e.target.value)}
                      placeholder="Summary"
                      className="text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleEditSave(subject.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      onBlur={() => handleEditSave(subject.id)}
                    />
                  </div>
                ) : (
                  <>
                    <h4 className="font-bold" style={{ fontSize: 16, color: 'var(--torq-text)' }}>
                      {subject.title}
                    </h4>
                    <span
                      className="font-mono-torq flex-shrink-0 px-2 py-0.5"
                      style={{ fontSize: 11, background: '#F1F5F9', borderRadius: 6, color: 'var(--torq-muted)' }}
                    >
                      🎥 {total}
                    </span>
                  </>
                )}
              </div>

              {/* Summary */}
              {!isEditing && subject.summary && (
                <p
                  className="text-[13px] mb-4"
                  style={{
                    color: '#64748B',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {subject.summary}
                </p>
              )}

              {/* Progress */}
              {!isEditing && (
                <div className="mt-auto pt-2">
                  <span className="font-mono-torq font-bold text-[13px]" style={{ color: 'var(--torq-accent)' }}>
                    {pct}%
                  </span>
                  <div className="w-full h-1.5 rounded-full mt-1" style={{ background: '#F1F5F9' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: 'var(--torq-accent)' }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Add Subject tile (admin only) */}
        {isAdmin && (
          <div
            className="rounded-2xl p-6 flex items-center justify-center cursor-pointer"
            style={{
              border: '2px dashed var(--torq-border)',
              minHeight: 180,
              transition: 'border-color 0.15s',
            }}
            onClick={() => setAddOpen(true)}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--torq-accent)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--torq-border)')}
          >
            <span className="font-semibold" style={{ color: 'var(--torq-accent)' }}>
              ＋ Add Subject
            </span>
          </div>
        )}
      </div>

      {/* Add Subject Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Training Subject</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Title (required)" value={addTitle} onChange={(e) => setAddTitle(e.target.value)} />
            <Input placeholder="Summary" value={addSummary} onChange={(e) => setAddSummary(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={!addTitle.trim() || adding}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Subject?</DialogTitle>
          </DialogHeader>
          <p className="text-sm" style={{ color: 'var(--torq-muted)' }}>
            This will also delete all videos and progress for this subject.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
