import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Target,
  BarChart2,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid
} from 'recharts';
import { ModelMetricsData } from '../types';
import { fetchModelMetrics } from '../lib/api';

export const ModelPerformance: React.FC = () => {
  const [data, setData] = useState<ModelMetricsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<'approval' | 'default'>('approval');

  useEffect(() => {
    async function loadMetrics() {
      try {
        setLoading(true);
        const res = await fetchModelMetrics();
        setData(res);
      } catch (err: any) {
        setError(err.message || 'Failed to load model metrics');
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs animate-pulse space-y-4">
        <div className="h-20 bg-slate-900 rounded-lg max-w-xl mx-auto" />
        <div className="h-64 bg-slate-900 rounded-lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-lg text-xs">
        {error || 'Unable to retrieve real model metrics.'}
      </div>
    );
  }

  const modelInfo =
    selectedModel === 'approval' ? data.approval_model : data.default_model;
  const cm = modelInfo.confusion_matrix;

  // Feature importance data for active model
  const featureData =
    selectedModel === 'approval'
      ? data.approval_coefficients.slice(0, 10).map((f) => ({
          name: f.feature.replace(/_/g, ' '),
          value: f.weight,
          absVal: Math.abs(f.weight),
          direction: f.direction
        }))
      : data.default_importances.slice(0, 10).map((f) => ({
          name: f.feature.replace(/_/g, ' '),
          value: f.importance,
          absVal: f.importance,
          direction: 'Relative Importance'
        }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-teal-400" />
            <h1 className="text-xl font-bold tracking-tight text-slate-100">
              Model Performance & Credit Risk Governance
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real evaluated test metrics, confusion matrix counts, and feature importance profiles for production models.
          </p>
        </div>

        {/* Model Selector Tabs */}
        <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setSelectedModel('approval')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              selectedModel === 'approval'
                ? 'bg-slate-800 text-teal-400 shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Approval Model (Logistic Reg)
          </button>
          <button
            onClick={() => setSelectedModel('default')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              selectedModel === 'default'
                ? 'bg-slate-800 text-teal-400 shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Default Risk Model (Random Forest)
          </button>
        </div>
      </div>

      {/* Model Spec Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/30">
            {modelInfo.model_type}
          </span>
          <span className="text-slate-300">
            <strong>Target:</strong> {modelInfo.target}
          </span>
        </div>
        <div className="text-slate-400 font-mono">
          Out-of-sample Test Size:{' '}
          <strong className="text-slate-200">{modelInfo.test_sample_size.toLocaleString('en-IN')}</strong> loans
        </div>
      </div>

      {/* 5 Real Metric Scorecards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5">
          <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block">
            ROC-AUC Score
          </span>
          <div className="text-2xl font-bold font-mono text-teal-400 mt-1">
            {modelInfo.roc_auc.toFixed(4)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Discriminatory Power</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5">
          <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block">
            Overall Accuracy
          </span>
          <div className="text-2xl font-bold font-mono text-slate-100 mt-1">
            {(modelInfo.accuracy * 100).toFixed(2)}%
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Correct Predictions</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5">
          <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block">
            Precision
          </span>
          <div className="text-2xl font-bold font-mono text-slate-100 mt-1">
            {(modelInfo.precision * 100).toFixed(2)}%
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Positive Predictive Value</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5">
          <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block">
            Recall / Sensitivity
          </span>
          <div className="text-2xl font-bold font-mono text-slate-100 mt-1">
            {(modelInfo.recall * 100).toFixed(2)}%
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Capture Rate</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5">
          <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block">
            F1 Score
          </span>
          <div className="text-2xl font-bold font-mono text-slate-100 mt-1">
            {modelInfo.f1.toFixed(4)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Harmonic Mean</div>
        </div>
      </div>

      {/* Grid: Confusion Matrix & Feature Importances */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Rendered Confusion Matrix (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-teal-400" />
              Rendered Confusion Matrix
            </h2>
            <span className="text-[10px] font-mono text-slate-400">
              Total Test: {modelInfo.test_sample_size.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/70 p-4">
            <div className="text-center text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2">
              PREDICTED CLASS
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              {/* True Negative */}
              <div className="bg-slate-900 border border-emerald-500/20 p-3 rounded">
                <div className="text-[10px] text-slate-400">True Negatives (TN)</div>
                <div className="text-xl font-mono font-bold text-emerald-400 mt-0.5">
                  {cm.true_negatives.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Correctly Rejected</div>
              </div>

              {/* False Positive */}
              <div className="bg-slate-900 border border-rose-500/20 p-3 rounded">
                <div className="text-[10px] text-slate-400">False Positives (FP)</div>
                <div className="text-xl font-mono font-bold text-rose-400 mt-0.5">
                  {cm.false_positives.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Type I Error</div>
              </div>

              {/* False Negative */}
              <div className="bg-slate-900 border border-rose-500/20 p-3 rounded">
                <div className="text-[10px] text-slate-400">False Negatives (FN)</div>
                <div className="text-xl font-mono font-bold text-rose-400 mt-0.5">
                  {cm.false_negatives.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Type II Error</div>
              </div>

              {/* True Positive */}
              <div className="bg-slate-900 border border-emerald-500/20 p-3 rounded">
                <div className="text-[10px] text-slate-400">True Positives (TP)</div>
                <div className="text-xl font-mono font-bold text-emerald-400 mt-0.5">
                  {cm.true_positives.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Correctly Approved</div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
              <div className="flex justify-between font-mono">
                <span>Sensitivity / Recall (TP Rate):</span>
                <strong className="text-slate-200">
                  {((cm.true_positives / (cm.true_positives + cm.false_negatives)) * 100).toFixed(2)}%
                </strong>
              </div>
              <div className="flex justify-between font-mono">
                <span>Specificity (TN Rate):</span>
                <strong className="text-slate-200">
                  {((cm.true_negatives / (cm.true_negatives + cm.false_positives)) * 100).toFixed(2)}%
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Importance / Coefficients Bar Chart (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4 text-teal-400" />
              {selectedModel === 'approval'
                ? 'Top 10 Feature Coefficients (Odds Impact)'
                : 'Top 10 Feature Importances (Gini Impurity)'}
            </h2>
            <span className="text-[10px] font-mono text-teal-400">
              {selectedModel === 'approval' ? 'LOGISTIC REGRESSION' : 'RANDOM FOREST'}
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={featureData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 70, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  type="number"
                  stroke="#64748b"
                  fontSize={10}
                  tickFormatter={(v) => v.toFixed(2)}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={10}
                  width={110}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  formatter={(val: any, name: string, item: any) => [
                    Number(val).toFixed(4),
                    item.payload.direction
                  ]}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {featureData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.value >= 0
                          ? selectedModel === 'approval'
                            ? '#10b981'
                            : '#0ea5e9'
                          : '#f43f5e'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Methodology Write-up Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
        <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-teal-400" />
          Methodology & Underwriting Architecture Write-up
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300 leading-relaxed">
          {/* Card 1: Train / Test Split */}
          <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-lg space-y-1.5">
            <strong className="text-teal-400 font-semibold block text-sm">
              1. 80 / 20 Stratified Validation
            </strong>
            <p>
              The loan application population was partitioned into an 80% training set (40,000 records) and a 20% out-of-sample test set (10,000 records) using stratified sampling on the approval status and default flags.
            </p>
            <p className="text-slate-400">
              Stratification guarantees identical target class distribution across folds, preventing sample bias in credit thresholding.
            </p>
          </div>

          {/* Card 2: Imputation Strategy */}
          <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-lg space-y-1.5">
            <strong className="text-teal-400 font-semibold block text-sm">
              2. Preprocessing & Imputation
            </strong>
            <p>
              Real lending applications inevitably suffer from incomplete applicant submissions. Missing numeric values (applicant income, loan amount) are imputed using the <em>median</em> to insulate against extreme right-tail skew.
            </p>
            <p className="text-slate-400">
              Categorical attributes and credit history missingness are imputed using the <em>mode</em> (most frequent), followed by one-hot encoding.
            </p>
          </div>

          {/* Card 3: Class Weight Balancing */}
          <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-lg space-y-1.5">
            <strong className="text-teal-400 font-semibold block text-sm">
              3. Balanced Class Weights for Default
            </strong>
            <p>
              Defaults represent ~9% of approved loans. Training a standard classifier on heavily imbalanced credit data causes models to favor the majority non-defaulting class, yielding dangerous false negatives.
            </p>
            <p className="text-slate-400">
              Applying <code className="text-teal-300 font-mono">class_weight=&apos;balanced&apos;</code> penalizes misclassifications of delinquent borrowers inversely proportional to their frequency.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
