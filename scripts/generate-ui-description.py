# MasterTV Samsung Smart TV UI Description Generator (.pptx and .docx)
# Strictly ASCII comments only as per project guidelines

import os
import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from docx import Document
from docx.shared import Inches as DocxInches, Pt as DocxPt, RGBColor as DocxRGBColor

def build_presentation(output_pptx):
    prs = Presentation()
    # 16:9 widescreen slides (10 x 5.625 inches)
    prs.slide_width = Inches(10)
    prs.slide_height = Inches(5.625)
    blank_layout = prs.slide_layouts[6]

    # Color Palette: Dark Modern Theme
    bg_color = RGBColor(15, 23, 42)      # Slate 900
    primary_color = RGBColor(14, 165, 233) # Sky 500
    text_white = RGBColor(248, 250, 252)
    text_gray = RGBColor(148, 163, 184)
    accent_card = RGBColor(30, 41, 59)    # Slate 800

    def add_slide_background(slide):
        background = slide.background
        fill = background.fill
        fill.solid()
        fill.fore_color.rgb = bg_color

    def add_slide_header(slide, title_text, category_text="Samsung Apps TV Certification"):
        tb = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(8.4), Inches(0.8))
        tf = tb.text_frame
        tf.word_wrap = True
        
        p_cat = tf.paragraphs[0]
        p_cat.text = category_text.upper()
        p_cat.font.size = Pt(10)
        p_cat.font.bold = True
        p_cat.font.color.rgb = primary_color
        
        p_title = tf.add_paragraph()
        p_title.text = title_text
        p_title.font.size = Pt(22)
        p_title.font.bold = True
        p_title.font.color.rgb = text_white

    # ==========================================
    # SLIDE 1: Title & Revision History
    # ==========================================
    s1 = prs.slides.add_slide(blank_layout)
    add_slide_background(s1)

    tb1 = s1.shapes.add_textbox(Inches(1.0), Inches(1.2), Inches(8.0), Inches(3.2))
    tf1 = tb1.text_frame
    tf1.word_wrap = True

    p = tf1.paragraphs[0]
    p.text = "SAMSUNG SMART TV (TIZEN)"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = primary_color

    p = tf1.add_paragraph()
    p.text = "MasterTV-HD"
    p.font.size = Pt(36)
    p.font.bold = True
    p.font.color.rgb = text_white

    p = tf1.add_paragraph()
    p.text = "Application UI Description & QA Certification Guide"
    p.font.size = Pt(18)
    p.font.color.rgb = text_gray

    p = tf1.add_paragraph()
    p.text = "\nApplication ID: V7gE5M3K8w.MasterTV  |  Version: 1.0.0  |  Package: V7gE5M3K8w"
    p.font.size = Pt(12)
    p.font.color.rgb = text_white

    p = tf1.add_paragraph()
    p.text = "Content Provider: MasterTV  |  Website: https://mastertvhd.online  |  Date: 2026-11-08"
    p.font.size = Pt(11)
    p.font.color.rgb = text_gray

    # ==========================================
    # SLIDE 2: Application Overview & Target Specs
    # ==========================================
    s2 = prs.slides.add_slide(blank_layout)
    add_slide_background(s2)
    add_slide_header(s2, "1. Application Overview & Technical Specifications")

    tb2 = s2.shapes.add_textbox(Inches(0.8), Inches(1.3), Inches(8.4), Inches(3.8))
    tf2 = tb2.text_frame
    tf2.word_wrap = True

    items = [
        ("Application Name:", "MasterTV-HD"),
        ("Category:", "Video (IPTV & VOD Media Player)"),
        ("Platform Profile:", "Samsung Smart TV (tv-samsung), Tizen Web API 2.3+"),
        ("Supported Display:", "Full HD (1920x1080) and 4K UHD (3840x2160) Auto-Scaling"),
        ("Orientation:", "Landscape (Fullscreen Optimized for TV Displays)"),
        ("Streaming Engine:", "Native HTML5 Video with HLS (.m3u8) / MP4 Streaming support"),
        ("Failover Mechanism:", "Automatic Multi-Source Redundancy (HD / FHD Main & Backup links)"),
        ("Target Region:", "Brazil & International Markets")
    ]
    for label, val in items:
        p = tf2.add_paragraph() if tf2.paragraphs[0].text else tf2.paragraphs[0]
        run1 = p.add_run()
        run1.text = label + " "
        run1.font.bold = True
        run1.font.size = Pt(13)
        run1.font.color.rgb = primary_color

        run2 = p.add_run()
        run2.text = val
        run2.font.size = Pt(13)
        run2.font.color.rgb = text_white

    # ==========================================
    # SLIDE 3: Remote Control Key Mapping
    # ==========================================
    s3 = prs.slides.add_slide(blank_layout)
    add_slide_background(s3)
    add_slide_header(s3, "2. Samsung Smart TV Remote Control Mapping")

    tb3 = s3.shapes.add_textbox(Inches(0.8), Inches(1.3), Inches(8.4), Inches(3.8))
    tf3 = tb3.text_frame
    tf3.word_wrap = True

    keys = [
        ("D-Pad (Up / Down / Left / Right):", "Navigate between menu tabs, categories, channel list, and media cards."),
        ("Enter / OK Button:", "Open selected movie/series, play live channel, or trigger active buttons."),
        ("Return / Back Key (Key 10009):", "Exit fullscreen player to channel list, close modals, or navigate to previous view."),
        ("Channel Up / Channel Down:", "Instant channel surfing in Live TV mode (switches to next/previous channel directly)."),
        ("Media Play / Pause / Stop:", "Direct playback control during VOD movies, series episodes, and live streams."),
        ("FastForward / Rewind:", "Skip forward and backward through on-demand media content.")
    ]
    for label, val in keys:
        p = tf3.add_paragraph() if tf3.paragraphs[0].text else tf3.paragraphs[0]
        run1 = p.add_run()
        run1.text = label + " "
        run1.font.bold = True
        run1.font.size = Pt(12)
        run1.font.color.rgb = primary_color

        run2 = p.add_run()
        run2.text = val
        run2.font.size = Pt(12)
        run2.font.color.rgb = text_white

    # ==========================================
    # SLIDE 4: UI Navigation Structure & Use Cases
    # ==========================================
    s4 = prs.slides.add_slide(blank_layout)
    add_slide_background(s4)
    add_slide_header(s4, "3. UI Navigation Structure & Use Cases")

    tb4 = s4.shapes.add_textbox(Inches(0.8), Inches(1.3), Inches(8.4), Inches(3.8))
    tf4 = tb4.text_frame
    tf4.word_wrap = True

    flows = [
        ("Screen 1: Main Dashboard (Home):", "Displays highlighted content banners, live TV category cards, recently added movies, and trending series. Navigation via D-Pad arrows."),
        ("Screen 2: Live Channels (Canais Ao Vivo):", "List of TV channels categorized by genre (Sports, Movies, News). Displays EPG programming schedule and instant live stream preview."),
        ("Screen 3: Fullscreen Live Player:", "Full resolution player with channel information bar (OSD), stream quality indicator, and instant backup source failover."),
        ("Screen 4: VOD Details & Player:", "Displays synopsis, cast members, duration, genres, and audio/subtitle tracks with Play/Pause controls."),
        ("Screen 5: Search & Settings:", "Search channels and titles by voice or virtual keyboard; configure player aspect ratio and server parameters.")
    ]
    for label, val in flows:
        p = tf4.add_paragraph() if tf4.paragraphs[0].text else tf4.paragraphs[0]
        run1 = p.add_run()
        run1.text = label + " "
        run1.font.bold = True
        run1.font.size = Pt(12)
        run1.font.color.rgb = primary_color

        run2 = p.add_run()
        run2.text = val
        run2.font.size = Pt(12)
        run2.font.color.rgb = text_white

    # ==========================================
    # SLIDE 5: QA Verification & Test Accounts
    # ==========================================
    s5 = prs.slides.add_slide(blank_layout)
    add_slide_background(s5)
    add_slide_header(s5, "4. Samsung QA Certification & Testing Instructions")

    tb5 = s5.shapes.add_textbox(Inches(0.8), Inches(1.3), Inches(8.4), Inches(3.8))
    tf5 = tb5.text_frame
    tf5.word_wrap = True

    qa_notes = [
        ("Application Launch Behavior:", "The application launches immediately into the content showcase. Live channels and catalog items are accessible without upfront fee barriers."),
        ("No In-App Purchases Required:", "Certification testers can navigate, select, and test media streaming directly."),
        ("QA Test Account Credentials:", "Username: teste  |  Password: teste  (Pre-configured for QA inspection)"),
        ("Live Stream Testing:", "Select any channel from the 'Canais Ao Vivo' menu to verify video playback, audio synchronization, and remote key handling."),
        ("Customer Support & Inquiries:", "Website: https://mastertvhd.online  |  E-mail: suporte@mastertvhd.online")
    ]
    for label, val in qa_notes:
        p = tf5.add_paragraph() if tf5.paragraphs[0].text else tf5.paragraphs[0]
        run1 = p.add_run()
        run1.text = label + " "
        run1.font.bold = True
        run1.font.size = Pt(12)
        run1.font.color.rgb = primary_color

        run2 = p.add_run()
        run2.text = val
        run2.font.size = Pt(12)
        run2.font.color.rgb = text_white

    prs.save(output_pptx)
    print(f"[PPTX GENERATOR] Successfully created {output_pptx}")

