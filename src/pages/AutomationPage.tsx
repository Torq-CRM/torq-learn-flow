import { useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Lock, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAutomationData } from '@/hooks/useAutomationData';
import { useLocationId } from '@/contexts/LocationContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// ── Card type config ──
const CARD_TYPES: Record<string, { label: string; text: string; bg: string; border: string; emoji: string }> = {
  trigger: { label: 'TRIGGER', text: '#DC2626', bg: '#FEE2E2', border: '#FECACA', emoji: '⚡' },
  wait: { label: 'WAIT', text: '#D97706', bg: '#FEF3C7', border: '#FDE68A', emoji: '⏳' },
  action: { label: 'ACTION', text: '#0891B2', bg: '#CFFAFE', border: '#A5F3FC', emoji: '❗' },
  move: { label: 'MOVE', text: '#16A34A', bg: '#DCFCE7', border: '#BBF7D0', emoji: '➡️' },
  sms: { label: 'SMS', text: '#16A34A', bg: '#F0FDF4', border: '#D1FAE5', emoji: '💬' },
  email: { label: 'EMAIL', text: '#16A34A', bg: '#F0FDF4', border: '#D1FAE5', emoji: '✉️' },
  ifelse: { label: 'IF/ELSE', text: '#7C3AED', bg: '#EDE9FE', border: '#DDD6FE', emoji: '❓' },
  notes: { label: 'NOTES', text: '#CA8A04', bg: '#FEFCE8', border: '#FEF08A', emoji: '📝' },
};

function chipStyle(cardType: string) {
  const ct = CARD_TYPES[cardType] || CARD_TYPES.notes;
  return {
    background: ct.bg,
    border: `2px solid ${ct.border}`,
    color: ct.text,
    borderRadius: 8,
    padding: '6px 10px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'grab',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    userSelect: 'none' as const,
  };
}

