class PengajuanSAService {
  constructor(authToken) {
    this.authToken = authToken;
    this.baseUrl = 'http://localhost:5000/api';
  }

  async updateStatus(pengajuanId, newStatus, dosenId = null, detailId = null) {
    console.log('🔄 Updating status:', { pengajuanId, newStatus, dosenId, detailId }); // Debug log
    
    let response;
    
    if (newStatus === 'MENUNGGU_VERIFIKASI_KAPRODI') {
      // ✅ ADMIN VERIFIKASI - Endpoint khusus
      console.log('📝 Admin verifikasi pembayaran...'); // Debug log
      response = await fetch(`${this.baseUrl}/pengajuan-sa/${pengajuanId}/verifikasi`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        }
      });
    } else if (dosenId && detailId && newStatus === 'DALAM_PROSES_SA') {
      // ✅ KAPRODI ASSIGN DOSEN - Endpoint per mata kuliah
      console.log('👨‍🏫 Kaprodi assign dosen per mata kuliah...', { detailId, dosenId }); // Debug log
      response = await fetch(`${this.baseUrl}/pengajuan-sa/detail/${detailId}/assign-dosen`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dosenId: dosenId
        })
      });
    } else {
      // ✅ FALLBACK - Endpoint umum
      console.log('🔄 General status update...'); // Debug log
      response = await fetch(`${this.baseUrl}/pengajuan-sa/${pengajuanId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus,
          dosenId: dosenId
        })
      });
    }

    console.log('📡 Response status:', response.status); // Debug log

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ API Error:', errorData); // Debug log
      throw new Error(errorData.error || 'Failed to update status');
    }

    const result = await response.json();
    console.log('✅ Update successful:', result); // Debug log
    return result;
  }

  async updateNilai(id, nilai) {
    console.log('📝 Updating nilai:', { id, nilai }); // Debug log
    
    const response = await fetch(`${this.baseUrl}/pengajuan-sa/${id}/nilai`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nilaiAkhir: parseFloat(nilai)
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Nilai update error:', errorData); // Debug log
      
      // Handle specific error cases
      if (response.status === 404) {
        throw new Error('Data pengajuan SA tidak ditemukan. Silakan refresh halaman untuk melihat data terbaru.');
      } else if (response.status === 400) {
        throw new Error(errorData.error || 'Data yang dimasukkan tidak valid');
      } else {
        throw new Error(errorData.error || 'Terjadi kesalahan saat menyimpan nilai');
      }
    }

    const result = await response.json();
    console.log('✅ Nilai update success:', result); // Debug log
    return result;
  }

  async updateNilaiDetail(detailId, nilai) {
    console.log('📝 Updating nilai detail:', { detailId, nilai }); // Debug log
    
    const response = await fetch(`${this.baseUrl}/pengajuan-sa/detail/${detailId}/nilai`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nilaiAkhir: parseFloat(nilai)
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Nilai detail update error:', errorData); // Debug log
      
      // Handle specific error cases
      if (response.status === 404) {
        throw new Error('Data mata kuliah tidak ditemukan. Silakan refresh halaman untuk melihat data terbaru.');
      } else if (response.status === 400) {
        throw new Error(errorData.error || 'Data yang dimasukkan tidak valid');
      } else {
        throw new Error(errorData.error || 'Terjadi kesalahan saat menyimpan nilai');
      }
    }

    const result = await response.json();
    console.log('✅ Nilai detail update success:', result); // Debug log
    return result;
  }

  async tolakPengajuanSA(pengajuanId, keteranganReject) {
    console.log('❌ Rejecting pengajuan SA:', { pengajuanId, keteranganReject }); // Debug log
    
    const response = await fetch(`${this.baseUrl}/pengajuan-sa/${pengajuanId}/tolak`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        keteranganReject: keteranganReject
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Reject pengajuan error:', errorData); // Debug log
      throw new Error(errorData.error || 'Terjadi kesalahan saat menolak pengajuan');
    }

    const result = await response.json();
    console.log('✅ Reject pengajuan success:', result); // Debug log
    return result;
  }
}

export default PengajuanSAService;