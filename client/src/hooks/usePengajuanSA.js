// hooks/usePengajuanSA.js - FIXED DOSEN LOGIC
import { useState, useEffect, useCallback } from "react";
import { calculateNominalPerDetail } from "../utils/helper/nominalCalculator";

export const usePengajuanSA = (authToken, userType, currentUser) => {
  const [pengajuanList, setPengajuanList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dosenList, setDosenList] = useState([]);
  const [mataKuliahList, setMataKuliahList] = useState([]);
  const [filterStatus, setFilterStatus] = useState("ALL");

  const fetchPengajuanSA = useCallback(async () => {
    try {
      let url = "http://localhost:5000/api/pengajuan-sa";

      if (userType === "mahasiswa") {
        url += `/mahasiswa/${currentUser.username}`;
      } else if (userType === "dosen") {
        // ✅ FIXED: Add specific endpoint for dosen
        url += `/dosen/${currentUser.username || currentUser.nip}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        let data = await response.json();
        let filteredData = [];

        // Sort data by creation date in descending order
        if (Array.isArray(data)) {
          data = data.sort((a, b) => {
            const dateA = a.createdAt || a.tanggalPengajuan;
            const dateB = b.createdAt || b.tanggalPengajuan;
            return new Date(dateB) - new Date(dateA);
          });
        }

        // Process data based on user type
        if (userType === "mahasiswa") {
          // Untuk mahasiswa: grouped jika status awal, split jika sudah diverifikasi admin
          filteredData = [];
          data.forEach((pengajuan) => {
            if (
              pengajuan.status === "PROSES_PENGAJUAN" ||
              pengajuan.status === "DITOLAK"
            ) {
              // GROUPED
              const mataKuliahNames = pengajuan.details.map((detail) => {
                return (
                  detail.mataKuliah?.nama || detail.mataKuliah || "Unknown"
                );
              });
              const nilaiDetails = pengajuan.details.filter(
                (d) => d.nilaiAkhir !== null,
              );
              const rataRataNilai =
                nilaiDetails.length > 0
                  ? (
                      nilaiDetails.reduce((sum, d) => sum + d.nilaiAkhir, 0) /
                      nilaiDetails.length
                    ).toFixed(1)
                  : null;
              filteredData.push({
                ...pengajuan,
                mataKuliah: mataKuliahNames.join(", "),
                mataKuliahList: pengajuan.details.map((d) => ({
                  id: d.mataKuliah?.id || d.id,
                  nama: d.mataKuliah?.nama || d.mataKuliah || "Unknown",
                  sks: d.mataKuliah?.sks || 0,
                  semester: d.mataKuliah?.semester,
                  nilaiAkhir: d.nilaiAkhir,
                })),
                totalSKS: pengajuan.details.reduce(
                  (sum, d) => sum + (d.mataKuliah?.sks || 0),
                  0,
                ),
                jumlahMataKuliah: pengajuan.details.length,
                isGrouped: true,
                dosen: pengajuan.details[0]?.dosen || null,
                dosenId: pengajuan.details[0]?.dosenId || null,
                nilaiAkhir: rataRataNilai,
                semuaSudahDinilai: pengajuan.details.every(
                  (d) => d.nilaiAkhir !== null,
                ),
              });
            } else {
              // SPLIT: 1 baris per mata kuliah
              pengajuan.details.forEach((detail) => {
                filteredData.push({
                  id: detail.id,
                  pengajuanSAId: pengajuan.id,
                  mahasiswa: pengajuan.mahasiswa,
                  mataKuliah: detail.mataKuliah,
                  dosen: detail.dosen,
                  nilaiAkhir: detail.nilaiAkhir,
                  buktiPembayaran: pengajuan.buktiPembayaran,
                  tanggalPengajuan: pengajuan.tanggalPengajuan,
                  status: pengajuan.status,
                  keterangan: pengajuan.keterangan,
                  nominal: (detail.mataKuliah?.sks || 0) * 300000,
                  totalSKS: detail.mataKuliah?.sks || 0,
                  isGrouped: false,
                });
              });
            }
          });
        } else if (userType === "dosen") {
          // ✅ SIMPLIFIED FILTER untuk dosen - data sudah difilter dari backend
          // Hitung nominal per mata kuliah berdasarkan SKS untuk dosen
          filteredData = data.map((detail) => {
            // Hitung nominal per mata kuliah berdasarkan SKS (1 SKS = 300,000)
            const sks = detail.mataKuliah?.sks || 0;
            const nominalPerMataKuliah = sks * 300000;

            return {
              ...detail,
              nominal: nominalPerMataKuliah, // ✅ NOMINAL PER MATA KULIAH
              isGrouped: false, // ✅ DOSEN SELALU SEPARATED
            };
          });
        } else if (userType === "sekjur" || userType === "kaprodi") {
          // Group by pengajuanSAId untuk sekjur/kaprodi (sama seperti admin)
          const groupedByPengajuan = {};
          data.forEach((detail) => {
            const pengajuanId = detail.pengajuanSAId;
            if (!groupedByPengajuan[pengajuanId]) {
              groupedByPengajuan[pengajuanId] = {
                pengajuanId: pengajuanId,
                status: detail.status,
                mahasiswa: detail.mahasiswa,
                mahasiswaId: detail.mahasiswa?.nim || detail.mahasiswaId,
                buktiPembayaran: detail.buktiPembayaran,
                tanggalPengajuan: detail.tanggalPengajuan,
                keterangan: detail.keterangan,
                nominal: detail.nominal,
                details: [],
              };
            }
            groupedByPengajuan[pengajuanId].details.push(detail);
          });
          filteredData = [];
          Object.values(groupedByPengajuan).forEach((pengajuan) => {
            if (
              pengajuan.status === "PROSES_PENGAJUAN" ||
              pengajuan.status === "DITOLAK"
            ) {
              const mataKuliahNames = pengajuan.details.map(
                (d) => d.mataKuliah?.nama || d.mataKuliah || "Unknown",
              );
              const result = {
                id: pengajuan.pengajuanId,
                mahasiswa: pengajuan.mahasiswa,
                mahasiswaId: pengajuan.mahasiswaId,
                mataKuliah: mataKuliahNames.join(", "),
                mataKuliahList: pengajuan.details.map((d) => ({
                  id: d.mataKuliah?.id || d.id,
                  nama: d.mataKuliah?.nama || d.mataKuliah || "Unknown",
                  sks: d.mataKuliah?.sks || 0,
                  semester: d.mataKuliah?.semester,
                  nilaiAkhir: d.nilaiAkhir,
                })),
                totalSKS: pengajuan.details.reduce(
                  (sum, d) => sum + (d.mataKuliah?.sks || 0),
                  0,
                ),
                jumlahMataKuliah: pengajuan.details.length,
                buktiPembayaran: pengajuan.buktiPembayaran,
                tanggalPengajuan: pengajuan.tanggalPengajuan,
                semesterPengajuan:
                  pengajuan.details[0]?.semesterPengajuan ||
                  pengajuan.semesterPengajuan,
                status: pengajuan.status,
                keterangan: pengajuan.keterangan,
                nominal: pengajuan.nominal,
                isGrouped: true,
                dosen: pengajuan.details[0]?.dosen || null,
                dosenId: pengajuan.details[0]?.dosenId || null,
                nilaiAkhir: pengajuan.details[0]?.nilaiAkhir || null,
              };
              filteredData.push(result);
            } else {
              // ✅ UPDATED: Gunakan metode Standar + Selisih Proporsional
              const nominalPerDetail = calculateNominalPerDetail(
                parseFloat(pengajuan.nominal),
                pengajuan.details,
              );

              pengajuan.details.forEach((detail, index) => {
                const result = {
                  ...detail,
                  nominal: nominalPerDetail[index] || 0,
                  isGrouped: false,
                };
                filteredData.push(result);
              });
            }
          });
        } else {
          // Group by pengajuanSAId untuk admin/kaprodi
          const groupedByPengajuan = {};
          data.forEach((detail) => {
            const pengajuanId = detail.pengajuanSAId;
            if (!groupedByPengajuan[pengajuanId]) {
              groupedByPengajuan[pengajuanId] = {
                pengajuanId: pengajuanId,
                status: detail.status,
                mahasiswa: detail.mahasiswa,
                mahasiswaId: detail.mahasiswa?.nim || detail.mahasiswaId,
                buktiPembayaran: detail.buktiPembayaran,
                tanggalPengajuan: detail.tanggalPengajuan,
                keterangan: detail.keterangan,
                nominal: detail.nominal,
                details: [],
              };
            }
            groupedByPengajuan[pengajuanId].details.push(detail);
          });

          // Transform berdasarkan status - SAMA UNTUK ADMIN DAN KAPRODI
          filteredData = [];
          Object.values(groupedByPengajuan).forEach((pengajuan) => {
            // ✅ CONDITIONAL GROUPING UNTUK ADMIN & KAPRODI
            if (
              pengajuan.status === "PROSES_PENGAJUAN" ||
              pengajuan.status === "DITOLAK"
            ) {
              const mataKuliahNames = pengajuan.details.map(
                (d) => d.mataKuliah?.nama || d.mataKuliah || "Unknown",
              );
              const result = {
                id: pengajuan.pengajuanId,
                mahasiswa: pengajuan.mahasiswa,
                mahasiswaId: pengajuan.mahasiswaId,
                mataKuliah: mataKuliahNames.join(", "), // ✅ GABUNG MATA KULIAH
                mataKuliahList: pengajuan.details.map((d) => ({
                  id: d.mataKuliah?.id || d.id,
                  nama: d.mataKuliah?.nama || d.mataKuliah || "Unknown",
                  sks: d.mataKuliah?.sks || 0,
                  semester: d.mataKuliah?.semester,
                  nilaiAkhir: d.nilaiAkhir,
                })),
                totalSKS: pengajuan.details.reduce(
                  (sum, d) => sum + (d.mataKuliah?.sks || 0),
                  0,
                ),
                jumlahMataKuliah: pengajuan.details.length,
                buktiPembayaran: pengajuan.buktiPembayaran,
                tanggalPengajuan: pengajuan.tanggalPengajuan,
                semesterPengajuan:
                  pengajuan.details[0]?.semesterPengajuan ||
                  pengajuan.semesterPengajuan,
                status: pengajuan.status,
                keterangan: pengajuan.keterangan,
                nominal: pengajuan.nominal,
                isGrouped: true, // ✅ GROUPED UNTUK STATUS AWAL
                dosen: pengajuan.details[0]?.dosen || null,
                dosenId: pengajuan.details[0]?.dosenId || null,
                nilaiAkhir: pengajuan.details[0]?.nilaiAkhir || null,
              };

              filteredData.push(result);
            } else {
              // ✅ UPDATED: Gunakan metode Standar + Selisih Proporsional
              const nominalPerDetail = calculateNominalPerDetail(
                parseFloat(pengajuan.nominal),
                pengajuan.details,
              );

              pengajuan.details.forEach((detail, index) => {
                const result = {
                  ...detail,
                  nominal: nominalPerDetail[index] || 0,
                  isGrouped: false, // ✅ SEPARATED UNTUK STATUS LANJUTAN
                };

                filteredData.push(result);
              });
            }
          });
        }

        // Sort the final filtered data again to ensure newest first
        filteredData = filteredData.sort((a, b) => {
          const dateA = a.createdAt || a.tanggalPengajuan;
          const dateB = b.createdAt || b.tanggalPengajuan;
          return new Date(dateB) - new Date(dateA);
        });

        setPengajuanList(filteredData);
      } else {
        // ✅ Handle error response properly
        if (response.status === 404) {
          setPengajuanList([]);
        } else {
          setPengajuanList([]);
        }
      }
    } catch (error) {
      setPengajuanList([]);
    } finally {
      setLoading(false);
    }
  }, [authToken, userType, currentUser]);

  const fetchDosenList = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:5000/api/dosen", {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDosenList(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development")
        console.error("Error fetching dosen list:", error);
    }
  }, [authToken]);

  const fetchMataKuliahList = useCallback(async () => {
    try {
      console.log("🔄 [usePengajuanSA] Fetching mata kuliah from API...");
      const response = await fetch(
        "http://localhost:5000/api/auth/mata-kuliah",
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      console.log("📡 [usePengajuanSA] API Response status:", response.status);

      if (response.ok) {
        const result = await response.json();
        console.log("📦 [usePengajuanSA] API Response data:", result);

        if (result.success && Array.isArray(result.data)) {
          console.log(
            "✅ [usePengajuanSA] Setting mata kuliah list:",
            result.data.length,
            "items",
          );
          console.log(
            "📋 [usePengajuanSA] Mata kuliah by semester:",
            result.data.reduce((acc, mk) => {
              const sem = mk.semester || "unknown";
              acc[sem] = (acc[sem] || 0) + 1;
              return acc;
            }, {}),
          );
          setMataKuliahList(result.data);
        } else {
          console.warn(
            "⚠️ [usePengajuanSA] Invalid response format or not an array:",
            result,
          );
          setMataKuliahList([]);
        }
      } else {
        console.error(
          "❌ [usePengajuanSA] API returned error status:",
          response.status,
        );
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ [usePengajuanSA] Error details:", errorData);
        setMataKuliahList([]);
      }
    } catch (error) {
      console.error("❌ [usePengajuanSA] Error fetching mata kuliah:", error);
      setMataKuliahList([]);
    }
  }, [authToken]);

  useEffect(() => {
    console.log("🔄 [usePengajuanSA] useEffect triggered", {
      hasAuthToken: !!authToken,
      hasCurrentUser: !!currentUser,
      userType: userType,
      username: currentUser?.username,
      semester: currentUser?.semester,
    });

    if (authToken && currentUser) {
      fetchPengajuanSA();
      // Fetch dosen list for admin, kaprodi, and dosen (needed for reports)
      if (["sekjur", "kaprodi", "dosen"].includes(userType)) {
        fetchDosenList();
      }
      if (userType === "mahasiswa") {
        console.log(
          "👨‍🎓 [usePengajuanSA] User is mahasiswa, fetching mata kuliah...",
        );
        fetchMataKuliahList();
      }
    } else {
      console.warn("⚠️ [usePengajuanSA] Missing auth or user data");
    }
  }, [
    authToken,
    userType,
    currentUser,
    fetchPengajuanSA,
    fetchDosenList,
    fetchMataKuliahList,
  ]);

  const filteredPengajuan = pengajuanList.filter((item) => {
    if (filterStatus === "ALL") return true;
    return item.status === filterStatus;
  });

  return {
    pengajuanList,
    filteredPengajuan,
    loading,
    dosenList,
    mataKuliahList,
    filterStatus,
    setFilterStatus,
    fetchPengajuanSA,
    fetchDosenList,
    fetchMataKuliahList,
  };
};
