# Celica T230 — flush infinity tail bar, build plan v2
Steel OEM tailgate · full DIY · sequential amber, white reverse, breathing wake-up, light smoke face.
Interactive version (fillable measurement + photometric sheet) is published as a Claude artifact.

## 1. What you're building
Five functions and one animation, in a bar ~1.1 m long and 45–55 mm tall, cut between the existing clusters.

| Function | How | What you're accepting |
|---|---|---|
| Red position (sidelights) | infinity tunnel at ~20% | nothing — an optional rear position lamp only has to be red (RVLR Sch 10 Pt II) |
| Red brake (recommended) | same emitters at 100% | unapproved additional stop lamp; looks factory, big safety gain |
| Amber sequential | discrete high-power amber zones, IN ADDITION to the OEM cluster indicators | unapproved 2nd rear indicator. MOT explicitly passes sequential. Keeping OEM = legal cap of 2/side + failsafe |
| White reverse | discrete white zones at the bar ends | car may only have 2 reversing lamps — disconnect the OEM pair, or knowingly run 4 |
| Breathing wake-up | gamma ramp on unlock, 2 s, once | reg 13 bans auto-flashing lamps. Build a steady/MOT mode switch |
| Light smoke face | tint the BAR only | fine on an optional lamp. Never tint the OEM clusters (MOT Major, and they're your legal stop + indicator) |

**The decision that decides the build:** half-mirror passes 10–30%, light smoke another 65–80%. Anything behind
both is at ~10–20% of raw output — fine for a deco red glow, useless for an indicator read at 50 m in daylight.
So: **the tunnel does the show, discrete emitters do the work.** Red lives in the tunnel; amber and white fire
through clear (tinted, not mirrored) apertures in a lower tier.

## 2. Photometric targets — build to numbers
| Function | On-axis target | Source |
|---|---|---|
| Rear indicator cat 2a | 50–500 cd (250 max if D-marked pair). Aim 150–250 cd | UNECE R6 |
| Rear indicator cat 2b | 50–1000 cd | UNECE R6 |
| Reversing lamp | >=80 cd, no stated max | UNECE R23 |
| Rear position | match OEM; no brighter at night | measure yours |
| Stop | ~5–10x position | measure yours |

Home method: lux meter on axis at a measured distance in a dark garage. **cd = lux x distance(m)²**
(12 lux at 4 m = 192 cd). Measure the OEM cluster first as reference, and measure THROUGH the finished
face — mirror, tint and all. Use 3–5 m. Amber measured at full brightness, not mid-sweep.

### Sweep timing
- Flash rate 60–120/min (legal + MOT). Aim ~85/min = 706 ms period. Time 30 flashes.
- Sweep 150–200 ms, then hold fully lit ~180–200 ms.
- **All zones extinguish together** — never unwind the sweep; that's what makes cheap kits look wrong.
- Direction inboard -> outboard. Duty ~50%. Hazards: both halves sweep in phase, not mirrored inwards.

## 3. Legal reference (compressed)
| Rule | Says | Bearing |
|---|---|---|
| Sch 10 Pt II | optional rear position lamps: any number, only requirement = Red | red bar unconditionally fine |
| Sch 7 Pt II | max 2 rear indicators per side; mark, amber, 60–120/min, tell-tale still apply | keep OEM indicators -> at the cap |
| Sch 14 | not more than two reversing lamps, approval mark post-1986 | disconnect OEM reverse, or run 4 knowingly |
| Sch 12 Pt II | optional stop lamps: mark + 20–60 cd for a centre lamp post-1991 | bar's brake is unapproved; keep OEM stop + high-level |
| reg 11 | red only to rear, except amber indicator / white reverse | no colour modes on the road |
| reg 13 | no fitted lamp may automatically flash (indicators excepted) | the wake-up is the one plain offence — mode switch |
| reg 27 | no undue dazzle | why position runs at ~20% |
| MOT 4.4 | "sequential/dynamic indicators not to be considered a reason to fail" | sequential passes outright |
| MOT 4.2/4.3 | defective lens affecting emitted light = Major | tint the bar, not the clusters |

Declare the modification to your insurer in writing.

## 4. On the car (T230 facelift, RHD)
- Tail/stop 7443 · indicator 7440 amber · reverse 921/W21W — all in the quarter-panel clusters
- **Keep the OEM indicators connected** (legal + failsafe). Disconnect OEM reverse if the bar takes it
- Rear fog: rear bumper lower section, L&R (P21W/W21W) — untouched
- Plate lamps: tailgate outer garnish above the plate (W5W/168) — VERIFY, then relocate
- Fuses: TAIL 10A #9 (+plate lamps) · STOP 10A #3 · TURN 7.5A #7 · HAZ 15A #21 (engine bay) · BK/UP 5A D1 · RR FOG 7.5A A2
- Adding LED in parallel with OEM bulbs won't hyperflash (you're adding current, not removing it)
- Width 1740 · height 1320 · length 4340 mm · UK plate 520x111 · skin ~0.7–0.8 mm

