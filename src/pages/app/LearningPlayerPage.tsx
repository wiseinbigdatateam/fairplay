import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDeps } from '@/app/providers/AppProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import type { LessonBlock, ScenarioCase, Quiz } from '@/domain';
import { ROLE_HOME_PATHS } from '@/domain';
import {
  calculateQuizScore,
  validateCommitmentText,
} from '@/application/services/learningRules';
import { ErrorState, LoadingState } from '@/components/ui/PageStates';
import { getDemoQuizzes, getDemoScenarios } from '@/infrastructure/demo/demoState';
import { generateId } from '@/infrastructure/demo/demoState';

export function LearningPlayerPage() {
  const { courseId = '' } = useParams();
  const { user, session } = useAuth();
  const deps = useDeps();
  const navigate = useNavigate();
  const homePath = session ? ROLE_HOME_PATHS[session.role] : '/app';
  const certificatesPath = `${homePath}/certificates`;
  const coursesPath = `${homePath}/courses`;
  const [lesson, setLesson] = useState<Awaited<ReturnType<typeof deps.courseRepository.getLesson>>>(null);
  const [courseTitle, setCourseTitle] = useState('');
  const [step, setStep] = useState(0);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [commitment, setCommitment] = useState('');
  const [commitmentWarnings, setCommitmentWarnings] = useState<string[]>([]);
  const [quizResponses, setQuizResponses] = useState<Record<string, string>>({});
  const [scenarioChoice, setScenarioChoice] = useState<string | null>(null);
  const [scenarioFinal, setScenarioFinal] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !courseId) return;
    (async () => {
      setLoading(true);
      setStep(0);
      const course = await deps.courseRepository.getCourse(courseId);
      setCourseTitle(course?.title ?? '');
      const lessonId = course?.modules[0]?.lessonIds[0];
      const l = lessonId ? await deps.courseRepository.getLesson(lessonId) : null;
      setLesson(l);
      if (l) {
        const progress = await deps.learningRepository.getLessonProgress(user.id, l.id);
        if (progress?.lastCompletedBlockId && l.blocks.length) {
          const idx = l.blocks.findIndex((b) => b.id === progress.lastCompletedBlockId);
          if (idx >= 0) setStep(idx);
        }
      }
      setLoading(false);
    })();
  }, [courseId, user, deps]);

  const blocks = lesson?.blocks ?? [];
  const current = blocks[step];

  const saveProgress = async (blockId: string, completed = false) => {
    if (!user || !lesson) return;
    setSaveState('saving');
    try {
      const now = new Date().toISOString();
      await deps.learningRepository.saveLessonProgress({
        id: `lp-${user.id}-${lesson.id}`,
        userId: user.id,
        lessonId: lesson.id,
        courseId: lesson.courseId,
        startedAt: now,
        lastAccessedAt: now,
        lastCompletedBlockId: blockId,
        progressPercent: Math.round(((step + 1) / blocks.length) * 100),
        completedAt: completed ? now : undefined,
      });
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  };

  const goNext = async () => {
    if (!current || !user || !lesson) return;
    const completed = step === blocks.length - 1;
    await saveProgress(current.id, completed);
    if (completed) {
      try {
        const progress = await deps.learningRepository.getCourseProgress(user.id, lesson.courseId);
        if (progress && progress.progressPercent >= 100) {
          await deps.certificateRepository.createDemoCertificatePreview({
            userId: user.id,
            courseId: lesson.courseId,
          });
          navigate(certificatesPath);
          return;
        }
      } catch {
        // 수료 조건 미충족 시 과정 목록으로
      }
      navigate(coursesPath);
      return;
    }
    setStep((s) => s + 1);
  };

  const goPrev = () => setStep((s) => Math.max(0, s - 1));

  const progressPercent = blocks.length ? Math.round(((step + 1) / blocks.length) * 100) : 0;
  const remainingMinutes = lesson ? Math.max(1, Math.round(lesson.estimatedMinutes * (1 - progressPercent / 100))) : 0;

  if (loading) return <LoadingState label="학습 콘텐츠를 불러오는 중…" />;
  if (!lesson || !current) return <ErrorState title="차시를 찾을 수 없습니다" description="목록에서 다시 선택해 주세요." />;

  return (
    <div className="learning-player">
      <header className="learning-header">
        <div>
          <p className="learning-course">{courseTitle}</p>
          <h1>{lesson.title}</h1>
        </div>
        <div className="learning-meta">
          <span>
            {step + 1} / {blocks.length}
          </span>
          <span>{progressPercent}%</span>
          <span>약 {remainingMinutes}분 남음</span>
          <span className={`save-badge save-${saveState}`} aria-live="polite">
            {saveState === 'saving' && '저장 중…'}
            {saveState === 'saved' && '저장됨'}
            {saveState === 'error' && '저장 실패'}
            {saveState === 'idle' && '자동 저장'}
          </span>
        </div>
        <div className="progress-bar" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
          <div style={{ width: `${progressPercent}%` }} />
        </div>
      </header>

      <div className="learning-content">
        <BlockRenderer
          block={current}
          commitment={commitment}
          commitmentWarnings={commitmentWarnings}
          onCommitmentChange={(text) => {
            setCommitment(text);
            setCommitmentWarnings(validateCommitmentText(text).warnings);
          }}
          quizResponses={quizResponses}
          onQuizChange={setQuizResponses}
          scenarioChoice={scenarioChoice}
          scenarioFinal={scenarioFinal}
          onScenarioSelect={async (choiceId, isReselect) => {
            if (!user || !lesson) return;
            if (!isReselect && !scenarioChoice) setScenarioChoice(choiceId);
            setScenarioFinal(choiceId);
            await deps.learningRepository.saveScenarioAttempt({
              id: generateId('sa'),
              userId: user.id,
              scenarioId: current.type === 'scenario' ? current.scenarioId : '',
              lessonId: lesson.id,
              firstChoiceId: scenarioChoice ?? choiceId,
              finalChoiceId: choiceId,
              reselected: isReselect,
              attemptedAt: new Date().toISOString(),
            });
          }}
          onScenarioReset={() => setScenarioFinal(null)}
          showTranscript={showTranscript}
          onToggleTranscript={() => setShowTranscript((v) => !v)}
          onSaveCommitment={async () => {
            if (!user || !lesson) return;
            await deps.learningRepository.saveCommitment({
              id: generateId('commit'),
              userId: user.id,
              lessonId: lesson.id,
              courseId: lesson.courseId,
              text: commitment,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            setSaveState('saved');
          }}
        />
      </div>

      <footer className="learning-footer">
        <button type="button" className="btn btn-ghost" onClick={goPrev} disabled={step === 0}>
          이전
        </button>
        <Link to={coursesPath} className="btn btn-ghost">
          학습 종료
        </Link>
        <button type="button" className="btn btn-primary" onClick={goNext}>
          {step === blocks.length - 1 ? '완료' : '다음'}
        </button>
      </footer>
    </div>
  );
}

function BlockRenderer({
  block,
  commitment,
  commitmentWarnings,
  onCommitmentChange,
  quizResponses,
  onQuizChange,
  scenarioChoice,
  scenarioFinal,
  onScenarioSelect,
  onScenarioReset,
  showTranscript,
  onToggleTranscript,
  onSaveCommitment,
}: {
  block: LessonBlock;
  commitment: string;
  commitmentWarnings: string[];
  onCommitmentChange: (v: string) => void;
  quizResponses: Record<string, string>;
  onQuizChange: (v: Record<string, string>) => void;
  scenarioChoice: string | null;
  scenarioFinal: string | null;
  onScenarioSelect: (choiceId: string, isReselect: boolean) => void;
  onScenarioReset: () => void;
  showTranscript: boolean;
  onToggleTranscript: () => void;
  onSaveCommitment: () => void;
}) {
  switch (block.type) {
    case 'title':
      return <h2 className="block-title">{block.text}</h2>;
    case 'text':
      return <p className="block-text">{block.content}</p>;
    case 'key_points':
      return (
        <ul className="key-points">
          {block.points.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      );
    case 'quote':
      return (
        <blockquote className="block-quote">
          <p>{block.text}</p>
          {block.attribution && <cite>{block.attribution}</cite>}
        </blockquote>
      );
    case 'video':
      return (
        <div className="block-video">
          <div className="video-placeholder" aria-label={`${block.title} 영상 영역`}>
            <p>{block.title}</p>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onToggleTranscript}>
            {showTranscript ? '대본 숨기기' : '전체 대본 보기'}
          </button>
          {showTranscript && <pre className="video-transcript">{block.transcript}</pre>}
        </div>
      );
    case 'scenario':
      return (
        <ScenarioBlockView
          scenarioId={block.scenarioId}
          selected={scenarioFinal}
          firstSelected={scenarioChoice}
          onSelect={onScenarioSelect}
          onReset={onScenarioReset}
        />
      );
    case 'quiz':
      return <QuizBlockView quizId={block.quizId} responses={quizResponses} onChange={onQuizChange} />;
    case 'commitment':
      return (
        <div className="commitment-block">
          <label htmlFor="commitment-input">{block.prompt}</label>
          <textarea
            id="commitment-input"
            maxLength={200}
            value={commitment}
            onChange={(e) => onCommitmentChange(e.target.value)}
            onBlur={onSaveCommitment}
            rows={4}
          />
          <p className="char-count">{commitment.length}/200</p>
          <p className="privacy-notice">
            실명, 연락처, 피해내용 등 개인을 식별하거나 민감할 수 있는 정보는 입력하지 마세요.
          </p>
          {commitmentWarnings.map((w) => (
            <p key={w} className="warning-text" role="alert">
              {w}
            </p>
          ))}
        </div>
      );
    case 'completion':
      return (
        <div className="completion-block">
          <h2>차시 완료</h2>
          <p>{block.message}</p>
        </div>
      );
    default:
      return <ErrorState title="알 수 없는 학습 블록" description="이 단계는 표시할 수 없습니다." />;
  }
}

function ScenarioBlockView({
  scenarioId,
  selected,
  firstSelected,
  onSelect,
  onReset,
}: {
  scenarioId: string;
  selected: string | null;
  firstSelected: string | null;
  onSelect: (choiceId: string, isReselect: boolean) => void;
  onReset: () => void;
}) {
  const scenario = useMemo(
    () => getDemoScenarios().find((s) => s.id === scenarioId) as ScenarioCase | undefined,
    [scenarioId],
  );
  if (!scenario) return <ErrorState title="상황을 찾을 수 없습니다" />;

  const activeChoice = scenario.choices.find((c) => c.id === selected);

  return (
    <div className="scenario-block">
      <h3>{scenario.title}</h3>
      <p>{scenario.description}</p>
      <div className="choice-list">
        {scenario.choices.map((choice) => (
          <button
            key={choice.id}
            type="button"
            className={`choice-btn ${selected === choice.id ? 'selected' : ''}`}
            onClick={() => onSelect(choice.id, !!firstSelected && firstSelected !== choice.id)}
          >
            {choice.label}
          </button>
        ))}
      </div>
      {activeChoice && (
        <div className="scenario-feedback">
          <h4>선택의 영향</h4>
          <p>
            <strong>나에게:</strong> {activeChoice.impactOnSelf}
          </p>
          <p>
            <strong>동료에게:</strong> {activeChoice.impactOnPeer}
          </p>
          <p>
            <strong>팀 문화에:</strong> {activeChoice.impactOnTeam}
          </p>
          <p>
            <strong>더 나은 행동:</strong> {activeChoice.betterAction}
          </p>
          <p>
            <strong>사용할 수 있는 문장:</strong> “{activeChoice.usableSentence}”
          </p>
          {!activeChoice.isRecommended && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={onReset}>
              다시 선택하기
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function QuizBlockView({
  quizId,
  responses,
  onChange,
}: {
  quizId: string;
  responses: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
}) {
  const quiz = useMemo(() => getDemoQuizzes().find((q) => q.id === quizId) as Quiz | undefined, [quizId]);
  if (!quiz) return <ErrorState title="확인문항을 찾을 수 없습니다" />;
  const score = calculateQuizScore(responses, quiz.questions);

  return (
    <div className="quiz-block">
      <h3>{quiz.title}</h3>
      {quiz.questions.map((q) => (
        <fieldset key={q.id} className="quiz-question">
          <legend>{q.prompt}</legend>
          {q.options.map((opt) => (
            <label key={opt.id} className="quiz-option">
              <input
                type="radio"
                name={q.id}
                value={opt.id}
                checked={responses[q.id] === opt.id}
                onChange={() => onChange({ ...responses, [q.id]: opt.id })}
              />
              {opt.label}
            </label>
          ))}
        </fieldset>
      ))}
      <p className="quiz-score" aria-live="polite">
        현재 점수: {score}점 (통과 기준 {quiz.passingScore}점)
      </p>
    </div>
  );
}
