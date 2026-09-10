/* ==========================================================================
   Projects.

   A project is: some metadata, an ordered list of sections whose bodies are
   HTML, and any number of checklists. Nothing here is specific to lighting or
   to any one job — add an entry to the array and the page picks it up, builds
   its card, its contents rail and its checklists, and gives it a URL at
   #<id>.

   status: 'planned' | 'active' | 'done' | 'proposed' | 'parked'
   Checklist state is stored per project id, so renaming an id resets it.
   ========================================================================== */
window.CELICA = window.CELICA || {};

window.CELICA.projects = [

  /* ====================================================== infinity tail bar */
  {
    id: 'tailbar',
    title: 'Flush infinity tail bar',
    cat: 'Lighting',
    status: 'planned',
    blurb: 'Steel OEM tailgate, full DIY. Sequential amber, white reverse, ' +
           'breathing wake-up, light smoke face — five functions and one ' +
           'animation in a bar about 1.1 m long.',
    meta: [
      { k: 'Budget', v: '£695 – £1,405' },
      { k: 'Bench time', v: '80 – 120 h' },
      { k: 'Donor part', v: 'Second tailgate' },
      { k: 'Risk', v: 'Road legality' }
    ],
    sections: [
      {
        id: 'functions', title: "What you're building",
        html: `
<p>Five functions and one animation. Each buys a different amount of trouble, and it is
worth being clear which is which before any metal gets cut.</p>
<div class="tbl-wrap"><table>
<thead><tr><th>Function</th><th>How</th><th>What you're accepting</th></tr></thead>
<tbody>
<tr><td><b>Red position</b></td><td>Infinity tunnel at ~20 %</td><td>Nothing. An optional rear position lamp only has to be red — RVLR Sch 10 Pt II</td></tr>
<tr><td><b>Red brake</b></td><td>Same emitters at 100 %</td><td>Unapproved additional stop lamp. Looks factory, big safety gain</td></tr>
<tr><td><b>Amber sequential</b></td><td>Discrete high-power amber zones, <em>in addition to</em> the OEM cluster indicators</td><td>Unapproved second rear indicator. MOT explicitly passes sequential. Keeping OEM puts you at the legal cap of 2/side, and gives a failsafe</td></tr>
<tr><td><b>White reverse</b></td><td>Discrete white zones at the bar ends</td><td>The car may only have two reversing lamps — disconnect the OEM pair, or knowingly run four</td></tr>
<tr><td><b>Breathing wake-up</b></td><td>Gamma ramp on unlock, 2 s, once</td><td>Reg 13 bans automatically flashing lamps. This is the one plain offence — build a steady/MOT mode switch</td></tr>
<tr><td><b>Light smoke face</b></td><td>Tint the bar only</td><td>Fine on an optional lamp. Never tint the OEM clusters — MOT major, and they are your legal stop and indicator</td></tr>
</tbody></table></div>
<div class="note red">
  <div class="hd">The decision that decides the build</div>
  <p>Half-mirror passes 10–30 %, light smoke another 65–80 %. Anything behind both is at
  10–20 % of raw output — fine for a decorative red glow, useless for an indicator read at
  50 m in daylight. So: <b>the tunnel does the show, discrete emitters do the work.</b> Red
  lives in the tunnel; amber and white fire through clear, tinted, un-mirrored apertures in
  a lower tier.</p>
</div>`
      },
      {
        id: 'photometry', title: 'Photometric targets',
        html: `
<p>Build to numbers, not to how it looks in the garage at night.</p>
<div class="tbl-wrap"><table>
<thead><tr><th>Function</th><th>On-axis target</th><th>Source</th></tr></thead>
<tbody>
<tr><td>Rear indicator, category 2a</td><td class="n">50–500 cd — aim 150–250</td><td>UNECE R6</td></tr>
<tr><td>Rear indicator, category 2b</td><td class="n">50–1,000 cd</td><td>UNECE R6</td></tr>
<tr><td>Reversing lamp</td><td class="n">≥ 80 cd, no stated max</td><td>UNECE R23</td></tr>
<tr><td>Rear position</td><td class="n">Match OEM, no brighter at night</td><td>Measure yours</td></tr>
<tr><td>Stop</td><td class="n">5–10× position</td><td>Measure yours</td></tr>
</tbody></table></div>
<div class="note cool">
  <div class="hd">Home method</div>
  <p>Lux meter on axis at a measured distance in a dark garage.
  <b>cd = lux × distance(m)²</b> — so 12 lux at 4 m is 192 cd. Measure the OEM cluster first
  as your reference, and measure <em>through</em> the finished face: mirror, tint and all.
  Use 3–5 m. Take amber at full brightness, not mid-sweep.</p>
</div>
<h3>Sweep timing</h3>
<ul>
<li>Flash rate 60–120/min, legal and MOT. Aim ~85/min, a 706 ms period. Time 30 flashes.</li>
<li>Sweep 150–200 ms, then hold fully lit 180–200 ms.</li>
<li><strong>All zones extinguish together</strong> — never unwind the sweep. That is what makes cheap kits look wrong.</li>
<li>Direction inboard to outboard. Duty ~50 %. Hazards: both halves sweep in phase, not mirrored inwards.</li>
</ul>`
      },
      {
        id: 'legal', title: 'Legal reference',
        html: `
<div class="tbl-wrap"><table>
<thead><tr><th>Rule</th><th>Says</th><th>Bearing</th></tr></thead>
<tbody>
<tr><td class="n">Sch 10 Pt II</td><td>Optional rear position lamps: any number, only requirement is red</td><td>Red bar unconditionally fine</td></tr>
<tr><td class="n">Sch 7 Pt II</td><td>Max two rear indicators per side; mark, amber, 60–120/min, tell-tale still apply</td><td>Keeping OEM puts you at the cap</td></tr>
<tr><td class="n">Sch 14</td><td>Not more than two reversing lamps, approval mark post-1986</td><td>Disconnect OEM reverse, or run four knowingly</td></tr>
<tr><td class="n">Sch 12 Pt II</td><td>Optional stop lamps: mark + 20–60 cd for a centre lamp post-1991</td><td>Bar's brake is unapproved; keep OEM stop and high-level</td></tr>
<tr><td class="n">Reg 11</td><td>Red only to the rear, except amber indicator and white reverse</td><td>No colour modes on the road</td></tr>
<tr><td class="n">Reg 13</td><td>No fitted lamp may automatically flash, indicators excepted</td><td>The wake-up is the one plain offence — mode switch</td></tr>
<tr><td class="n">Reg 27</td><td>No undue dazzle</td><td>Why position runs at ~20 %</td></tr>
<tr><td class="n">MOT 4.4</td><td>"Sequential/dynamic indicators not to be considered a reason to fail"</td><td>Sequential passes outright</td></tr>
<tr><td class="n">MOT 4.2/4.3</td><td>Defective lens affecting emitted light is a major defect</td><td>Tint the bar, not the clusters</td></tr>
</tbody></table></div>
<p><strong>Declare the modification to your insurer in writing.</strong> This is a summary of
the regulations, not legal advice — check the current text before relying on it.</p>`
      },
      {
        id: 'car', title: 'On the car',
        html: `
<ul>
<li>Tail/stop 7443 · indicator 7440 amber · reverse 921/W21W — all in the quarter-panel clusters.</li>
<li><strong>Keep the OEM indicators connected.</strong> Legal, and a failsafe. Disconnect OEM reverse if the bar takes it.</li>
<li>Rear fog: rear bumper lower section, left and right (P21W/W21W) — untouched.</li>
<li>Plate lamps: tailgate outer garnish above the plate (W5W/168) — <em>verify</em>, then relocate.</li>
<li>Fuses: TAIL 10 A · STOP 10 A · TURN 7.5 A · BK/UP 5 A · RR FOG 7.5 A.
    <a href="electrical.html">The fusebox page has this car's actual numbers.</a></li>
<li>Adding LED in parallel with OEM bulbs will not hyperflash — you are adding current, not removing it.</li>
<li>Width 1,740 · height 1,320 · length 4,340 mm · UK plate 520 × 111 · skin ~0.7–0.8 mm.</li>
</ul>`
      },
      {
        id: 'measure', title: 'Measure before drawing',
        html: `
<p>M1 lamp inner-edge to inner-edge · M2 tail lamp band height · M3 bar centreline height ·
M4 plate recess · M5 garnish footprint · <strong>M6 outer skin to inner panel gap (critical)</strong> ·
M7 skin to glass flange · M8 channel to latch/striker (≥40 mm) · M9 channel to wiper motor/washer ·
M10 grommet ID · M11 skin thickness · M12 crown radius · M13 reverse lamp height ·
M14 bumper to plate · M15 face angle · M16 tailgate weight · M17 depth behind plate recess ·
M18 body width at lamps. Plus P1–P4: OEM tail, stop and indicator lux, and the distance used.</p>
<div class="note">
  <p><b>M6 method.</b> Trim board and garnish off, right-angled 1.5 mm welding wire through a
  garnish fixing hole to the inner panel, mark at the skin, withdraw, measure. Five points
  across; the shallowest wins.</p>
</div>`
      },
      {
        id: 'optics', title: 'Optics and transmission budget',
        html: `
<div class="tbl-wrap"><table>
<thead><tr><th>Layer</th><th>Transmission</th><th>Running total</th></tr></thead>
<tbody>
<tr><td>Two-way mirror acrylic, 3 mm</td><td class="n">10–30 %</td><td class="n">0.10–0.30</td></tr>
<tr><td>Light smoke film</td><td class="n">65–80 %</td><td class="n">0.07–0.24</td></tr>
<tr><td>Diffuser, if fitted</td><td class="n">60–85 %</td><td class="n">0.04–0.20</td></tr>
<tr><td>Behind all three</td><td class="n">—</td><td class="n">Need 5–25× raw output</td></tr>
<tr><td><b>Clear aperture + tint only</b></td><td class="n">65–80 %</td><td class="n"><b>Need 1.25–1.5× — amber and white go here</b></td></tr>
</tbody></table></div>
<p><strong>Two-tier face.</strong> Upper tier is the infinity tunnel, 26–34 mm deep, red. Lower tier
is a 12–16 mm functional strip — amber sweep and white reverse — behind clear tinted windows.
The divider reads as a styling crease at 3 m.</p>
<p><strong>Depth options by M6.</strong> A: deep tunnel 40–52 mm, 6–10 repeats. B: shallow 28–36 mm,
4–6 repeats — recommended. C: edge-lit light guide 16–20 mm, no tunnel, brightest, the fallback.</p>
<p><strong>Curvature.</strong> The tailgate crowns, and a tunnel needs two parallel flats. So it is a
flat chord let into the panel, or three shallow flat segments with joints hidden behind opaque
dividers. Decide at template stage, from M12.</p>`
      },
      {
        id: 'electronics', title: 'Electronics',
        html: `
<h3>Light sources</h3>
<ul>
<li><b>Tunnel:</b> 12 V addressable RGB strip, WS2815 class, 60/m, in aluminium channel, edge-firing, baffled. About 12 mA per colour channel per pixel at 12 V — roughly 25 W for a 70-pixel bar.</li>
<li><b>Amber:</b> 10–14 zones of 1 W PC-amber discretes at ~590 nm, 2–3 per zone, on constant-current drivers. <strong>Not RGB-mixed amber</strong> — it is dim, drifts orange under tint, and it is the giveaway on cheap builds.</li>
<li><b>White:</b> two zones of 3 W cool white, 5,000–6,000 K, at the bar ends.</li>
</ul>
<h3>Controller</h3>
<ul>
<li>MCU: ATmega328 or RP2040 class. ESP32 if you want a phone toggle for MOT mode.</li>
<li>Supply: automotive buck, Recom R-78E5.0 class, 6.5–32 V in. Not a linear regulator.</li>
<li><strong>Protection, non-negotiable:</strong> inline fuse, reverse-polarity MOSFET or Schottky, TVS across the supply for load dump, 470 µF bulk plus 100 nF local.</li>
<li>Inputs: five 12 V lines — tail, brake, left, right, reverse — through optocouplers, PC817 class, 4k7 series.</li>
<li>Data: 5 V through a 74AHCT125 level shifter, 330 Ω series, 1,000 µF at the injection point.</li>
<li>Amber and white: logic-level MOSFETs on PWM-dimmable CC drivers, 100 Ω gate resistors, LEDs on aluminium bonded to the steel tray.</li>
<li><strong>Enable the watchdog.</strong> A hung MCU leaving amber on solid is worse than one that goes dark.</li>
</ul>
<h3>Priority state machine</h3>
<p>Write this down before the code.</p>
<ol>
<li>Indicator active → that half becomes the amber sweep; red on that half goes <em>off</em>, because amber plus red is a muddy orange.</li>
<li>Reverse → white zones on.</li>
<li>Brake → tunnel red 100 %.</li>
<li>Tail → tunnel red ~20 %.</li>
<li>Wake-up → only with ignition off and nothing else active, once.</li>
</ol>
<p>Hazards: both halves sweep in phase. MOT/steady mode: a hidden switch kills the wake-up and
the sweep, leaving a plain simultaneous amber flash and steady red.</p>
<div class="note red">
  <div class="hd">Failsafe — build this first, not last</div>
  <p>Leave the OEM cluster indicators fully connected and car-driven, so the bar's amber is
  purely additive. Controller hangs and the car still indicates, brakes and passes an MOT.
  It also puts you at exactly two rear indicators per side.</p>
</div>
<p><strong>Animation.</strong> Gamma curve around 2.2, not linear PWM. Wake-up 2 s in, 400 ms hold,
1 s out, once per unlock. Drive the flash timing off the car's own indicator signal so the bar
stays in phase with the OEM lamps.</p>`
      },
      {
        id: 'phases', title: 'Phases',
        html: `
<ol>
<li><strong>Buy a second tailgate, £60–150.</strong> The car stays road legal while you cut. Weigh before and after — M16.</li>
<li>Survey, then <strong>build a cardboard mock-up of the two-tier face using the real acrylic, real tint and one amber LED.</strong> Photograph at 3 m and 20 m, day and night. That answers tint, depth and divider in half a day. Then template — card to MDF to 1.5 mm aluminium — and CAD everything off one sketch. Keep ≥40 mm of untouched skin.</li>
<li>Cut: 6 mm relief holes at the corners, cut 5 mm inside the line, file to it. Outer skin only. Tray in 1.2 mm CR4 with 25 mm flanges. <strong>Stitch weld 15 on / 40 off</strong>, alternate sides, cool between passes. No welder: 3M 08115 and 4 mm rivets at 40 mm centres.</li>
<li>Corrosion: etch, 2K epoxy primer both sides, seam seal, two 8 mm drains with grommets — test with water — then cavity wax after paint. 202 Black, and paint the whole panel.</li>
<li>Module: ABS or ASA housing, not PLA — it sees 70–80 °C in sun. 2 mm first-surface rear mirror, perimeter-bonded. Laser-cut face, mirror acrylic upper and clear lower. Butyl rope and a clamp strip so the lens comes off. One PTFE breather at the high point. <strong>Bench-run the full electronics inside the finished module for two hours.</strong></li>
<li>Wiring. 7. Lock delete. 8. Plate lighting. 9. Fit, measure, sign off.</li>
</ol>`
      },
      {
        id: 'wiring', title: 'Wiring',
        html: `
<p><strong>OEM circuits are triggers, never supplies.</strong></p>
<div class="tbl-wrap"><table>
<thead><tr><th>Signal</th><th>Tapped at</th><th>Into</th></tr></thead>
<tbody>
<tr><td>Tail</td><td>Plate lamp connector at the tailgate</td><td>Opto + main relay trigger</td></tr>
<tr><td>Brake</td><td>Stop lamp feed at a cluster, after the switch</td><td>Opto</td></tr>
<tr><td>Left / right</td><td>Both cluster indicator feeds</td><td>Two optos — gives phase sync and hazard detect</td></tr>
<tr><td>Reverse</td><td>BK/UP 5 A</td><td>Opto, trigger only</td></tr>
<tr><td><b>Main supply</b></td><td>Boot junction or battery via relay</td><td><b>15 A fuse within 300 mm of the take-off</b></td></tr>
<tr><td>Plate lamps</td><td>Back onto the original TAIL feed</td><td>Must light with the position lamps</td></tr>
</tbody></table></div>
<p>Cores through the existing corrugated boot conduit with a draw string. Deutsch DT 8 or
12-way at the hinge. <strong>The controller lives in the boot, not the tailgate</strong> — dry,
serviceable, and it keeps mass off the struts. Its own earth stud, never shared with the OEM
lamp earth. LEDs on aluminium bonded to the tray, under 60 °C after an hour. Label every conductor.</p>`
      },
      {
        id: 'lock', title: 'Lock delete and plate lighting',
        html: `
<p>Trim board off, unclip the rod both ends, slide the horseshoe clip, and the barrel pushes out
forwards. Bag the barrel, rod and clip. The latch stays. Three layers of access:
(1) central locking via the OEM actuator, (2) a boot popper of ≥150 N on its own fuse and hidden
switch, (3) a <strong>mechanical Bowden cable</strong> to the latch's manual release, reachable through
the folded rear seats. <strong>Prove layer 3 with the panel closed and the battery disconnected,
before paint.</strong></p>
<p>Plate lamps must be E-marked, white, lit with the position lamps, with no direct white to the
rear, and the plate stays BS AU 145e. Best answer is slim E-marked lamps in a new lower garnish
firing down, which also hides the bottom edge of the repair. Bumper-mounted upward units work but
spill white rearwards — sight along the bumper from 10 m first.</p>`
      },
      {
        id: 'budget', title: 'Budget',
        html: `
<p>Donor gate 60–150 · steel 25–40 · mirror acrylic 55–110 · rear mirror 20–35 · clear and
diffuser 20–40 · tint film 15–35 · housing 30–70 · addressable strip 30–60 · amber LEDs and
drivers 60–130 · white 20–45 · controller and protection 45–90 · aluminium heatsink 20–40 ·
plate lamps 15–40 · popper and cable 35–70 · relays, cable, connectors 55–95 · primers, sealers,
wax 70–120 · paint 80–160 · sundries 25–45 · lux meter 15–30.</p>
<p><strong>Total £695–£1,405, excluding tools. 80–120 hours of bench time.</strong></p>`
      },
      {
        id: 'risks', title: 'Top risks',
        html: `
<ul>
<li>Water into the tailgate cavity</li>
<li><strong>Amber too dim through mirror and tint — measure in candela before bonding the lens</strong></li>
<li>Condensation · controller hang (OEM indicators stay connected, watchdog on) · sweep out of phase with OEM</li>
<li>Weld distortion · M6 too shallow · strut sag</li>
<li>Roadside attention (steady mode switch) · insurance · not being able to open the tailgate</li>
</ul>`
      }
    ],
    checklists: [
      {
        id: 'signoff', title: 'Sign-off',
        note: 'Tick these off on the car, not on paper.',
        items: [
          'Colour to the rear is correct in every mode',
          'Nothing animates with the ignition on',
          'Steady / MOT mode works',
          'Amber measures 150–250 cd through the finished face',
          'Reverse measures ≥ 80 cd',
          'Brake is 5–10× position',
          'Flash rate between 60 and 120 per minute',
          'Bar is in phase with the OEM indicators',
          'Sweep runs inboard to outboard, all zones off together',
          'Unplug the controller — the car still indicates, brakes and shows position',
          'Reversing lamp count is two, or four knowingly',
          'Plate lamps light with the position lamps',
          'No stray white light to the rear',
          'Dazzle check from 5 m behind, at night',
          'Water test passed, drains clear',
          'One-hour thermal soak stays under 60 °C',
          'Overnight condensation check passed',
          'Emergency release works with the battery disconnected',
          'Shut lines are right and the loom is labelled',
          'Insurance declared in writing',
          'Build record filed'
        ]
      }
    ],
    open: [
      'Confirm the plate lamps are in the tailgate garnish on a RHD UK car — pop the garnish.',
      'M6 internal depth. It decides option A, B or C.',
      'What is behind the channel line: reinforcements, wiper motor, washer line.',
      'Reverse: two lamps or four.',
      'Whether you need tint at all — decide from the P1 mock-up photos.'
    ],
    links: [
      { t: 'RVLR 1989', u: 'https://www.legislation.gov.uk/uksi/1989/1796/contents/made' },
      { t: 'MOT inspection manual, section 4', u: 'https://www.gov.uk/guidance/mot-inspection-manual-for-private-passenger-and-light-commercial-vehicles/4-lamps-reflectors-and-electrical-equipment' },
      { t: 'UNECE R6 — indicator intensities', u: 'https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:42010X0710(02)' },
      { t: 'UNECE R23 — reversing lamps', u: 'https://www.dun-bri.com/Regulations-Standards/UNECE-Regulations/Guide-To-ECE-R23-Reverse-Lamps' }
    ]
  },

  /* ================================================= headlight LED repair */
  {
    id: 'headlight-led',
    title: 'Headlight DRL strip repair',
    cat: 'Lighting',
    status: 'planned',
    blurb: 'Some LEDs in the aftermarket DRL and sequential indicator strip are ' +
           'flickering. The strip is inside a bonded housing, so the housing has ' +
           'to come apart.',
    meta: [
      { k: 'Access', v: 'Bumper off' },
      { k: 'Parts', v: '£30 – £90' },
      { k: 'Time', v: 'A weekend' },
      { k: 'Risk', v: 'Condensation' }
    ],
    sections: [
      {
        id: 'before', title: 'Diagnose before you open anything',
        html: `
<p>Opening a bonded headlight is the expensive, irreversible part of this job. It is worth an
hour of testing first, because <b>flicker is more often a supply problem than a dead LED</b>.</p>
<div class="note red">
  <div class="hd">What the flicker pattern tells you</div>
  <ul style="margin-bottom:0">
    <li><b>A whole segment out or flickering together.</b> LEDs in a strip run in
    series-parallel groups, so one failing emitter takes its whole group with it. That is a
    strip replacement.</li>
    <li><b>The entire strip flickering evenly.</b> Supply, not emitters. Earth first, then the
    driver.</li>
    <li><b>Only at idle, or only with headlights on.</b> Voltage sag. Look at the charging
    system before the light.</li>
    <li><b>Only in DRL mode, steady when indicating.</b> The DRL feed is being PWM-dimmed and
    the strip's driver cannot follow it. Common on retrofits.</li>
    <li><b>Random, and worse in the wet.</b> Moisture in the housing corroding a joint — which
    on a housing that has already been opened once is the most likely answer of all.</li>
  </ul>
</div>
<p>Check the earth before anything else. A shared or corroded earth on an aftermarket light
produces exactly this symptom and costs nothing to rule out.</p>`
      },
      {
        id: 'access', title: 'Getting the headlight out',
        html: `
<p>The manual's headlight page settles the access question: <b>the front bumper cover comes
off first</b>, along with the upper front fender apron seal and the upper radiator support
seal. The headlight is then held by a handful of bolts and a clip.</p>
<p>Take the chance while the bumper is off to look at the condenser — it sits directly behind
there, and it is on the <a href="issues.html#ac-dead">A/C fault's</a> check list.</p>`
      },
      {
        id: 'opening', title: 'Opening a bonded housing',
        html: `
<p>Toyota bonds the lens to the housing with butyl. It was designed never to come apart, and
the manual has nothing to say about doing so — everything here is general practice rather than
a Toyota procedure.</p>
<ol>
<li><b>Heat the whole housing evenly</b> to soften the butyl. An oven around 90–100 °C for ten
minutes, or a heat gun kept moving. Too hot and the lens distorts permanently.</li>
<li><b>Find and release the clips first.</b> Most housings have them around the perimeter,
hidden under the butyl. Prising against a clip you have not found is how lenses crack.</li>
<li><b>Work a blunt tool round steadily</b> rather than levering at one point. Reheat when it
stops giving.</li>
<li>Do the work, then <b>re-seal with fresh butyl</b>, not the old stuff. Warm it, seat the
lens fully, clamp until cool.</li>
</ol>
<div class="note amber">
  <div class="hd">The bit that bites months later</div>
  <p>A headlight that is not properly re-sealed will mist internally, and a lens that fogs
  enough to affect the beam is an MOT defect. If this housing has been opened before, assume
  the original butyl is contaminated and replace all of it.</p>
</div>`
      },
      {
        id: 'legal', title: 'Keeping it road legal',
        html: `
<p>An aftermarket DRL and indicator strip has to satisfy three things independently.</p>
<ul>
<li><b>Colour.</b> Front indicators amber, DRLs white — not a warm white pretending to be amber.</li>
<li><b>Flash rate 60–120 per minute</b>, the same requirement the tail bar works to. LED
indicators can hyperflash if the original bulb has been removed: adding load fixes it,
removing load causes it.</li>
<li><b>The DRL must dim or switch off on the side that is indicating.</b> A white DRL at full
brightness beside an amber indicator swamps it. Most decent sequential controllers do this —
check that yours actually does.</li>
</ul>
<p>Sequential indicators themselves are fine. The MOT manual states that dynamic indicators
are not a reason to fail.</p>`
      }
    ],
    checklists: [
      {
        id: 'diagnose', title: 'Before opening the housing',
        items: [
          'Note exactly when it flickers — DRL only, indicating, at idle, when wet',
          'Check and clean the earth for the strip',
          'Measure supply voltage at the strip with the engine running',
          'Establish whether the DRL feed is PWM-dimmed',
          'Wiggle-test the loom and connectors with the light on',
          'Look for condensation or tide marks inside the lens'
        ]
      },
      {
        id: 'rebuild', title: 'Rebuild',
        items: [
          'Front bumper cover off, headlight out',
          'Housing opened without cracking the lens or losing clips',
          'Old butyl fully removed from both faces',
          'New strip fitted, earth and supply made off properly',
          'Bench-tested before the lens goes back on',
          'Re-sealed with fresh butyl and clamped until cool',
          'Refitted and beam alignment checked',
          'Indicator flash rate checked at 60–120/min',
          'DRL confirmed to dim or extinguish on the indicating side',
          'Left overnight and checked for misting'
        ]
      }
    ],
    open: [
      'Which failure pattern is it? That decides whether the housing needs opening at all.',
      'Is the existing strip a known brand with a spare available, or a full replacement?',
      'Was the housing sealed properly the last time it was opened?'
    ],
    links: []
  },

  /* ==================================================== 17-inch wheel swap */
  {
    id: 'wheels-17',
    title: 'Switch to 17-inch alloys',
    cat: 'Chassis',
    status: 'planned',
    blurb: 'Coming down from the 19s. Better ride, cheaper tyres, less unsprung mass ' +
           '— and it fixes the speedometer error outright if the tyre size is chosen ' +
           'with any care.',
    meta: [
      { k: 'Current error', v: '4.4 % low' },
      { k: 'Best size', v: '215/40R17' },
      { k: 'Time', v: 'An afternoon' },
      { k: 'Also fixes', v: 'Speedo' }
    ],
    sections: [
      {
        id: 'sizing', title: 'Pick the size on rolling radius, not looks',
        html: `
<p>The car was calibrated for <b>205/55R15 — 606.5 mm</b> rolling diameter. Everything the
speedometer and odometer do is scaled from that. Land near it and the speedo corrects itself
for free.</p>
<div class="tbl-wrap"><table>
<thead><tr><th>Size</th><th>Diameter</th><th>Vs standard</th><th></th></tr></thead>
<tbody>
<tr><td>215/40R17</td><td class="n">603.8 mm</td><td class="n">−0.4 %</td><td><span class="chip ok">closest</span></td></tr>
<tr><td>205/40R17</td><td class="n">595.8 mm</td><td class="n">−1.8 %</td><td></td></tr>
<tr><td>205/45R17</td><td class="n">616.3 mm</td><td class="n">+1.6 %</td><td></td></tr>
<tr><td>215/45R17</td><td class="n">625.3 mm</td><td class="n">+3.1 %</td><td></td></tr>
<tr><td>225/45R17</td><td class="n">634.3 mm</td><td class="n">+4.6 %</td><td><span class="chip warn">no better than the 19s</span></td></tr>
</tbody></table></div>
<p><b>215/40R17 lands within half a percent of standard.</b> That puts the speedometer back
where Toyota calibrated it. Going to a 45 profile undoes most of the benefit — 225/45R17 is no
more accurate than the 19s you are leaving.</p>
<p>Run whatever you are actually considering through
<a href="specs.html">the rolling-radius calculator</a> before ordering.</p>`
      },
      {
        id: 'speedo', title: 'What it does to the speedometer',
        html: `
<p>On the 19s the meter reads about 4.4 % low. At a true 100 km/h it shows 95.8 — below the
100–105 band the manual allows, and the wrong side of the line legally. A speedometer may
over-read; it may never under-read.</p>
<div class="tbl-wrap"><table>
<thead><tr><th>True speed</th><th>Manual allows</th><th>On the 19s</th><th>On 215/40R17</th></tr></thead>
<tbody>
<tr><td class="n">60 km/h</td><td class="n">60 – 64.5</td><td class="n">57.5</td><td class="n">60.3</td></tr>
<tr><td class="n">100 km/h</td><td class="n">100 – 105</td><td class="n">95.8</td><td class="n">100.4</td></tr>
<tr><td class="n">160 km/h</td><td class="n">160 – 167</td><td class="n">153.3</td><td class="n">160.7</td></tr>
</tbody></table></div>
<p>Verify against GPS afterwards rather than assuming — especially with a reworked cluster,
where it is not obvious whether anything has already been scaled.</p>`
      },
      {
        id: 'fitment', title: 'Fitment and geometry',
        html: `
<p>Two things the manual gives you, and one it does not.</p>
<ul>
<li><b>Balance limit 8.0 g</b> and <b>tyre runout 1.0 mm</b>. A 17 is more forgiving than a 19,
but the limits are still the limits.</li>
<li><b>Alignment</b> is quoted at a reference ride height of 190 mm front and 224 mm rear on
205/55R15. The car is lowered, so those stay a target shape rather than something measurable.
Get it aligned after the change either way — a different rolling radius and a different offset
both move things.</li>
<li><b>Bolt pattern, centre bore and offset are not in this manual.</b> The commonly quoted
figures for a T230 are 5×100 with a 54.1 mm bore, but check them against the wheels in front
of you rather than against a forum post.</li>
</ul>
<div class="note cool">
  <div class="hd">Set the pressures properly</div>
  <p>The 220 kPa on the label is for a 205/55R15. A different section width and profile wants
  its own pressure — start from the tyre manufacturer's figure for the load, not the sticker.</p>
</div>`
      }
    ],
    checklists: [
      {
        id: 'buy', title: 'Before buying',
        items: [
          'Confirm bolt pattern, centre bore and offset against the actual wheels',
          'Choose the tyre size on rolling radius — 215/40R17 unless there is a reason not to',
          'Check clearance against the suspension and the bodykit',
          'Decide the speed and load rating',
          'Check what happens to the spare, if there is one'
        ]
      },
      {
        id: 'fit', title: 'After fitting',
        items: [
          'Balance checked, 8.0 g or better',
          'Wheel fasteners torqued, and re-checked after 50 miles',
          'Pressures set cold for the new size',
          'Alignment checked',
          'Speedometer verified against GPS at two speeds',
          'The 19s sold or stored properly'
        ]
      }
    ],
    open: [
      'Which 17-inch wheels, and what offset do they actually have?',
      'Keeping the 19s, or moving them on?'
    ],
    links: []
  },

  /* =================================================== wing to TRD spoiler */
  {
    id: 'trd-spoiler',
    title: 'GT wing off, TRD spoiler on',
    cat: 'Body',
    status: 'planned',
    blurb: 'Swapping the raised GT wing for the factory-style TRD lip. The interesting ' +
           'part is not the spoiler — it is the holes the wing leaves behind, and the ' +
           'rust already starting around them.',
    meta: [
      { k: 'Blocked by', v: 'Tailgate rust' },
      { k: 'Paint', v: 'Required' },
      { k: 'Time', v: 'Body shop' },
      { k: 'Side effect', v: 'Strut load' }
    ],
    sections: [
      {
        id: 'sequence', title: 'This is a paint job with a spoiler at the end',
        html: `
<div class="note red">
  <div class="hd">Do this with the corrosion repair, not before or after it</div>
  <p>There is already rust breaking out around the GT wing mounts, and the wing has to come
  off to fix it. Treating the spoiler swap as a separate job means paying to paint the tailgate
  twice. <a href="issues.html#rust-tailgate">The corrosion issue has the repair method.</a></p>
</div>
<p>So the real order is: wing off, assess the holes, repair the corrosion, deal with the holes,
paint the panel, then fit the spoiler.</p>`
      },
      {
        id: 'holes', title: 'The holes the wing leaves',
        html: `
<p>A raised GT wing bolts through the tailgate skin. A TRD-style lip mounts differently —
usually bonded along the trailing edge, sometimes with a couple of small fixings. <b>It is
unlikely to cover the existing holes.</b></p>
<p>Filling a hole in an outer skin properly means closing it with metal — a welded plug or a
bonded patch behind — and then filling only to level the surface. Filler bridged straight
across an open hole cracks along its edge within a year or two and lets water back in behind
the paint, which is exactly how the corrosion started.</p>
<p>While the panel is bare, seal and cavity-wax the inside. It is the one chance you get.</p>`
      },
      {
        id: 'struts', title: 'What changes when the mass comes off',
        html: `
<p>A raised wing puts a few kilos at the very top of the tailgate, the worst place for it as
far as the gas struts are concerned. Two things to expect:</p>
<ul>
<li>If the struts were uprated to cope with the wing, the tailgate may now fly up faster than
it should once the weight is gone.</li>
<li>If they were never changed and have been sagging, they may seem fine again — which is not
the same as being fine.</li>
</ul>
<p>Check the panel holds itself open at the top of its travel, warm and cold, once the swap is
done. The manual has the back door stay on its own page.</p>`
      }
    ],
    checklists: [
      {
        id: 'plan', title: 'Sequence',
        items: [
          'Wing off, extent of corrosion assessed',
          'Confirm whether the TRD lip covers or misses the existing holes',
          'Corrosion cut back and treated',
          'Holes closed with metal, not filler alone',
          'Inside of the tailgate sealed and cavity-waxed',
          'Panel painted — the whole panel, not a patch',
          'Spoiler fitted and aligned',
          'Gas struts checked hot and cold',
          'Insurer told the car has changed'
        ]
      }
    ],
    open: [
      'Genuine TRD or a replica? Mounting differs, and so does what it covers.',
      'Does the TRD lip use any of the existing holes?',
      'Paint the spoiler to match 202 Black before or after fitting?'
    ],
    links: []
  }
];
