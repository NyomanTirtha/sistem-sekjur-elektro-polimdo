import React from 'react';
import { Clock, AlertCircle, GraduationCap, CheckCircle, XCircle } from 'lucide-react';
import { STATUS_CONFIG } from '../../constants/pengajuanSAConstants';

const StatusBadge = ({ status }) => {
  const iconMap = {
    'PROSES_PENGAJUAN': Clock,
    'MENUNGGU_VERIFIKASI_KAPRODI': AlertCircle,
    'DALAM_PROSES_SA': GraduationCap,
    'SELESAI': CheckCircle,
    'DITOLAK': XCircle
  };

  const config = STATUS_CONFIG[status] || STATUS_CONFIG['PROSES_PENGAJUAN'];
  const Icon = iconMap[status] || Clock;

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}>
      {status === 'SELESAI' ? config.text : (
        <>
          <Icon className="w-4 h-4 mr-1" />
          {config.text}
        </>
      )}
    </span>
  );
};

export default StatusBadge;