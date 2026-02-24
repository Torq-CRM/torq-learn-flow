import { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface OnboardingStep {
  id: string;
  title: string;
  icon: string | null;
  description: string | null;
  sort_order: number;
}

interface OnboardingProgress {
  step_id: string | null;
  completed: boolean | null;
}

interface Props {
  steps: OnboardingStep[];
  progress: OnboardingProgress[];
  locationId: string;
}

const CALENDAR_URLS: Record<number, string> = {
  1: 'https://link.torqcrm.com/widget/booking/ZlvHZ1OLA0CRSxA3AzH5',
  2: 'https://link.torqcrm.com/widget/booking/0hIHpP5yleFth8RsiQRU',
};

const CHECKBOX_LABELS: Record<number, string> = {
  1: 'I have booked my Tech Call Sign Up.',
  2: 'I have scheduled my Onboard Tech Call.',
  3: 'I have completed this step.',
  4: 'I have completed this step.',
  5: 'My onboarding rep has completed the Opt-In Workflow.',
  6: 'I have completed this step.',
};

export default function OnboardingFlow({ steps, progress, locationId }: Props) {
  const queryClient = useQueryClient();
  // Track locally completed step IDs (combined from DB + local)
  const [localCompletedIds, setLocalCompletedIds] = useState<Set<string>>(() => new Set(
    progress.filter((p) => p.completed).map((p) => p.step_id).filter(Boolean) as string[]
  ));

  const completedStepIds = localCompletedIds;

  // Find first incomplete step
  const firstIncompleteIndex = steps.findIndex((s) => !completedStepIds.has(s.id));
  const [currentIndex, setCurrentIndex] = useState(
    firstIncompleteIndex === -1 ? steps.length : Math.max(0, firstIncompleteIndex)
  );
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  const currentStep = steps[currentIndex];
  const stepNumber = currentIndex + 1;
  const isLastStep = currentIndex === steps.length - 1;
  const isAlreadyCompleted = currentStep ? completedStepIds.has(currentStep.id) : false;

  // Reset checkbox when step changes
  useEffect(() => {
    setChecked(isAlreadyCompleted);
    setAnimKey((k) => k + 1);
  }, [currentIndex, isAlreadyCompleted]);

  // ESC closes calendar
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowCalendar(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleCheck = useCallback(async () => {
    if (!currentStep || checked) return;
    setSaving(true);
    const { error } = await supabase
      .from('onboarding_progress')
      .upsert(
        {
          location_id: locationId,
          step_id: currentStep.id,
          completed: true,
          completed_at: new Date().toISOString(),
        },
        { onConflict: 'location_id,step_id' }
      );
    if (error) {
      toast.error('Failed to save progress');
      setSaving(false);
      return;
    }
    // Don't invalidate queries here — just update local state
    // This prevents AppGate from re-rendering and resetting our component
    setLocalCompletedIds((prev) => {
      const next = new Set(prev);
      next.add(currentStep.id);
      return next;
    });
    setChecked(true);
    setSaving(false);
  }, [currentStep, checked, locationId]);

  const handleContinue = () => {
    if (isLastStep) {
      setShowCompletion(true);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  const handleEnterHub = async () => {
    await queryClient.invalidateQueries({ queryKey: ['onboarding-progress', locationId] });
  };

  // Completion screen
  if (showCompletion) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: `
            radial-gradient(circle at 80% 10%, rgba(109,40,217,0.08) 0%, transparent 60%),
            radial-gradient(circle at 10% 90%, rgba(94,34,198,0.05) 0%, transparent 50%),
            #FFFFFF
          `,
        }}
      >
        <div className="text-center">
          <div
            className="mx-auto mb-6 flex items-center justify-center rounded-full animate-scale-pop"
            style={{ width: 72, height: 72, background: 'var(--torq-accent)' }}
          >
            <Check size={36} className="text-white" />
          </div>
          <h2 className="text-2xl font-extrabold mb-2" style={{ color: 'var(--torq-text)' }}>
            Onboarding Complete!
          </h2>
          <p className="text-sm mb-8" style={{ color: 'var(--torq-muted)' }}>
            You're all set. Welcome to TorqTraining.
          </p>
          <button
            onClick={handleEnterHub}
            className="px-6 py-3 rounded-lg text-sm font-semibold text-white transition-colors"
            style={{ background: 'var(--torq-accent)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--torq-accent-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--torq-accent)')}
          >
            Enter Training Hub →
          </button>
        </div>
      </div>
    );
  }

  if (!currentStep) return null;

  const calendarUrl = CALENDAR_URLS[stepNumber];

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: `
          radial-gradient(circle at 80% 10%, rgba(109,40,217,0.08) 0%, transparent 60%),
          radial-gradient(circle at 10% 90%, rgba(94,34,198,0.05) 0%, transparent 50%),
          #FFFFFF
        `,
      }}
    >
      <div
        className="w-[90%] max-w-[560px] md:p-10 p-6"
        style={{
          background: 'var(--torq-card)',
          border: '1px solid var(--torq-border)',
          borderRadius: 20,
          boxShadow: '0 8px 40px rgba(0,0,0,0.10)',
        }}
      >
        {/* Branding */}
        <div className="text-center mb-6">
          <h1 className="text-[22px] font-extrabold">
            <span style={{ color: 'var(--torq-accent)' }}>Torq</span>
            <span style={{ color: 'var(--torq-text)' }}>Training</span>
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: 'var(--torq-muted)' }}>
            Setup &amp; Onboarding
          </p>
        </div>

        {/* Progress Segments */}
        <div className="flex gap-1 mb-4">
          {steps.map((step, i) => {
            const isCompleted = completedStepIds.has(step.id) || i < currentIndex;
            const isCurrent = i === currentIndex;
            return (
              <div
                key={step.id}
                className="flex-1 rounded-full"
                style={{
                  height: 5,
                  background: isCompleted || isCurrent ? 'var(--torq-accent)' : '#E6E8EF',
                  boxShadow: isCurrent ? '0 0 6px rgba(109,40,217,0.5)' : 'none',
                }}
              />
            );
          })}
        </div>

        {/* Step Counter */}
        <p
          className="text-center font-mono mb-6"
          style={{
            fontSize: 11,
            letterSpacing: 3,
            color: 'var(--torq-muted)',
            textTransform: 'uppercase' as const,
          }}
        >
          STEP {stepNumber} OF {steps.length}
        </p>

        {/* Step Content — animated */}
        <div key={animKey} className="animate-fade-in-up">
          {/* Emoji */}
          <div className="text-center text-[40px] mb-3">{currentStep.icon}</div>

          {/* Title */}
          <h2 className="text-center text-[22px] font-extrabold mb-2" style={{ color: 'var(--torq-text)' }}>
            {currentStep.title}
          </h2>

          {/* Description */}
          <p className="text-center text-sm mb-6" style={{ color: 'var(--torq-muted)' }}>
            {currentStep.description}
          </p>

          {/* Step 5 info notice */}
          {stepNumber === 5 && (
            <div
              className="mb-4 p-3"
              style={{
                background: 'rgba(109,40,217,0.08)',
                borderLeft: '3px solid var(--torq-accent)',
                borderRadius: 10,
              }}
            >
              <p className="text-[13px]" style={{ color: 'var(--torq-accent)' }}>
                Your onboarding rep will complete this step for you. Please confirm once they have let you know it's done.
              </p>
            </div>
          )}

          {/* Calendar button */}
          {calendarUrl && (
            <button
              onClick={() => setShowCalendar(true)}
              className="w-full mb-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
              style={{
                background: 'var(--torq-accent-light)',
                color: 'var(--torq-accent)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#E0D4FF')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--torq-accent-light)')}
            >
              📅 Book Now →
            </button>
          )}

          {/* Checkbox */}
          <div
            className="flex items-start gap-3 cursor-pointer select-none mb-6"
            onClick={!checked && !saving ? handleCheck : undefined}
          >
            <div
              className="mt-0.5 flex-shrink-0 flex items-center justify-center rounded transition-colors"
              style={{
                width: 20,
                height: 20,
                border: checked ? 'none' : '2px solid var(--torq-border)',
                background: checked ? 'var(--torq-accent)' : 'transparent',
              }}
            >
              {checked && <Check size={14} className="text-white" />}
            </div>
            <span
              className="text-sm"
              style={{ color: 'var(--torq-text-secondary)' }}
            >
              {CHECKBOX_LABELS[stepNumber] || 'I have completed this step.'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3">
          {currentIndex > 0 ? (
            <button
              onClick={handleBack}
              className="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{ color: 'var(--torq-muted)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--torq-text)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--torq-muted)')}
            >
              ← Back
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={handleContinue}
            disabled={!checked}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: checked ? 'var(--torq-accent)' : 'var(--torq-accent)' }}
            onMouseEnter={(e) => { if (checked) e.currentTarget.style.background = 'var(--torq-accent-hover)'; }}
            onMouseLeave={(e) => { if (checked) e.currentTarget.style.background = 'var(--torq-accent)'; }}
          >
            {isLastStep ? 'Complete Setup' : 'Continue →'}
          </button>
        </div>
      </div>

      {/* Calendar Modal */}
      {showCalendar && calendarUrl && (
        <div
          className="fixed inset-0 flex items-center justify-center animate-fade-in"
          style={{ zIndex: 2000, background: 'rgba(0,0,0,0.65)' }}
          onClick={() => setShowCalendar(false)}
        >
          <div
            className="w-[92%] max-w-[720px] md:rounded-[20px] md:max-h-[90vh] max-md:w-full max-md:h-full max-md:rounded-none overflow-hidden flex flex-col"
            style={{ background: 'var(--torq-card)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid var(--torq-border)' }}
            >
              <h3 className="text-base font-bold" style={{ color: 'var(--torq-text)' }}>
                {currentStep.title}
              </h3>
              <button
                onClick={() => setShowCalendar(false)}
                className="p-1 rounded transition-colors"
                style={{ color: 'var(--torq-muted)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--torq-text)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--torq-muted)')}
              >
                <X size={20} />
              </button>
            </div>
            {/* Modal body */}
            <div className="p-6 flex-1" style={{ minHeight: 500 }}>
              <iframe
                src={calendarUrl}
                style={{ width: '100%', height: '100%', minHeight: 480, border: 'none', overflow: 'hidden' }}
                scrolling="no"
                title="Booking Calendar"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
