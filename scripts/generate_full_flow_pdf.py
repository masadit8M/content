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
            self.drawString(1.8 * cm, 28.5 * cm, "Dokumen Alur Kerja & Sistem Update Web App — Arjuna Consulting & Rumah Nara")
            self.setStrokeColor(colors.HexColor("#e2e8f0"))
            self.setLineWidth(0.5)
            self.line(1.8 * cm, 28.3 * cm, 19.2 * cm, 28.3 * cm)
        
        page_str = f"Halaman {self._pageNumber} dari {page_count}"
        self.drawRightString(19.2 * cm, 1.2 * cm, page_str)
        self.drawString(1.8 * cm, 1.2 * cm, "https://arjunaworkspace.kinikutau.com · Dokumen Arsitektur & Workflow Resmi")
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
        fontSize=18,
        leading=22,
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
        spaceAfter=10
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#0f172a"),
        spaceBefore=9,
        spaceAfter=4
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#047857"),
        spaceBefore=6,
        spaceAfter=3
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=13,
        textColor=colors.HexColor("#334155"),
        spaceAfter=4
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.5,
        textColor=colors.HexColor("#1e293b"),
        leftIndent=10,
        spaceAfter=3
    )

    box_style = ParagraphStyle(
        'BoxText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=12,
        textColor=colors.HexColor("#065f46")
    )

    flow_box_style = ParagraphStyle(
        'FlowBoxText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=12,
        textColor=colors.HexColor("#1e293b")
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
        leading=11,
        textColor=colors.HexColor("#1e293b")
    )

    story = []

    # Title
    story.append(Paragraph("DOKUMEN ALUR SISTEM & WORKFLOW PENGGUNAAN", title_style))
    story.append(Paragraph("ARJUNA CONSULTING & RUMAH NARA ISLAMIC CHILD CENTER", subtitle_style))
    story.append(Paragraph("Alamat Web App: <b>https://arjunaworkspace.kinikutau.com</b> | Repository: <b>github.com/masadit8M/arjuna-workspace</b>", body_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#059669"), spaceAfter=8))

    # Ringkasan Eksekutif
    intro_p = Paragraph(
        "<b>Ringkasan Eksekutif:</b> Dokumen ini menyajikan panduan komprehensif mengenai: "
        "(1) <b>Arsitektur Pembaruan Otomatis (CI/CD Auto-Deploy)</b> dari pengembangan hingga live di Hostinger tanpa risiko kehilangan data, "
        "(2) <b>Alur Penggunaan Operasional Harian</b> antara tim konsultan Arjuna dan manajemen Rumah Nara, serta "
        "(3) <b>Struktur Akun & Keamanan Data</b> di cloud database Supabase.",
        box_style
    )
    intro_table = Table([[intro_p]], colWidths=[17.4 * cm])
    intro_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#ecfdf5")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#a7f3d0")),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(intro_table)
    story.append(Spacer(1, 6))

    # BAB 1: ALUR UPDATE SISTEM (CI/CD PIPELINE)
    story.append(Paragraph("1. ALUR UPDATE & PEMELIHARAAN SISTEM (AUTO-DEPLOYMENT)", h1_style))
    story.append(Paragraph(
        "Sistem web app ini mengadopsi arsitektur <i>Continuous Integration & Continuous Deployment (CI/CD)</i> modern. "
        "Setiap permintaan pembaruan fitur akan terdistribusi secara otomatis:",
        body_style
    ))

    flow_table_data = [
        [
            Paragraph("Tahapan", table_header_style),
            Paragraph("Pelaksana", table_header_style),
            Paragraph("Mekanisme & Jaminan Keamanan", table_header_style)
        ],
        [
            Paragraph("<b>1. Request Update</b>", table_body_style),
            Paragraph("User / Mas Adit", table_body_style),
            Paragraph("Menyampaikan kebutuhan perbaikan atau fitur baru melalui chat asisten AI pengembang.", table_body_style)
        ],
        [
            Paragraph("<b>2. Koding & Test</b>", table_body_style),
            Paragraph("AI Developer", table_body_style),
            Paragraph("Fitur dikoding, diuji compile TypeScript, dan diverifikasi kompatibilitas mobile-nya.", table_body_style)
        ],
        [
            Paragraph("<b>3. Git Push</b>", table_body_style),
            Paragraph("AI Developer", table_body_style),
            Paragraph("Perubahan kodingan di-commit dan di-push ke GitHub repository (branch <b>main</b>).", table_body_style)
        ],
        [
            Paragraph("<b>4. Auto-Deploy</b>", table_body_style),
            Paragraph("Hostinger Web App", table_body_style),
            Paragraph("Hostinger mendeteksi commit baru via Webhook GitHub, mengunduh kode baru, dan me-rebuild website secara otomatis dalam 1–2 menit.", table_body_style)
        ],
        [
            Paragraph("<b>5. Data Permanen</b>", table_body_style),
            Paragraph("Supabase Cloud", table_body_style),
            Paragraph("<b>Zero Data Loss:</b> Database dan file media tersimpan terpisah di Supabase Cloud PostgreSQL, sehingga <b>tidak akan pernah terhapus</b> saat Hostinger melakukan build ulang.", table_body_style)
        ]
    ]
    flow_table = Table(flow_table_data, colWidths=[2.8 * cm, 3.2 * cm, 11.4 * cm])
    flow_table.setStyle(TableStyle([
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
    story.append(flow_table)
    story.append(Spacer(1, 8))

    # BAB 2: DAFTAR AKUN & HAK AKSES
    story.append(Paragraph("2. DAFTAR AKUN PENGGUNA & HAK AKSES", h1_style))

    account_table_data = [
        [
            Paragraph("Nama Pengguna", table_header_style),
            Paragraph("Email Terdaftar", table_header_style),
            Paragraph("Peran & Tanggung Jawab Operasional", table_header_style)
        ],
        [
            Paragraph("<b>Mbak Tika</b>", table_body_style),
            Paragraph("tika@arjuna.id", table_body_style),
            Paragraph("<b>Lead Consultant</b>: Perencana jadwal kunjungan, pembuat rekomendasi SOP, pengisi evaluasi temuan, dan pendamping guru.", table_body_style)
        ],
        [
            Paragraph("<b>Ms. Tsania</b>", table_body_style),
            Paragraph("tsania@rumahnara.id", table_body_style),
            Paragraph("<b>Kepala Daycare</b>: Penerima laporan kunjungan, koordinator tugas pengasuh/guru, pengunggah foto sanitasi & kegiatan anak.", table_body_style)
        ],
        [
            Paragraph("<b>Mr. Ryan</b>", table_body_style),
            Paragraph("ryan@rumahnara.id", table_body_style),
            Paragraph("<b>Owner / Decision Maker</b>: Penyetuju rekomendasi strategis & anggaran perbaikan, pengawas rekap laporan berkala.", table_body_style)
        ],
        [
            Paragraph("<b>Mas Adit</b>", table_body_style),
            Paragraph("masadit@arjuna.id", table_body_style),
            Paragraph("<b>Super Admin (Arjuna)</b>: Pengawasan menyeluruh seluruh aktivitas pendampingan, audit log, dan administrasi.", table_body_style)
        ],
        [
            Paragraph("<b>Cindy & Lena</b>", table_body_style),
            Paragraph("cindy@arjuna.id<br/>lena@arjuna.id", table_body_style),
            Paragraph("<b>Tim Konsultan Pendukung</b>: Asistensi modul pelatihan guru, standarisasi fasilitas, dan dokumentasi visual.", table_body_style)
        ]
    ]
    acc_table = Table(account_table_data, colWidths=[3.0 * cm, 3.8 * cm, 10.6 * cm])
    acc_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#047857")),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(acc_table)
    story.append(Paragraph("<font color='#64748b' size=7.5><i>* Password default login awal seluruh akun: <b>arjuna123</b></i></font>", body_style))

    story.append(PageBreak())

    # BAB 3: WORKFLOW PENGGUNAAN FITUR
    story.append(Paragraph("3. ALUR KERJA DETAIL PENGGUNAAN FITUR (USER WORKFLOW)", h1_style))

    # Flow 1
    story.append(Paragraph("A. Perencanaan Jadwal & Laporan Kunjungan (Menu 'Jurnal & Jadwal')", h2_style))
    story.append(Paragraph("• <b>Input Agenda:</b> Mbak Tika membuka menu <i>Jurnal & Jadwal</i> > klik <b>'+ Rencana & Kunjungan'</b>.", bullet_style))
    story.append(Paragraph("• <b>Status Fleksibel:</b> Pilih status <b>'📌 Rencana Jadwal'</b> (jika penjadwalan ke depan) atau <b>'✅ Sudah Terlaksana'</b> (jika kunjungan telah selesai).", bullet_style))
    story.append(Paragraph("• <b>Multi-PIC Pelaporan:</b> Mbak Tika dapat mengklik lebih dari satu nama penerima (misal: <b>Ms. Tsania & Mr. Ryan</b>) agar kedua pimpinan Rumah Nara otomatis mendapatkan tembusan laporan.", bullet_style))
    story.append(Paragraph("• <b>Struktur 3 Temuan:</b> Form meminta <i>Hasil (Outcome)</i>, <i>Temuan Lapangan</i>, dan <i>Tindak Lanjut</i> agar tidak ada catatan yang terlewat.", bullet_style))
    story.append(Paragraph("• <b>Pembaruan 1-Klik:</b> Jika status awalnya Rencana, saat kunjungan selesai cukup tekan tombol <b>'Tandai Selesai'</b> di kartu kegiatan.", bullet_style))

    story.append(Spacer(1, 4))

    # Flow 2
    story.append(Paragraph("B. Dokumentasi Lapangan Foto & Video (Menu 'Foto & Video')", h2_style))
    story.append(Paragraph("• <b>Upload Langsung:</b> Mengambil foto/video langsung dari kamera smartphone atau laptop.", bullet_style))
    story.append(Paragraph("• <b>Kategori Standar:</b> Penerapan SOP, Fasilitas & Sanitasi, Kegiatan Anak, atau Briefing Guru.", bullet_style))
    story.append(Paragraph("• <b>Privasi / Target Penerima:</b>", bullet_style))
    story.append(Paragraph("  - <b>'🌐 Semua Tim':</b> Dokumentasi terbuka untuk seluruh tim konsultan & pihak daycare.", bullet_style))
    story.append(Paragraph("  - <b>'👤 User Tertentu':</b> Khusus foto/video sensitif (misal temuan sanitasi khusus yang hanya ditujukan kepada Ms. Tsania / Mr. Ryan). Anggota lain tidak dapat melihatnya.", bullet_style))

    story.append(Spacer(1, 4))

    # Flow 3
    story.append(Paragraph("C. Diary Observasi Mandiri Pribadi (Tab '🔒 Diary Observasi Saya')", h2_style))
    story.append(Paragraph("• <b>Privasi Mutlak:</b> Catatan di tab ini <b>100% RAHASIA</b> dan terenkripsi per-user. Hanya pemilik akun yang dapat membaca atau mengeditnya.", bullet_style))
    story.append(Paragraph("• <b>Kegunaan:</b> Wadah refleksi konsultan, catatan harian kepala daycare terkait perilaku anak/guru, atau catatan strategis owner sebelum rapat formal.", bullet_style))

    story.append(Spacer(1, 4))

    # Flow 4
    story.append(Paragraph("D. Pengajuan Rekomendasi & Persetujuan Klien (Menu 'Rekomendasi & Solusi')", h2_style))
    story.append(Paragraph("• <b>Mbak Tika</b> merumuskan rekomendasi perbaikan (misal: penataan ruang makan bayi, SOP isolasi anak sakit, rasio guru-anak).", bullet_style))
    story.append(Paragraph("• <b>Pihak Rumah Nara (Mr. Ryan / Ms. Tsania)</b> menerima notifikasi di dashboard utama.", bullet_style))
    story.append(Paragraph("• Pihak Rumah Nara cukup menekan tombol:", bullet_style))
    story.append(Paragraph("  - <b>'✅ Setujui Rekomendasi'</b> jika sepakat untuk diterapkan.", bullet_style))
    story.append(Paragraph("  - <b>'💬 Minta Diskusi'</b> jika memerlukan penyesuaian anggaran atau tahapan waktu.", bullet_style))
    story.append(Paragraph("• Status persetujuan tercatat otomatis untuk audit laporan akhir pendampingan 12 bulan.", bullet_style))

    story.append(Spacer(1, 4))

    # Flow 5
    story.append(Paragraph("E. Cetak Rekap & Simpan PDF Bulanan (Menu 'Jurnal & Jadwal')", h2_style))
    story.append(Paragraph("• Pilih filter bulan (misal: <i>September 2026</i>) > klik tombol <b>'🖨️ Cetak Rekap Kunjungan'</b>.", bullet_style))
    story.append(Paragraph("• Format cetak otomatis tersusun rapi dengan kop surat Arjuna Consulting, daftar hadir PIC, dan kolom tanda tangan pengesahan.", bullet_style))

    story.append(Spacer(1, 8))

    # BAB 4: PANDUAN PENGGUNAAN MOBILE
    story.append(Paragraph("4. PANDUAN PENGGUNAAN DI SMARTPHONE (MOBILE FRIENDLY)", h1_style))
    m_box_content = Paragraph(
        "<b>Cara Menjadikan Web App Seperti Aplikasi HP (Shortcut Layar Depan):</b><br/>"
        "1. Buka <b>https://arjunaworkspace.kinikutau.com</b> di browser Chrome (Android) atau Safari (iPhone).<br/>"
        "2. Tekan menu browser (ikon titik tiga atau ikon share/bagikan).<br/>"
        "3. Pilih menu <b>'Tambahkan ke Layar Utama' (Add to Home Screen)</b>.<br/>"
        "4. Ikon Arjuna Consulting akan muncul di beranda smartphone Anda dan dapat dibuka langsung layaknya aplikasi native tanpa perlu membuka browser manual.<br/>"
        "5. Seluruh menu utama dapat diakses mudah lewat <b>Bottom Navigation Bar</b> di bagian bawah layar HP.",
        box_style
    )
    m_box_table = Table([[m_box_content]], colWidths=[17.4 * cm])
    m_box_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(m_box_table)

    story.append(Spacer(1, 15))

    # Pengesahan
    sign_p1 = Paragraph("<b>Pihak Konsultan:</b><br/><br/><br/><br/><b>Mbak Tika</b><br/>Lead Consultant<br/>Yayasan Arjuna Cendekia", body_style)
    sign_p2 = Paragraph("<b>Pihak Klien:</b><br/><br/><br/><br/><b>Ms. Tsania / Mr. Ryan</b><br/>Kepala Daycare / Owner<br/>Rumah Nara Islamic Child Center", body_style)
    sign_table = Table([[sign_p1, sign_p2]], colWidths=[8.7 * cm, 8.7 * cm])
    sign_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 15),
        ('RIGHTPADDING', (0,0), (-1,-1), 15),
    ]))
    story.append(sign_table)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"SUCCESS: Generated {filename}")

if __name__ == '__main__':
    target = "public/DOKUMEN_ALUR_KERJA_DAN_UPDATE_WEB_APP.pdf"
    build_pdf(target)
    import shutil
    shutil.copyfile(target, "DOKUMEN_ALUR_KERJA_DAN_UPDATE_WEB_APP.pdf")
    print("SUCCESS: Copied to root workspace")
