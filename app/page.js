"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function BookingTimeline() {
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState({});
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const [isSelecting, setIsSelecting] = useState(false);
  const [selection, setSelection] = useState({ roomId: null, startDay: null, endDay: null });

  const [newBooking, setNewBooking] = useState({ room_id: '', customer_name: '', price: 0, check_in: '', check_out: '', note: '', status: 'booked' });

  const columnWidth = 60;
  const sidebarWidth = 200;
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth()); // 0 = ม.ค.
  const [currentYear, setCurrentYear] = useState(2026);

  const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
  ];

// ฟังก์ชันหาจำนวนวันในเดือนนั้นๆ
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    const { data: r } = await supabase.from('rooms').select('*').order('room_no');
    const { data: b } = await supabase.from('bookings').select('*');
    setRooms(r || []);
    setBookings(b || []);
    const types = [...new Set(r?.map(room => room.room_type?.trim().toUpperCase()))];
    const initialStatus = {};
    types.forEach(t => initialStatus[t] = true);
    setExpandedGroups(initialStatus);
  }

  // ฟังก์ชันคำนวณจำนวนคืน
  const getNights = (checkIn, checkOut) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  };

  const handleSaveBooking = async () => {
    const { error } = await supabase.from('bookings').insert([newBooking]);
    if (error) alert("Error: " + error.message);
    else { setIsModalOpen(false); fetchData(); }
  };

  const handleCheckIn = async (id) => {
    await supabase.from('bookings').update({ status: 'checked_in' }).eq('id', id);
    setIsDetailOpen(false);
    fetchData();
  };

  const handleDelete = async (id) => {
    if (confirm("ยืนยันการลบการจอง?")) {
      await supabase.from('bookings').delete().eq('id', id);
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
    
    // ใช้ currentYear และ currentMonth แทนค่าคงที่
    const checkInDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(start).padStart(2, '0')}`;
    const checkOutDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(end + 1).padStart(2, '0')}`; 

    setNewBooking({
      ...newBooking,
      room_id: selection.roomId,
      check_in: checkInDate,
      check_out: checkOutDate,
    });
    setIsModalOpen(true);
    setIsSelecting(false);
  }
};

  const roomTypes = [...new Set(rooms.map(r => r.room_type?.trim().toUpperCase()))];

  return (
    <div className="p-6 bg-[#121212] min-h-screen text-white select-none font-sans" onMouseUp={handleMouseUp}>
      <header className="mb-6 flex justify-between items-center">
  <h1 className="text-2xl font-bold tracking-tighter text-gray-200 uppercase">
    Lanta <span className="text-red-700 text-3xl">Paradise</span>
  </h1>
  
  <div className="flex items-center gap-4 bg-white/5 p-1 rounded-full border border-white/10">
    <button 
      onClick={() => setCurrentMonth(prev => prev === 0 ? 11 : prev - 1)}
      className="p-2 hover:bg-white/10 rounded-full transition-colors">◀</button>
    
    <div className="text-xs font-black w-32 text-center uppercase tracking-widest">
      {monthNames[currentMonth]} {currentYear}
    </div>
    
    <button 
      onClick={() => setCurrentMonth(prev => prev === 11 ? 0 : prev + 1)}
      className="p-2 hover:bg-white/10 rounded-full transition-colors">▶</button>
  </div>
</header>

      <div className="overflow-x-auto border border-gray-800 rounded-3xl bg-[#1a1a1a] shadow-2xl relative">
        <div className="flex bg-[#1f1f1f] border-b border-gray-800 sticky top-0 z-[30]">
          <div className="w-[200px] min-w-[200px] p-4 font-black border-r border-gray-800 bg-[#1f1f1f] sticky left-0 z-[31] text-[10px] text-gray-500 tracking-widest uppercase">ROOMS LIST</div>
          {days.map(day => (
            <div key={day} className="w-[60px] min-w-[60px] p-3 text-center border-r border-gray-800/50 text-[14px] font-mono text-gray-600">{day}</div>
          ))}
        </div>

        {roomTypes.map(type => (
          <div key={type} className="relative">
            <div 
              onClick={() => setExpandedGroups(p => ({ ...p, [type]: !p[type] }))}
              className="bg-[#222] p-2 pl-4 flex items-center cursor-pointer hover:bg-[#282828] sticky left-0 z-[25] border-b border-gray-800"
            >
              <span className="mr-3 text-[14px] text-red-500">{expandedGroups[type] ? '▼' : '▶'}</span>
              <span className="text-[14px] font-black uppercase tracking-[0.2em] text-blue-400">{type}</span>
            </div>

            {/* ค้นหาห้องและวาดตาราง */}
{expandedGroups[type] && rooms.filter(r => r.room_type?.trim().toUpperCase() === type).map(room => (
  <div key={room.id} className="flex border-b border-gray-800/50 relative h-14 group">
    {/* ชื่อห้อง */}
    <div className="w-[200px] min-w-[200px] p-4 pl-8 border-r border-gray-800 bg-[#181818] sticky left-0 z-[20] text-[16px] font-bold text-gray-500 group-hover:text-white flex items-center uppercase">
      {room.room_no}
    </div>

    {/* ช่องตารางวัน (สร้างตามจำนวนวันในเดือนนั้นๆ) */}
    {days.map(day => {
      const isSelected = isSelecting && selection.roomId === room.id && 
        day >= Math.min(selection.startDay, selection.endDay) && 
        day <= Math.max(selection.startDay, selection.endDay);
      return (
        <div 
          key={day} 
          onMouseDown={() => handleMouseDown(room.id, day)} 
          onMouseEnter={() => handleMouseEnter(day)}
          className={`w-[60px] min-w-[60px] border-r border-gray-800/30 transition-colors cursor-cell ${isSelected ? 'bg-orange-500/20' : 'group-hover:bg-white/[0.02]'}`}
        />
      );
    })}

    {/* แถบสีการจอง (กรองเฉพาะเดือนและปีที่เลือก) */}
    {bookings.filter(b => {
      const checkInDate = new Date(b.check_in);
      return b.room_id === room.id && 
             checkInDate.getMonth() === currentMonth && 
             checkInDate.getFullYear() === currentYear;
    }).map(booking => {
      const bIn = new Date(booking.check_in);
      const bOut = new Date(booking.check_out);
      
      const startDay = bIn.getDate();
      // คำนวณจำนวนคืนจริง เพื่อให้แถบยาวถูกต้อง
      const nights = getNights(booking.check_in, booking.check_out);
      
      return (
        <div 
          key={booking.id}
          onClick={(e) => { 
            e.stopPropagation(); 
            setSelectedBooking({...booking, room_no: room.room_no}); 
            setIsDetailOpen(true); 
          }}
          className={`absolute h-10 mt-2 rounded-xl flex items-center justify-center cursor-pointer font-black shadow-xl z-[21] transition-all hover:scale-[1.01] border border-white/10 text-[10px] uppercase
            ${booking.status === 'checked_in' ? 'bg-green-600 shadow-green-900/20' : 'bg-red-500 shadow-red-900/20'}`}
          style={{
            // คำนวณตำแหน่ง: Sidebar(200) + (วันเริ่ม-1 * กว้างช่อง) + ครึ่งช่อง(30)
            left: `${200 + (startDay - 1) * 60 + 30}px`,
            // ความกว้าง: จำนวนคืน * กว้างช่อง
            width: `${nights * 60}px`,
          }}
        >
          <span className="truncate px-2 text-white drop-shadow-md text-[14px] font-black tracking-tight">
            {booking.customer_name}
          </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* --- MODAL รายละเอียด --- */}
      {isDetailOpen && selectedBooking && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[999] backdrop-blur-md transition-all">
          <div className="bg-[#1f1f1f] w-[400px] rounded-[2rem] border border-gray-800 overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className={`p-6 text-center font-black text-xl tracking-tighter ${selectedBooking.status === 'checked_in' ? 'bg-green-600' : 'bg-red-500'}`}>
              {selectedBooking.status === 'checked_in' ? 'IN HOUSE' : 'CONFIRMED'}
            </div>
            <div className="p-8 space-y-5">
              <div className="flex justify-between items-end border-b border-gray-800 pb-3">
                <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Customer</span>
                <span className="font-black text-lg">{selectedBooking.customer_name}</span>
              </div>

              {/* เพิ่มจำนวนคืนตรงนี้ครับพี่ */}
              <div className="flex justify-between items-end border-b border-gray-800 pb-3">
                <span className="text-gray-500 text-xs font-bold uppercase tracking-widest text-orange-500">Stay Duration</span>
                <span className="font-black text-lg text-orange-500 italic">{getNights(selectedBooking.check_in, selectedBooking.check_out)} Nights</span>
              </div>

              <div className="flex justify-between items-end border-b border-gray-800 pb-3">
                <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Room No.</span>
                <span className="font-black text-blue-400">{selectedBooking.room_no}</span>
              </div>
              <div className="flex justify-between items-end border-b border-gray-800 pb-3">
                <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Stay Period</span>
                <span className="font-bold text-sm text-gray-300">{selectedBooking.check_in} - {selectedBooking.check_out}</span>
              </div>
              <div className="flex justify-between items-end border-b border-gray-800 pb-3">
                <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Total</span>
                <span className="font-black text-xl text-yellow-500">{Number(selectedBooking.price).toLocaleString()} ฿</span>
              </div>
              
              <div className="flex flex-col gap-3 pt-6">
                {selectedBooking.status !== 'checked_in' && (
                  <button onClick={() => handleCheckIn(selectedBooking.id)} className="w-full py-4 bg-green-600 hover:bg-green-500 rounded-2xl font-black transition-all shadow-lg active:scale-95">CHECK IN NOW</button>
                )}
                <div className="flex gap-2">
                  <button onClick={() => handleDelete(selectedBooking.id)} className="flex-1 py-4 bg-orange-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-2xl font-bold transition-all text-xs">DELETE</button>
                  <button onClick={() => setIsDetailOpen(false)} className="flex-1 py-4 bg-gray-800 hover:bg-gray-700 rounded-2xl font-bold transition-all text-gray-400 text-xs">CLOSE</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL จองใหม่ --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[999] backdrop-blur-sm">
          <div className="bg-[#1a1a1a] p-8 rounded-[2rem] w-[400px] border border-red-500/30 shadow-2xl">
            <h2 className="text-2xl font-black mb-6 text-red-500 tracking-tighter italic underline decoration-4">NEW BOOKING</h2>
            <div className="space-y-4">
              <input className="w-full bg-black/50 p-4 border border-gray-800 rounded-2xl outline-none focus:border-red-700 text-white placeholder:text-gray-700" placeholder="Customer Name" onChange={e => setNewBooking({...newBooking, customer_name: e.target.value})} />
              <input className="w-full bg-black/50 p-4 border border-gray-800 rounded-2xl outline-none focus:border-red-700 text-white placeholder:text-gray-700" type="number" placeholder="Price" onChange={e => setNewBooking({...newBooking, price: e.target.value})} />
              <textarea className="w-full bg-black/50 p-4 border border-gray-800 rounded-2xl outline-none focus:border-red-700 text-white h-24 placeholder:text-gray-700" placeholder="Note..." onChange={e => setNewBooking({...newBooking, note: e.target.value})} />
              <div className="flex gap-3 pt-4">
                <button className="flex-1 py-4 bg-gray-800 rounded-2xl font-bold text-gray-500 hover:text-white" onClick={() => setIsModalOpen(false)}>CANCEL</button>
                <button className="flex-1 py-4 bg-red-600 hover:bg-red-500 rounded-2xl font-black shadow-lg shadow-red-900/20 active:scale-95" onClick={handleSaveBooking}>CREATE</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}