/**
 * Utility untuk menghitung pembagian nominal pembayaran per mata kuliah
 * Menggunakan metode: Tarif Standar (300k/SKS) + Selisih Proporsional
 */

const TARIF_PER_SKS = 300000; // Tarif standar per SKS

/**
 * Menghitung nominal per mata kuliah berdasarkan tarif standar + selisih proporsional
 * @param {number} totalNominal - Total nominal pembayaran
 * @param {Array} details - Array detail mata kuliah dengan property sks
 * @returns {Array} Array dengan nominal per detail
 */
export const calculateNominalPerDetail = (totalNominal, details) => {
  if (!details || details.length === 0) {
    return [];
  }

  // 1. Hitung total SKS dengan berbagai format data
  const totalSKS = details.reduce((sum, detail) => {
    // Handle berbagai format: detail.mataKuliah.sks atau detail.sks
    let sks = 0;
    if (detail.mataKuliah && typeof detail.mataKuliah === 'object') {
      sks = detail.mataKuliah.sks || 0;
    } else if (typeof detail.sks === 'number') {
      sks = detail.sks;
    }
    return sum + sks;
  }, 0);

  if (totalSKS === 0) {
    return details.map(() => 0);
  }

  // 2. Hitung biaya standar per mata kuliah
  const standardCosts = details.map(detail => {
    let sks = 0;
    if (detail.mataKuliah && typeof detail.mataKuliah === 'object') {
      sks = detail.mataKuliah.sks || 0;
    } else if (typeof detail.sks === 'number') {
      sks = detail.sks;
    }
    return sks * TARIF_PER_SKS;
  });

  // 3. Hitung total biaya standar
  const totalStandardCost = standardCosts.reduce((sum, cost) => sum + cost, 0);

  // 4. Hitung selisih antara pembayaran aktual dengan biaya standar
  const difference = totalNominal - totalStandardCost;

  // 5. Bagi selisih secara proporsional berdasarkan SKS
  const differencePerSKS = difference / totalSKS;

  // 6. Hitung nominal final per mata kuliah = standar + selisih proporsional
  const nominalPerDetail = details.map((detail, index) => {
    let sks = 0;
    if (detail.mataKuliah && typeof detail.mataKuliah === 'object') {
      sks = detail.mataKuliah.sks || 0;
    } else if (typeof detail.sks === 'number') {
      sks = detail.sks;
    }
    const standardCost = standardCosts[index];
    const proportionalDifference = sks * differencePerSKS;
    return standardCost + proportionalDifference;
  });

  return nominalPerDetail;
};

/**
 * Menghitung nominal untuk satu mata kuliah
 * @param {number} totalNominal - Total nominal pembayaran
 * @param {number} sks - SKS mata kuliah ini
 * @param {number} totalSKS - Total SKS dari semua mata kuliah
 * @returns {number} Nominal untuk mata kuliah ini
 */
export const calculateNominalForSingleMK = (totalNominal, sks, totalSKS) => {
  if (totalSKS === 0) return 0;

  // 1. Hitung biaya standar
  const standardCost = sks * TARIF_PER_SKS;

  // 2. Hitung total biaya standar (dibutuhkan untuk menghitung selisih)
  // Catatan: ini adalah estimasi, karena kita tidak tahu total SKS dari pengajuan
  // Untuk akurasi penuh, gunakan calculateNominalPerDetail
  const estimatedTotalStandardCost = totalSKS * TARIF_PER_SKS;

  // 3. Hitung selisih
  const difference = totalNominal - estimatedTotalStandardCost;

  // 4. Bagi selisih proporsional
  const differencePerSKS = difference / totalSKS;
  const proportionalDifference = sks * differencePerSKS;

  // 5. Return standar + selisih
  return standardCost + proportionalDifference;
};

/**
 * Menghitung informasi detail pembayaran untuk display
 * @param {number} nominal - Nominal pembayaran untuk mata kuliah ini
 * @param {number} sks - SKS mata kuliah ini
 * @returns {Object} Object dengan informasi detail
 */
export const getPaymentInfo = (nominal, sks) => {
  const standardCost = sks * TARIF_PER_SKS;
  const difference = nominal - standardCost;
  const differencePerSKS = sks > 0 ? difference / sks : 0;

  return {
    nominal,
    sks,
    standardCost,
    difference,
    differencePerSKS,
    effectiveRatePerSKS: sks > 0 ? nominal / sks : 0
  };
};

export { TARIF_PER_SKS };

