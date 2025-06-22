const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

// Update admin
const updateAdmin = async (req, res) => {
  try {
    const { username } = req.params;
    const { nama, noTelp, alamat } = req.body;

    // Validasi input
    if (!nama) {
      return res.status(400).json({ message: 'Nama wajib diisi' });
    }

    // Cek apakah admin exists
    const existingAdmin = await prisma.user.findFirst({
      where: { 
        username,
        role: 'ADMIN'
      }
    });

    if (!existingAdmin) {
      return res.status(404).json({ message: 'Admin tidak ditemukan' });
    }

    // Update data admin di tabel users
    const updatedAdmin = await prisma.user.update({
      where: { username },
      data: {
        nama,
        noTelp: noTelp || existingAdmin.noTelp,
        alamat: alamat || existingAdmin.alamat
      }
    });

    // Remove password from response
    const { password, ...adminWithoutPassword } = updatedAdmin;

    res.json({
      success: true,
      data: adminWithoutPassword
    });
  } catch (error) {
    console.error('Error updating admin:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat memperbarui data admin' });
  }
};

module.exports = {
  updateAdmin
}; 