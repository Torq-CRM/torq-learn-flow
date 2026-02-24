import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Shield, GripVertical, X } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';

const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(255),
  password: z.string().min(1, 'Password is required').max(128),
});

// ── Admin Login ──
function AdminSignIn() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) { setError(result.error.errors[0].message); return; }
    setSubmitting(true);
    try {
      await signIn(result.data.email, result.data.password);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background: `
          radial-gradient(circle at 75% 15%, rgba(109,40,217,0.10) 0%, transparent 55%),
          radial-gradient(circle at 15% 85%, rgba(109,40,217,0.06) 0%, transparent 50%),
          #F8FAFC
        `,
      }}
    >
      <div
        className="w-full max-w-[400px] p-10 rounded-2xl"
        style={{
          background: '#fff',
          border: '1px solid #E6E8EF',
          boxShadow: '0 8px 40px rgba(0,0,0,0.10)',
        }}
      >
        <div className="text-center mb-6">
          <h2 style={{ fontSize: 22, fontWeight: 800 }}>
            <span style={{ color: '#6D28D9' }}>Torq</span>
            <span style={{ color: '#0F172A' }}>Training</span>
          </h2>
          <p className="text-[13px] mt-1" style={{ color: '#64748B' }}>Admin Login</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--torq-text-secondary)' }}>Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@torqcrm.com" required autoComplete="email" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--torq-text-secondary)' }}>Password</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required autoComplete="current-password" />
          </div>
          {error && <p className="text-[13px]" style={{ color: '#DC2626' }}>{error}</p>}
          <Button type="submit" disabled={submitting} className="w-full" style={{ borderRadius: 10 }}>
            {submitting ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 rounded-full border-white border-t-transparent" />
                Signing in…
              </span>
            ) : 'Sign In'}
          </Button>
        </form>
      </div>
    </div>
  );
}

