import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  BoardDetail,
  BoardList,
  BoardPagination,
  BoardToolbar,
  type BoardListRow,
} from '@/components/community/BoardList';
import {
  filterByQuery,
  formatBoardDateTime,
  getTotalPages,
  paginateItems,
} from '@/components/community/boardUtils';
import { PageHeader } from '@/components/ui/PageStates';
import {
  addDemoQnaPost,
  getDemoAnnouncements,
  getDemoQnaPosts,
} from '@/infrastructure/demo/demoState';
import type { Announcement, QnaPost } from '@/domain';

const PAGE_SIZE = 10;

function sortAnnouncements(items: Announcement[]): Announcement[] {
  return [...items].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
}

function toAnnouncementRows(items: Announcement[], page: number): BoardListRow[] {
  const sorted = sortAnnouncements(items);
  const totalRegular = sorted.filter((item) => !item.isPinned).length;
  const paged = paginateItems(sorted, page, PAGE_SIZE);
  const regularBeforePage = sorted
    .filter((item) => !item.isPinned)
    .slice(0, (page - 1) * PAGE_SIZE).length;
  let number = totalRegular - regularBeforePage;

  return paged.map((item) => ({
    id: item.id,
    number: item.isPinned ? 0 : number--,
    title: item.title,
    author: item.authorName ?? '관리자',
    date: item.publishedAt,
    views: item.viewCount ?? 0,
    href: `/community/announcements/${item.id}`,
    isNotice: item.isPinned,
  }));
}

function toQnaRows(items: QnaPost[], page: number): BoardListRow[] {
  const startNo = items.length - (page - 1) * PAGE_SIZE;
  return items.map((item, index) => ({
    id: item.id,
    number: startNo - index,
    title: item.title,
    author: item.authorName,
    date: item.createdAt,
    views: item.viewCount,
    href: `/community/qna/${item.id}`,
    status: item.status,
  }));
}

export function EducationInfoPage() {
  return (
    <div className="content-page">
      <PageHeader
        title="페어플레이 교육 안내"
        description="승리를 넘어, 존중받는 선수로 — FAIR PLAY ACADEMY"
      />
      <section className="panel">
        <h2>교육 목표</h2>
        <p>
          FAIR PLAY ACADEMY는 학생선수가 경기와 훈련, 온라인과 일상에서 마주하는 실제 상황을 통해
          공정·존중·책임·공존·용기를 배우고 실천하는 온라인 스포츠 가치교육 플랫폼입니다.
        </p>
      </section>
      <section className="panel">
        <h2>교육 방식</h2>
        <ol className="values-list">
          <li>실제 상황 확인</li>
          <li>나의 행동 선택</li>
          <li>선택의 영향 확인</li>
          <li>더 나은 행동 연습</li>
          <li>확인문항 · 실천약속 · 이수 확인</li>
        </ol>
      </section>
      <section className="panel">
        <h2>교육 대상</h2>
        <ul className="values-list">
          <li>학생선수 — 경기장·팀·일상에서의 선택을 연습합니다.</li>
          <li>학부모 — 가정의 언어와 태도가 선수의 기준을 만듭니다.</li>
          <li>지도자 — 지도자의 말과 선택이 팀 문화를 만듭니다.</li>
        </ul>
      </section>
    </div>
  );
}

