# Color System Constants

Sistem warna yang konsisten dan terstandarisasi untuk seluruh aplikasi.

## 📋 Cara Pakai

### Import
```javascript
import { PRIMARY, BUTTON, ALERT, TABLE, CARD } from '../../constants/colors';
```

### Contoh Penggunaan

#### 1. Buttons
```javascript
// Primary button (Biru)
<button className={BUTTON.primary}>
  Simpan
</button>

// Danger button (Merah)
<button className={BUTTON.danger}>
  Hapus
</button>

// Secondary button (Abu-abu)
<button className={BUTTON.secondary}>
  Batal
</button>

// Icon button
<button className={BUTTON.iconPrimary}>
  <Edit size={16} />
</button>
```

#### 2. Alerts/Notifications
```javascript
// Success alert
<div className={ALERT.success}>
  <AlertCircle className={ALERT.successIcon} />
  <p className={ALERT.successText}>Berhasil disimpan!</p>
</div>

// Error alert
<div className={ALERT.error}>
  <AlertCircle className={ALERT.errorIcon} />
  <p className={ALERT.errorText}>Terjadi kesalahan</p>
</div>
```

#### 3. Tables
```javascript
<div className={TABLE.container}>
  <table className="w-full">
    <thead className={TABLE.header}>
      <tr>
        <th className={TABLE.headerText}>Nama</th>
        <th className={TABLE.headerText}>NIM</th>
      </tr>
    </thead>
    <tbody className={TABLE.border}>
      <tr className={TABLE.row}>
        <td className={TABLE.cell}>John Doe</td>
        <td className={TABLE.cell}>12345</td>
      </tr>
    </tbody>
  </table>
</div>
```

#### 4. Cards
```javascript
// Basic card
<div className={CARD.base}>
  <h3>Card Title</h3>
  <p>Card content</p>
</div>

// Card with hover effect
<div className={CARD.hover}>
  <h3>Hover Me</h3>
</div>
```

#### 5. Badges
```javascript
import { BADGE } from '../../constants/colors';

<span className={BADGE.blue}>Active</span>
<span className={BADGE.green}>Success</span>
<span className={BADGE.yellow}>Pending</span>
<span className={BADGE.red}>Rejected</span>
```

#### 6. Status Colors (Dynamic)
```javascript
import { getStatusColor } from '../../constants/colors';

const status = 'DALAM_PROSES_SA';
<span className={getStatusColor(status)}>
  {status}
</span>
```

## 🎨 Color Palette

### Primary (Brand Color)
- **Biru**: `bg-blue-600` - Button utama, link, active state
- **Gradient**: `from-blue-600 to-blue-700` - Header table, card header

### Semantic Colors
- **Success (Hijau)**: `bg-green-600` - Berhasil, approved, selesai
- **Warning (Kuning)**: `bg-yellow-600` - Peringatan, pending
- **Danger (Merah)**: `bg-red-600` - Error, hapus, ditolak
- **Info (Biru)**: `bg-blue-600` - Informasi

### Neutral
- **White**: Background utama
- **Gray**: Text secondary, border, disabled state

## ✅ Konsistensi

### DO ✓
```javascript
// ✓ Gunakan constants
<button className={BUTTON.primary}>Submit</button>

// ✓ Konsisten dengan semantic color
<div className={ALERT.success}>Success message</div>
```

### DON'T ✗
```javascript
// ✗ Jangan hardcode warna
<button className="bg-blue-500 hover:bg-blue-600">Submit</button>

// ✗ Jangan pakai warna random
<div className="bg-teal-500">Message</div>
```

## 🔄 Update Components

Jika ada komponen yang belum pakai color system:

1. Import constants
2. Replace hardcoded colors dengan constants
3. Test tampilan

## 📊 Available Constants

- `PRIMARY` - Warna brand utama (biru)
- `SUCCESS` - Warna sukses (hijau)
- `WARNING` - Warna warning (kuning)
- `DANGER` - Warna bahaya (merah)
- `INFO` - Warna info (biru)
- `NEUTRAL` - Warna netral (abu-abu)
- `STATUS` - Badge status
- `TABLE` - Style table
- `BUTTON` - Style button
- `CARD` - Style card
- `ALERT` - Style alert/notification
- `INPUT` - Style input form
- `BADGE` - Style badge
- `TIME_SLOT` - Warna slot waktu jadwal
- `DAY_COLORS` - Warna hari untuk kalender

## 🎯 Helper Functions

```javascript
// Get button style dengan size
getButtonStyle('primary', 'lg'); // large primary button

// Get status color
getStatusColor('APPROVED'); // returns STATUS.approved

// Get alert style
getAlertStyle('error'); // returns error alert styles
```

## 📝 Notes

- Semua warna menggunakan Tailwind CSS classes
- Konsistensi warna membantu user experience
- Mudah maintenance dan update tema
- Standar industri: Blue untuk primary, Red untuk danger, dll

---

**Version**: 1.0  
**Last Updated**: 2025  
**Maintainer**: Development Team