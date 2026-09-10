import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
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
            self.draw_page_number(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_number(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#556677"))
        
        # Header rule & title
        self.setStrokeColor(colors.HexColor("#00a8cc"))
        self.setLineWidth(0.8)
        self.line(40, 760, 572, 760)
        self.drawString(40, 765, "OPERATION: DEFUSE — CLASSIFIED FIELD DISARMAMENT MANUAL")
        self.drawRightString(572, 765, "TECH FEST HARDWARE EDITION")
        
        # Footer rule & page info
        self.setStrokeColor(colors.HexColor("#cccccc"))
        self.setLineWidth(0.5)
        self.line(40, 45, 572, 45)
        self.drawString(40, 32, "CONFIDENTIAL // FOR AUTHORIZED EOD & HARDWARE OPERATIVES ONLY")
        self.drawRightString(572, 32, f"PAGE {self._pageNumber} OF {page_count}")
        self.restoreState()

def create_manual_pdf(filename="BOMB_DEFUSAL_FIELD_MANUAL.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=40,
        rightMargin=40,
        topMargin=55,
        bottomMargin=55
    )

    styles = getSampleStyleSheet()
    
    # Custom Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#0b2239"),
        alignment=1, # Center
        spaceAfter=4
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=colors.HexColor("#007799"),
        alignment=1,
        spaceAfter=12
    )

    h1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#0f2a4a"),
        spaceBefore=10,
        spaceAfter=6
    )

    h2_style = ParagraphStyle(
        'LevelHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=colors.HexColor("#b30000"),
        spaceBefore=8,
        spaceAfter=4
    )

    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor("#1e293b")
    )

    bullet_style = ParagraphStyle(
        'DocBullet',
        parent=body_style,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=2
    )

    code_style = ParagraphStyle(
        'DocCode',
        parent=styles['Normal'],
        fontName='Courier-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#004466")
    )

    alert_style = ParagraphStyle(
        'AlertText',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#8a1c14")
    )

    story = []

    # Title Block
    story.append(Paragraph("TACTICAL BOMB DISARMAMENT MANUAL", title_style))
    story.append(Paragraph("4-SECTOR FIELD MANUAL & ARDUINO BREADBOARD PROTOCOLS", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0099cc"), spaceBefore=0, spaceAfter=8))

    # Introduction / Overview Table Box
    intro_p = Paragraph(
        "<b>MISSION BRIEFING:</b> This field document contains certified ordnance disposal guidelines for all <b>4 tactical combat sectors</b>. Operatives utilizing the physical breadboard hardware interface must inspect the <b>Serial Number</b>, active <b>LED status bank</b>, and colored wire harness to deduce and sever the correct circuit sequence within the <b>2-minute global countdown</b>.",
        body_style
    )
    intro_table = Table([[intro_p]], colWidths=[532])
    intro_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f0f8ff")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#0088b3")),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(intro_table)
    story.append(Spacer(1, 8))

    # SECTION 1: Hardware Breadboard Pinout Map
    story.append(Paragraph("SECTION 1: BREADBOARD HARDWARE PINOUT & WIRE COLOR CODES", h1_style))
    
    wire_table_data = [
        [
            Paragraph("<b>WIRE COLOR</b>", code_style),
            Paragraph("<b>PIN / KEY</b>", code_style),
            Paragraph("<b>CIRCUIT ROLE</b>", code_style),
            Paragraph("<b>FUNCTION & DESCRIPTION</b>", code_style)
        ],
        [
            Paragraph("<font color='#cc0000'><b>RED</b></font>", body_style),
            Paragraph("<b>Pin 1 / Key [1]</b>", code_style),
            Paragraph("Primary Power Feed", body_style),
            Paragraph("Carries high-voltage core charge; cuts generator loop.", body_style)
        ],
        [
            Paragraph("<font color='#008833'><b>GREEN</b></font>", body_style),
            Paragraph("<b>Pin 2 / Key [2]</b>", code_style),
            Paragraph("Chemical Neutralizer", body_style),
            Paragraph("Flushes coolant lines and disables reactant coils.", body_style)
        ],
        [
            Paragraph("<font color='#b38600'><b>YELLOW</b></font>", body_style),
            Paragraph("<b>Pin 3 / Key [3]</b>", code_style),
            Paragraph("Timer Logic Bypass", body_style),
            Paragraph("Drains discharge capacitor and disarms logic relays.", body_style)
        ],
        [
            Paragraph("<font color='#333333'><b>BLACK</b></font>", body_style),
            Paragraph("<b>Pin 4 / Key [4]</b>", code_style),
            Paragraph("Terminal Ground", body_style),
            Paragraph("Isolates internal coils and prevents circuit feedback.", body_style)
        ],
        [
            Paragraph("<font color='#0066cc'><b>BLUE</b></font>", body_style),
            Paragraph("<b>Pin 5 / Key [5]</b>", code_style),
            Paragraph("Microprocessor Clock", body_style),
            Paragraph("Freezes microprocessor frequency and stops ignition pulse.", body_style)
        ],
        [
            Paragraph("<font color='#666666'><b>WHITE</b></font>", body_style),
            Paragraph("<b>Pin 6 / Key [6]</b>", code_style),
            Paragraph("Containment Stabilizer", body_style),
            Paragraph("Locks chamber pressure valves and seals radioactive core.", body_style)
        ]
    ]

    wire_table = Table(wire_table_data, colWidths=[80, 95, 120, 237])
    wire_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0b2239")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#99aabb")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f7fafc")]),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(wire_table)
    story.append(Spacer(1, 8))

    # SECTION 2: Combat Override Ciphers & Elimination Rules
    story.append(Paragraph("SECTION 2: ON-RAIL COMBAT & 3-BUTTON CIPHER OVERRIDES [C, V, SPACE]", h1_style))
    combat_text = Paragraph(
        "• <b>Lock-On Engagement:</b> Operative automatically moves on-rail and locks aim onto <b>2 to 3 distant, scattered hostiles per sector</b> spaced across long corridor sprints.<br/>"
        "• <b>Strict Stopping Rule:</b> Forward movement ceases when an enemy is targeted. You <b>CANNOT advance</b> until the hostile is neutralized.<br/>"
        "• <b>3-Button Combat System:</b> When locked onto a target, a randomized sequence is generated from strictly 3 buttons:<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<b>Buttons:</b> <font color='#0099cc'><b>[C: Circuit C]</b></font>, <font color='#008833'><b>[V: Circuit V]</b></font>, and <font color='#b38600'><b>[SPACE: Kinetic Trigger]</b></font> (or click on-screen badges).<br/>"
        "• <b>Tightening Reaction Windows:</b> Input the correct sequence before the countdown expires:<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<b>Sector 01:</b> 1–2 buttons &bull; 3.0s ➔ 2.6s ➔ 2.4s reaction window<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<b>Sector 02:</b> 2 buttons &bull; 2.4s ➔ 2.2s ➔ 2.0s reaction window<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<b>Sector 03:</b> 2–3 buttons &bull; 2.0s ➔ 1.8s ➔ 1.7s reaction window<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<b>Sector 04:</b> 3 buttons (Guards) / 4 buttons (General Malikov Boss) &bull; 1.8s ➔ 1.6s ➔ 2.4s (Boss Showdown!)<br/>"
        "• <b>Wrong Key Penalty:</b> Entering an incorrect cipher applies an error buzz and subtracts <b>-0.25s</b> from the reaction timer.<br/>"
        "• <b>Instant Failure on Timeout:</b> If the reaction timer hits 0.0s, the hostile fires a lethal shot for <b>immediate mission failure</b>!",
        body_style
    )
    story.append(combat_text)
    story.append(Spacer(1, 10))

    # SECTION 3: Detailed Procedural Sector Disarmament Protocols
    story.append(Paragraph("SECTION 3: PROCEDURAL SECTOR DISARMAMENT PROTOCOLS & LOGIC MATRICES", h1_style))
    story.append(Paragraph("<i>NOTICE: Bomb Serial Numbers and LED banks are procedurally randomized on every deployment. Apply the priority rules below to deduce the active sequence.</i>", body_style))
    story.append(Spacer(1, 4))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#0099cc"), spaceBefore=0, spaceAfter=6))

    # Level 1 Box
    l1_text = Paragraph(
        "<b>SECTOR 1: COASTAL INFILTRATION YARD (MK-I FUSE)</b><br/>"
        "• <b>Priority Decision Matrix:</b><br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<b>Rule 1:</b> If Serial ends with an <b>ODD digit</b> AND <b>BLUE LED is ON</b> ➔ Cut <font color='#0066cc'><b>BLUE [5]</b></font> then <font color='#b38600'><b>YELLOW [3]</b></font>.<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<b>Rule 2:</b> Else if <b>RED LED is ON</b> AND <b>GREEN LED is OFF</b> ➔ Cut <font color='#008833'><b>GREEN [2]</b></font> then <font color='#cc0000'><b>RED [1]</b></font>.<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<b>Rule 3:</b> Else if Serial ends with an <b>EVEN digit</b> ➔ Cut <font color='#cc0000'><b>RED [1]</b></font> then <font color='#333333'><b>BLACK [4]</b></font>.<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<b>Rule 4 (Fallback):</b> Otherwise ➔ Cut <font color='#666666'><b>WHITE [6]</b></font> then <font color='#b38600'><b>YELLOW [3]</b></font>.",
        body_style
    )
    
    # Level 2 Box
    l2_text = Paragraph(
        "<b>SECTOR 2: SUBTERRANEAN BUNKER & SERVERS (MK-II CAPACITOR)</b><br/>"
        "• <b>Priority Decision Matrix:</b><br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<b>Rule 1:</b> If both <b>RED & GREEN LEDs are ACTIVE</b> ➔ Cut <font color='#b38600'><b>YELLOW [3]</b></font> then <font color='#666666'><b>WHITE [6]</b></font>.<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<b>Rule 2:</b> Else if Serial ends with an <b>EVEN digit</b> AND <b>YELLOW LED is ON</b> ➔ Cut <font color='#333333'><b>BLACK [4]</b></font> then <font color='#008833'><b>GREEN [2]</b></font>.<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<b>Rule 3:</b> Else if <b>BLUE LED is ACTIVE (ON)</b> ➔ Cut <font color='#cc0000'><b>RED [1]</b></font> then <font color='#0066cc'><b>BLUE [5]</b></font>.<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<b>Rule 4 (Fallback):</b> Otherwise ➔ Cut <font color='#666666'><b>WHITE [6]</b></font> then <font color='#333333'><b>BLACK [4]</b></font>.",
        body_style
    )

    l1_l2_table = Table([[l1_text], [l2_text]], colWidths=[532])
    l1_l2_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#fffdf5")),
        ('BACKGROUND', (0,1), (-1,1), colors.HexColor("#f8fafc")),
        ('BOX', (0,0), (-1,-1), 0.8, colors.HexColor("#cbd5e1")),
        ('LINEBELOW', (0,0), (-1,0), 0.8, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(l1_l2_table)
    story.append(Spacer(1, 6))

    # Level 3 Box
    l3_text = Paragraph(
        "<b>SECTOR 3: RESEARCH SILO & CATWALKS (MK-III 2-STAGE BIO-CHEMICAL CORE)</b><br/>"
        "• <b>2-Stage Logic Matrix:</b><br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<b>STAGE 1 (Valve Seal):</b> If <b>BLUE LED is ON</b> and <b>RED LED is OFF</b> ➔ Cut <font color='#666666'><b>WHITE [6]</b></font>; otherwise cut <font color='#b38600'><b>YELLOW [3]</b></font>.<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<b>STAGE 2 (Neutralizer Line):</b> If Serial contains letter <b>'V'</b>, <b>'C'</b>, or <b>'X'</b> ➔ Cut <font color='#008833'><b>GREEN [2]</b></font>; otherwise cut <font color='#333333'><b>BLACK [4]</b></font>.",
        body_style
    )

    # Level 4 Box
    l4_text = Paragraph(
        "<b>SECTOR 4: FORTRESS COMMAND CITADEL (MK-IV 2-STAGE QUANTUM RESONATOR - GRAND FINALE)</b><br/>"
        "• <b>2-Stage Logic Matrix:</b><br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<b>STAGE 1 (Grid Decouple):</b> If <b>EXACTLY 3 or 4 LEDs ARE ACTIVE</b> ➔ Cut <font color='#cc0000'><b>RED [1]</b></font>; else if <b>EXACTLY 2 ACTIVE</b> ➔ Cut <font color='#b38600'><b>YELLOW [3]</b></font>; otherwise cut <font color='#0066cc'><b>BLUE [5]</b></font>.<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<b>STAGE 2 (Grounding Discharge):</b> If Serial ends with an <b>EVEN digit</b> ➔ Cut <font color='#333333'><b>BLACK [4]</b></font>; otherwise cut <font color='#666666'><b>WHITE [6]</b></font>.",
        body_style
    )

    l3_l4_table = Table([[l3_text], [l4_text]], colWidths=[532])
    l3_l4_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f8fafc")),
        ('BACKGROUND', (0,1), (-1,1), colors.HexColor("#fffdf5")),
        ('BOX', (0,0), (-1,-1), 0.8, colors.HexColor("#cbd5e1")),
        ('LINEBELOW', (0,0), (-1,0), 0.8, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(l3_l4_table)
    story.append(Spacer(1, 8))

    # SECTION 4: Quick Engagement & Protocol Overview
    story.append(Paragraph("SECTION 4: QUICK ENGAGEMENT & SECTOR PROTOCOL OVERVIEW", h1_style))
    summary_data = [
        [
            Paragraph("<b>SECTOR</b>", code_style),
            Paragraph("<b>SECTOR NAME</b>", code_style),
            Paragraph("<b>HOSTILES</b>", code_style),
            Paragraph("<b>COMBAT CIPHER (QTE)</b>", code_style),
            Paragraph("<b>PUZZLE SYSTEM</b>", code_style),
            Paragraph("<b>STAGES</b>", code_style)
        ],
        [
            Paragraph("<b>Sector 01</b>", body_style),
            Paragraph("Coastal Infiltration Yard", body_style),
            Paragraph("2–3 Scattered Scouts", body_style),
            Paragraph("1–2 Keys (3.0s ➔ 2.4s)", body_style),
            Paragraph("Tactical Fuse Matrix", body_style),
            Paragraph("2 Wires", code_style)
        ],
        [
            Paragraph("<b>Sector 02</b>", body_style),
            Paragraph("Subterranean Bunker", body_style),
            Paragraph("2–3 Distant Guards", body_style),
            Paragraph("2 Keys (2.4s ➔ 2.0s)", body_style),
            Paragraph("Circuit Logic Matrix", body_style),
            Paragraph("2 Wires", code_style)
        ],
        [
            Paragraph("<b>Sector 03</b>", body_style),
            Paragraph("Research Silo", body_style),
            Paragraph("2–3 Catwalk Foes", body_style),
            Paragraph("2–3 Keys (2.0s ➔ 1.7s)", body_style),
            Paragraph("Bio-Chemical Pressure", body_style),
            Paragraph("2 Wires", code_style)
        ],
        [
            Paragraph("<b>Sector 04</b>", body_style),
            Paragraph("Fortress Command Citadel", body_style),
            Paragraph("2–3 Foes + <b>BOSS</b>", body_style),
            Paragraph("3–4 Keys (1.8s ➔ 2.4s Boss)", body_style),
            Paragraph("Quantum Resonator (Finale)", body_style),
            Paragraph("2 Wires", code_style)
        ]
    ]

    sum_table = Table(summary_data, colWidths=[55, 115, 100, 115, 100, 47])
    sum_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0b2239")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#99aabb")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f7fafc")]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(sum_table)
    story.append(Spacer(1, 8))

    # Warning Box
    warn_p = Paragraph(
        "<b>CRITICAL SAFETY NOTICE:</b> Cutting an incorrect wire applies an immediate <b>-20 SECONDS PENALTY</b> to the global 2-minute round timer. If the quick-draw reaction timer hits 0.0s or the global round clock reaches 00:00.00, catastrophic detonation/elimination occurs immediately.",
        alert_style
    )
    warn_table = Table([[warn_p]], colWidths=[532])
    warn_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#fee2e2")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#dc2626")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(warn_table)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated printable PDF manual: {filename}")

if __name__ == "__main__":
    create_manual_pdf()

