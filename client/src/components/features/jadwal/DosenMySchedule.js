import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
  Calendar,
  Clock,
  MapPin,
  Book,
  Users,
  AlertCircle,
  Download,
  ChevronDown,
  ChevronUp,
  Award
} from 'lucide-react';
import { BUTTON, ALERT, BADGE, TIME_SLOT, CARD } from '../../../constants/colors';

// ===================================
// CONSTANTS
// ===================================
const HARI_ORDER = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
const API_BASE_URL = 'http://localhost:5000/api/schedule-validation';

const TIME_COLOR_MAP = [
  { limit: 10, class: TIME_SLOT.morning },
  { limit: 13, class: TIME_SLOT.midday },
  { limit: 16, class: TIME_SLOT.afternoon },
  { limit: 24, class: TIME_SLOT.evening }
];

const DAY_COLOR_MAP = {
  SENIN: 'border-l-blue-500',
  SELASA: 'border-l-green-500',
  RABU: 'border-l-yellow-500',
  KAMIS: 'border-l-red-500',
  JUMAT: 'border-l-purple-500',
  SABTU: 'border-l-pink-500'
};

// ===================================
// UTILITY FUNCTIONS
// ===================================
const getTimeColor = (jamMulai) => {
  const hour = parseInt(jamMulai.split(':')[0]);
  return TIME_COLOR_MAP.find(({ limit }) => hour < limit)?.class || TIME_COLOR_MAP[TIME_COLOR_MAP.length - 1].class;
};

const getDayColor = (hari) => DAY_COLOR_MAP[hari] || 'border-l-gray-500';

const getWorkloadColor = (currentSKS, maxSKS) => {
  const percentage = (currentSKS / maxSKS) * 100;
  if (percentage > 100) return 'text-red-600';
  if (percentage >= 80) return 'text-yellow-600';
  return 'text-green-600';
};

const downloadJSON = (data, filename) => {
  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = window.URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
};

// ===================================
// SUB-COMPONENTS
// ===================================
const LoadingState = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Memuat jadwal mengajar...</p>
    </div>
  </div>
);

const ErrorState = ({ error, onRetry }) => (
  <div className="p-6">
    <div className={ALERT.error}>
      <div className={`flex items-center gap-2 ${ALERT.errorText}`}>
        <AlertCircle size={20} className={ALERT.errorIcon} />
        <p className="font-semibold">Error</p>
      </div>
      <p className={`${ALERT.errorText} mt-2`}>{error}</p>
      <button
        onClick={onRetry}
        className={`mt-4 ${BUTTON.danger}`}
      >
        Coba Lagi
      </button>
    </div>
  </div>
);

const EmptyState = () => (
  <div className="p-6">
    <div className={`${ALERT.warning} text-center`}>
      <Calendar size={48} className={`mx-auto ${ALERT.warningIcon} mb-4`} />
      <h3 className={`text-lg font-semibold ${ALERT.warningText}`}>Belum Ada Jadwal Mengajar</h3>
      <p className={`${ALERT.warningText} mt-2`}>
        Anda belum memiliki jadwal mengajar yang disetujui untuk semester ini.
      </p>
    </div>
  </div>
);

const SummaryCard = ({ icon: Icon, label, value }) => (
  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
    <div className="flex items-center gap-2 mb-2">
      <Icon size={20} />
      <span className="text-sm text-blue-100">{label}</span>
    </div>
    <p className="text-3xl font-bold">{value}</p>
  </div>
);

const ScheduleDetailItem = ({ icon: Icon, text, size = 16 }) => (
  <div className="flex items-center gap-2 text-gray-600">
    <Icon size={size} />
    <span>{text}</span>
  </div>
);

const ScheduleCard = ({ schedule, showProdi = false }) => (
  <div className={`${CARD.hover} border border-gray-200`}>
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-2">
        <h4 className="text-lg font-bold text-gray-900">
          {schedule.mataKuliah.nama}
        </h4>
        <span className={BADGE.gray}>
          Kelas {schedule.kelas}
        </span>
      </div>
      <span className={`px-2 py-1 rounded text-xs font-medium ${getTimeColor(schedule.jamMulai)}`}>
        {schedule.jamMulai} - {schedule.jamSelesai}
      </span>
    </div>

    <div className="space-y-2 text-sm text-gray-600">
      <div className="flex items-center gap-6">
        <span className="flex items-center gap-1">
          <Book size={14} />
          {schedule.mataKuliah.sks} SKS
        </span>
        <span className="flex items-center gap-1">
          <MapPin size={14} />
          {schedule.ruangan.nama}
        </span>
      </div>
    </div>
  </div>
);

const WeeklyView = ({ scheduleByDay }) => (
  <div className="space-y-3">
    {HARI_ORDER.map(hari => {
      const daySchedules = scheduleByDay[hari] || [];
      if (daySchedules.length === 0) return null;

      return (
        <div key={hari} className="bg-white rounded-lg shadow overflow-hidden">
          <div className={`border-l-4 ${getDayColor(hari)} bg-gray-50 px-4 py-2 flex items-center justify-between`}>
            <h3 className="text-lg font-bold text-gray-800">{hari}</h3>
            <span className="text-sm text-gray-600">{daySchedules.length} kelas</span>
          </div>

          <div className="p-4 space-y-3">
            {daySchedules.map((schedule, idx) => (
              <ScheduleCard key={idx} schedule={schedule} showProdi />
            ))}
          </div>
        </div>
      );
    })}
  </div>
);