## 5. Measure before drawing
M1 lamp inner-edge to inner-edge · M2 tail lamp band height · M3 bar centreline height · M4 plate recess ·
M5 garnish footprint · **M6 outer skin to inner panel gap (critical)** · M7 skin to glass flange ·
M8 channel to latch/striker (>=40 mm) · M9 channel to wiper motor/washer · M10 grommet ID (12 cores?) ·
M11 skin thickness · M12 crown radius · M13 reverse lamp height · M14 bumper to plate · M15 face angle ·
M16 tailgate weight · M17 depth behind plate recess · M18 body width at lamps
Plus P1–P4: OEM tail / stop / indicator lux, and the distance used.

M6 method: trim board + garnish off, right-angled 1.5 mm welding wire through a garnish fixing hole to the
inner panel, mark at the skin, withdraw, measure. Five points across; shallowest wins.

## 6. Optics, tint, transmission budget
| Layer | Transmission | Running total |
|---|---|---|
| two-way mirror acrylic 3 mm | 10–30% | 0.10–0.30 |
| light smoke film | 65–80% | 0.07–0.24 |
| diffuser (if fitted) | 60–85% | 0.04–0.20 |
| behind all three | | need 5–25x raw output |
| **clear aperture + tint only** | 65–80% | need 1.25–1.5x — **amber and white go here** |

Two-tier face: upper tier = infinity tunnel (26–34 mm deep, red); lower tier = 12–16 mm functional strip
(amber sweep + white reverse) behind clear tinted windows. Divider reads as a styling crease at 3 m.

Depth options by M6: **A** deep tunnel 40–52 mm (6–10 repeats) · **B** shallow 28–36 mm (4–6 repeats,
recommended) · **C** edge-lit light guide 16–20 mm (no tunnel, brightest, fallback).

Tint: the mirror acrylic already reads as a dark smoked panel when off — cut a 100 mm offcut, hold it over a
lit LED at the intended spacing, photograph in daylight, then decide. If you do tint: light smoke vinyl
65–80% on the outside (reversible). Avoid spray tint over 1.1 m — you'll never keep it even.

Curvature: the tailgate crowns. A tunnel needs two parallel flats, so it's a flat chord let into the panel,
or three shallow flat segments with joints behind opaque dividers. Decide at template stage (M12).

## 7. Electronics
**Light sources**
- Tunnel: 12 V addressable RGB strip (WS2815 class, 60/m) in ali channel, edge-firing, baffled. ~12 mA per
  colour channel per pixel at 12 V (check the datasheet) -> ~25 W for a 70-pixel bar.
- Amber: 10–14 zones of 1 W PC-amber discretes (~590 nm), 2–3 per zone, constant-current drivers. **Not RGB
  mixed amber** — dim, drifts orange under tint, and it's the giveaway on cheap builds.
