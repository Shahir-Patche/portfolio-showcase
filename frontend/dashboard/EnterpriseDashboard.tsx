import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ActivityPulse from '../components/ActivityPulse';
// import InfluencerDashboard from '../components/InfluencerDashboard'; // Excluded for portfolio brevity
import { supabase } from '../../lib/supabaseClient';
import {
    ComposedChart,
    Line,
    LineChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

// --- Premium UI Components ---

const ThemeToggle: React.FC = () => {
    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
        }
        return false;
    });

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.theme = 'dark';
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.theme = 'light';
        }
    }, [isDark]);

    return (
        <button
            onClick={() => setIsDark(!isDark)}
            className={`relative w-16 h-8 rounded-full p-1 transition-colors duration-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-indigo-50 border border-indigo-100'}`}
            title="Toggle Theme"
        >
            <motion.div
                layout
                className="w-6 h-6 rounded-full shadow-md flex items-center justify-center relative z-10"
                style={{ backgroundColor: isDark ? '#1e293b' : '#ffffff' }}
                initial={false}
                animate={{ x: isDark ? 32 : 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={isDark ? 'moon' : 'sun'}
                        initial={{ scale: 0.5, opacity: 0, rotate: -180 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        exit={{ scale: 0.5, opacity: 0, rotate: 180 }}
                        transition={{ duration: 0.2 }}
                    >
                        {isDark ? (
                            <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                        ) : (
                            <svg className="w-3.5 h-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        )}
                    </motion.div>
                </AnimatePresence>
            </motion.div>
        </button>
    );
};

const KPICard: React.FC<{
    title: string;
    children: React.ReactNode;
    delay?: number;
    className?: string;
}> = ({ title, children, delay = 0, className = "" }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
        className={`relative overflow-hidden p-6 rounded-3xl bg-white/70 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 shadow-sm backdrop-blur-xl ${className}`}
    >
        <h3 className="text-sm font-semibold tracking-wide text-slate-500 dark:text-slate-400 uppercase mb-4">
            {title}
        </h3>
        {children}
    </motion.div>
);

const Sparkline: React.FC<{ data: any[] }> = ({ data }) => {
    if (!data || data.length === 0) return <div className="w-24 h-10" />;

    return (
        <div className="w-24 h-10">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <Line
                        type="monotone"
                        dataKey="adherence_score"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

const TrafficLight: React.FC<{ status: 'red' | 'yellow' | 'green' }> = ({ status }) => {
    const colors = {
        red: 'bg-red-500 shadow-red-500/50',
        yellow: 'bg-yellow-500 shadow-yellow-500/50',
        green: 'bg-green-500 shadow-green-500/50',
    };

    return (
        <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-full">
            {(['green', 'yellow', 'red'] as const).map((color) => (
                <div
                    key={color}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${status === color
                        ? `${colors[color]} scale-110 shadow-lg`
                        : 'bg-slate-300 dark:bg-slate-700 opacity-30'
                        }`}
                />
            ))}
        </div>
    );
};

export const EnterpriseDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [totalUsers, setTotalUsers] = useState<number | null>(null);
    const [activeUsersCount, setActiveUsersCount] = useState<number>(0);
    const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
    const [organizationsList, setOrganizationsList] = useState<any[]>([]);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);

    // Removed Influencer Logic for Portfolio Showcase simplicity
    const [sidebarView, setSidebarView] = useState<'organizations'>('organizations');

    const [metrics, setMetrics] = useState({
        workouts: 0,
        meals: 0,
        scans: 0
    });
    // Row 2 Data
    const [chartData, setChartData] = useState<any[]>([]);
    const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
    // Row 3 Data
    const [riskRadarData, setRiskRadarData] = useState<any[]>([]);

    // New Adherence Real Data
    const [benchmark, setBenchmark] = useState<number | null>(null);
    const [adherenceHistory, setAdherenceHistory] = useState<any[]>([]);
    const [roiMetrics, setRoiMetrics] = useState({ netWeight: 0, muscleMass: 0 });
    const [industryName, setIndustryName] = useState<string>('');

    const [loadingUsers, setLoadingUsers] = useState(true);
    const [orgName, setOrgName] = useState<string>('');
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            // Mock session for portfolio viewing if no real auth
            if (!session) {
                // navigate('/login'); // Disabled for portfolio static view
                // return;
            }

            // SIMULATED DATA LOADING FOR PORTFOLIO
            // In a real app, we fetch from Supabase. Here we mock for the showcase.
            setIsSuperAdmin(true);
            setOrgName('Global Manufacturing Inc.');
            setOrganizationsList([{ id: '1', name: 'Global Manufacturing Inc.', industry: 'Industrial' }]);
            setSelectedOrgId('1');
            setIndustryName('Industrial');
            setBenchmark(85);
            setAdherenceHistory(Array.from({ length: 30 }, (_, i) => ({
                date: new Date(Date.now() - i * 86400000).toISOString(),
                adherence_score: 70 + Math.random() * 20,
                avg_recovery_score: 60 + Math.random() * 30
            })).reverse());
            setChartData(Array.from({ length: 30 }, (_, i) => ({
                name: new Date(Date.now() - (29 - i) * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                activity: 40 + Math.random() * 50,
                recovery: 50 + Math.random() * 40
            })));
            setMetrics({ workouts: 1240, meals: 3500, scans: 850 });
            setTotalUsers(150);
            setActiveUsersCount(128);
            setLeaderboardData([
                { name: 'Logistics', adherence: 92, color: '#3b82f6' },
                { name: 'Production', adherence: 88, color: '#8b5cf6' },
                { name: 'Safety', adherence: 75, color: '#ec4899' }
            ]);
            setRiskRadarData([
                { dept: 'Logistics', risks: [{ name: 'High Stress', status: 'warning', score: 65, impact: '15%', recommendation: 'Reduce shift length' }] },
                { dept: 'Production', risks: [{ name: 'High Stress', status: 'error', score: 85, impact: '30%', recommendation: 'Mandatory breaks' }] }
            ]);
            setLoadingUsers(false);
        };

        checkSession();

        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, [navigate, selectedOrgId]);

    // Derived Display Values
    const adherenceScore = totalUsers ? Math.round((activeUsersCount / totalUsers) * 100) : 0;
    const totalEngagement = metrics.workouts + metrics.meals + metrics.scans;
    const workoutPct = totalEngagement ? (metrics.workouts / totalEngagement) * 100 : 33;
    const mealPct = totalEngagement ? (metrics.meals / totalEngagement) * 100 : 33;
    const scanPct = totalEngagement ? (metrics.scans / totalEngagement) * 100 : 33;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-indigo-500/30 flex">

            {/* Super Admin Sidebar */}
            {isSuperAdmin && (
                <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-20 lg:w-64'} flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 z-50`}>
                    <div className="h-20 flex items-center justify-center relative border-b border-slate-100 dark:border-slate-800">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-lg">P</span>
                        </div>
                        <span className={`ml-3 font-bold text-slate-900 dark:text-white hidden ${isSidebarCollapsed ? '' : 'lg:block'} transition-opacity duration-200`}>
                            Admin Console
                        </span>

                        <button
                            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center shadow-sm text-slate-500 hover:text-indigo-600 hidden lg:flex"
                        >
                            <svg className={`w-3 h-3 transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto py-6 px-3 space-y-2">
                        {/* Sidebar content simplified for showcase */}
                        {sidebarView === 'organizations' && (
                            <>
                                <p className={`px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 hidden ${isSidebarCollapsed ? '' : 'lg:block'}`}>
                                    Organizations
                                </p>

                                {organizationsList.map(org => (
                                    <button
                                        key={org.id}
                                        onClick={() => setSelectedOrgId(org.id)}
                                        className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 group ${selectedOrgId === org.id
                                            ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-indigo-200 dark:ring-indigo-500/30'
                                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'}`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center transition-colors ${selectedOrgId === org.id ? 'bg-indigo-100 dark:bg-indigo-500/20' : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700'}`}>
                                            <span className="text-sm font-bold">{org.name.substring(0, 2).toUpperCase()}</span>
                                        </div>
                                        <div className={`ml-3 text-left hidden ${isSidebarCollapsed ? '' : 'lg:block'} overflow-hidden`}>
                                            <p className="text-sm font-semibold truncate max-w-[140px]">{org.name}</p>
                                        </div>
                                    </button>
                                ))}
                            </>
                        )}
                    </div>
                </aside>
            )}

            <div className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto bg-slate-50 dark:bg-slate-950">
                {/* Top Navigation Bar / Context */}
                <div className="sticky top-0 z-40 backdrop-blur-md bg-white/50 dark:bg-slate-950/50 border-b border-slate-200/50 dark:border-slate-800/50">
                    <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                                {orgName ? `${orgName}` : 'Dashboard'}
                            </h1>
                            <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mt-0.5">
                                Enterprise Overview
                            </p>
                        </div>

                        <div className="flex items-center gap-6">
                            <ThemeToggle />
                        </div>
                    </div>
                </div>

                <main className="max-w-[1600px] mx-auto px-6 py-10 space-y-8">
                    <>
                        {/* C-SUITE HUD (Row 1) */}
                        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">

                            {/* 1. Adherence Score */}
                            <KPICard title="Organizational Adherence" delay={0.1}>
                                <div className="flex items-end justify-between mb-2">
                                    <span className="text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
                                        {adherenceScore}<span className="text-3xl text-slate-400 font-normal">%</span>
                                    </span>
                                    <Sparkline data={adherenceHistory} />
                                </div>
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    {benchmark !== null ? (
                                        <>
                                            <span className={`${adherenceScore >= benchmark ? 'text-emerald-500' : 'text-rose-500'} flex items-center`}>
                                                <svg className={`w-4 h-4 mr-0.5 ${adherenceScore < benchmark ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11.586 10l2.414-2.414H12z" clipRule="evenodd" />
                                                </svg>
                                                {Math.abs(adherenceScore - benchmark).toFixed(1)}%
                                            </span>
                                            <span className="text-slate-400">vs {industryName || 'Industry'} Avg</span>
                                        </>
                                    ) : (
                                        <span className="text-slate-400">Loading benchmark...</span>
                                    )}
                                </div>
                            </KPICard>

                            {/* 2. Total Engagement Volume */}
                            <KPICard title="Engagement Volume" delay={0.2}>
                                <div className="mb-4">
                                    <span className="text-4xl font-bold text-slate-900 dark:text-white">
                                        {totalEngagement.toLocaleString()}
                                    </span>
                                    <span className="text-slate-500 ml-2 text-sm">activities</span>
                                </div>
                                <div className="space-y-2">
                                    {/* Distribution Bar */}
                                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full flex overflow-hidden">
                                        <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${workoutPct}%` }} />
                                        <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${mealPct}%` }} />
                                        <div className="h-full bg-violet-500 transition-all duration-1000" style={{ width: `${scanPct}%` }} />
                                    </div>
                                </div>
                            </KPICard>

                            {/* 3. Net Weight Change */}
                            <KPICard title="Net Weight Change" delay={0.3}>
                                <div className="h-full flex flex-col justify-center">
                                    <p className="text-4xl font-bold text-slate-900 dark:text-white mb-1">
                                        {roiMetrics.netWeight > 0 ? '+' : ''}{roiMetrics.netWeight}<span className="text-xl text-slate-400 font-normal">lbs</span>
                                    </p>
                                    <p className={`text-xs font-semibold ${roiMetrics.netWeight <= 0 ? 'text-emerald-500' : 'text-rose-500'} flex items-center`}>
                                        Aggregate Loss
                                    </p>
                                </div>
                            </KPICard>

                            {/* 4. Muscle Mass Gain */}
                            <KPICard title="Muscle Mass" delay={0.35}>
                                <div className="h-full flex flex-col justify-center">
                                    <p className="text-4xl font-bold text-slate-900 dark:text-white mb-1">
                                        {roiMetrics.muscleMass > 0 ? '+' : ''}{roiMetrics.muscleMass}<span className="text-xl font-normal text-slate-400">%</span>
                                    </p>
                                    <p className="text-xs font-semibold text-emerald-500 flex items-center">
                                        Avg Increase
                                    </p>
                                </div>
                            </KPICard>

                            {/* 4. Burnout Risk Flag */}
                            <KPICard title="Burnout Risk" delay={0.4} className="border-l-4 border-l-yellow-500"> {/* Accent border */}
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <span className="text-4xl font-bold text-slate-900 dark:text-white">3</span>
                                        <span className="text-base text-slate-500 font-medium ml-2">Teams at risk</span>
                                    </div>
                                    <TrafficLight status="yellow" />
                                </div>
                            </KPICard>
                        </section>

                        {/* --- Row 2: Deep Dive Analytics (Split View) --- */}
                        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                            {/* Left Panel: Adherence vs Burnout Correlation */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.4 }}
                                className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Adherence vs. Burnout Correlation</h3>
                                        <p className="text-sm text-slate-500">Visualizing high-activity / low-recovery zones</p>
                                    </div>
                                </div>

                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={chartData}>
                                            <defs>
                                                <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                                            <YAxis yAxisId="left" orientation="left" fontSize={10} tickLine={false} axisLine={false} />
                                            <YAxis yAxisId="right" orientation="right" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                labelStyle={{ color: '#64748b', fontWeight: 'bold' }}
                                            />
                                            <Area yAxisId="left" type="monotone" dataKey="activity" stroke="#3b82f6" fillOpacity={1} fill="url(#colorActivity)" strokeWidth={3} />
                                            <Line yAxisId="right" type="monotone" dataKey="recovery" stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                            </motion.div>

                            {/* Right Panel: Department Leaderboard */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 }}
                                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col"
                            >
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Department Leaderboard</h3>
                                <p className="text-sm text-slate-500 mb-6">Engagement Scores by Team</p>

                                <div className="flex-1 space-y-5">
                                    {leaderboardData.map((dept, index) => (
                                        <div key={index} className="space-y-2">
                                            <div className="flex justify-between text-sm font-medium">
                                                <span className="text-slate-700 dark:text-slate-200">{dept.name}</span>
                                                <span className="text-slate-900 dark:text-white">{dept.adherence}%</span>
                                            </div>
                                            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${dept.adherence}%` }}
                                                    transition={{ duration: 1, delay: 0.5 + (index * 0.1) }}
                                                    className="h-full rounded-full"
                                                    style={{ backgroundColor: dept.color || '#3b82f6' }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>

                        </section>

                        <section>
                            <div className="mb-6 flex items-end justify-between">
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Risk Radar</h3>
                                    <p className="text-slate-500">Privacy-Safe Intervention Map</p>
                                </div>
                            </div>
                            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto">
                                {/* Simplified Risk Radar display for portfolio */}
                                <div className="grid grid-cols-2 gap-4">
                                    {riskRadarData.map((d: any, i) => (
                                        <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                            <h4 className="font-bold text-lg">{d.dept}</h4>
                                            {d.risks.map((r: any, j: number) => (
                                                <div key={j} className="mt-2 text-sm">
                                                    <span className="font-semibold text-red-500">{r.name}</span>: {r.score} (Impact: {r.impact})
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* --- Row 5: Live Activity Feed (Organization Pulse) --- */}
                        <section className="mt-8 mb-8">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                {selectedOrgId && <ActivityPulse orgId={selectedOrgId} />}
                            </motion.div>
                        </section>
                    </>
                </main>
            </div>
        </div>
    );
};
