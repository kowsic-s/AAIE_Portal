import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { getStudentDashboard } from '../../api/student';
import { useWhatIf } from '../../hooks/usePrediction';
import RiskBadge from '../../components/RiskBadge';

const RISK_TO_SCORE = { High: 78, Medium: 48, Low: 20 };

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const toPercentage = (value) => {
  const num = Number(value ?? 0);
  return clamp(Math.round(num * 100), 0, 100);
};

export default function StudentWhatIfPage() {
  const { data } = useQuery({
    queryKey: ['student-dashboard'],
    queryFn: getStudentDashboard,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
  const whatIfMut = useWhatIf();

  const d = data?.data ?? {};
  const pred = d.latest_prediction ?? d.prediction ?? {};
  const perf = d.latest_performance ?? {};
  const currentRiskLabel = pred?.risk_level ?? whatIfMut.data?.current_risk ?? 'Medium';
  const currentRiskScore = RISK_TO_SCORE[currentRiskLabel] ?? 48;

  const [attendance, setAttendance] = useState(80);
  const [gpa, setGpa] = useState(7.0);
  const [rewardPoints, setRewardPoints] = useState(40);
  const [activityPoints, setActivityPoints] = useState(30);
  const [initialized, setInitialized] = useState(false);
  const [autoSimulated, setAutoSimulated] = useState(false);

  useEffect(() => {
    if (!initialized && perf) {
      setAttendance(Number(perf.attendance_pct ?? 80));
      setGpa(Number(perf.gpa ?? 7.0));
      setRewardPoints(Number(perf.reward_points ?? 40));
      setActivityPoints(Number(perf.activity_points ?? 30));
      setInitialized(true);
    }
  }, [perf, initialized]);

  const payload = useMemo(
    () => ({
      attendance_pct: Number(attendance),
      gpa: Number(gpa),
      reward_points: Number(rewardPoints),
      activity_points: Number(activityPoints),
    }),
    [attendance, gpa, rewardPoints, activityPoints]
  );

  useEffect(() => {
    if (initialized && !autoSimulated && !whatIfMut.isPending) {
      whatIfMut.mutate(payload);
      setAutoSimulated(true);
    }
  }, [initialized, autoSimulated, payload, whatIfMut]);

  const simulation = whatIfMut.data ?? null;
  const projectedRiskLabel = simulation?.projected_risk ?? currentRiskLabel;
  const projectedRiskScore = RISK_TO_SCORE[projectedRiskLabel] ?? currentRiskScore;
  const confidencePct = toPercentage(simulation?.projected_confidence ?? pred?.confidence ?? 0);

  const projectionData = [
    { point: 'Current', score: currentRiskScore },
    { point: 'Simulated', score: projectedRiskScore },
  ];

  const probabilityBreakdown = simulation?.probability_breakdown ?? {};
  const probabilityData = [
    {
      name: 'Low',
      value: toPercentage(
        probabilityBreakdown.low ?? probabilityBreakdown.Low ?? probabilityBreakdown.prob_low
      ),
    },
    {
      name: 'Medium',
      value: toPercentage(
        probabilityBreakdown.medium ??
          probabilityBreakdown.Medium ??
          probabilityBreakdown.prob_medium
      ),
    },
    {
      name: 'High',
      value: toPercentage(
        probabilityBreakdown.high ?? probabilityBreakdown.High ?? probabilityBreakdown.prob_high
      ),
    },
  ];

  const runSimulation = () => {
    whatIfMut.mutate(payload);
  };

  const resetToCurrent = () => {
    setAttendance(Number(perf.attendance_pct ?? 80));
    setGpa(Number(perf.gpa ?? 7.0));
    setRewardPoints(Number(perf.reward_points ?? 40));
    setActivityPoints(Number(perf.activity_points ?? 30));
  };

  return (
    <div className="student-page">
      <section className="student-kpis">
        <article className="student-kpi">
          <header>
            <h3>Current Risk</h3>
          </header>
          <div style={{ marginTop: '0.3rem' }}>
            <RiskBadge level={currentRiskLabel} size="md" />
          </div>
          <p className="student-kpi-subtext">From your latest prediction</p>
        </article>

        <article className="student-kpi">
          <header>
            <h3>Projected Risk</h3>
          </header>
          <div style={{ marginTop: '0.3rem' }}>
            <RiskBadge level={projectedRiskLabel} size="md" />
          </div>
          <p className="student-kpi-subtext">Live result from What-If simulation</p>
        </article>

        <article className="student-kpi">
          <header>
            <h3>Projected Confidence</h3>
          </header>
          <div className="student-kpi-value student-whatif-value">{confidencePct}%</div>
          <p className="student-kpi-subtext">
            {simulation?.projected_confidence_tier || pred?.confidence_tier || 'Estimated'}
          </p>
        </article>
      </section>

      <section className="student-grid student-grid-2">
        <motion.article
          className="student-shell"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="student-shell-header">
            <div>
              <h2 className="student-shell-title">Scenario Controls</h2>
              <p className="student-shell-subtitle">
                Update academic metrics and run simulation.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn-secondary" onClick={resetToCurrent}>
                Reset
              </button>
              <button className="btn-primary" onClick={runSimulation} disabled={whatIfMut.isPending}>
                {whatIfMut.isPending ? 'Simulating...' : 'Run Simulation'}
              </button>
            </div>
          </div>

          <div className="student-shell-body" style={{ display: 'grid', gap: '1rem' }}>
            <label className="student-control">
              <div className="student-control-head">
                <span>Attendance</span>
                <strong>{attendance.toFixed(1)}%</strong>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="0.5"
                value={attendance}
                onChange={(e) => setAttendance(Number(e.target.value))}
              />
            </label>

            <label className="student-control">
              <div className="student-control-head">
                <span>GPA</span>
                <strong>{gpa.toFixed(2)}</strong>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="0.01"
                value={gpa}
                onChange={(e) => setGpa(Number(e.target.value))}
              />
            </label>

            <label className="student-control">
              <div className="student-control-head">
                <span>Reward Points</span>
                <strong>{rewardPoints}</strong>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                step="1"
                value={rewardPoints}
                onChange={(e) => setRewardPoints(Number(e.target.value))}
              />
            </label>

            <label className="student-control">
              <div className="student-control-head">
                <span>Activity Points</span>
                <strong>{activityPoints}</strong>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                step="1"
                value={activityPoints}
                onChange={(e) => setActivityPoints(Number(e.target.value))}
              />
            </label>

            {whatIfMut.isError && (
              <p style={{ color: 'var(--risk-high)', fontSize: '0.78rem' }}>
                Simulation failed. Check values and try again.
              </p>
            )}
          </div>
        </motion.article>

        <motion.article
          className="student-shell"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          <div className="student-shell-header">
            <div>
              <h2 className="student-shell-title">Risk Projection</h2>
              <p className="student-shell-subtitle">
                Comparison between current and simulated risk profile.
              </p>
            </div>
          </div>

          <div className="student-shell-body" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectionData}>
                <defs>
                  <linearGradient id="studentRiskFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.38} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="point" stroke="var(--text-2)" />
                <YAxis stroke="var(--text-2)" domain={[0, 100]} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  fill="url(#studentRiskFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.article>
      </section>

      <section className="student-shell">
        <div className="student-shell-header">
          <div>
            <h2 className="student-shell-title">Probability Breakdown</h2>
            <p className="student-shell-subtitle">
              Distribution from the simulation output.
            </p>
          </div>
        </div>

        <div className="student-shell-body" style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={probabilityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--text-2)" />
                <YAxis domain={[0, 100]} stroke="var(--text-2)" />
                <Tooltip formatter={(value) => `${value}%`} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="var(--accent)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="student-list-row">
            <strong>Summary</strong>
            <span>
              {simulation?.explanation ||
                'Run the simulation to get AI-generated insight for this scenario.'}
            </span>
          </div>

          <div style={{ marginTop: '0.25rem' }}>
            <Link className="student-quick-link" to="/student/recommendations">
              Get Action Recommendations
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