const PeriodView = ({ scheduleByPeriod, maxSKS, expandedPeriods, onToggle }) => (
  <div className="space-y-3">
    {Object.entries(scheduleByPeriod).map(([periodKey, periodData]) => {
      const isExpanded = expandedPeriods[periodKey] !== false;

      return (
        <div key={periodKey} className="bg-white rounded-lg shadow overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-50 to-white px-4 py-3 cursor-pointer hover:bg-blue-100 transition-colors"
            onClick={() => onToggle(periodKey)}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-800">{periodKey}</h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                  <span>{periodData.totalMataKuliah} mata kuliah</span>
                  <span>•</span>
                  <span className="font-semibold">{periodData.totalSKS} SKS</span>
                  <span>•</span>
                  <span>{Math.round(periodData.totalJamMengajar / 60)} jam/minggu</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`text-sm font-bold ${getWorkloadColor(periodData.totalSKS, maxSKS)}`}>
                  {periodData.totalSKS}/{maxSKS}
                </span>
                {isExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
              </div>
            </div>
          </div>

          {isExpanded && (
            <div className="p-4">
              <div className="space-y-2">
                {periodData.schedules.map((schedule, idx) => (
                  <div key={idx} className="bg-gray-50 rounded p-3 border border-gray-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-700 text-sm">{schedule.hari}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTimeColor(schedule.jamMulai)}`}>
                          {schedule.jamMulai}-{schedule.jamSelesai}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">{schedule.mataKuliah.sks} SKS</span>
                    </div>

                    <h4 className="font-semibold text-gray-900 text-sm mb-2">
                      {schedule.mataKuliah.nama}
                    </h4>

                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <Users size={12} />
                        {schedule.kelas}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {schedule.ruangan.nama}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    })}
  </div>
);

// ===================================
// MAIN COMPONENT
// ===================================
const DosenMySchedule = ({ authToken, currentUser }) => {
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('weekly');
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [expandedPeriods, setExpandedPeriods] = useState({});

  const fetchMySchedule = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${API_BASE_URL}/my-teaching-schedule`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (response.data.success) {
        setScheduleData(response.data.data);
        const periods = Object.keys(response.data.data.scheduleByPeriod);
        if (periods.length > 0) setSelectedPeriod(periods[0]);
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
      setError(error.response?.data?.message || 'Gagal mengambil jadwal mengajar');
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    fetchMySchedule();
  }, [fetchMySchedule]);

  const exportSchedule = async () => {
    try {
      const periodId = selectedPeriod && scheduleData?.scheduleByPeriod[selectedPeriod]?.periodId;
      const response = await axios.get(`${API_BASE_URL}/my-teaching-schedule/export`, {
        params: { periodId },
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (response.data.success) {
        downloadJSON(response.data.data, `jadwal-mengajar-${scheduleData.dosen.nama}-${Date.now()}.json`);
      }
    } catch (error) {
      console.error('Error exporting schedule:', error);
      alert('Gagal export jadwal');
    }
  };

  const togglePeriod = useCallback((periodKey) => {
    setExpandedPeriods(prev => ({ ...prev, [periodKey]: !prev[periodKey] }));
  }, []);

  const summaryCards = useMemo(() => [
    { icon: Book, label: 'Total Jadwal', value: scheduleData?.summary.totalScheduleItems },
    { icon: Award, label: 'Periode Aktif', value: scheduleData?.summary.totalPeriods },
    { icon: Clock, label: 'Maks SKS', value: `${scheduleData?.summary.maxSKSPerSemester} SKS` }
  ], [scheduleData]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={fetchMySchedule} />;
  if (!scheduleData || scheduleData.summary.totalScheduleItems === 0) return <EmptyState />;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Jadwal Mengajar Saya</h1>
            <p className="text-sm text-gray-600 mt-1">
              {scheduleData.dosen.nama} • {scheduleData.dosen.prodi}
            </p>
          </div>
          <button
            onClick={exportSchedule}
            className={`flex items-center gap-2 text-sm ${BUTTON.primary}`}
          >
            <Download size={16} />
            <span>Export</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-100">
            <p className="text-2xl font-bold text-blue-600">{scheduleData.summary.totalScheduleItems}</p>
            <p className="text-xs text-gray-600 mt-1">Total Jadwal</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center border border-green-100">
            <p className="text-2xl font-bold text-green-600">{scheduleData.summary.totalPeriods}</p>
            <p className="text-xs text-gray-600 mt-1">Periode Aktif</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center border border-purple-100">
            <p className="text-2xl font-bold text-purple-600">{scheduleData.summary.maxSKSPerSemester}</p>
            <p className="text-xs text-gray-600 mt-1">Maks SKS</p>
          </div>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex gap-2 mb-4">
        {[
          { mode: 'weekly', label: 'Mingguan' },
          { mode: 'period', label: 'Per Periode' }
        ].map(({ mode, label }) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === mode
                ? BUTTON.primary
                : BUTTON.secondary
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Views */}
      {viewMode === 'weekly' ? (
        <WeeklyView scheduleByDay={scheduleData.scheduleByDay} />
      ) : (
        <PeriodView
          scheduleByPeriod={scheduleData.scheduleByPeriod}
          maxSKS={scheduleData.dosen.maxSKS}
          expandedPeriods={expandedPeriods}
          onToggle={togglePeriod}
        />
      )}
    </div>
  );
};

export default DosenMySchedule;
