'use client';

import { useMemo, useState } from 'react';
import { getScoreRowClass } from './marketIntelligence';

function formatCell(value) {
  if (Array.isArray(value)) return value.join(', ');
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return Number.isFinite(value) ? value.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function toCsv(rows, columns) {
  const escape = (value) => `"${formatCell(value).replace(/"/g, '""')}"`;
  return [
    columns.map((column) => escape(column.label)).join(','),
    ...rows.map((row) => columns.map((column) => escape(row[column.key])).join(',')),
  ].join('\n');
}

function toExcelHtml(rows, columns) {
  const cells = rows.map((row) => (
    `<tr>${columns.map((column) => `<td>${formatCell(row[column.key])}</td>`).join('')}</tr>`
  )).join('');
  return `<table><thead><tr>${columns.map((column) => `<th>${column.label}</th>`).join('')}</tr></thead><tbody>${cells}</tbody></table>`;
}

export default function MarketIntelligenceTable({
  rows,
  columns,
  title,
  loading,
  error,
  noDataMessage = 'No data',
  onRowClick,
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('');
  const [sorts, setSorts] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [visible, setVisible] = useState(() => new Set(columns.map((column) => column.key)));

  const visibleColumns = useMemo(
    () => columns.filter((column) => visible.has(column.key)),
    [columns, visible]
  );

  const filteredRows = useMemo(() => {
    const search = query.trim().toLowerCase();
    const filterText = filter.trim().toLowerCase();
    const filtered = rows.filter((row) => {
      const rowText = columns.map((column) => formatCell(row[column.key])).join(' ').toLowerCase();
      return (!search || rowText.includes(search)) && (!filterText || rowText.includes(filterText));
    });

    return filtered.sort((a, b) => {
      for (const sort of sorts) {
        const av = a[sort.key];
        const bv = b[sort.key];
        const an = Number(av);
        const bn = Number(bv);
        const result = Number.isFinite(an) && Number.isFinite(bn)
          ? an - bn
          : formatCell(av).localeCompare(formatCell(bv));
        if (result !== 0) return sort.direction === 'asc' ? result : -result;
      }
      return 0;
    });
  }, [rows, columns, query, filter, sorts]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageRows = filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  function toggleSort(columnKey, multi) {
    setSorts((current) => {
      const existing = current.find((sort) => sort.key === columnKey);
      const nextSort = existing?.direction === 'asc'
        ? { key: columnKey, direction: 'desc' }
        : existing?.direction === 'desc'
          ? null
          : { key: columnKey, direction: 'asc' };
      const without = current.filter((sort) => sort.key !== columnKey);
      if (!nextSort) return multi ? without : [];
      return multi ? [...without, nextSort] : [nextSort];
    });
  }

  function toggleColumn(columnKey) {
    setVisible((current) => {
      const next = new Set(current);
      if (next.has(columnKey)) next.delete(columnKey);
      else next.add(columnKey);
      return next.size ? next : current;
    });
  }

  return (
    <>
      <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
        {title ? <h5 className="mb-0 me-auto">{title}</h5> : <div className="me-auto" />}

        <input
          className="form-control form-control-sm"
          placeholder="Search"
          value={query}
          onChange={(event) => {
            setPage(1);
            setQuery(event.target.value);
          }}
          style={{ width: 180 }}
        />

        <input
          className="form-control form-control-sm"
          placeholder="Filter"
          value={filter}
          onChange={(event) => {
            setPage(1);
            setFilter(event.target.value);
          }}
          style={{ width: 160 }}
        />

        <select
          className="form-select form-select-sm"
          value={pageSize}
          onChange={(event) => {
            setPage(1);
            setPageSize(Number(event.target.value));
          }}
          style={{ width: 90 }}
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>

        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={() => downloadFile(`${title || 'market-intelligence'}.csv`, toCsv(filteredRows, visibleColumns), 'text/csv;charset=utf-8')}
        >
          CSV
        </button>

        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={() => downloadFile(`${title || 'market-intelligence'}.xls`, toExcelHtml(filteredRows, visibleColumns), 'application/vnd.ms-excel')}
        >
          Excel
        </button>
      </div>

      <div className="d-flex flex-wrap gap-2 mb-2 small">
        {columns.map((column) => (
          <label key={column.key} className="form-check-label">
            <input
              className="form-check-input me-1"
              type="checkbox"
              checked={visible.has(column.key)}
              onChange={() => toggleColumn(column.key)}
            />
            {column.label}
          </label>
        ))}
      </div>

      {loading ? (
        <div className="placeholder-glow">
          <span className="placeholder col-12 mb-2" />
          <span className="placeholder col-10 mb-2" />
          <span className="placeholder col-11 mb-2" />
        </div>
      ) : error ? (
        <div className="alert alert-warning">{error}</div>
      ) : !filteredRows.length ? (
        <div className="text-muted">{noDataMessage}</div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-striped table-bordered table-sm align-middle">
              <thead className="position-sticky top-0">
                <tr>
                  {visibleColumns.map((column) => {
                    const sort = sorts.find((item) => item.key === column.key);
                    return (
                      <th
                        key={column.key}
                        role="button"
                        onClick={(event) => toggleSort(column.key, event.shiftKey)}
                      >
                        {column.label}
                        {sort ? ` ${sort.direction === 'asc' ? '↑' : '↓'}` : ''}
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {pageRows.map((row, index) => (
                  <tr
                    key={row.id || `${row.symbol || 'row'}-${index}`}
                    className={getScoreRowClass(Number(row.score ?? row.scannerScore ?? 0))}
                    onClick={() => onRowClick?.(row)}
                    style={{ cursor: onRowClick ? 'pointer' : undefined }}
                  >
                    {visibleColumns.map((column) => (
                      <td key={column.key}>
                        {column.key === 'badges' ? (
                          <span className="d-flex flex-wrap gap-1">
                            {(row.badges || []).map((badge) => (
                              <span key={badge} className="badge text-bg-secondary">{badge}</span>
                            ))}
                          </span>
                        ) : (
                          formatCell(row[column.key])
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="d-flex justify-content-between align-items-center small">
            <span>{filteredRows.length} rows</span>
            <div className="btn-group btn-group-sm">
              <button type="button" className="btn btn-outline-secondary" disabled={safePage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
                Prev
              </button>
              <button type="button" className="btn btn-outline-secondary" disabled>
                {safePage}/{pageCount}
              </button>
              <button type="button" className="btn btn-outline-secondary" disabled={safePage >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