// ── Training Manager ──
function TrainingManager() {
  const queryClient = useQueryClient();
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [addSubjectOpen, setAddSubjectOpen] = useState(false);
  const [addSubjectTitle, setAddSubjectTitle] = useState('');
  const [addSubjectSummary, setAddSubjectSummary] = useState('');
  const [addVideoOpen, setAddVideoOpen] = useState(false);
  const [addVideoTitle, setAddVideoTitle] = useState('');
  const [addVideoUrl, setAddVideoUrl] = useState('');
  const [addVideoDesc, setAddVideoDesc] = useState('');
  const [deleteSubjectId, setDeleteSubjectId] = useState<string | null>(null);
  const [deleteVideoId, setDeleteVideoId] = useState<string | null>(null);

  const { data: subjects, isLoading: subjectsLoading } = useQuery({
    queryKey: ['training-subjects'],
    queryFn: async () => {
      const { data, error } = await supabase.from('training_subjects').select('*').order('sort_order');
      if (error) { toast.error('Unable to connect. Please try again.'); throw error; }
      return data;
    },
  });

  const { data: videos, isLoading: videosLoading } = useQuery({
    queryKey: ['training-videos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('training_videos').select('*').order('sort_order');
      if (error) { toast.error('Unable to connect. Please try again.'); throw error; }
      return data;
    },
  });

  const selectedSubject = subjects?.find((s) => s.id === selectedSubjectId);
  const selectedVideos = videos?.filter((v) => v.subject_id === selectedSubjectId) ?? [];

  const handleAddSubject = async () => {
    if (!addSubjectTitle.trim()) return;
    const maxSort = subjects?.length ? Math.max(...subjects.map((s) => s.sort_order ?? 0)) : 0;
    const { data, error } = await supabase.from('training_subjects').insert({
      title: addSubjectTitle.trim(), summary: addSubjectSummary.trim() || null,
      sort_order: maxSort + 1, is_active: true,
    }).select().single();
    if (error) { toast.error('Failed to save — please check your connection.'); return; }
    queryClient.invalidateQueries({ queryKey: ['training-subjects'] });
    if (data) setSelectedSubjectId(data.id);
    setAddSubjectTitle(''); setAddSubjectSummary(''); setAddSubjectOpen(false);
  };

  const handleDeleteSubject = async () => {
    if (!deleteSubjectId) return;
    const vids = videos?.filter((v) => v.subject_id === deleteSubjectId) ?? [];
    if (vids.length > 0) {
      await supabase.from('training_progress').delete().in('video_id', vids.map((v) => v.id));
      await supabase.from('training_videos').delete().eq('subject_id', deleteSubjectId);
    }
    await supabase.from('training_subjects').delete().eq('id', deleteSubjectId);
    queryClient.invalidateQueries({ queryKey: ['training-subjects'] });
    queryClient.invalidateQueries({ queryKey: ['training-videos'] });
    if (selectedSubjectId === deleteSubjectId) setSelectedSubjectId(null);
    setDeleteSubjectId(null);
  };

  const handleAddVideo = async () => {
    console.log('[handleAddVideo] called', { addVideoTitle, addVideoUrl, selectedSubjectId });
    if (!addVideoTitle.trim() || !addVideoUrl.trim()) { toast.error('Title and URL are required.'); return; }
    if (!selectedSubjectId) { toast.error('No subject selected.'); return; }
    const maxSort = selectedVideos.length > 0 ? Math.max(...selectedVideos.map((v) => v.sort_order ?? 0)) : 0;
    const { error } = await supabase.from('training_videos').insert({
      subject_id: selectedSubjectId, title: addVideoTitle.trim(),
      video_url: addVideoUrl.trim(), description: addVideoDesc.trim() || null,
      sort_order: maxSort + 1,
    });
    console.log('[handleAddVideo] result', { error });
    if (error) { toast.error('Failed to save — please check your connection.'); return; }
    queryClient.invalidateQueries({ queryKey: ['training-videos'] });
    queryClient.invalidateQueries({ queryKey: ['training-subjects'] });
    setAddVideoTitle(''); setAddVideoUrl(''); setAddVideoDesc(''); setAddVideoOpen(false);
    toast.success('Video added successfully.');
  };

  const handleDeleteVideo = async () => {
    if (!deleteVideoId) return;
    await supabase.from('training_progress').delete().eq('video_id', deleteVideoId);
    await supabase.from('training_videos').delete().eq('id', deleteVideoId);
    queryClient.invalidateQueries({ queryKey: ['training-videos'] });
    queryClient.invalidateQueries({ queryKey: ['training-subjects'] });
    setDeleteVideoId(null);
  };

  const handleVideoFieldSave = async (videoId: string, field: string, value: string) => {
    const update: Record<string, string> = { [field]: value };
    const { error } = await supabase.from('training_videos').update(update).eq('id', videoId);
    if (error) toast.error('Failed to save — please check your connection.');
    else queryClient.invalidateQueries({ queryKey: ['training-videos'] });
  };

  return (
    <>
      <div className="flex flex-col md:flex-row gap-4">
        {/* Left Panel - Subjects */}
        <div
          className="rounded-2xl w-full md:w-[340px] flex-shrink-0 overflow-hidden"
          style={{ background: 'var(--torq-card)', border: '1px solid var(--torq-border)' }}
        >
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #F1F5F9' }}>
            <span className="font-mono-torq uppercase text-[11px]" style={{ color: '#64748B' }}>Training Subjects</span>
            <button className="text-sm font-semibold" style={{ color: '#6D28D9' }} onClick={() => setAddSubjectOpen(true)}>+ Add Subject</button>
          </div>
          {subjectsLoading ? (
            <div className="p-3 space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-[52px] rounded-xl" />)}</div>
          ) : !subjects?.length ? (
            <p className="text-center py-8 text-sm" style={{ color: '#64748B' }}>No subjects yet. Add your first subject.</p>
          ) : (
            <div>
              {subjects.map((subject) => {
                const isSelected = selectedSubjectId === subject.id;
                const videoCount = videos?.filter((v) => v.subject_id === subject.id).length ?? 0;
                return (
                  <div
                    key={subject.id}
                    className="flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors"
                    style={{
                      borderBottom: '1px solid #F1F5F9',
                      background: isSelected ? 'rgba(109,40,217,0.06)' : 'transparent',
                      borderLeft: isSelected ? '2px solid #6D28D9' : '2px solid transparent',
                    }}
                    onClick={() => setSelectedSubjectId(subject.id)}
                  >
                    <GripVertical size={14} style={{ color: '#CBD5E1', cursor: 'grab', flexShrink: 0 }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--torq-text)' }}>{subject.title}</p>
                      {subject.summary && (
                        <p className="text-xs truncate" style={{ color: '#94A3B8' }}>{subject.summary}</p>
                      )}
                    </div>
                    <span className="font-mono-torq text-[11px] px-1.5 py-0.5 flex-shrink-0" style={{ background: '#F1F5F9', borderRadius: 6 }}>{videoCount}</span>
                    <button className="p-1 rounded hover:bg-red-50 flex-shrink-0" onClick={(e) => { e.stopPropagation(); setDeleteSubjectId(subject.id); }} aria-label="Delete subject">
                      <X size={12} style={{ color: 'var(--torq-danger)' }} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Panel - Videos */}
        <div
          className="rounded-2xl flex-1 min-w-0 overflow-hidden"
          style={{ background: 'var(--torq-card)', border: '1px solid var(--torq-border)' }}
        >
          {!selectedSubject ? (
            <p className="text-center py-16 text-sm" style={{ color: '#64748B' }}>Select a subject to manage its videos.</p>
          ) : (
            <>
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #F1F5F9' }}>
                <h4 className="font-bold" style={{ fontSize: 16, color: 'var(--torq-text)' }}>{selectedSubject.title}</h4>
                <button className="text-sm font-semibold" style={{ color: '#6D28D9' }} onClick={() => setAddVideoOpen(true)}>+ Add Video</button>
              </div>
              {videosLoading ? (
                <div className="p-3 space-y-2">{[1, 2].map((i) => <Skeleton key={i} className="h-[80px] rounded-xl" />)}</div>
              ) : selectedVideos.length === 0 ? (
                <p className="text-center py-12 text-sm" style={{ color: '#64748B' }}>No videos added for this subject yet.</p>
              ) : (
                <div>
                  {selectedVideos.map((video) => (
                    <div key={video.id} className="flex items-start gap-2 px-4 py-3" style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <GripVertical size={14} className="mt-1 flex-shrink-0" style={{ color: '#CBD5E1', cursor: 'grab' }} />
                      <div className="flex-1 min-w-0 space-y-1">
                        <input
                          className="w-full text-sm font-semibold bg-transparent border-none outline-none"
                          style={{ color: 'var(--torq-text)' }}
                          defaultValue={video.title}
                          onBlur={(e) => handleVideoFieldSave(video.id, 'title', e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                        />
                        <input
                          className="w-full text-xs bg-transparent border-none outline-none"
                          style={{ color: '#64748B' }}
                          defaultValue={video.description ?? ''}
                          placeholder="Description"
                          onBlur={(e) => handleVideoFieldSave(video.id, 'description', e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                        />
                        <input
                          className="w-full font-mono-torq text-xs bg-transparent border-none outline-none"
                          style={{ color: '#6D28D9' }}
                          defaultValue={video.video_url}
                          placeholder="Video embed URL"
                          onBlur={(e) => handleVideoFieldSave(video.id, 'video_url', e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                        />
                      </div>
                      <button className="p-1 rounded hover:bg-red-50 flex-shrink-0 mt-1" onClick={() => setDeleteVideoId(video.id)} aria-label="Delete video">
                        <X size={12} style={{ color: 'var(--torq-danger)' }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add Subject Modal */}
      <Dialog open={addSubjectOpen} onOpenChange={setAddSubjectOpen}>
        <DialogContent><DialogHeader><DialogTitle>Add Subject</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Title (required)" value={addSubjectTitle} onChange={(e) => setAddSubjectTitle(e.target.value)} />
            <textarea className="w-full text-sm rounded-lg p-3 outline-none resize-none" style={{ border: '1px solid var(--torq-border)', minHeight: 80 }} placeholder="Summary" value={addSubjectSummary} onChange={(e) => setAddSubjectSummary(e.target.value)} />
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAddSubjectOpen(false)}>Cancel</Button><Button onClick={handleAddSubject} disabled={!addSubjectTitle.trim()}>Create Subject</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Subject */}
      <Dialog open={!!deleteSubjectId} onOpenChange={() => setDeleteSubjectId(null)}>
        <DialogContent><DialogHeader><DialogTitle>Delete Subject?</DialogTitle></DialogHeader>
          <p className="text-sm" style={{ color: 'var(--torq-muted)' }}>This will delete all videos and progress data.</p>
          <DialogFooter><Button variant="outline" onClick={() => setDeleteSubjectId(null)}>Cancel</Button><Button variant="destructive" onClick={handleDeleteSubject}>Delete</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Video Modal */}
      <Dialog open={addVideoOpen} onOpenChange={setAddVideoOpen}>
        <DialogContent><DialogHeader><DialogTitle>Add Video</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Title (required)" value={addVideoTitle} onChange={(e) => setAddVideoTitle(e.target.value)} />
            <div>
              <Input placeholder="Video URL (required)" value={addVideoUrl} onChange={(e) => setAddVideoUrl(e.target.value)} />
              <p className="text-xs mt-1" style={{ color: 'var(--torq-muted)' }}>Paste a Loom, YouTube, or Vimeo embed URL</p>
            </div>
            <Input placeholder="Description" value={addVideoDesc} onChange={(e) => setAddVideoDesc(e.target.value)} />
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAddVideoOpen(false)}>Cancel</Button><Button onClick={(e) => { e.stopPropagation(); handleAddVideo(); }} disabled={!addVideoTitle.trim() || !addVideoUrl.trim()}>Add Video</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Video */}
      <Dialog open={!!deleteVideoId} onOpenChange={() => setDeleteVideoId(null)}>
        <DialogContent><DialogHeader><DialogTitle>Delete Video?</DialogTitle></DialogHeader>
          <p className="text-sm" style={{ color: 'var(--torq-muted)' }}>This will delete progress data for this video.</p>
          <DialogFooter><Button variant="outline" onClick={() => setDeleteVideoId(null)}>Cancel</Button><Button variant="destructive" onClick={handleDeleteVideo}>Delete</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── User Role Manager ──
function UserRoleManager() {
  const queryClient = useQueryClient();
  const [addEmail, setAddEmail] = useState('');
  const [adding, setAdding] = useState(false);

  const { data: roles, isLoading } = useQuery({
    queryKey: ['user-roles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_roles').select('*');
      if (error) { toast.error('Unable to connect. Please try again.'); throw error; }
      return data;
    },
  });

  const handleRoleChange = async (id: string, role: string) => {
    const { error } = await supabase.from('user_roles').update({ role }).eq('id', id);
    if (error) toast.error('Failed to save — please check your connection.');
    else queryClient.invalidateQueries({ queryKey: ['user-roles'] });
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Remove this user role?')) return;
    await supabase.from('user_roles').delete().eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['user-roles'] });
  };

  const handleAddAdmin = async () => {
    if (!addEmail.trim()) return;
    setAdding(true);
    try {
      const { data, error } = await supabase.functions.invoke('lookup-user-by-email', {
        body: { email: addEmail.trim() },
      });
      if (error || data?.error) {
        toast.error(data?.error || 'No user found with that email address.');
        return;
      }
      const { error: insertError } = await supabase.from('user_roles').insert({
        user_id: data.user_id, role: 'admin',
      });
      if (insertError) {
        toast.error(insertError.message.includes('duplicate') ? 'User already has a role.' : 'Failed to add admin.');
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      setAddEmail('');
      toast.success('Admin added successfully');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--torq-card)', border: '1px solid var(--torq-border)' }}>
        {isLoading ? (
          <div className="p-4 space-y-2">{[1, 2].map((i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
        ) : !roles?.length ? (
          <p className="text-center py-12 text-sm" style={{ color: '#64748B' }}>No users with roles assigned yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  {['Email', 'Role', 'Actions'].map((h) => (
                    <th key={h} className="text-left font-mono-torq uppercase px-4 py-3" style={{ fontSize: 11, color: '#64748B', fontWeight: 400 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role.id} style={{ borderTop: '1px solid var(--torq-border)' }}>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--torq-text)' }}>{role.user_id}</td>
                    <td className="px-4 py-3">
                      <select
                        className="text-sm rounded-md px-2 py-1 outline-none"
                        style={{ border: '1px solid var(--torq-border)' }}
                        value={role.role}
                        onChange={(e) => handleRoleChange(role.id, e.target.value)}
                      >
                        <option value="admin">admin</option>
                        <option value="viewer">viewer</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button className="text-sm" style={{ color: 'var(--torq-danger)' }} onClick={() => handleRemove(role.id)}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Input placeholder="Email address" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} className="max-w-xs" />
        <Button onClick={handleAddAdmin} disabled={!addEmail.trim() || adding}>
          {adding ? 'Adding…' : 'Add Admin'}
        </Button>
      </div>
    </div>
  );
}

// ── Main Admin Page ──
export default function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const [tab, setTab] = useState<'training' | 'users'>('training');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-6 w-6 border-2 rounded-full" style={{ borderColor: 'var(--torq-accent)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (!user) return <AdminSignIn />;

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8FAFC' }}>
        <div className="rounded-2xl p-6 text-center max-w-md" style={{ background: '#fff', border: '1px solid #E6E8EF' }}>
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--torq-text)' }}>Access Denied</h3>
          <p className="text-sm mb-4" style={{ color: 'var(--torq-muted)' }}>You don't have admin privileges. Signed in as {user.email}.</p>
          <Button variant="outline" onClick={() => supabase.auth.signOut()}>
            <LogOut size={14} className="mr-2" /> Sign Out
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-6">
        {(['training', 'users'] as const).map((t) => (
          <button
            key={t}
            className="text-sm font-semibold pb-2 transition-colors"
            style={{
              color: tab === t ? '#6D28D9' : '#64748B',
              borderBottom: tab === t ? '2px solid #6D28D9' : '2px solid transparent',
            }}
            onClick={() => setTab(t)}
          >
            {t === 'training' ? 'Training' : 'Users'}
          </button>
        ))}
      </div>

      {tab === 'training' ? <TrainingManager /> : <UserRoleManager />}
    </div>
  );
}
