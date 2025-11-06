class PengajuanSAService {
  constructor(authToken) {
    this.authToken = authToken;
    this.baseUrl = 'http://localhost:5000/api';
  }

  async updateStatus(pengajuanId, newStatus, dosenId = null, detailId = null) {
    let response;
    
    if (newStatus === 'MENUNGGU_VERIFIKASI_KAPRODI') {
      response = await fetch(`${this.baseUrl}/pengajuan-sa/${pengajuanId}/verifikasi`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        }
      });
    } else if (dosenId && detailId && newStatus === 'DALAM_PROSES_SA') {
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

    if (!response.ok) {
      const errorData = await response.json();
      if (process.env.NODE_ENV === 'development') console.error('API Error:', errorData);
      throw new Error(errorData.error || 'Failed to update status');
    }

    return await response.json();
  }

  async updateNilai(id, nilai) {
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
      if (process.env.NODE_ENV === 'development') console.error('Nilai update error:', errorData);
      
      if (response.status === 404) {
        throw new Error('Data pengajuan SA tidak ditemukan. Silakan refresh halaman untuk melihat data terbaru.');
      } else if (response.status === 400) {
        throw new Error(errorData.error || 'Data yang dimasukkan tidak valid');
      } else {
        throw new Error(errorData.error || 'Terjadi kesalahan saat menyimpan nilai');
      }
    }

    return await response.json();
  }

  async updateNilaiDetail(detailId, nilai) {
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
      if (process.env.NODE_ENV === 'development') console.error('Nilai detail update error:', errorData);
      
      if (response.status === 404) {
        throw new Error('Data mata kuliah tidak ditemukan. Silakan refresh halaman untuk melihat data terbaru.');
      } else if (response.status === 400) {
        throw new Error(errorData.error || 'Data yang dimasukkan tidak valid');
      } else {
        throw new Error(errorData.error || 'Terjadi kesalahan saat menyimpan nilai');
      }
    }

    return await response.json();
  }

  async tolakPengajuanSA(pengajuanId, keteranganReject) {
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
      if (process.env.NODE_ENV === 'development') console.error('Reject pengajuan error:', errorData);
      throw new Error(errorData.error || 'Terjadi kesalahan saat menolak pengajuan');
    }

    return await response.json();
  }
}

export default PengajuanSAService;