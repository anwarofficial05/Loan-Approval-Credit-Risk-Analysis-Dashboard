import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Play,
  Copy,
  Check,
  Clock,
  Database,
  Layers,
  Code2,
  Table as TableIcon
} from 'lucide-react';
import { QueryItem, QueryRunResult } from '../types';
import { fetchQueries, runQuery } from '../lib/api';
import { formatINR } from '../lib/formatters';

export const SQLExplorer: React.FC = () => {
  const [queries, setQueries] = useState<QueryItem[]>([]);
  const [selectedQueryId, setSelectedQueryId] = useState<number>(1);
  const [loadingQueries, setLoadingQueries] = useState<boolean>(true);

  // Execution state
  const [running, setRunning] = useState<boolean>(false);
  const [queryResult, setQueryResult] = useState<QueryRunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoadingQueries(true);
        const list = await fetchQueries();
        setQueries(list);
        if (list.length > 0) {
          setSelectedQueryId(list[0].id);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load queries catalog');
      } finally {
        setLoadingQueries(false);
      }
    }
    loadCatalog();
  }, []);

  const activeQuery = queries.find((q) => q.id === selectedQueryId) || queries[0];

  // Auto-run when switching query or on user click
  const handleExecute = async (queryId?: number) => {
    const idToRun = queryId ?? selectedQueryId;
    try {
      setRunning(true);
      setError(null);
      const res = await runQuery(idToRun);
      setQueryResult(res);
    } catch (err: any) {
      setError(err.message || 'SQL execution failed');
      setQueryResult(null);
    } finally {
      setRunning(false);
    }
  };

  // Run automatically when selected query changes
  useEffect(() => {
    if (selectedQueryId) {
      handleExecute(selectedQueryId);
    }
  }, [selectedQueryId]);

  const handleCopySQL = () => {
    if (!activeQuery) return;
    navigator.clipboard.writeText(activeQuery.sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Format cell values smartly
  const formatCellValue = (val: any, colName: string) => {
    if (val === null || val === undefined) return <span className="text-slate-600">NULL</span>;
    if (typeof val === 'number') {
      if (colName.includes('pct') || colName.includes('rate') || colName.includes('growth')) {
        return <span className="text-teal-300 font-mono font-semibold">{val.toFixed(2)}%</span>;
      }
      if (colName.includes('inr') || colName.includes('amount') || colName.includes('disbursed')) {
        return <span className="font-mono text-slate-200">{formatINR(val)}</span>;
      }
      return <span className="font-mono text-slate-300">{val.toLocaleString('en-IN')}</span>;
    }
    return String(val);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-teal-400" />
          <h1 className="text-xl font-bold tracking-tight text-slate-100">
            SQL Analytics Explorer
          </h1>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/30">
            12 RAW PRODUCTION QUERIES
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Execute institutional-grade SQL queries directly against 50,000 loan records. Analyzes window functions, multi-level aggregations, CTEs, and pivots.
        </p>
      </div>

      {/* Main Split Grid: Left Query List, Right Execution Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: 12 Queries Menu (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-2">
          <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>ANALYTICAL QUESTIONS</span>
            <span className="font-mono text-slate-400">{queries.length} Queries</span>
          </div>

          <div className="space-y-1.5 max-h-[720px] overflow-y-auto pr-1">
            {loadingQueries ? (
              <div className="p-4 text-center text-slate-500 text-xs animate-pulse">
                Loading query catalog...
              </div>
            ) : (
              queries.map((q) => {
                const isSelected = q.id === selectedQueryId;
                return (
                  <button
                    key={q.id}
                    onClick={() => setSelectedQueryId(q.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all text-xs group ${
                      isSelected
                        ? 'bg-slate-950 border-teal-500/50 shadow-md ring-1 ring-teal-500/20'
                        : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 group-hover:text-slate-200">
                        Q{q.id.toString().padStart(2, '0')}
                      </span>
                      <span className="text-[10px] text-teal-400/90 font-mono">
                        {q.technique}
                      </span>
                    </div>

                    <div className="font-semibold text-slate-200 group-hover:text-white leading-snug">
                      {q.title}
                    </div>

                    <div className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {q.business_question}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: SQL Hero Editor & Result Grid (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {activeQuery ? (
            <>
              {/* Business Question Banner */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20 font-bold">
                      QUERY #{activeQuery.id}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {activeQuery.category}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-teal-400">
                    Technique: {activeQuery.technique}
                  </span>
                </div>

                <h2 className="text-base font-bold text-slate-100">
                  {activeQuery.title}
                </h2>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed bg-slate-950/60 p-2.5 rounded border border-slate-800">
                  <strong className="text-teal-400 font-semibold block mb-0.5">
                    Business Question Answered:
                  </strong>
                  {activeQuery.business_question}
                </p>
              </div>

              {/* Raw SQL Block with Actions */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-sm">
                <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Code2 className="w-4 h-4 text-teal-400" />
                    <span className="font-mono font-medium">RAW SQL SYNTAX</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopySQL}
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded bg-slate-900 border border-slate-750 transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy SQL</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleExecute()}
                      disabled={running}
                      className="flex items-center gap-1.5 text-xs font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 px-3.5 py-1 rounded transition-colors disabled:opacity-50"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{running ? 'Executing...' : 'Run Query'}</span>
                    </button>
                  </div>
                </div>

                <pre className="p-4 text-xs font-mono text-slate-200 bg-slate-950/90 overflow-x-auto leading-relaxed selection:bg-teal-700">
                  <code>{activeQuery.sql}</code>
                </pre>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded text-xs">
                  <strong>Execution Error:</strong> {error}
                </div>
              )}

              {/* Execution Stats Bar */}
              {queryResult && (
                <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>EXECUTION SUCCESSFUL</span>
                    </div>

                    <div className="flex items-center gap-1 text-slate-400 font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>Latency:</span>
                      <strong className="text-teal-400">{queryResult.execution_ms} ms</strong>
                    </div>

                    <div className="flex items-center gap-1 text-slate-400 font-mono">
                      <TableIcon className="w-3.5 h-3.5 text-slate-500" />
                      <span>Result Set:</span>
                      <strong className="text-slate-200">{queryResult.row_count} rows</strong>
                    </div>

                    <div className="flex items-center gap-1 text-slate-400 font-mono">
                      <Layers className="w-3.5 h-3.5 text-slate-500" />
                      <span>Columns:</span>
                      <strong className="text-slate-200">{queryResult.columns.length}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Result Grid Table */}
              {queryResult && (
                <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-sm">
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-slate-950 sticky top-0 border-b border-slate-800 text-slate-400 font-mono select-none">
                        <tr>
                          {queryResult.columns.map((col) => (
                            <th key={col} className="py-2.5 px-3 font-semibold whitespace-nowrap">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {queryResult.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-800/30 transition-colors">
                            {queryResult.columns.map((col) => (
                              <td key={col} className="py-2 px-3 whitespace-nowrap">
                                {formatCellValue(row[col], col)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
