"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function BookingTimeline() {
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- State สำหรับดูและลบข้อมูลลูกค้า ---
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // การลากเมาส์บนตาราง
  const [isSelecting, setIsSelecting] = useState(false);
  const [selection, setSelection] = useState({ roomId: null, startDay: null, endDay: null });

  // ข้อมูลใน Modal
  const [customerName, setCustomerName] = useState('');
  const [selectedRooms, setSelectedRooms] = useState([]);

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(2026);
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  useEffect(() => { fetchData(); }, [currentMonth]);

  async function fetchData() {
    const { data: r } = await supabase.from('rooms').select('*').order('room_no');
    const { data: b } = await supabase.from('bookings').select('*');
    setRooms(r || []);
    setBookings(b || []);
    
    // จัดกลุ่ม Room Type
    const types = [...new Set(r?.map(room => room.room_type?.trim().toUpperCase()))];
    const initialStatus = {};
    types.forEach(t => {
        if (expandedGroups[t] === undefined) initialStatus[t] = true;
    });
    setExpandedGroups(prev => ({ ...initialStatus, ...prev }));
  }

  const handleBookingClick = (booking, e) => {
    e.stopPropagation();
    setSelectedBooking(booking);
    setIsDetailOpen(true);
  };

  const handleCheckIn = async (id) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'checked_in' })
      .eq('id', id);

    if (error) {
      alert("เช็คอินไม่สำเร็จครับพี่: " + error.message);
    } else {
      setIsDetailOpen(false);
      fetchData();
    }
  };

  const handleDeleteBooking = async (id) => {
    const confirmDelete = confirm("พี่เจแน่ใจนะครับว่าจะลบรายการนี้?");
    if (!confirmDelete) return;

    const { error } = await supabase.from('bookings').delete().eq('id', id);
    if (error) {
      alert("ลบไม่ได้ครับพี่: " + error.message);
    } else {
      setIsDetailOpen(false);
      fetchData();
    }
  };

  const handleMouseDown = (roomId, day) => {
    setIsSelecting(true);
    setSelection({ roomId, startDay: day, endDay: day });
  };

  const handleMouseEnter = (day) => {
    if (isSelecting) setSelection(prev => ({ ...prev, endDay: day }));
  };

  const handleMouseUp = () => {
    if (isSelecting) {
      const start = Math.min(selection.startDay, selection.endDay);
      const end = Math.max(selection.startDay, selection.endDay);
      const checkIn = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(start).padStart(2, '0')}`;
      const checkOut = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(end + 1).padStart(2, '0')}`;
      const room = rooms.find(r => r.id === selection.roomId);
      
      setSelectedRooms([{
        id: Date.now(),
        actual_room_id: room.id,
        room_no: room.room_no,
        check_in: checkIn,
        check_out: checkOut,
        price: 0
      }]);
      setIsModalOpen(true);
      setIsSelecting(false);
    }
  };

  const addExtraRoom = () => {
    const first = selectedRooms[0];
    setSelectedRooms([...selectedRooms, {
      id: Date.now(),
      actual_room_id: '',
      room_no: '',
      check_in: first?.check_in || '',
      check_out: first?.check_out || '',
      price: 0
    }]);
  };

  const updateRoomRow = (id, field, value) => {
    setSelectedRooms(selectedRooms.map(r => {
      if (r.id === id) {
        if (field === 'actual_room_id') {
          const roomInfo = rooms.find(item => item.id === value);
          return { ...r, actual_room_id: value, room_no: roomInfo?.room_no || '' };
        }
        return { ...r, [field]: value };
      }
      return r;
    }));
  };

  const handleSaveBooking = async () => {
    if (!customerName) return alert("ใส่ชื่อลูกค้าด้วยครับพี่เจ");
    if (selectedRooms.some(r => !r.actual_room_id)) return alert("เลือกห้องให้ครบทุกบรรทัดด้วยครับ");

    const toSave = selectedRooms.map(r => ({
      customer_name: customerName,
      room_id: r.actual_room_id,
      check_in: r.check_in,
      check_out: r.check_out,
      price: Number(r.price) || 0,
      status: 'booked'
    }));

    const { error } = await supabase.from('bookings').insert(toSave);
    if (error) alert(error.message);
    else {
      setIsModalOpen(false);
      setCustomerName('');
      fetchData();
    }
  };

  const groupedRooms = rooms.reduce((acc, room) => {
    const type = room.room_type?.trim().toUpperCase() || 'OTHER';
    if (!acc[type]) acc[type] = [];
    acc[type].push(room);
    return acc;
  }, {});
  
  return (
    <div className="p-6 bg-[#0c0c0c] min-h-screen text-white font-sans selection:bg-red-600 selection:text-white" onMouseUp={handleMouseUp}>
      
      {/* Header */}
      <header className="mb-8 flex justify-between items-center border-b border-white/5 pb-6">
        <h1 className="text-4xl font-black italic uppercase tracking-tighter">LANTA <span className="text-red-600">PARADISE</span></h1>
        <div className="flex items-center gap-4 bg-[#1a1a1a] p-1 rounded-2xl border border-white/10 shadow-2xl">
           <button onClick={() => setCurrentMonth(p => p === 0 ? 11 : p-1)} className="p-3 hover:text-red-500 transition-colors font-bold text-xl">◀</button>
           <span className="font-mono text-lg font-black uppercase tracking-widest px-4">{monthNames[currentMonth]} {currentYear}</span>
           <button onClick={() => setCurrentMonth(p => p === 11 ? 0 : p+1)} className="p-3 hover:text-red-500 transition-colors font-bold text-xl">▶</button>
        </div>
      </header>

      {/* TIMELINE GRID */}
      <div className="overflow-x-auto border-2 border-white/10 rounded-[2rem] bg-[#111] shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <div className="inline-block min-w-full">
          
          {/* วันที่ (Header) */}
          <div className="flex bg-[#1a1a1a] sticky top-0 z-30 border-b-2 border-white/10">
            <div className="w-56 p-5 text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] sticky left-0 bg-[#1a1a1a] border-r-2 border-white/10">Room List</div>
            {days.map(day => (
              <div key={day} className="w-14 min-w-[3.5rem] h-14 flex items-center justify-center border-r border-white/5 text-xs font-black hover:bg-white/5 transition-colors cursor-default">{day}</div>
            ))}
          </div>

          {/* แสดงผลตาม Room Type */}
          {Object.entries(groupedRooms).map(([type, roomsInGroup]) => (
            <div key={type}>
              <div 
                className="flex bg-gradient-to-r from-red-950/40 to-transparent border-b border-white/5 cursor-pointer hover:from-red-900/40 transition-all"
                onClick={() => setExpandedGroups(prev => ({ ...prev, [type]: !prev[type] }))}
              >
                <div className="w-56 p-3 sticky left-0 z-20 bg-[#111]/80 backdrop-blur-md flex items-center gap-2 border-r-2 border-white/10">
                  <span className="text-red-600 text-xs">{expandedGroups[type] ? '▼' : '▶'}</span>
                  <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">{type}</span>
                </div>
                <div className="flex-1 h-10"></div>
              </div>

              {expandedGroups[type] && roomsInGroup.map(room => (
                <div key={room.id} className="flex border-b border-white/5 relative h-16 group">
                  <div className="w-56 p-5 font-black text-gray-400 sticky left-0 bg-[#111] z-20 border-r-2 border-white/10 group-hover:text-white transition-colors uppercase italic">{room.room_no}</div>
                  
                  {days.map(day => {
                    const isSelected = isSelecting && selection.roomId === room.id && day >= Math.min(selection.startDay, selection.endDay) && day <= Math.max(selection.startDay, selection.endDay);
                    return (
                      <div 
                        key={day} 
                        onMouseDown={() => handleMouseDown(room.id, day)} 
                        onMouseEnter={() => handleMouseEnter(day)}
                        className={`w-14 min-w-[3.5rem] border-r border-white/5 transition-all cursor-crosshair ${isSelected ? 'bg-red-600/40 border-red-600' : 'hover:bg-red-600/5'}`} 
                      />
                    );
                  })}

                  {bookings.filter(b => b.room_id === room.id).map(b => {
                    const checkInDate = new Date(b.check_in);
                    if (checkInDate.getMonth() !== currentMonth) return null;
                    const checkOutDate = new Date(b.check_out);
                    
                    const start = checkInDate.getDate();
                    const end = checkOutDate.getDate();
                    const duration = end - start;
                    const isCheckedIn = b.status === 'checked_in';

                    return (
                      <div 
                        key={b.id}
                        onClick={(e) => handleBookingClick(b, e)}
                        className={`absolute h-10 top-3 rounded-lg z-10 flex items-center px-3 text-[10px] font-black uppercase shadow-xl border-l-4 truncate cursor-pointer hover:scale-[1.02] transition-all
                          ${isCheckedIn 
                            ? 'bg-green-500 text-white border-green-700' 
                            : 'bg-white text-red-700 border-red-600'
                          }`}
                        style={{ left: `calc(14rem + ${(start - 1) * 3.5}rem + 4px)`, width: `calc(${duration * 3.5}rem - 8px)` }}
                      >
                        {b.customer_name} {isCheckedIn && "✓"}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* --- MODAL รายละเอียดการจอง --- */}
      {isDetailOpen && selectedBooking && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[200] p-4 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl text-black animate-in zoom-in duration-200">
            <div className={`${selectedBooking.status === 'checked_in' ? 'bg-green-600' : 'bg-red-600'} p-8 text-white transition-colors`}>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Customer Info</p>
              <h2 className="text-4xl font-black italic uppercase">{selectedBooking.customer_name}</h2>
            </div>
            
            <div className="p-8 space-y-4">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-400 font-bold uppercase text-[10px]">Status</span>
                <span className={`font-black uppercase text-xs ${selectedBooking.status === 'checked_in' ? 'text-green-600' : 'text-red-600'}`}>
                   {selectedBooking.status === 'checked_in' ? 'Checked In ✓' : 'Pending'}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-400 font-bold uppercase text-[10px]">Room</span>
                <span className="font-black italic">{rooms.find(r => r.id === selectedBooking.room_id)?.room_no}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-400 font-bold uppercase text-[10px]">Check In / Out</span>
                <span className="font-black text-xs">{selectedBooking.check_in} ➜ {selectedBooking.check_out}</span>
              </div>
              <div className="bg-gray-100 p-4 rounded-xl flex justify-between items-center">
                <span className="text-gray-400 font-bold uppercase text-[10px]">Price</span>
                <span className={`text-2xl font-black italic ${selectedBooking.status === 'checked_in' ? 'text-green-600' : 'text-red-600'}`}>
                    {Number(selectedBooking.price).toLocaleString()} ฿
                </span>
              </div>
            </div>

            <div className="p-6 bg-gray-50 flex flex-col gap-3">
              {selectedBooking.status !== 'checked_in' && (
                <button 
                  onClick={() => handleCheckIn(selectedBooking.id)}
                  className="w-full bg-green-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg active:scale-95 mb-2"
                >
                  Confirm Check-In
                </button>
              )}
              <div className="flex justify-between items-center">
                <button onClick={() => handleDeleteBooking(selectedBooking.id)} className="text-red-600 font-black uppercase text-[10px] hover:underline">Delete Booking</button>
                <button onClick={() => setIsDetailOpen(false)} className="bg-black text-white px-10 py-3 rounded-xl font-black uppercase text-[10px]">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL จองใหม่ */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[100] p-4 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-[#151515] rounded-[3rem] w-full max-w-6xl border-4 border-red-700 shadow-[0_0_100px_rgba(220,38,38,0.2)] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-red-700 p-10 flex justify-between items-center">
              <div>
                <h2 className="text-5xl font-black italic text-white uppercase tracking-tighter">Group Booking</h2>
                <p className="text-white/60 font-bold text-xs uppercase tracking-widest mt-2">Lanta Paradise Resort Management</p>
              </div>
              <input 
                className="bg-white p-6 rounded-2xl w-[400px] outline-none text-black font-black text-xl placeholder:text-gray-400 shadow-2xl" 
                placeholder="ชื่อลูกค้า (Customer Name)" 
                value={customerName} 
                onChange={e => setCustomerName(e.target.value)} 
              />
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-6">
              <div className="grid grid-cols-12 gap-4 px-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                <div className="col-span-4">เลือกห้องพัก</div>
                <div className="col-span-2 text-center">วันเข้าพัก</div>
                <div className="col-span-2 text-center">วันออก</div>
                <div className="col-span-3 text-right">ราคาต่อห้อง</div>
                <div className="col-span-1"></div>
              </div>

              {selectedRooms.map((row) => (
                <div key={row.id} className="grid grid-cols-12 gap-4 bg-white/5 p-6 rounded-[2rem] items-center border border-white/5 hover:border-red-600/30 transition-all">
                  <div className="col-span-4">
                    <select 
                      className="w-full bg-black/50 p-4 rounded-xl border border-white/10 text-sm font-bold outline-none focus:border-red-600 text-white" 
                      value={row.actual_room_id} 
                      onChange={e => updateRoomRow(row.id, 'actual_room_id', e.target.value)}
                    >
                      <option value="">-- เลือกห้องพัก --</option>
                      {rooms.map(r => <option key={r.id} value={r.id}>{r.room_no} | {r.room_type}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <input type="date" className="w-full bg-black/50 p-4 rounded-xl border border-white/10 text-xs text-center font-bold text-white" value={row.check_in} onChange={e => updateRoomRow(row.id, 'check_in', e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <input type="date" className="w-full bg-black/50 p-4 rounded-xl border border-white/10 text-xs text-center font-bold text-white" value={row.check_out} onChange={e => updateRoomRow(row.id, 'check_out', e.target.value)} />
                  </div>
                  <div className="col-span-3 relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-red-600 font-black">฿</span>
                    <input 
                      type="number" 
                      className="w-full bg-black/50 pl-10 p-4 rounded-xl border border-white/10 text-right font-mono text-lg font-black text-white outline-none focus:border-red-600" 
                      value={row.price} 
                      onChange={e => updateRoomRow(row.id, 'price', e.target.value)} 
                    />
                  </div>
                  <div className="col-span-1 text-right">
                    <button onClick={() => setSelectedRooms(selectedRooms.filter(r => r.id !== row.id))} className="text-gray-600 hover:text-red-600 text-2xl transition-colors">✕</button>
                  </div>
                </div>
              ))}

              <button 
                onClick={addExtraRoom} 
                className="w-full py-6 border-4 border-dashed border-white/5 rounded-[2rem] text-gray-500 font-black hover:border-red-600/50 hover:text-red-600 transition-all uppercase tracking-widest text-sm"
              >
                + Add Another Room to this Group
              </button>
            </div>

            <div className="p-10 bg-[#111] border-t-2 border-white/5 flex justify-between items-center">
              <div className="text-5xl font-black italic text-white tracking-tighter">
                TOTAL: <span className="text-red-600">{selectedRooms.reduce((sum, r) => sum + Number(r.price || 0), 0).toLocaleString()}</span> ฿
              </div>
              <div className="flex gap-6">
                <button onClick={() => setIsModalOpen(false)} className="px-10 py-5 font-black text-gray-500 uppercase tracking-widest hover:text-white transition-colors">Cancel</button>
                <button 
                  onClick={handleSaveBooking} 
                  className="bg-white text-red-700 px-16 py-5 rounded-2xl font-black text-2xl hover:bg-red-600 hover:text-white transition-all shadow-2xl active:scale-95 uppercase italic tracking-tighter"
                >
                  Confirm Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}