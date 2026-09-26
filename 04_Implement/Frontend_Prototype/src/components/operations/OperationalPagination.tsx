import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface OperationalPaginationProps {
  /** Current page (1-indexed) */
  currentPage: number;
  /** Total number of items */
  totalItems: number;
  /** Items displayed per page */
  pageSize: number;
  /** Called when page changes */
  onPageChange: (page: number) => void;
  /** Optional: available page size options */
  pageSizeOptions?: number[];
  /** Optional: called when page size changes */
  onPageSizeChange?: (size: number) => void;
  /** Optional: compact variant without first/last buttons */
  compact?: boolean;
}

export const OperationalPagination: React.FC<OperationalPaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  pageSizeOptions,
  onPageSizeChange,
  compact = false,
}) => {
  const { t } = useTranslation();

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  const getVisiblePages = (): (number | 'ellipsis')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | 'ellipsis')[] = [1];

    if (currentPage > 3) pages.push('ellipsis');

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);

    return pages;
  };

  if (totalItems === 0) return null;

  return (
    <div className="ops-pagination" role="navigation" aria-label={t('operations.pagination.label', 'Table pagination')}>
      {/* Left: Item count summary */}
      <div className="ops-pagination-info">
        <span>
          {t('operations.pagination.showing', {
            start: startItem,
            end: endItem,
            total: totalItems,
            defaultValue: `Showing ${startItem}–${endItem} of ${totalItems}`,
          })}
        </span>
        {pageSizeOptions && onPageSizeChange && (
          <div className="ops-pagination-size">
            <label htmlFor="ops-page-size">{t('operations.pagination.perPage', 'Per page')}:</label>
            <select
              id="ops-page-size"
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1); // Reset to first page
              }}
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Page navigation */}
      <div className="ops-pagination-nav">
        {/* First page */}
        {!compact && (
          <button
            type="button"
            className="ops-pagination-btn"
            onClick={() => onPageChange(1)}
            disabled={!canPrev}
            aria-label={t('operations.pagination.firstPage', 'First page')}
            title={t('operations.pagination.firstPage', 'First page')}
          >
            <ChevronsLeft size={14} />
          </button>
        )}

        {/* Previous */}
        <button
          type="button"
          className="ops-pagination-btn"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canPrev}
          aria-label={t('operations.pagination.previousPage', 'Previous page')}
          title={t('operations.pagination.previousPage', 'Previous page')}
        >
          <ChevronLeft size={14} />
        </button>

        {/* Page numbers */}
        <div className="ops-pagination-pages">
          {getVisiblePages().map((page, idx) =>
            page === 'ellipsis' ? (
              <span key={`ellipsis-${idx}`} className="ops-pagination-ellipsis">
                …
              </span>
            ) : (
              <button
                key={page}
                type="button"
                className={`ops-pagination-page ${currentPage === page ? 'is-active' : ''}`}
                onClick={() => onPageChange(page)}
                aria-current={currentPage === page ? 'page' : undefined}
                aria-label={t('operations.pagination.goToPage', { page, defaultValue: `Go to page ${page}` })}
              >
                {page}
              </button>
            )
          )}
        </div>

        {/* Next */}
        <button
          type="button"
          className="ops-pagination-btn"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canNext}
          aria-label={t('operations.pagination.nextPage', 'Next page')}
          title={t('operations.pagination.nextPage', 'Next page')}
        >
          <ChevronRight size={14} />
        </button>

        {/* Last page */}
        {!compact && (
          <button
            type="button"
            className="ops-pagination-btn"
            onClick={() => onPageChange(totalPages)}
            disabled={!canNext}
            aria-label={t('operations.pagination.lastPage', 'Last page')}
            title={t('operations.pagination.lastPage', 'Last page')}
          >
            <ChevronsRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
};