- White: 2 zones of 3 W cool white (5000–6000 K) at the bar ends.

**Controller**
- MCU: ATmega328/RP2040 class; ESP32 if you want a phone toggle for MOT mode.
- Supply: automotive buck (Recom R-78E5.0 class, 6.5–32 V in), not a linear reg.
- Protection (non-negotiable): inline fuse, reverse-polarity MOSFET/Schottky, TVS across supply for load
  dump, 470 uF bulk + 100 nF local.
- Inputs: 5 x 12 V (tail, brake, left, right, reverse) through optocouplers (PC817 class, 4k7 series).
- Data: 5 V through 74AHCT125 level shifter, 330 R series, 1000 uF at the injection point.
- Amber/white: logic-level MOSFETs on PWM-dimmable CC drivers, 100 R gate resistors, LEDs on ali bonded to
  the steel tray.
- **Enable the watchdog.** A hung MCU leaving amber on solid is worse than one that goes dark.

**Priority state machine** (write this down before the code)
1. Indicator active -> that half becomes the amber sweep; red on that half goes OFF (amber+red = muddy orange)
2. Reverse -> white zones on
3. Brake -> tunnel red 100%
4. Tail -> tunnel red ~20%
5. Wake-up -> only with ignition off and nothing else active, once
- Hazards: both halves sweep in phase
- MOT/steady mode: hidden switch kills wake-up and sweep -> plain simultaneous amber flash + steady red

**Failsafe — build first, not last:** leave the OEM cluster indicators fully connected and car-driven, so the
bar's amber is purely additive. Controller hangs -> the car still indicates, brakes and passes an MOT.
It also puts you at exactly 2 rear indicators per side.

**Animation:** gamma curve (~2.2) not linear PWM. Wake-up 2 s in, 400 ms hold, 1 s out, once per unlock.
Drive the flash timing off the car's own indicator signal so the bar stays in phase with the OEM lamps.

## 8. Phases
0. **Buy a second tailgate (£60–150).** Car stays road legal while you cut. Weigh before/after (M16).
1. Survey + **build a cardboard/offcut mock-up of the two-tier face with the real acrylic, real tint and one
   amber LED** — photograph at 3 m and 20 m, day and night. Answers tint, depth and divider in half a day.
   Then template (card -> MDF -> 1.5 mm ali) and CAD everything off one sketch. Keep >=40 mm untouched skin.
2. Cut: 6 mm relief holes at corners, cut 5 mm inside the line, file to it. Outer skin only. Tray in 1.2 mm
   CR4 with 25 mm flanges. **Stitch weld 15 on / 40 off**, alternate sides, cool between passes. No welder:
   3M 08115 + 4 mm rivets at 40 mm centres.
3. Corrosion: etch, 2K epoxy primer both sides, seam seal, two 8 mm drains + grommets (test with water),
   cavity wax after paint. 202 Black — paint the whole panel.
4. Module: ABS/ASA housing (not PLA — 70–80 C in sun). 2 mm first-surface rear mirror, perimeter-bonded.
   Laser-cut face: mirror acrylic upper, clear lower. Butyl rope + clamp strip so the lens comes off.
   One PTFE breather at the high point. **Bench-run the full electronics inside the finished module for 2 h.**
5. Wiring. 6. Lock delete. 7. Plate lighting. 8. Fit, measure, sign off.

## 9. Wiring — OEM circuits are triggers, never supplies
| Signal | Tapped at | Into |
|---|---|---|
| Tail | plate lamp connector at the tailgate | opto + main relay trigger |
| Brake | stop lamp feed at a cluster (after the switch) | opto |
| Left / right | both cluster indicator feeds | 2 optos (gives phase sync + hazard detect) |
| Reverse | BK/UP 5 A | opto (trigger only) |
| **Main supply** | boot junction / battery via relay | **15 A** fuse within 300 mm of take-off |
| Plate lamps | back onto the original TAIL feed | must light with position lamps |