export function AnnouncementsPage() {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const announcements = getDemoAnnouncements();
  const filtered = useMemo(() => filterByQuery(announcements, query), [announcements, query]);
  const totalPages = getTotalPages(filtered.length, PAGE_SIZE);
  const paged = useMemo(() => paginateItems(filtered, page, PAGE_SIZE), [filtered, page]);
  const rows = toAnnouncementRows(paged, page);

  return (
    <div className="content-page board-page">
      <PageHeader title="공지사항" description="FAIR PLAY ACADEMY 소식과 안내" />
      <BoardToolbar total={filtered.length} query={query} onQueryChange={(v) => { setQuery(v); setPage(1); }} />
      <BoardList rows={rows} />
      <BoardPagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

export function AnnouncementDetailPage() {
  const { id = '' } = useParams();
  const announcement = getDemoAnnouncements().find((item) => item.id === id);

  if (!announcement) {
    return (
      <div className="content-page board-page">
        <div className="board-empty panel">
          <p>공지사항을 찾을 수 없습니다.</p>
          <Link to="/community/announcements" className="btn btn-secondary">
            목록으로
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="content-page board-page">
      <PageHeader title="공지사항" />
      <BoardDetail
        title={announcement.title}
        author={announcement.authorName ?? '관리자'}
        date={formatBoardDateTime(announcement.publishedAt)}
        views={announcement.viewCount ?? 0}
        body={announcement.body}
        listHref="/community/announcements"
        listLabel="목록으로"
      />
    </div>
  );
}

export function FaqPage() {
  const faqs = [
    {
      q: '누가 수강할 수 있나요?',
      a: '학생선수, 학부모, 지도자, 기관 구성원 모두 역할에 맞는 교육과정을 수강할 수 있습니다.',
    },
    {
      q: '교육은 어떻게 진행되나요?',
      a: '상황형 학습, 확인문항, 실천약속으로 구성되며 차시별로 진도가 저장됩니다.',
    },
    {
      q: '수료증은 어떻게 받나요?',
      a: '과정별 수료 조건(차시 완료, 확인문항, 실천약속 등)을 충족하면 수료증을 확인할 수 있습니다.',
    },
    {
      q: '기관 단위로 도입할 수 있나요?',
      a: '기관관리자 계정으로 구성원·팀·과정 배정 및 진도 관리가 가능합니다. 도입 문의는 Q&A 게시판을 이용해 주세요.',
    },
  ];

  return (
    <div className="content-page">
      <PageHeader title="자주묻는 질문" />
      <dl className="faq-list">
        {faqs.map((item) => (
          <div key={item.q} className="faq-item panel">
            <dt>{item.q}</dt>
            <dd>{item.a}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function QnaPage() {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const posts = getDemoQnaPosts();
  const sorted = useMemo(
    () => [...posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [posts],
  );
  const filtered = useMemo(() => filterByQuery(sorted, query), [sorted, query]);
  const totalPages = getTotalPages(filtered.length, PAGE_SIZE);
  const paged = useMemo(() => paginateItems(filtered, page, PAGE_SIZE), [filtered, page]);
  const rows = toQnaRows(paged, page);

  return (
    <div className="content-page board-page">
      <PageHeader title="Q&A" description="교육·수강·기관 도입 관련 문의" />
      <BoardToolbar
        total={filtered.length}
        query={query}
        onQueryChange={(v) => {
          setQuery(v);
          setPage(1);
        }}
        action={{ label: '문의 등록', to: '/community/qna/write' }}
      />
      <BoardList rows={rows} showStatus emptyMessage="등록된 문의가 없습니다." />
      <BoardPagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

export function QnaDetailPage() {
  const { id = '' } = useParams();
  const post = getDemoQnaPosts().find((item) => item.id === id);

  if (!post) {
    return (
      <div className="content-page board-page">
        <div className="board-empty panel">
          <p>문의를 찾을 수 없습니다.</p>
          <Link to="/community/qna" className="btn btn-secondary">
            목록으로
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="content-page board-page">
      <PageHeader title="Q&A" />
      <BoardDetail
        title={post.title}
        author={post.authorName}
        date={formatBoardDateTime(post.createdAt)}
        views={post.viewCount}
        body={post.body}
        listHref="/community/qna"
        listLabel="목록으로"
        status={post.status}
        answer={post.answer}
        answeredAt={post.answeredAt ? formatBoardDateTime(post.answeredAt) : undefined}
      />
    </div>
  );
}

export function QnaWritePage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim() || !authorName.trim()) return;
    addDemoQnaPost({ title: title.trim(), body: body.trim(), authorName: authorName.trim() });
    setSubmitted(true);
    setTimeout(() => navigate('/community/qna'), 800);
  };

  return (
    <div className="content-page board-page">
      <PageHeader title="문의 등록" description="교육·수강·기관 도입 관련 문의를 남겨 주세요." />
      <form className="board-write panel" onSubmit={handleSubmit}>
        <label>
          작성자
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="이름 (예: 홍*동)"
            required
          />
        </label>
        <label>
          제목
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="문의 제목"
            required
          />
        </label>
        <label>
          내용
          <textarea
            rows={8}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="문의 내용을 입력해 주세요."
            required
          />
        </label>
        <p className="privacy-notice">개인정보(실명, 연락처 등)는 최소한으로 입력해 주세요.</p>
        <div className="board-write-actions">
          <Link to="/community/qna" className="btn btn-secondary">
            취소
          </Link>
          <button type="submit" className="btn btn-primary" disabled={submitted}>
            {submitted ? '등록 완료' : '등록하기'}
          </button>
        </div>
      </form>
    </div>
  );
}
