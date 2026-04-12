import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

export default function Stats() {
  const { api } = useAuth();
  const [activityData, setActivityData] = useState([]);
  const [sleepData, setSleepData] = useState([]);
  const [assessmentStats, setAssessmentStats] = useState([]);

  useEffect(() => {
    Promise.all([
      api('/admin/stats/activity-overview?days=30'),
      api('/admin/stats/sleep-overview?days=30'),
      api('/admin/stats/assessment-overview'),
    ]).then(([act, sleep, assess]) => {
      if (act.success) setActivityData([...act.data].reverse());
      if (sleep.success) setSleepData([...sleep.data].reverse());
      if (assess.success) setAssessmentStats(assess.data);
    }).catch(console.error);
  }, []);

  const activityChartData = {
    labels: activityData.map((d) => d.date),
    datasets: [{
      label: 'متوسط الخطوات',
      data: activityData.map((d) => Math.round(d.avg_steps || 0)),
      borderColor: '#1197CC',
      backgroundColor: 'rgba(17, 151, 204, 0.1)',
      tension: 0.3,
      fill: true,
    }],
  };

  const sleepChartData = {
    labels: sleepData.map((d) => d.date),
    datasets: [{
      label: 'متوسط ساعات النوم',
      data: sleepData.map((d) => ((d.avg_duration || 0) / 60).toFixed(1)),
      backgroundColor: '#9333EA',
      borderRadius: 4,
    }],
  };

  const chartOptions = { responsive: true, plugins: { legend: { display: false } } };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">الإحصائيات</h1>
      <p className="text-gray-500 mb-8">تحليلات مفصلة عن البيانات</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">النشاط اليومي (آخر 30 يوم)</h3>
          {activityData.length > 0 ? (
            <Line data={activityChartData} options={chartOptions} />
          ) : (
            <div className="text-center text-gray-400 py-12">لا توجد بيانات</div>
          )}
        </div>

        {/* Sleep Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">جودة النوم</h3>
          {sleepData.length > 0 ? (
            <Bar data={sleepChartData} options={chartOptions} />
          ) : (
            <div className="text-center text-gray-400 py-12">لا توجد بيانات</div>
          )}
        </div>

        {/* Assessment Stats */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="font-bold text-gray-800 mb-4">نتائج الاختبارات</h3>
          {assessmentStats.length > 0 ? (
            <div className="space-y-3">
              {assessmentStats.map((a) => (
                <div key={a.id} className="border border-gray-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{a.title_ar || a.title}</div>
                    <div className="text-sm text-gray-600">
                      {a.unique_users} مستخدم · {a.total_sessions} جلسة
                    </div>
                  </div>
                  {/* Score bar */}
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div className="bg-primary-500 h-full rounded-full transition-all" style={{ width: `${a.avg_score || 0}%` }} />
                    </div>
                    <div className="flex gap-4 text-xs text-gray-500">
                      <span>متوسط: <strong className="text-primary-500">{(a.avg_score || 0).toFixed(0)}%</strong></span>
                      <span>أقل: <strong>{(a.min_score || 0).toFixed(0)}%</strong></span>
                      <span>أعلى: <strong>{(a.max_score || 0).toFixed(0)}%</strong></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">لا توجد بيانات اختبارات</div>
          )}
        </div>
      </div>
    </div>
  );
}
