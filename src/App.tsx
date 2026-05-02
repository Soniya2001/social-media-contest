import React, { useState } from 'react';
import { 
  Send, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  User, 
  TrendingUp,
  LayoutDashboard,
  MessageSquarePlus,
  Sparkles
} from 'lucide-react';
import { analyzeTeamSync, AnalysisResult, Task, Blocker, Prediction } from './services/aiProvider';

function App() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await analyzeTeamSync(input);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "An error occurred during analysis.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <header className="max-w-6xl mx-auto mb-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
            <LayoutDashboard className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">NexusFlow AI</h1>
            <p className="text-slate-400 text-sm">Team Coordination Intelligence</p>
          </div>
        </div>
        <div className="hidden md:flex gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-400 px-4 py-2 border border-slate-800 rounded-lg">
            <Sparkles size={16} className="text-indigo-400" />
            Gemini 1.5 Flash Active
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Section */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          <div className="glass-card animate-fade-in">
            <div className="flex items-center gap-2 mb-4 text-indigo-400">
              <MessageSquarePlus size={20} />
              <h2 className="font-semibold">Sync Input</h2>
            </div>
            <textarea
              className="input-area mb-4"
              placeholder="Paste meeting notes, chat logs, or updates here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button 
              className="btn-primary w-full justify-center"
              onClick={handleAnalyze}
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing...
                </div>
              ) : (
                <>
                  <Send size={18} />
                  Analyze Progress
                </>
              )}
            </button>
            {error && <p className="text-red-400 text-xs mt-3">{error}</p>}
          </div>

          {result?.suggestions && (
            <div className="glass-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider mb-4">Actionable Next Steps</h3>
              <ul className="space-y-3">
                {result.suggestions.map((s, i) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-300">
                    <div className="mt-1 shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Results Section */}
        <section className="lg:col-span-7 flex flex-col gap-6">
          {!result && !loading && (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center glass-card border-dashed border-2">
              <Sparkles size={48} className="text-slate-700 mb-4" />
              <p className="text-slate-500 text-center">Enter team updates to generate <br/>tasks and risk predictions.</p>
            </div>
          )}

          {result && (
            <>
              {/* Risks & Blockers Summary */}
              {(result.blockers.length > 0 || result.predictions.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="glass-card border-red-500/20 bg-red-500/5">
                    <div className="flex items-center gap-2 mb-3 text-red-400">
                      <AlertTriangle size={18} />
                      <h3 className="font-semibold text-sm">Critical Blockers</h3>
                    </div>
                    {result.blockers.map((b, i) => (
                      <div key={i} className="mb-2 last:mb-0">
                        <p className="text-sm font-medium">{b.issue}</p>
                        <p className="text-[10px] text-red-400/60">Affects: {b.affected_tasks.join(', ')}</p>
                      </div>
                    ))}
                    {result.blockers.length === 0 && <p className="text-xs text-slate-500">No active blockers detected.</p>}
                  </div>

                  <div className="glass-card border-amber-500/20 bg-amber-500/5">
                    <div className="flex items-center gap-2 mb-3 text-amber-400">
                      <TrendingUp size={18} />
                      <h3 className="font-semibold text-sm">Risk Predictions</h3>
                    </div>
                    {result.predictions.map((p, i) => (
                      <div key={i} className="mb-2 last:mb-0">
                        <div className="flex justify-between items-start gap-2">
                          <p className="text-sm font-medium">{p.task}</p>
                          <span className={`text-[10px] font-bold uppercase risk-level-${p.risk_level}`}>{p.risk_level}</span>
                        </div>
                        <p className="text-[10px] text-slate-400">{p.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Task Board */}
              <div className="glass-card flex-1">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold">Project Tasks</h3>
                  <span className="text-xs text-slate-400">{result.tasks.length} items detected</span>
                </div>
                <div className="space-y-4">
                  {result.tasks.map((task, i) => (
                    <div key={i} className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:border-indigo-500/30 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-indigo-100">{task.title}</h4>
                        <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                      </div>
                      <p className="text-xs text-slate-400 mb-4">{task.description}</p>
                      <div className="flex flex-wrap gap-4 text-[11px] text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <User size={12} className="text-indigo-400" />
                          {task.assignee || 'Unassigned'}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} className="text-indigo-400" />
                          {task.deadline || 'No deadline'}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 size={12} className="text-indigo-400" />
                          {task.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