Cores through the existing corrugated boot with a draw string. Deutsch DT 8/12-way at the hinge.
**Controller lives in the boot, not the tailgate** — dry, serviceable, keeps mass off the struts.
Own earth stud (never share the OEM lamp earth). LEDs on ali bonded to the tray, <60 C after 1 h.
Label every conductor.

## 10. Lock delete
Trim board off -> unclip rod both ends -> slide the horseshoe/spring clip -> barrel pushes out forwards.
Bag barrel/rod/clip. Latch stays. Three layers: (1) central locking/OEM actuator, (2) boot popper >=150 N on
its own fuse + hidden switch, (3) **mechanical Bowden cable** to the latch's manual release, reachable through
the folded rear seats. Prove (3) with the panel closed and the battery disconnected, before paint.

## 11. Plate lighting
E-marked, white, lit with the position lamps, no direct white to rear, plate stays BS AU 145e.
Best: slim E-marked lamps in a new lower garnish firing down (also hides the bottom edge of the repair).
Bumper-mounted upward units work but spill white rearwards — sight along the bumper at 10 m first.

## 12. Budget (excl. tools)
Donor gate 60–150 · steel 25–40 · mirror acrylic 55–110 · rear mirror 20–35 · clear+diffuser 20–40 ·
tint film 15–35 · housing 30–70 · addressable strip 30–60 · amber LEDs+drivers 60–130 · white 20–45 ·
controller+protection 45–90 · ali heatsink 20–40 · plate lamps 15–40 · popper+cable 35–70 ·
relays/cable/connectors 55–95 · primers/sealers/wax 70–120 · paint 80–160 · sundries 25–45 · lux meter 15–30.
**Total £695–£1,405. Bench time 80–120 h.**

## 13. Top risks
Water into the tailgate cavity · **amber too dim through mirror+tint (measure in cd before bonding the lens)** ·
condensation · controller hang (OEM indicators stay connected, watchdog on) · sweep out of phase with OEM ·
weld distortion · M6 too shallow · strut sag · roadside attention (steady mode switch) · insurance ·
can't open the tailgate.

## 14. Sign-off (short list)
Colour to rear · nothing animates with ignition on · steady/MOT mode works · amber 150–250 cd · reverse >=80 cd ·
brake 5–10x position · flash 60–120/min · bar in phase with OEM · sweep inboard->outboard, all off together ·
**unplug the controller: car still indicates, brakes, shows position** · reversing lamp count <=2 · plate lamps ·
no stray white to rear · dazzle check from 5 m behind · water test · drains · 1 h thermal soak <60 C ·
overnight condensation · emergency release with battery disconnected · shut lines · loom labelled ·
insurance declared · build record filed.

## 15. Open questions
1. Confirm plate lamps are in the tailgate garnish on a RHD UK car — pop the garnish.
2. M6 internal depth — decides A/B/C.
3. What's behind the channel line (reinforcements, wiper motor, washer line).
4. Reverse: two lamps or four.
5. Whether you need tint at all — decide from the P1 mock-up photos.

## Sources
- RVLR 1989: https://www.legislation.gov.uk/uksi/1989/1796/contents/made (regs 11, 13, 20, 27; Schs 7, 10, 11, 12, 14, 15)
- MOT inspection manual s4: https://www.gov.uk/guidance/mot-inspection-manual-for-private-passenger-and-light-commercial-vehicles/4-lamps-reflectors-and-electrical-equipment
- UNECE R6 indicator intensities: https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:42010X0710(02)
- UNECE R23 reversing lamps: https://www.dun-bri.com/Regulations-Standards/UNECE-Regulations/Guide-To-ECE-R23-Reverse-Lamps
- Celica T230 fuses and relays: https://fuseandrelay.com/toyota/celica-t230.html
- Rear fog fitment (bumper, L&R): https://www.autodoc.co.uk/car-parts/rear-fog-light-10565/toyota/celica