def build_docx(output_docx):
    doc = Document()
    doc.add_heading('MasterTV-HD - Application UI Description', 0)
    
    doc.add_heading('1. General Information', level=1)
    doc.add_paragraph('Application Name: MasterTV-HD')
    doc.add_paragraph('Application ID: V7gE5M3K8w.MasterTV')
    doc.add_paragraph('Package: V7gE5M3K8w')
    doc.add_paragraph('Version: 1.0.0')
    doc.add_paragraph('Platform: Samsung Smart TV (Tizen Web 2.3+)')
    doc.add_paragraph('Website: https://mastertvhd.online')
    doc.add_paragraph('Category: Videos (IPTV & VOD)')
    
    doc.add_heading('2. Remote Control Key Mapping', level=1)
    doc.add_paragraph('D-Pad (Up, Down, Left, Right): UI navigation across lists and menus.')
    doc.add_paragraph('Enter / OK: Select card, open channel or play movie.')
    doc.add_paragraph('Return / Back (10009): Close player or return to previous screen.')
    doc.add_paragraph('Channel Up / Channel Down: Direct live channel switching.')
    doc.add_paragraph('Media Keys (Play / Pause / Stop / Rewind / FastForward): VOD media controls.')

    doc.add_heading('3. UI Navigation Flow', level=1)
    doc.add_paragraph('Home View: Highlights, carousels, Live TV, Movies and Series.')
    doc.add_paragraph('Live TV Player: Fullscreen stream with channel overlay and EPG.')
    doc.add_paragraph('VOD Player: Fullscreen player with time scrubber and controls.')
    doc.add_paragraph('Settings: Account details and server settings.')

    doc.add_heading('4. QA Test Instructions', level=1)
    doc.add_paragraph('Test Account: Username: teste | Password: teste')
    doc.add_paragraph('Immediate playback available without payment gates.')

    doc.save(output_docx)
    print(f"[DOCX GENERATOR] Successfully created {output_docx}")

if __name__ == '__main__':
    rootDir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    pptx_path = os.path.join(rootDir, "MasterTV_UI_Description.pptx")
    docx_path = os.path.join(rootDir, "MasterTV_UI_Description.docx")
    build_presentation(pptx_path)
    build_docx(docx_path)

