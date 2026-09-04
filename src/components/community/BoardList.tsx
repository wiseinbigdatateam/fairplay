import { Link } from 'react-router-dom';
import { formatBoardDate } from '@/components/community/boardUtils';

export interface BoardListRow {
  id: string;
  number: number;
  title: string;
  author: string;
  date: string;
  views: number;
  href: string;
  isNotice?: boolean;
  status?: 'answered' | 'pending';
}

interface BoardListProps {
  rows: BoardListRow[];
  emptyMessage?: string;
  showStatus?: boolean;
}

export function BoardList({ rows, emptyMessage = '등록된 게시글이 없습니다.', showStatus = false }: BoardListProps) {
  if (rows.length === 0) {
    return (
      <div className="board-empty panel">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="board-table-wrap">
      <table className="board-table">
        <thead>
          <tr>
            <th scope="col" className="board-col-no">
              번호
            </th>
            <th scope="col" className="board-col-title">
              제목
            </th>
            <th scope="col" className="board-col-author">
              작성자
            </th>
            <th scope="col" className="board-col-date">
              작성일
            </th>
            <th scope="col" className="board-col-views">
              조회
            </th>
            {showStatus && (
              <th scope="col" className="board-col-status">
                상태
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className={row.isNotice ? 'board-row-notice' : undefined}>
              <td className="board-col-no">
                {row.isNotice ? (
                  <span className="board-badge board-badge-notice">공지</span>
                ) : (
                  row.number
                )}
              </td>
              <td className="board-col-title">
                <Link to={row.href} className="board-title-link">
                  {row.title}
                  {row.status === 'pending' && (
                    <span className="board-inline-badge board-inline-badge-new">N</span>
                  )}
                </Link>
              </td>
              <td className="board-col-author">{row.author}</td>
              <td className="board-col-date">{formatBoardDate(row.date)}</td>
              <td className="board-col-views">{row.views}</td>
              {showStatus && (
                <td className="board-col-status">
                  {row.status === 'answered' ? (
                    <span className="board-badge board-badge-answered">답변완료</span>
                  ) : (
                    <span className="board-badge board-badge-pending">답변대기</span>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface BoardToolbarProps {
  total: number;
  query: string;
  onQueryChange: (value: string) => void;
  searchPlaceholder?: string;
  action?: { label: string; to: string };
}

export function BoardToolbar({
  total,
  query,
  onQueryChange,
  searchPlaceholder = '제목 검색',
  action,
}: BoardToolbarProps) {
  return (
    <div className="board-toolbar">
      <p className="board-total">
        전체 <strong>{total}</strong>건
      </p>
      <div className="board-toolbar-actions">
        <label className="board-search">
          <span className="sr-only">검색</span>
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={searchPlaceholder}
          />
        </label>
        {action && (
          <Link to={action.to} className="btn btn-primary btn-sm">
            {action.label}
          </Link>
        )}
      </div>
    </div>
  );
}

interface BoardPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function BoardPagination({ page, totalPages, onPageChange }: BoardPaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav className="board-pagination" aria-label="게시판 페이지">
      <button
        type="button"
        className="board-page-btn"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        이전
      </button>
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          className={`board-page-btn ${p === page ? 'active' : ''}`}
          aria-current={p === page ? 'page' : undefined}
          onClick={() => onPageChange(p)}
        >
          {p}
        </button>
      ))}
      <button
        type="button"
        className="board-page-btn"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        다음
      </button>
    </nav>
  );
}

interface BoardDetailProps {
  title: string;
  author: string;
  date: string;
  views: number;
  body: string;
  listHref: string;
  listLabel: string;
  status?: 'answered' | 'pending';
  answer?: string;
  answeredAt?: string;
}

export function BoardDetail({
  title,
  author,
  date,
  views,
  body,
  listHref,
  listLabel,
  status,
  answer,
  answeredAt,
}: BoardDetailProps) {
  return (
    <article className="board-detail panel">
      <header className="board-detail-header">
        <h1>{title}</h1>
        <dl className="board-detail-meta">
          <div>
            <dt>작성자</dt>
            <dd>{author}</dd>
          </div>
          <div>
            <dt>작성일</dt>
            <dd>{date}</dd>
          </div>
          <div>
            <dt>조회</dt>
            <dd>{views}</dd>
          </div>
          {status && (
            <div>
              <dt>상태</dt>
              <dd>
                {status === 'answered' ? (
                  <span className="board-badge board-badge-answered">답변완료</span>
                ) : (
                  <span className="board-badge board-badge-pending">답변대기</span>
                )}
              </dd>
            </div>
          )}
        </dl>
      </header>

      <div className="board-detail-body">
        {body.split('\n').map((line, i) => (
          <p key={i}>{line || '\u00A0'}</p>
        ))}
      </div>

      {answer && (
        <section className="board-detail-answer">
          <h2>답변</h2>
          {answeredAt && <time className="board-answer-date">{answeredAt}</time>}
          <div className="board-detail-body">
            {answer.split('\n').map((line, i) => (
              <p key={i}>{line || '\u00A0'}</p>
            ))}
          </div>
        </section>
      )}

      <footer className="board-detail-footer">
        <Link to={listHref} className="btn btn-secondary">
          {listLabel}
        </Link>
      </footer>
    </article>
  );
}
