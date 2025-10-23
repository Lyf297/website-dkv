// === Koneksi ke Supabase ===
// Ganti dengan kredensial proyek kamu
const SUPABASE_URL = "https://uuhmzdzbqercxcbxucxi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1aG16ZHpicWVyY3hjYnh1Y3hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMDAzNTksImV4cCI6MjA3NjY3NjM1OX0.KJ05INGONvh5gv_eqfkiTDkrP5mhIn0NfjXMS4DLPCE";
// Pastikan library Supabase sudah dimuat di HTML:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// === UPLOAD KARYA SISWA ===
const uploadForm = document.getElementById("uploadForm");
if (uploadForm) {
  uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const namaKarya = document.getElementById("namaKarya").value.trim();
    const namaSiswa = document.getElementById("namaSiswa").value.trim();
    const kelas = document.getElementById("kelas").value.trim();
    const file = document.getElementById("fileUpload").files[0];

    if (!file) return alert("⚠️ Pilih file gambar terlebih dahulu!");

    const filePath = `${Date.now()}_${file.name}`;

    // Upload ke storage Supabase
    const { data, error } = await supabase.storage
      .from("karya-siswa")
      .upload(filePath, file);

    if (error) {
      console.error(error);
      return alert("❌ Gagal upload: " + error.message);
    }

    // Ambil URL publik gambar
    const { data: urlData } = supabase
      .storage
      .from("karya-siswa")
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    // Simpan data ke tabel 'karya'
    const { error: insertError } = await supabase
      .from("karya")
      .insert([
        {
          nama_karya: namaKarya,
          nama_siswa: namaSiswa,
          kelas: kelas,
          url: publicUrl,
        },
      ]);

    if (insertError) {
      console.error(insertError);
      return alert("❌ Gagal menyimpan data ke database.");
    }

    alert("✅ Karya berhasil diupload!");
    uploadForm.reset();
    loadGallery();
  });
}

// === TAMPILKAN GALERI ===
async function loadGallery() {
  const galleryGrid = document.getElementById("galleryGrid");
  if (!galleryGrid) return;

  const { data, error } = await supabase.from("karya").select("*").order("id", { ascending: false });
  if (error) {
    console.error(error);
    galleryGrid.innerHTML = "<p>Gagal memuat galeri.</p>";
    return;
  }

  galleryGrid.innerHTML = data
    .map(
      (k) => `
        <div>
          <img src="${k.url}" alt="${k.nama_karya}">
          <h4>${k.nama_karya}</h4>
          <p>${k.nama_siswa} - ${k.kelas}</p>
        </div>
      `
    )
    .join("");
}
loadGallery();

// === FORM KIRIM PESAN ===
const messageForm = document.getElementById("messageForm");
if (messageForm) {
  messageForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nama = document.getElementById("nama").value.trim();
    const email = document.getElementById("email").value.trim();
    const pesan = document.getElementById("pesan").value.trim();

    if (!nama || !email || !pesan) {
      alert("⚠️ Harap isi semua kolom!");
      return;
    }

    const { error } = await supabase
      .from("messages")
      .insert([{ nama, email, pesan }]);

    if (error) {
      console.error(error);
      return alert("❌ Gagal kirim pesan: " + error.message);
    }

    alert("✅ Pesan berhasil dikirim!");
    messageForm.reset();
  });
}

// === ANIMASI SAAT SCROLL ===
document.addEventListener("scroll", () => {
  const reveals = document.querySelectorAll("section");
  const triggerBottom = window.innerHeight * 0.9;

  reveals.forEach((section) => {
    const sectionTop = section.getBoundingClientRect().top;
    if (sectionTop < triggerBottom) {
      section.style.animation = "fadeUp 0.8s ease forwards";
    }
  });
});
