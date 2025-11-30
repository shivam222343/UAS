import React from 'react';

/**
 * Reusable skeleton loader components for progressive loading
 */

export const SkeletonCard = ({ className = '' }) => (
    <div className={`animate-pulse ${className}`}>
        <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-6">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
        </div>
    </div>
);

export const SkeletonStatCard = () => (
    <div className="animate-pulse bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center">
            <div className="p-3 bg-gray-200 dark:bg-gray-700 rounded-full w-12 h-12"></div>
            <div className="ml-4 flex-1">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
            </div>
        </div>
    </div>
);

export const SkeletonTable = ({ rows = 5 }) => (
    <div className="animate-pulse space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center p-4 border dark:border-gray-700 rounded-lg">
                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="ml-4 flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                </div>
            </div>
        ))}
    </div>
);

export const SkeletonChart = ({ height = 'h-64' }) => (
    <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg ${height}`}>
        <div className="flex items-end justify-around h-full p-4">
            {[60, 80, 40, 90, 70].map((h, i) => (
                <div
                    key={i}
                    className="bg-gray-300 dark:bg-gray-600 rounded-t w-12"
                    style={{ height: `${h}%` }}
                ></div>
            ))}
        </div>
    </div>
);

export const SkeletonText = ({ lines = 3, className = '' }) => (
    <div className={`animate-pulse space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
            <div
                key={i}
                className="h-4 bg-gray-200 dark:bg-gray-700 rounded"
                style={{ width: i === lines - 1 ? '60%' : '100%' }}
            ></div>
        ))}
    </div>
);

export const SkeletonMeetingCard = () => (
    <div className="animate-pulse p-4 border dark:border-gray-700 rounded-lg">
        <div className="flex items-center justify-between mb-3">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20"></div>
        </div>
        <div className="space-y-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/5"></div>
        </div>
    </div>
);

export const SkeletonMemberCard = () => (
    <div className="animate-pulse px-6 py-4 border-b dark:border-gray-700">
        <div className="flex items-center">
            <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="ml-4 flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
            </div>
            <div className="flex gap-2">
                <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            </div>
        </div>
    </div>
);

export default {
    SkeletonCard,
    SkeletonStatCard,
    SkeletonTable,
    SkeletonChart,
    SkeletonText,
    SkeletonMeetingCard,
    SkeletonMemberCard
};
