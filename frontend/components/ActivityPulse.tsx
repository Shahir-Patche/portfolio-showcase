import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';

interface ActivityItem {
    activity_type: 'workout' | 'meal' | 'scan';
    user_id: string;
    activity_id: string;
    description: string;
    created_at: string;
    display_name: string;
    avatar_url: string | null;
    department: string | null;
}

interface ActivityPulseProps {
    orgId: string;
}

const ActivityPulse: React.FC<ActivityPulseProps> = ({ orgId }) => {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchActivity = async () => {
        if (!orgId) return;

        // In a real scenario, this fetches from a secure view
        const { data, error } = await supabase
            .from('activity_feed_view')
            .select('*')
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false })
            .limit(10);

        if (data) {
            setActivities(data as ActivityItem[]);
        } else {
            console.error('Error fetching activity:', error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchActivity();

        // Poll every 30 seconds for "Live" feel without heavy realtime subscription overhead
        const interval = setInterval(fetchActivity, 30000);
        return () => clearInterval(interval);
    }, [orgId]);

    const getTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        return `${Math.floor(diffInHours / 24)}d ago`;
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'workout':
                return (
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                );
            case 'meal':
                return (
                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                );
            case 'scan':
                return (
                    <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                        </svg>
                    </div>
                );
            default:
                return null;
        }
    };

    if (loading && activities.length === 0) return (
        <div className="w-full p-8 text-center text-slate-400 text-sm animate-pulse">Loading activity feed...</div>
    );

    if (activities.length === 0) return (
        <div>
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Live Organization Pulse</h3>
                    <p className="text-sm text-slate-500">No recent activity found</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        Live Organization Pulse
                    </h3>
                    <p className="text-sm text-slate-500">Real-time engagement feed across all departments</p>
                </div>
                <span className="text-xs font-medium px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500">
                    Live Updates
                </span>
            </div>

            <div className="p-4 max-h-[400px] overflow-y-auto">
                <AnimatePresence initial={false}>
                    {activities.map((activity) => (
                        <motion.div
                            key={activity.activity_id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                            className="p-3 mb-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center gap-4 group"
                        >
                            {/* Avatar */}
                            <div className="relative">
                                {activity.avatar_url ? (
                                    <img src={activity.avatar_url} alt={activity.display_name} className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-sm" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 font-bold border-2 border-white dark:border-slate-800 shadow-sm">
                                        {activity.display_name?.charAt(0) || '?'}
                                    </div>
                                )}
                                <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-full p-0.5 shadow-sm">
                                    {getIcon(activity.activity_type)}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                        {activity.display_name}
                                    </h4>
                                    <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                                        {getTimeAgo(activity.created_at)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                    <span className="truncate">{activity.description}</span>
                                    {activity.department && (
                                        <span className="text-[10px] uppercase font-bold text-slate-400 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                                            {activity.department}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ActivityPulse;
