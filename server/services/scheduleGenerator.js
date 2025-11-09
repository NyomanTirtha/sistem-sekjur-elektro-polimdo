const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const PRODI_CODES = {
  TI: 1,
  TL: 2,
  TKBG: 3,
  TKJJ: 4,
};

const WORKING_DAYS = ["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT"];

// Definisikan slot waktu untuk Pagi dan Sore
const PAGI_SLOTS = [
  { start: "07:45", end: "09:25" },
  { start: "10:45", end: "12:25" },
  { start: "12:55", end: "14:35" },
];

const SORE_SLOTS = [
  { start: "12:55", end: "14:35" },
  { start: "14:35", end: "16:15" },
  { start: "16:20", end: "18:00" }, // Disesuaikan agar tidak lewat jam 19:00 dan menghindari break malam
];

function parseKelas(kelas) {
  const match = kelas.match(/^(\d)(\D+)(\d*)$/);
  if (!match) return null;

  const semester = parseInt(match[1], 10);
  const prodiCode = match[2].toUpperCase();

  let prodiId;
  // Find the key in PRODI_CODES that is a substring of prodiCode
  for (const key in PRODI_CODES) {
    if (prodiCode.startsWith(key)) {
      prodiId = PRODI_CODES[key];
      break;
    }
  }

  if (!semester || !prodiId) return null;

  return { semester, prodiId };
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

async function generateSchedule(
  timetablePeriodId,
  kelas,
  kaprodiUsername,
  prodiId,
  scheduleType = "PAGI", // Default ke Pagi jika tidak dispesifikasikan
) {
  const timeSlotsToUse = scheduleType === "SORE" ? SORE_SLOTS : PAGI_SLOTS;

  // 1. Parse kelas to get semester
  const parsedKelas = parseKelas(kelas);
  if (!parsedKelas || parsedKelas.prodiId !== prodiId) {
    throw new Error(
      "Format kelas tidak valid atau tidak sesuai dengan program studi Anda.",
    );
  }
  const { semester } = parsedKelas;

  // 2. Fetch required data
  const period = await prisma.timetablePeriod.findUnique({
    where: { id: timetablePeriodId },
  });
  if (!period) {
    throw new Error("Periode timetable tidak ditemukan.");
  }

  const courses = await prisma.mataKuliah.findMany({
    where: { programStudiId: prodiId, semester: semester },
  });

  const allLecturers = await prisma.dosen.findMany({
    where: { prodiId: prodiId },
  });

  const rooms = await prisma.ruangan.findMany({
    where: { isActive: true },
  });

  // --- MODIFICATION START ---
  // Fetch active teaching assignments for the period
  const activeAssignments = await prisma.penugasanMengajar.findMany({
    where: {
      status: "ACTIVE",
      tahunAjaran: period.tahunAkademik,
      // This assumes semester in penugasanMengajar matches the integer semester of the course
      semester: semester,
      mataKuliah: {
        programStudiId: prodiId,
      },
    },
  });

  const assignmentMap = new Map(
    activeAssignments.map((a) => [a.mataKuliahId, a.dosenId]),
  );
  // --- MODIFICATION END ---

  if (courses.length === 0) {
    throw new Error(
      `Tidak ada mata kuliah yang ditemukan untuk semester ${semester}.`,
    );
  }
  if (allLecturers.length === 0) {
    throw new Error("Tidak ada dosen yang tersedia di program studi ini.");
  }
  if (rooms.length === 0) {
    throw new Error("Tidak ada ruangan yang aktif dan tersedia.");
  }

  // 3. Initialize scheduling resources
  const occupiedSlots = {}; // { 'dosen-NIP-HARI-JAM': true, 'ruangan-ID-HARI-JAM': true }

  const scheduleItemsToCreate = [];
  const shuffledCourses = shuffleArray([...courses]);
  let unplacedCourses = [];

  // 4. Generation Algorithm
  for (const course of shuffledCourses) {
    let placed = false;
    const shuffledRooms = shuffleArray([...rooms]);
    const shuffledDays = shuffleArray([...WORKING_DAYS]);

    // --- MODIFICATION START ---
    const assignedLecturerId = assignmentMap.get(course.id);
    let lecturersToTry = [];

    if (assignedLecturerId) {
      const assignedLecturer = allLecturers.find(
        (l) => l.nip === assignedLecturerId,
      );
      if (assignedLecturer) {
        lecturersToTry = [assignedLecturer];
      } else {
        // Fallback if assigned lecturer not found in prodi's list
        lecturersToTry = shuffleArray([...allLecturers]);
      }
    } else {
      lecturersToTry = shuffleArray([...allLecturers]);
    }
    // --- MODIFICATION END ---

    for (const day of shuffledDays) {
      if (placed) break;
      const shuffledTimeSlots = shuffleArray([...timeSlotsToUse]);

      for (const slot of shuffledTimeSlots) {
        if (placed) break;

        for (const lecturer of lecturersToTry) {
          // Use the determined list of lecturers
          if (placed) break;

          for (const room of shuffledRooms) {
            const lecturerSlotKey = `${lecturer.nip}-${day}-${slot.start}`;
            const roomSlotKey = `${room.id}-${day}-${slot.start}`;
            const classSlotKey = `${kelas}-${day}-${slot.start}`;

            if (
              !occupiedSlots[lecturerSlotKey] &&
              !occupiedSlots[roomSlotKey] &&
              !occupiedSlots[classSlotKey]
            ) {
              // Found a valid slot
              scheduleItemsToCreate.push({
                mataKuliahId: course.id,
                dosenId: lecturer.nip,
                hari: day,
                jamMulai: slot.start,
                jamSelesai: slot.end,
                ruanganId: room.id,
                kelas: kelas,
                kapasitasMahasiswa: room.kapasitas,
              });

              // Mark resources as occupied
              occupiedSlots[lecturerSlotKey] = true;
              occupiedSlots[roomSlotKey] = true;
              occupiedSlots[classSlotKey] = true;

              placed = true;
              break;
            }
          }
        }
      }
    }
    if (!placed) {
      unplacedCourses.push(course.nama);
    }
  }

  if (scheduleItemsToCreate.length === 0) {
    throw new Error(
      "Gagal men-generate jadwal. Tidak ada slot yang bisa ditemukan.",
    );
  }

  // 5. Create schedule in database within a transaction
  const newSchedule = await prisma.$transaction(async (tx) => {
    const schedule = await tx.prodiSchedule.create({
      data: {
        timetablePeriodId: timetablePeriodId,
        prodiId: prodiId,
        kaprodiId: kaprodiUsername,
        kelas: kelas,
        status: "DRAFT",
      },
    });

    const itemsData = scheduleItemsToCreate.map((item) => ({
      ...item,
      prodiScheduleId: schedule.id,
    }));

    await tx.scheduleItem.createMany({
      data: itemsData,
    });

    return schedule;
  });

  return { schedule: newSchedule, unplacedCourses };
}

module.exports = { generateSchedule };
