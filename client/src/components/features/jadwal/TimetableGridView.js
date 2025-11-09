import React, { useMemo, memo } from "react";

const TimetableGridView = memo(({ scheduleItems = [], className = "" }) => {
  // Definisi time slots sesuai dengan gambar
  const timeSlots = [
    { id: 1, start: "07:45", end: "08:35", type: "slot" },
    { id: 2, start: "08:35", end: "09:25", type: "slot" },
    { id: 3, start: "09:25", end: "10:15", type: "slot" },
    { id: "break1", start: "10:15", end: "10:45", type: "break", label: "Istirahat" },
    { id: 4, start: "10:45", end: "11:35", type: "slot" },
    { id: 5, start: "11:35", end: "12:25", type: "slot" },
    { id: "break2", start: "12:25", end: "12:55", type: "break", label: "Istirahat" },
    { id: 6, start: "12:55", end: "13:45", type: "slot" },
    { id: 7, start: "13:45", end: "14:35", type: "slot" },
    { id: 8, start: "14:35", end: "15:25", type: "slot" },
    { id: 9, start: "15:25", end: "16:15", type: "slot" },
    { id: 10, start: "16:15", end: "17:05", type: "slot" },
    { id: 11, start: "17:05", end: "17:55", type: "slot" },
    { id: "break3", start: "17:55", end: "18:25", type: "break", label: "Istirahat" },
    { id: 12, start: "18:25", end: "19:15", type: "slot" },
    { id: 13, start: "19:15", end: "20:05", type: "slot" },
    { id: 14, start: "20:05", end: "20:55", type: "slot" },
  ];

  const days = ["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT"];

  // Memoize time slots dan days untuk menghindari re-creation
  const memoizedTimeSlots = useMemo(() => timeSlots, []);
  const memoizedDays = useMemo(() => days, []);

  // Helper function untuk convert waktu ke menit
  const timeToMinutes = (time) => {
    if (!time || typeof time !== 'string') return 0;
    try {
      const parts = time.split(":");
      if (parts.length !== 2) return 0;
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      if (isNaN(hours) || isNaN(minutes)) return 0;
      return hours * 60 + minutes;
    } catch (error) {
      console.error("Error in timeToMinutes:", error);
      return 0;
    }
  };

  // Helper function untuk cek apakah waktu overlap dengan slot
  const isTimeOverlappingSlot = (itemStart, itemEnd, slotStart, slotEnd) => {
    const itemStartMin = timeToMinutes(itemStart);
    const itemEndMin = timeToMinutes(itemEnd);
    const slotStartMin = timeToMinutes(slotStart);
    const slotEndMin = timeToMinutes(slotEnd);
    return itemStartMin < slotEndMin && itemEndMin > slotStartMin;
  };

  // Memoize schedule items untuk optimasi
  const validScheduleItems = useMemo(() => {
    if (!scheduleItems || !Array.isArray(scheduleItems)) return [];
    return scheduleItems.filter(item => item && item.hari && item.jamMulai && item.jamSelesai);
  }, [scheduleItems]);

  // Build grid structure - untuk setiap slot, cek item mana yang ada
  const getCellForSlot = (slot, day, slotIndex) => {
    if (validScheduleItems.length === 0) {
      return null;
    }
    
    const item = validScheduleItems.find((item) => {
      if (item.hari !== day) return false;
      return isTimeOverlappingSlot(
        item.jamMulai,
        item.jamSelesai,
        slot.start,
        slot.end
      );
    });

    if (!item) return null;

    // Cari slot pertama yang overlap dengan item ini
    let firstSlotIndex = -1;
    for (let i = 0; i < timeSlots.length; i++) {
      const s = timeSlots[i];
      if (s.type === "break") continue;
      if (
        isTimeOverlappingSlot(item.jamMulai, item.jamSelesai, s.start, s.end)
      ) {
        firstSlotIndex = i;
        break;
      }
    }

    // Jika ini bukan slot pertama, return null (akan di-handle oleh rowSpan)
    if (firstSlotIndex !== slotIndex) {
      return null;
    }

    // Hitung berapa slot yang digunakan
    let spanCount = 0;
    for (let i = firstSlotIndex; i < timeSlots.length; i++) {
      const s = timeSlots[i];
      if (s.type === "break") continue;
      if (
        isTimeOverlappingSlot(item.jamMulai, item.jamSelesai, s.start, s.end)
      ) {
        spanCount++;
      } else {
        break;
      }
    }

    return {
      item,
      span: spanCount,
    };
  };

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full border-collapse border border-gray-300 text-sm bg-white">
        <thead>
          <tr>
            <th className="border border-gray-300 bg-gray-100 p-2 text-left font-semibold w-32">
              Waktu
            </th>
            {memoizedDays.map((day) => (
              <th
                key={day}
                className="border border-gray-300 bg-gray-100 p-2 text-center font-semibold min-w-[150px]"
              >
                {day.slice(0, 3).toUpperCase()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {memoizedTimeSlots.map((slot, slotIndex) => {
            if (slot.type === "break") {
              return (
                <tr key={slot.id}>
                  <td className="border border-gray-300 bg-gray-50 p-2 text-center text-xs font-medium">
                    {slot.label}
                    <br />
                    <span className="text-gray-600">
                      {slot.start} - {slot.end}
                    </span>
                  </td>
                  {memoizedDays.map((day) => (
                    <td
                      key={day}
                      className="border border-gray-300 bg-gray-50"
                    ></td>
                  ))}
                </tr>
              );
            }

            return (
              <tr key={slot.id}>
                <td className="border border-gray-300 bg-white p-2 text-center text-xs font-medium">
                  {slot.id}
                  <br />
                  <span className="text-gray-600">
                    {slot.start} - {slot.end}
                  </span>
                </td>
                {(() => {
                  // Build array of cells to render, ensuring 5 cells per row
                  const cellsToRender = [];
                  let cellIndex = 0;

                  memoizedDays.forEach((day) => {
                    const cellData = getCellForSlot(slot, day, slotIndex);

                    if (cellData) {
                      // This is the first slot for this item
                      cellsToRender.push({ type: "class", data: cellData, day });
                      cellIndex++;
                    } else {
                      // Check if there's an overlapping item (merged cell)
                      const overlappingItem = validScheduleItems.find((item) => {
                        if (item.hari !== day) return false;
                        return isTimeOverlappingSlot(
                          item.jamMulai,
                          item.jamSelesai,
                          slot.start,
                          slot.end
                        );
                      });

                      if (overlappingItem) {
                        // This cell is merged (handled by rowSpan from previous row)
                        // Don't render anything - rowSpan will handle it
                        cellsToRender.push({ type: "merged", day });
                      } else {
                        // Empty cell
                        cellsToRender.push({ type: "empty", day });
                      }
                      cellIndex++;
                    }
                  });

                  // Render cells, but skip merged ones (they're handled by rowSpan)
                  return cellsToRender.map((cellInfo) => {
                    if (cellInfo.type === "merged") {
                      // Don't render - rowSpan from previous row handles this
                      return null;
                    }

                    if (cellInfo.type === "class") {
                      const { item, span } = cellInfo.data;
                      return (
                        <td
                          key={cellInfo.day}
                          className="border border-gray-300 bg-blue-50 p-2 align-top"
                          rowSpan={span}
                        >
                          <div className="text-xs">
                            <div className="font-semibold text-gray-900 mb-1">
                              {item.mataKuliah?.nama || "N/A"}
                            </div>
                            <div className="text-gray-700 mb-1 text-xs">
                              {item.dosen?.nama || "Belum ditentukan"}
                            </div>
                            <div className="text-gray-600 text-xs">
                              {item.ruangan?.nama || "Belum ditentukan"}
                            </div>
                            {item.kelas && (
                              <div className="text-gray-600 mt-1 text-xs">
                                Kelas: {item.kelas}
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    }

                    // Empty cell
                    return (
                      <td
                        key={cellInfo.day}
                        className="border border-gray-300 bg-white p-1"
                      ></td>
                    );
                  }).filter(Boolean);
                })()}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});

TimetableGridView.displayName = 'TimetableGridView';

export default TimetableGridView;