// ── Palette Chip (draggable) ──
function PaletteChip({ cardType }: { cardType: string }) {
  const ct = CARD_TYPES[cardType];
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${cardType}`,
    data: { type: 'palette', cardType },
  });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ ...chipStyle(cardType), opacity: isDragging ? 0.5 : 1 }}
    >
      {ct.emoji} {ct.label}
    </div>
  );
}

// ── Sortable Card ──
function SortableCard({
  card,
  editable,
  onOpen,
}: {
  card: { id: string; card_type: string; label: string | null; notes: string | null; sort_order: number | null };
  editable: boolean;
  onOpen: (id: string) => void;
}) {
  const queryClient = useQueryClient();
  const { locationId } = useLocationId();
  const [hovered, setHovered] = useState(false);
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: 'card', card },
    disabled: !editable,
  });

  const ct = CARD_TYPES[card.card_type] || CARD_TYPES.notes;
  const hasNotes = !!(card.notes && card.notes.trim());

  const style = {
    ...chipStyle(card.card_type),
    display: 'flex' as const,
    cursor: editable ? 'grab' : 'pointer',
    marginBottom: 8,
    position: 'relative' as const,
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    ...(hovered && !isDragging ? { transform: `${CSS.Transform.toString(transform) || ''} translateX(2px)`.trim() } : {}),
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from('automation_cards').delete().eq('id', card.id);
    queryClient.invalidateQueries({ queryKey: ['automation-boards', locationId] });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(editable ? { ...attributes, ...listeners } : {})}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseDown={(e) => {
        mouseDownPos.current = { x: e.clientX, y: e.clientY };
      }}
      onMouseUp={(e) => {
        if (mouseDownPos.current) {
          const dx = Math.abs(e.clientX - mouseDownPos.current.x);
          const dy = Math.abs(e.clientY - mouseDownPos.current.y);
          if (dx < 5 && dy < 5) {
            onOpen(card.id);
          }
        }
        mouseDownPos.current = null;
      }}
    >
      {hasNotes && (
        <div
          style={{
            position: 'absolute',
            top: -3,
            right: -3,
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#6D28D9',
          }}
        />
      )}
      {ct.emoji} {card.label || ct.label}
      {editable && hovered && (
        <button
          className="ml-auto p-0.5 rounded hover:bg-white/50"
          onClick={handleDelete}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}

// ── Droppable Column ──
function KanbanColumn({
  column,
  editable,
  onOpenCard,
  boardId,
}: {
  column: {
    id: string;
    title: string;
    automation_cards: { id: string; card_type: string; label: string | null; notes: string | null; sort_order: number | null }[];
  };
  editable: boolean;
  onOpenCard: (id: string) => void;
  boardId: string;
}) {
  const queryClient = useQueryClient();
  const { locationId } = useLocationId();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(column.title);

  const { setNodeRef, isOver } = useDroppable({ id: column.id, data: { type: 'column', columnId: column.id } });

  const handleSaveTitle = async () => {
    setEditingTitle(false);
    if (titleValue.trim() && titleValue !== column.title) {
      await supabase.from('automation_columns').update({ title: titleValue.trim() }).eq('id', column.id);
      queryClient.invalidateQueries({ queryKey: ['automation-boards', locationId] });
    }
  };

  const handleDeleteColumn = async () => {
    if (!confirm('Delete this column and all its cards?')) return;
    await supabase.from('automation_cards').delete().eq('column_id', column.id);
    await supabase.from('automation_columns').delete().eq('id', column.id);
    queryClient.invalidateQueries({ queryKey: ['automation-boards', locationId] });
  };

  const cards = column.automation_cards;

  return (
    <div
      className="flex-shrink-0 rounded-2xl flex flex-col"
      style={{
        width: 280,
        background: 'var(--torq-card)',
        border: '1px solid var(--torq-border)',
        maxHeight: '70vh',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid #F1F5F9' }}
      >
        {editingTitle && editable ? (
          <input
            className="text-sm font-semibold bg-transparent border-b border-gray-300 outline-none flex-1 mr-2"
            value={titleValue}
            autoFocus
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveTitle();
              if (e.key === 'Escape') { setEditingTitle(false); setTitleValue(column.title); }
            }}
          />
        ) : (
          <h4
            className="text-sm font-semibold"
            style={{ color: 'var(--torq-text)', cursor: editable ? 'pointer' : 'default' }}
            onClick={() => editable && setEditingTitle(true)}
          >
            {column.title}
          </h4>
        )}
        <div className="flex items-center gap-2">
          <span
            className="font-mono-torq px-1.5 py-0.5"
            style={{ fontSize: 11, background: '#F1F5F9', borderRadius: 6, color: 'var(--torq-muted)' }}
          >
            {cards.length}
          </span>
          {editable && (
            <button className="p-0.5 rounded hover:bg-red-50" onClick={handleDeleteColumn}>
              <X size={12} style={{ color: 'var(--torq-danger)' }} />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div
        ref={setNodeRef}
        className="flex-1 overflow-y-auto p-3"
        style={{
          background: isOver ? 'rgba(109,40,217,0.05)' : 'transparent',
          transition: 'background 0.15s',
          minHeight: 60,
        }}
      >
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <SortableCard key={card.id} card={card} editable={editable} onOpen={onOpenCard} />
          ))}
        </SortableContext>
        {cards.length === 0 && (
          <div
            className="text-center text-[13px] py-6 rounded-lg"
            style={{
              color: '#94A3B8',
              border: '1px dashed #E6E8EF',
            }}
          >
            Drop items here
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──
export default function AutomationPage() {
  const queryClient = useQueryClient();
  const { locationId } = useLocationId();
  const { isAdmin } = useAuth();
  const { boards, loading } = useAutomationData(locationId);

  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<DragStartEvent['active'] | null>(null);
  const [cardModalId, setCardModalId] = useState<string | null>(null);
  const [modalNotes, setModalNotes] = useState('');
  const [modalLabel, setModalLabel] = useState('');
  const [deleteBoard, setDeleteBoard] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Determine active board
  const standardBoard = boards.find((b) => b.is_standard);
  const activeBoard = boards.find((b) => b.id === activeBoardId) || standardBoard || boards[0];
  const isEditable = activeBoard
    ? activeBoard.is_standard ? isAdmin : true
    : false;

  // Find card for modal
  const allCards = boards.flatMap((b) => b.automation_columns?.flatMap((c) => c.automation_cards) ?? []);
  const modalCard = cardModalId ? allCards.find((c) => c.id === cardModalId) : null;

  // Set initial active board
  if (!activeBoardId && boards.length > 0) {
    const std = boards.find((b) => b.is_standard);
    if (std) setActiveBoardId(std.id);
    else setActiveBoardId(boards[0].id);
  }

  const handleNewBoard = async () => {
    const name = window.prompt('Board name:');
    if (!name?.trim()) return;
    const { data } = await supabase
      .from('automation_boards')
      .insert({ location_id: locationId, name: name.trim(), is_standard: false, sort_order: boards.length })
      .select()
      .single();
    queryClient.invalidateQueries({ queryKey: ['automation-boards', locationId] });
    if (data) setActiveBoardId(data.id);
  };

  const handleDeleteBoard = async () => {
    if (!deleteBoard) return;
    const board = boards.find((b) => b.id === deleteBoard);
    if (board) {
      const colIds = board.automation_columns?.map((c) => c.id) ?? [];
      if (colIds.length > 0) {
        await supabase.from('automation_cards').delete().in('column_id', colIds);
        await supabase.from('automation_columns').delete().in('id', colIds);
      }
      await supabase.from('automation_boards').delete().eq('id', deleteBoard);
    }
    queryClient.invalidateQueries({ queryKey: ['automation-boards', locationId] });
    setActiveBoardId(standardBoard?.id ?? null);
    setDeleteBoard(null);
  };

  const handleAddColumn = async () => {
    if (!activeBoard) return;
    const cols = activeBoard.automation_columns ?? [];
    const maxSort = cols.length > 0 ? Math.max(...cols.map((c) => c.sort_order ?? 0)) : -1;
    await supabase.from('automation_columns').insert({
      board_id: activeBoard.id,
      title: 'New Column',
      sort_order: maxSort + 1,
    });
    queryClient.invalidateQueries({ queryKey: ['automation-boards', locationId] });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setDragActive(event.active);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setDragActive(null);
    const { active, over } = event;
    if (!over || !activeBoard) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // Palette → Column
    if (activeData?.type === 'palette' && overData?.type === 'column') {
      const columnId = overData.columnId as string;
      const col = activeBoard.automation_columns?.find((c) => c.id === columnId);
      const cardCount = col?.automation_cards?.length ?? 0;
      await supabase.from('automation_cards').insert({
        column_id: columnId,
        card_type: activeData.cardType,
        label: '',
        notes: null,
        sort_order: cardCount,
      });
      queryClient.invalidateQueries({ queryKey: ['automation-boards', locationId] });
      return;
    }

    // Card drag
    if (activeData?.type === 'card') {
      const cardId = active.id as string;
      const card = activeData.card;

      // Find target column
      let targetColumnId: string | null = null;
      if (overData?.type === 'column') {
        targetColumnId = overData.columnId as string;
      } else if (overData?.type === 'card') {
        // Dropped on another card — find its column
        for (const col of activeBoard.automation_columns ?? []) {
          if (col.automation_cards?.some((c) => c.id === over.id)) {
            targetColumnId = col.id;
            break;
          }
        }
      } else {
        // Dropped on column droppable area
        targetColumnId = over.id as string;
      }

      if (!targetColumnId) return;

      const sourceColumn = activeBoard.automation_columns?.find((c) =>
        c.automation_cards?.some((cc) => cc.id === cardId)
      );
      const targetColumn = activeBoard.automation_columns?.find((c) => c.id === targetColumnId);

      if (!sourceColumn || !targetColumn) return;

      if (sourceColumn.id === targetColumn.id) {
        // Reorder within same column
        const oldIndex = sourceColumn.automation_cards.findIndex((c) => c.id === cardId);
        const overCardIndex = sourceColumn.automation_cards.findIndex((c) => c.id === over.id);
        if (oldIndex === -1 || overCardIndex === -1 || oldIndex === overCardIndex) return;

        const newOrder = arrayMove(sourceColumn.automation_cards, oldIndex, overCardIndex);
        for (let i = 0; i < newOrder.length; i++) {
          await supabase.from('automation_cards').update({ sort_order: i }).eq('id', newOrder[i].id);
        }
      } else {
        // Move to different column
        const targetCards = targetColumn.automation_cards ?? [];
        await supabase.from('automation_cards').update({
          column_id: targetColumnId,
          sort_order: targetCards.length,
        }).eq('id', cardId);
      }
      queryClient.invalidateQueries({ queryKey: ['automation-boards', locationId] });
    }
  };

  const openCardModal = useCallback((cardId: string) => {
    const card = allCards.find((c) => c.id === cardId);
    if (card) {
      setCardModalId(cardId);
      setModalNotes(card.notes ?? '');
      setModalLabel(card.label ?? '');
    }
  }, [allCards]);

  const handleSaveNotes = async () => {
    if (!cardModalId) return;
    await supabase.from('automation_cards').update({ notes: modalNotes, label: modalLabel }).eq('id', cardModalId);
    queryClient.invalidateQueries({ queryKey: ['automation-boards', locationId] });
    setCardModalId(null);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full rounded-2xl" />
        <div className="flex gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[300px] w-[280px] rounded-2xl flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  const columns = activeBoard?.automation_columns ?? [];

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="space-y-4">
        {/* Board Tabs */}
        <div
          className="rounded-2xl p-2 flex items-center gap-1 flex-wrap"
          style={{ background: 'var(--torq-card)', border: '1px solid var(--torq-border)' }}
        >
          {boards.map((board) => {
            const active = activeBoard?.id === board.id;
            return (
              <div key={board.id} className="relative flex items-center">
                <button
                  className="text-sm transition-colors"
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    fontWeight: 600,
                    background: active ? '#6D28D9' : 'transparent',
                    color: active ? '#fff' : '#64748B',
                    transition: '0.15s',
                  }}
                  onClick={() => setActiveBoardId(board.id)}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.background = '#F1F5F9';
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {board.is_standard ? '📌 Standard' : board.name}
                  {board.is_standard && !isAdmin && (
                    <Lock size={12} className="inline ml-1 opacity-60" />
                  )}
                </button>
                {!board.is_standard && (
                  <button
                    className="absolute -top-1 -right-1 p-0.5 rounded-full bg-white shadow"
                    style={{ border: '1px solid var(--torq-border)' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteBoard(board.id);
                    }}
                  >
                    <X size={10} style={{ color: 'var(--torq-danger)' }} />
                  </button>
                )}
              </div>
            );
          })}
          <button
            className="text-sm font-semibold px-3 py-1.5"
            style={{ color: '#6D28D9' }}
            onClick={handleNewBoard}
          >
            + New Board
          </button>
        </div>

        {/* Drag Palette */}
        {isEditable && (
          <div
            className="rounded-2xl p-4 flex items-center gap-2 flex-wrap"
            style={{ background: 'var(--torq-card)', border: '1px solid var(--torq-border)' }}
          >
            <span className="font-mono-torq uppercase text-[11px] mr-2" style={{ color: '#64748B' }}>
              DRAG:
            </span>
            {Object.keys(CARD_TYPES).map((type) => (
              <PaletteChip key={type} cardType={type} />
            ))}
          </div>
        )}

        {/* Kanban Board */}
        {columns.length === 0 ? (
          <p className="text-center py-12 text-sm" style={{ color: '#64748B' }}>
            {isEditable ? 'Add a column to start building your flow.' : 'No columns in this board.'}
          </p>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 items-start">
            {columns.map((col) => (
              <KanbanColumn
                key={col.id}
                column={col}
                editable={isEditable}
                onOpenCard={openCardModal}
                boardId={activeBoard!.id}
              />
            ))}
            {isEditable && (
              <button
                className="flex-shrink-0 text-sm font-semibold px-4 py-2 rounded-2xl"
                style={{ color: '#6D28D9', border: '1px dashed var(--torq-border)', minWidth: 140 }}
                onClick={handleAddColumn}
              >
                + Add Column
              </button>
            )}
          </div>
        )}
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {dragActive?.data?.current?.type === 'palette' && (
          <div style={chipStyle(dragActive.data.current.cardType)}>
            {CARD_TYPES[dragActive.data.current.cardType]?.emoji} {CARD_TYPES[dragActive.data.current.cardType]?.label}
          </div>
        )}
        {dragActive?.data?.current?.type === 'card' && (
          <div style={chipStyle(dragActive.data.current.card.card_type)}>
            {CARD_TYPES[dragActive.data.current.card.card_type]?.emoji}{' '}
            {dragActive.data.current.card.label || CARD_TYPES[dragActive.data.current.card.card_type]?.label}
          </div>
        )}
      </DragOverlay>

      {/* Card Detail Modal */}
      <Dialog open={!!modalCard} onOpenChange={() => setCardModalId(null)}>
        <DialogContent style={{ maxWidth: 480 }}>
          {modalCard && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span style={chipStyle(modalCard.card_type)}>
                    {CARD_TYPES[modalCard.card_type]?.emoji} {CARD_TYPES[modalCard.card_type]?.label}
                  </span>
                  {modalCard.label && (
                    <span className="text-sm font-medium" style={{ color: 'var(--torq-text)' }}>
                      {modalCard.label}
                    </span>
                  )}
                </DialogTitle>
              </DialogHeader>

              {isEditable && (
                <Input
                  placeholder="Card label (optional)"
                  value={modalLabel}
                  onChange={(e) => setModalLabel(e.target.value)}
                  className="text-sm"
                />
              )}

              <textarea
                className="w-full text-sm outline-none resize-none"
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E6E8EF',
                  borderRadius: 8,
                  minHeight: 140,
                  padding: 12,
                  fontFamily: 'Inter, sans-serif',
                }}
                placeholder="Add notes about this automation step..."
                value={modalNotes}
                onChange={(e) => setModalNotes(e.target.value)}
                disabled={!isEditable}
                onFocus={(e) => {
                  e.currentTarget.style.border = '2px solid #6D28D9';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.border = '1px solid #E6E8EF';
                }}
              />

              <DialogFooter className="flex items-center justify-between">
                <span className="font-mono-torq text-[11px]" style={{ color: '#94A3B8' }}>
                  {isEditable ? '' : 'View Only'}
                </span>
                {isEditable && (
                  <Button onClick={handleSaveNotes}>Save Notes</Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Board Confirmation */}
      <Dialog open={!!deleteBoard} onOpenChange={() => setDeleteBoard(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Board?</DialogTitle>
          </DialogHeader>
          <p className="text-sm" style={{ color: 'var(--torq-muted)' }}>
            This will delete the board, all its columns, and all cards.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteBoard(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteBoard}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DndContext>
  );
}
