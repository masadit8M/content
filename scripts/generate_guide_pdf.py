import sys
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        if self._pageNumber > 1:
            self.drawString(1.8 * cm, 28.5 * cm, "Panduan Workflow & Penggunaan — Arjuna Consulting & Rumah Nara Daycare")
            self.setStrokeColor(colors.HexColor("#e2e8f0"))
            self.setLineWidth(0.5)
            self.line(1.8 * cm, 28.3 * cm, 19.2 * cm, 28.3 * cm)
        
        page_str = f"Halaman {self._pageNumber} dari {page_count}"
        self.drawRightString(19.2 * cm, 1.2 * cm, page_str)
        self.drawString(1.8 * cm, 1.2 * cm, "https://arjunaworkspace.kinikutau.com · Dokumen Resmi & Internal")
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.5)
        self.line(1.8 * cm, 1.5 * cm, 19.2 * cm, 1.5 * cm)
        self.restoreState()

def build_pdf(filename):
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        leftMargin=1.8 * cm,
        rightMargin=1.8 * cm,
        topMargin=2.2 * cm,
        bottomMargin=2.2 * cm
    )

    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#0f172a"),
        spaceAfter=4
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor("#059669"),
        spaceAfter=12
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=colors.HexColor("#0f172a"),
        spaceBefore=10,
        spaceAfter=5
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor("#047857"),
        spaceBefore=7,
        spaceAfter=3
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13.5,
        textColor=colors.HexColor("#334155"),
        spaceAfter=5
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=13,
        textColor=colors.HexColor("#1e293b"),
        leftIndent=10,
        spaceAfter=3
    )

    box_style = ParagraphStyle(
        'BoxText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.5,
        textColor=colors.HexColor("#065f46")
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11.5,
        textColor=colors.white
    )

    table_body_style = ParagraphStyle(
        'TableBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11.5,
        textColor=colors.HexColor("#1e293b")
    )

    story = []

    story.append(Paragraph("PANDUAN ALUR KERJA (WORKFLOW)", title_style))
    story.append(Paragraph("ARJUNA CONSULTING & RUMAH NARA ISLAMIC CHILD CENTER", subtitle_style))
    story.append(Paragraph("Portal Digital Resmi: <b>https://arjunaworkspace.kinikutau.com</b>", body_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#059669"), spaceAfter=10))

    intro_p = Paragraph(
        "<b>Tujuan Sistem:</b> Panduan ini dirancang khusus agar tim konsultan Arjuna dan pihak Rumah Nara "
        "dapat berkoordinasi secara rapi, cepat, dan transparan selama masa pendampingan 12 bulan. "
        "Seluruh catatan jadwal kunjungan, foto/video SOP, persetujuan masukan konsultan, dan rekap bulanan tersimpan otomatis di cloud "
        "sehingga tidak lagi bergantung pada grup WhatsApp dan tidak ada data penting yang tercecer.",
        box_style
    )
    intro_table = Table([[intro_p]], colWidths=[17.4 * cm])
    intro_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#ecfdf5")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#a7f3d0")),
        ('TOPPADDING', (0,0), (-1,-1), 7),
        ('BOTTOMPADDING', (0,0), (-1,-1), 7),
        ('LEFTPADDING', (0,0), (-1,-1), 9),
        ('RIGHTPADDING', (0,0), (-1,-1), 9),
    ]))
    story.append(intro_table)
    story.append(Spacer(1, 8))

    # 1. AKUN PENGGUNA
    story.append(Paragraph("1. DAFTAR AKUN & PERAN PENGGUNA", h1_style))
    story.append(Paragraph(
        "Aplikasi telah dikonfigurasi dengan 6 akun resmi siap pakai:",
        body_style
    ))

    user_data = [
        [
            Paragraph("Nama Pengguna", table_header_style),
            Paragraph("Email Login", table_header_style),
            Paragraph("Peran & Tanggung Jawab", table_header_style)
        ],
        [
            Paragraph("<b>Mbak Tika</b>", table_body_style),
            Paragraph("tika@arjuna.id", table_body_style),
            Paragraph("<b>Lead Consultant</b> — Menginput rencana & hasil kunjungan, menyusun SOP, mengajukan rekomendasi, serta mendampingi guru & staf.", table_body_style)
        ],
        [
            Paragraph("<b>Ms. Tsania</b>", table_body_style),
            Paragraph("tsania@rumahnara.id", table_body_style),
            Paragraph("<b>Kepala Daycare</b> — Menerima pelaporan PIC, memantau checklist tugas operasional, mengunggah foto/video sanitasi & aktivitas anak.", table_body_style)
        ],
        [
            Paragraph("<b>Mr. Ryan</b>", table_body_style),
            Paragraph("ryan@rumahnara.id", table_body_style),
            Paragraph("<b>Owner / Decision Maker</b> — Memberikan persetujuan (approval) rekomendasi strategis, anggaran biaya, dan memantau laporan berkala.", table_body_style)
        ],
        [
            Paragraph("<b>Mas Adit</b>", table_body_style),
            Paragraph("masadit@arjuna.id", table_body_style),
            Paragraph("<b>Super Admin (Arjuna)</b> — Pengawasan seluruh proyek pendampingan, manajemen database cloud, dan audit trail.", table_body_style)
        ],
        [
            Paragraph("<b>Cindy & Lena</b>", table_body_style),
            Paragraph("cindy@arjuna.id<br/>lena@arjuna.id", table_body_style),
            Paragraph("<b>Tim Konsultan Pendukung</b> — Membantu penyusunan modul pelatihan guru, checklist sanitasi, dan dokumentasi visual.", table_body_style)
        ]
    ]

    user_table = Table(user_data, colWidths=[3.2 * cm, 3.8 * cm, 10.4 * cm])
    user_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0f172a")),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(user_table)
    story.append(Paragraph("<font color='#64748b' size=7.5><i>* Password default login awal: <b>arjuna123</b></i></font>", body_style))
    story.append(Spacer(1, 8))

    # 2. WORKFLOW
    story.append(Paragraph("2. ALUR KERJA UTAMA (WORKFLOW HARIAN & MINGGUAN)", h1_style))
    
    # Step 1
    story.append(Paragraph("Langkah 1: Perencanaan & Pelaporan Kunjungan (Menu 'Jurnal & Jadwal')", h2_style))
    story.append(Paragraph("<b>Pelaksana: Mbak Tika & Tim Konsultan Arjuna</b>", body_style))
    story.append(Paragraph("• Klik tombol <b>'+ Rencana & Kunjungan'</b>.", bullet_style))
    story.append(Paragraph("• Pilih Status: <b>'Rencana Jadwal'</b> (jika menjadwalkan ke depan) atau <b>'Sudah Terlaksana'</b> (jika kunjungan telah selesai).", bullet_style))
    story.append(Paragraph("• Isi tanggal, jam kunjungan, dan lokasi (contoh: Daycare Jl. Pajajaran).", bullet_style))
    story.append(Paragraph("• <b>Multi-PIC Pelaporan:</b> Klik nama <b>Ms. Tsania</b> dan <b>Mr. Ryan</b> agar laporan otomatis ditujukan kepada pihak Rumah Nara.", bullet_style))
    story.append(Paragraph("• Tulis ringkas: <i>Hasil (Outcome)</i>, <i>Temuan Lapangan</i>, dan <i>Tindak Lanjut</i>.", bullet_style))
    story.append(Paragraph("• <b>Fitur 1-Klik:</b> Jika status awalnya Rencana, saat kunjungan selesai cukup klik tombol <b>'Tandai Selesai'</b>.", bullet_style))

    story.append(Spacer(1, 4))

    # Step 2
    story.append(Paragraph("Langkah 2: Dokumentasi Visual Lapangan (Menu 'Foto & Video')", h2_style))
    story.append(Paragraph("<b>Pelaksana: Seluruh User (Mbak Tika, Ms. Tsania, Guru)</b>", body_style))
    story.append(Paragraph("• Buka menu <b>Foto & Video</b> > klik <b>'Upload Foto / Video'</b>.", bullet_style))
    story.append(Paragraph("• Langsung ambil foto dari kamera HP atau unggah dari galeri/laptop.", bullet_style))
    story.append(Paragraph("• Pilih kategori: <i>Penerapan SOP, Fasilitas & Sanitasi, Kegiatan Anak,</i> atau <i>Briefing Guru</i>.", bullet_style))
    story.append(Paragraph("• <b>Pengaturan Privasi / Target Penerima:</b>", bullet_style))
    story.append(Paragraph("  - Pilih <b>'🌐 Semua Tim'</b> jika dokumentasi bersifat umum untuk semua orang.", bullet_style))
    story.append(Paragraph("  - Pilih <b>'👤 User Tertentu'</b> jika dokumentasi bersifat rahasia/sensitif (hanya terlihat oleh pengunggah dan user yang dipilih).", bullet_style))

    story.append(Spacer(1, 4))

    # Step 3
    story.append(Paragraph("Langkah 3: Diary Observasi Mandiri (Menu 'Jurnal & Jadwal' > Tab 2)", h2_style))
    story.append(Paragraph("<b>Pelaksana: Masing-masing User secara Pribadi</b>", body_style))
    story.append(Paragraph("• Buka sub-tab <b>'🔒 Diary Observasi Saya'</b>.", bullet_style))
    story.append(Paragraph("• Fitur ini <b>100% privat</b>. Catatan yang ditulis di tab ini TIDAK DAPAT dibaca oleh akun lain.", bullet_style))
    story.append(Paragraph("• Cocok untuk: catatan evaluasi mandiri konsultan, catatan personal guru, atau draft pemikiran owner sebelum rapat.", bullet_style))

    story.append(PageBreak())

    # Step 4
    story.append(Paragraph("Langkah 4: Rekomendasi & Persetujuan Klien (Menu 'Rekomendasi & Solusi')", h2_style))
    story.append(Paragraph("<b>Pelaksana: Mbak Tika (Pengusul) & Mr. Ryan / Ms. Tsania (Pemberi Persetujuan)</b>", body_style))
    story.append(Paragraph("• <b>Mbak Tika</b> merumuskan rekomendasi perbaikan (misal: pengadaan lemari sanitasi botol, revisi alur sambut pagi anak, dll).", bullet_style))
    story.append(Paragraph("• Pihak Rumah Nara (<b>Mr. Ryan / Ms. Tsania</b>) dapat melihat rekomendasi dan menekan tombol:", bullet_style))
    story.append(Paragraph("  - <b>'✅ Setujui Rekomendasi'</b> jika sepakat untuk diterapkan.", bullet_style))
    story.append(Paragraph("  - <b>'💬 Minta Diskusi'</b> jika memerlukan pertimbangan anggaran atau penyesuaian jadwal.", bullet_style))
    story.append(Paragraph("• Rekam jejak persetujuan tersimpan rapi untuk laporan pertanggungjawaban.", bullet_style))

    story.append(Spacer(1, 6))

    # Step 5
    story.append(Paragraph("Langkah 5: Cetak & Simpan Laporan PDF Bulanan", h2_style))
    story.append(Paragraph("<b>Pelaksana: Mbak Tika & Manajemen Rumah Nara</b>", body_style))
    story.append(Paragraph("• Di menu <b>Jurnal & Jadwal</b> atau <b>Laporan & Dokumen</b>, gunakan filter bulan (contoh: September 2026).", bullet_style))
    story.append(Paragraph("• Klik tombol <b>'🖨️ Cetak Rekap Kunjungan'</b>.", bullet_style))
    story.append(Paragraph("• Pratinjau cetak resmi akan muncul lengkap dengan kop surat Arjuna Consulting, rekap temuan, dan lembar tanda tangan.", bullet_style))
    story.append(Paragraph("• Pilih <b>'Simpan sebagai PDF'</b> untuk arsip digital yayasan.", bullet_style))

    story.append(Spacer(1, 8))

    # 3. TIPS MOBILE
    story.append(Paragraph("3. PANDUAN PENGGUNAAN DI SMARTPHONE (MOBILE VIEW)", h1_style))
    
    mobile_box = Paragraph(
        "<b>Tips Penggunaan Praktis di HP:</b><br/>"
        "1. Buka <b>https://arjunaworkspace.kinikutau.com</b> di browser Chrome (Android) atau Safari (iPhone).<br/>"
        "2. Di browser, klik tombol menu (titik tiga atau ikon share) > pilih <b>'Tambahkan ke Layar Utama' (Add to Home Screen)</b>.<br/>"
        "3. Ikon web app akan muncul di layar depan HP Anda layaknya aplikasi native tanpa perlu install dari PlayStore/AppStore.<br/>"
        "4. Gunakan bilah menu di bagian bawah layar HP untuk berpindah cepat antara Ringkasan, Jurnal, Tugas, dan Foto.",
        box_style
    )
    m_table = Table([[mobile_box]], colWidths=[17.4 * cm])
    m_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f0fdf4")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#86efac")),
        ('TOPPADDING', (0,0), (-1,-1), 7),
        ('BOTTOMPADDING', (0,0), (-1,-1), 7),
        ('LEFTPADDING', (0,0), (-1,-1), 9),
        ('RIGHTPADDING', (0,0), (-1,-1), 9),
    ]))
    story.append(m_table)

    story.append(Spacer(1, 15))

    # Lembar Tanda Tangan
    sign_p1 = Paragraph("<b>Pihak Konsultan:</b><br/><br/><br/><br/><b>Mbak Tika</b><br/>Lead Consultant<br/>Yayasan Arjuna Cendekia", body_style)
    sign_p2 = Paragraph("<b>Pihak Klien:</b><br/><br/><br/><br/><b>Ms. Tsania / Mr. Ryan</b><br/>Kepala Daycare / Owner<br/>Rumah Nara Islamic Child Center", body_style)
    sign_table = Table([[sign_p1, sign_p2]], colWidths=[8.7 * cm, 8.7 * cm])
    sign_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 20),
        ('RIGHTPADDING', (0,0), (-1,-1), 20),
    ]))
    story.append(sign_table)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"SUCCESS: PDF generated at {filename}")

if __name__ == '__main__':
    target_file = "public/PANDUAN_WORKFLOW_ARJUNA_RUMAH_NARA.pdf"
    build_pdf(target_file)
    import shutil
    shutil.copyfile(target_file, "PANDUAN_WORKFLOW_ARJUNA_RUMAH_NARA.pdf")
    print("SUCCESS: Copied to root workspace")
