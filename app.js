// === Koneksi ke Supabase ===
const SUPABASE_URL = "https://uuhmzdzbqercxcbxucxi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1aG16ZHpicWVyY3hjYnh1Y3hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMDAzNTksImV4cCI6MjA3NjY3NjM1OX0.KJ05INGONvh5gv_eqfkiTDkrP5mhIn0NfjXMS4DLPCE";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// === UPLOAD KARYA SISWA ===
const uploadForm = document.getElementById("uploadForm");
if (uploadForm) {
  uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const namaKarya = document.getElementById("namaKarya").value.trim();
    const namaSiswa = document.getElementById("namaSiswa").value.trim();
    const kelas = document.getElementById("kelas").value.trim();
    const deskripsi = document.getElementById("deskripsi").value.trim();
    const passwordKarya = document.getElementById("passwordKarya").value.trim();
    const file = document.getElementById("fileUpload").files[0];

    if (!file) return showToast("⚠️ Pilih file gambar terlebih dahulu!");
    if (!passwordKarya) return showToast("⚠️ Password karya wajib diisi!");

    const filePath = `${Date.now()}_${file.name}`;

    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from("karya-siswa")
      .upload(filePath, file);

    if (uploadError) return showToast("❌ Gagal upload file!");

    const { data: publicData } = supabase.storage
      .from("karya-siswa")
      .getPublicUrl(filePath);

    const publicUrl = publicData.publicUrl;
    const realPath = uploadData.path;

    const { error: insertError } = await supabase.from("karya").insert([
      {
        nama_karya: namaKarya,
        nama_siswa: namaSiswa,
        kelas: kelas,
        deskripsi: deskripsi,
        password: passwordKarya,
        url: publicUrl,
        file_path: realPath,
      },
    ]);

    if (insertError) return showToast("❌ Gagal menyimpan data!");

    showToast("✅ Karya berhasil diupload!");
    uploadForm.reset();
    loadGallery();
  });
}

// === TAMPILKAN GALERI ===
async function loadGallery() {
  const galleryGrid = document.getElementById("galleryGrid");
  if (!galleryGrid) return;

  const { data, error } = await supabase
    .from("karya")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    galleryGrid.innerHTML = "<p>Gagal memuat galeri.</p>";
    return;
  }

  galleryGrid.innerHTML = data
    .map(
      (k) => `
        <div class="gallery-item">
          <img src="${k.url}" alt="${k.nama_karya}"
            onclick="showDetail('${k.url}', '${k.nama_karya.replace(/'/g, "\\'")}', '${k.nama_siswa.replace(/'/g, "\\'")}', '${k.kelas}', ${k.id}, '${(k.deskripsi || '').replace(/'/g, "\\'")}')">
          <h4>${k.nama_karya}</h4>
          <p>${k.nama_siswa} - ${k.kelas}</p>
          <button class="delete-btn" onclick="openDeleteModal(${k.id})">Hapus</button>
        </div>
      `
    )
    .join("");
}
loadGallery();

// === DETAIL MODAL ===
function showDetail(url, namaKarya, namaSiswa, kelas, id, deskripsi) {
  document.getElementById("detailImg").src = url;
  document.getElementById("detailTitle").textContent = namaKarya;
  document.getElementById("detailInfo").innerHTML = `
    <strong>${namaSiswa}</strong> - ${kelas}<br><br>
    <em>${deskripsi || "Tidak ada deskripsi."}</em>
  `;
  document.getElementById("detailModal").style.display = "flex";
}
function closeModal() {
  document.getElementById("detailModal").style.display = "none";
}

// === MODAL HAPUS ===
let deleteTarget = { id: null };
function openDeleteModal(id) {
  deleteTarget = { id };
  document.getElementById("deletePassword").value = "";
  document.getElementById("deleteModal").style.display = "flex";
}
function closeDeleteModal() {
  document.getElementById("deleteModal").style.display = "none";
}

document.getElementById("confirmDeleteBtn").addEventListener("click", async () => {
  const inputPassword = document.getElementById("deletePassword").value.trim();
  const { id } = deleteTarget;
  const parsedId = parseInt(id);

  if (!inputPassword) return showToast("⚠️ Password wajib diisi!");

  const { data, error } = await supabase
    .from("karya")
    .select("password, file_path")
    .match({ id: parsedId })
    .single();

  if (error || !data) {
    showToast("❌ Gagal menemukan karya di database!");
    return;
  }

  if (data.password !== inputPassword) {
    showToast("⚠️ Password salah!");
    return;
  }

  // Hapus file di storage
  if (data.file_path) {
    const { error: storageError } = await supabase
      .storage
      .from("karya-siswa")
      .remove([data.file_path]);
    if (storageError) console.warn("Gagal hapus file:", storageError.message);
  }

  // Hapus data di database
  const { error: delError } = await supabase
    .from("karya")
    .delete()
    .match({ id: parsedId });

  if (delError) {
    showToast("❌ Gagal menghapus karya dari database!");
  } else {
    showToast("✅ Karya berhasil dihapus!");
    closeDeleteModal();
    loadGallery();
  }
});


document.getElementById("cancelDeleteBtn").addEventListener("click", closeDeleteModal);

function closeDeleteModal() {
  document.getElementById("deleteModal").style.display = "none";
}
// === TOAST NOTIFIKASI ===
function showToast(message) {
  let toast = document.createElement("div");
  toast.className = "toast";
  toast.innerText = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 100);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// === ANIMASI SCROLL  ===
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