import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, GripVertical, X, Check } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTrainingData } from '@/hooks/useTrainingData';
import { useLocationId } from '@/contexts/LocationContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export default function SubjectDetailPage() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { locationId } = useLocationId();
  const { isAdmin } = useAuth();
  const { subjects, videos, progress, loading } = useTrainingData(locationId);

  const [addOpen, setAddOpen] = useState(false);
  const [addTitle, setAddTitle] = useState('');
  const [addUrl, setAddUrl] = useState('');
  const [addDesc, setAddDesc] = useState('');
  const [adding, setAdding] = useState(false);
  const [deleteVideoId, setDeleteVideoId] = useState<string | null>(null);

  // Inline editing state
  const [editingField, setEditingField] = useState<{ videoId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  const [marking, setMarking] = useState<string | null>(null);

  const subject = subjects.find((s) => s.id === subjectId);
  const subjectVideos = videos.filter((v) => v.subject_id === subjectId);
  const isWatched = (videoId: string) => progress.some((p) => p.video_id === videoId && p.watched);

  const linkSearch = locationId ? `?location_id=${locationId}` : '';

  const handleMarkComplete = async (videoId: string) => {
    if (!locationId) return;
    setMarking(videoId);
    await supabase.from('training_progress').upsert(
      {
        location_id: locationId,
        video_id: videoId,
        watched: true,
        completed_at: new Date().toISOString(),
      },
      { onConflict: 'location_id,video_id' }
    );
    queryClient.invalidateQueries({ queryKey: ['training-progress', locationId] });
    setMarking(null);
  };

  const handleInlineSave = async (videoId: string, field: string, value: string) => {
    const update: Record<string, string> = {};
    update[field] = value;
    await supabase.from('training_videos').update(update).eq('id', videoId);
    queryClient.invalidateQueries({ queryKey: ['training-videos'] });
    setEditingField(null);
  };

  const handleAddVideo = async () => {
    if (!addTitle.trim() || !addUrl.trim()) return;
    setAdding(true);
    const maxSort = subjectVideos.length > 0 ? Math.max(...subjectVideos.map((v) => v.sort_order ?? 0)) : 0;
    await supabase.from('training_videos').insert({
      subject_id: subjectId,
      title: addTitle.trim(),
      video_url: addUrl.trim(),
      description: addDesc.trim() || null,
      sort_order: maxSort + 1,
    });
    queryClient.invalidateQueries({ queryKey: ['training-videos'] });
    setAddTitle('');
    setAddUrl('');
    setAddDesc('');
    setAddOpen(false);
    setAdding(false);
  };

  const handleDeleteVideo = async () => {
    if (!deleteVideoId) return;
    await supabase.from('training_progress').delete().eq('video_id', deleteVideoId);
    await supabase.from('training_videos').delete().eq('id', deleteVideoId);
    queryClient.invalidateQueries({ queryKey: ['training-videos'] });
    queryClient.invalidateQueries({ queryKey: ['training-progress', locationId] });
    setDeleteVideoId(null);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48 rounded-2xl" />
        <Skeleton className="h-4 w-72 rounded-2xl" />
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-[300px] rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!subject) {
    return (
      <p className="text-center mt-12 text-sm" style={{ color: '#64748B' }}>
        Subject not found.
      </p>
    );
  }

  return (
    <div className="max-w-3xl">
      <button
        className="flex items-center gap-1 text-sm mb-4 hover:underline"
        style={{ color: 'var(--torq-muted)' }}
        onClick={() => navigate(`/training${linkSearch}`)}
      >
        <ArrowLeft size={16} /> Back to Training
      </button>

      <h2 className="font-bold text-2xl mb-1" style={{ color: 'var(--torq-text)' }}>
        {subject.title}
      </h2>
      {subject.summary && (
        <p className="text-sm mb-6" style={{ color: '#64748B' }}>
          {subject.summary}
        </p>
      )}

      <div className="space-y-4">
        {subjectVideos.map((video) => {
          const completed = isWatched(video.id);
          return (
            <div
              key={video.id}
              className="rounded-2xl p-5 relative"
              style={{
                background: 'var(--torq-card)',
                border: '1px solid var(--torq-border)',
              }}
            >
              {isAdmin && (
                <div className="absolute top-3 right-3 flex gap-1">
                  <GripVertical size={14} style={{ color: 'var(--torq-muted)', cursor: 'grab' }} />
                  <button className="p-1 rounded hover:bg-red-50" onClick={() => setDeleteVideoId(video.id)}>
                    <X size={14} style={{ color: 'var(--torq-danger)' }} />
                  </button>
                </div>
              )}

              {/* Title */}
              {editingField?.videoId === video.id && editingField.field === 'title' ? (
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  autoFocus
                  className="text-sm mb-1"
                  onBlur={() => handleInlineSave(video.id, 'title', editValue)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleInlineSave(video.id, 'title', editValue);
                    if (e.key === 'Escape') setEditingField(null);
                  }}
                />
              ) : (
                <h3
                  className="font-semibold"
                  style={{ fontSize: 16, color: 'var(--torq-text)', cursor: isAdmin ? 'pointer' : 'default' }}
                  onClick={() => {
                    if (isAdmin) {
                      setEditingField({ videoId: video.id, field: 'title' });
                      setEditValue(video.title);
                    }
                  }}
                >
                  {video.title}
                </h3>
              )}

              {/* Description */}
              {editingField?.videoId === video.id && editingField.field === 'description' ? (
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  autoFocus
                  className="text-sm mt-1"
                  onBlur={() => handleInlineSave(video.id, 'description', editValue)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleInlineSave(video.id, 'description', editValue);
                    if (e.key === 'Escape') setEditingField(null);
                  }}
                />
              ) : video.description ? (
                <p
                  className="text-[13px] mt-1"
                  style={{ color: '#64748B', cursor: isAdmin ? 'pointer' : 'default' }}
                  onClick={() => {
                    if (isAdmin) {
                      setEditingField({ videoId: video.id, field: 'description' });
                      setEditValue(video.description ?? '');
                    }
                  }}
                >
                  {video.description}
                </p>
              ) : null}

              {/* Video embed */}
              <div
                className="mt-3 relative rounded-xl overflow-hidden"
                style={{ paddingTop: '56.25%', background: '#000' }}
              >
                {video.video_url ? (
                  <iframe
                    src={video.video_url}
                    className="absolute top-0 left-0 w-full h-full"
                    frameBorder="0"
                    allowFullScreen
                    allow="autoplay; fullscreen; picture-in-picture"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[13px]" style={{ color: '#64748B' }}>
                      Video embed not available
                    </span>
                  </div>
                )}
              </div>

              {/* Admin: inline edit video_url */}
              {isAdmin && (
                <div className="mt-2">
                  {editingField?.videoId === video.id && editingField.field === 'video_url' ? (
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      autoFocus
                      className="text-xs"
                      placeholder="Embed URL"
                      onBlur={() => handleInlineSave(video.id, 'video_url', editValue)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleInlineSave(video.id, 'video_url', editValue);
                        if (e.key === 'Escape') setEditingField(null);
                      }}
                    />
                  ) : (
                    <button
                      className="text-xs underline"
                      style={{ color: 'var(--torq-muted)' }}
                      onClick={() => {
                        setEditingField({ videoId: video.id, field: 'video_url' });
                        setEditValue(video.video_url);
                      }}
                    >
                      Edit embed URL
                    </button>
                  )}
                </div>
              )}

              {/* Mark as Complete */}
              <div className="mt-3">
                {completed ? (
                  <span
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium text-white"
                    style={{ background: '#16A34A' }}
                  >
                    <Check size={14} /> Completed
                  </span>
                ) : (
                  <button
                    className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                    style={{
                      border: '1px solid var(--torq-accent)',
                      color: 'var(--torq-accent)',
                      background: 'transparent',
                    }}
                    disabled={marking === video.id || !locationId}
                    onClick={() => handleMarkComplete(video.id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--torq-accent)';
                      e.currentTarget.style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--torq-accent)';
                    }}
                  >
                    {marking === video.id ? 'Saving…' : 'Mark as Complete'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Admin: Add Video */}
      {isAdmin && (
        <Button variant="outline" className="mt-4" onClick={() => setAddOpen(true)}>
          + Add Video
        </Button>
      )}

      {/* Add Video Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Video</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Title (required)" value={addTitle} onChange={(e) => setAddTitle(e.target.value)} />
            <div>
              <Input placeholder="Video URL (required)" value={addUrl} onChange={(e) => setAddUrl(e.target.value)} />
              <p className="text-xs mt-1" style={{ color: 'var(--torq-muted)' }}>
                Paste a Loom, YouTube, or Vimeo embed URL
              </p>
            </div>
            <Input placeholder="Description" value={addDesc} onChange={(e) => setAddDesc(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddVideo} disabled={!addTitle.trim() || !addUrl.trim() || adding}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Video Confirmation */}
      <Dialog open={!!deleteVideoId} onOpenChange={() => setDeleteVideoId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Video?</DialogTitle>
          </DialogHeader>
          <p className="text-sm" style={{ color: 'var(--torq-muted)' }}>
            This will also delete progress data for this video.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteVideoId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteVideo}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
