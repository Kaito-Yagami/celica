/* ==========================================================================
   The car, and what has been done to it.

   `figs` are 0-indexed PDF pages in the bundled manual. `sourced` marks a
   claim that comes from the manual; anything else is general knowledge or an
   estimate and is labelled as such in the UI.
   ========================================================================== */
window.CELICA = window.CELICA || {};

window.CELICA.car = {
  model: 'Toyota Celica T-Sport',
  code: 'ZZT231',
  year: 2003,
  engine: '2ZZ-GE',
  gearbox: 'C60 6-speed manual',
  drive: 'FWD, RHD',
  plate: 'FM03 AZN',
  colour: '202 Black',
  facts: [
    { k: 'Power', v: '189', u: 'bhp', note: '141 kW at 7,600 rpm' },
    { k: 'Lift point', v: '6,200', u: 'rpm', note: 'VVTL-i switches to the high cam' },
    { k: 'Redline', v: '8,200', u: 'rpm', note: 'Fuel cut above' },
    { k: 'Kerb weight', v: '1,090', u: 'kg', note: 'Approx., as standard' }
  ],
  /* everything below is straight out of the bundled manual */
  oem: {
    tyre: '205/55R15 87V',
    tyreAlt: '205/50R16 87V',
    pressure: '220 kPa (2.2 bar, 32 psi) front and rear, cold',
    pressureFig: 195,
    camber: "-0°25' ± 45'",
    caster: "2°01' ± 45'",
    toe: "0° ± 12'  (0 ± 2 mm)",
    sai: "13°04' ± 45'",
    heightF: '190 mm',
    heightR: '224 mm',
    alignFig: 195,
    gearboxOil: '2.3 L, API GL-4 or GL-5, SAE 75W-90',
    gearboxFig: 102,
    psFluid: '1.0 L, ATF DEXRON II or III',
    psFig: 130,
    brakeFluid: 'SAE J1703 or FMVSS No. 116 DOT 3',
    brakeFig: 88
  }
};

window.CELICA.mods = [
  /* ---------------------------------------------------------------- interior */
  {
    id: 'starlight',
    name: 'Starlight headliner',
    cat: 'Interior',
    blurb: 'Fibre-optic star field woven into the roof lining.',
    body:
      'The headliner has to come out whole, which on a Celica means the pillar garnishes, ' +
      'the grab handles and the sunroof surround all come off first. The manual sequence for ' +
      'that is worth following exactly — the board is a single moulded panel and it creases if ' +
      'you flex it getting it past the B-pillars.',
    watch: [
      'This car has a sliding roof, so the headliner is cut around the cassette. Far less flat area to work with than a solid-roof car, and the fibre runs have to route around the drain tubes.',
      'Curtain airbags, if fitted, run along the roof rail behind the pillar garnishes. Do not route fibre over or through them, and do not pinch the loom.'
    ],
    elec: { draw: [0.6, 2.0], best: 18,
      why: 'Illuminator on the TAIL circuit means the stars come up with the sidelights and go off with them — no switch to forget, and it can never be left on with the key out.' },
    figs: [
      { p: 1857, c: 'Roof headlining — components and removal order' },
      { p: 1840, c: 'Sliding roof assembly, which the lining is cut around' },
      { p: 1772, c: 'Clip types — which ones are reusable' }
    ]
  },
  {
    id: 'seats',
    name: 'Heated seats',
    cat: 'Interior',
    blurb: 'Aftermarket carbon pads under the facings, both fronts.',
    body:
      'Retrofitted heater elements sit between the foam and the cover, so both front seats had ' +
      'to be stripped to the frame. This is the highest-consequence job on the car, and not ' +
      'because of the heaters.',
    danger:
      'These seats contain side airbags. The seat back cover has a designed tear seam that the ' +
      'airbag fires through. A heater pad, a hog ring or a replacement cover across that seam ' +
      'can turn a working airbag into shrapnel or stop it deploying. Keep every element and ' +
      'every fixing clear of the outboard bolster seam, and follow the manual disconnection ' +
      'procedure before either seat comes out.',
    watch: [
      'Disconnect the battery and wait before unplugging any seat connector — the yellow plugs under the seat are the airbag and the pretensioner.',
      'The seat belt pretensioner is live pyrotechnic hardware too, and it lives in the same area.',
      'Occupant detection on the passenger seat is calibrated to the standard cushion. Adding material under the cover can upset it, which shows up as a passenger airbag light.'
    ],
    elec: { draw: [7.0, 9.0], best: null,
      why: 'Roughly 4 A per seat on high. This must not live on a fuse tap. It needs a relay ' +
           'triggered by an ignition-switched circuit, with its own fused feed taken from the ' +
           'battery or a main junction stud — the relay coil is the only thing that should ' +
           'touch an existing circuit.' },
    figs: [
      { p: 1863, c: 'Front seat — components, including the side airbag assembly' },
      { p: 1604, c: 'Side airbag assembly — handling and precautions' },
      { p: 1880, c: 'Seat belt pretensioner' },
      { p: 1564, c: 'SRS airbag — general precautions. Read before touching a seat.' }
    ]
  },
  {
    id: 'shiftknob',
    name: 'LED shift knob',
    cat: 'Interior',
    blurb: 'Illuminated knob on the C60 six-speed.',
    body:
      'Mechanically trivial, electrically the neatest little problem on the car: getting a ' +
      'supply to something that moves in three axes every time you change gear.',
    watch: [
      'Run the feed as a service loop down the gaiter, not taut. A wire that is just long enough with the lever in neutral is too short in first and reverse.',
      'Cable ties on a shift lever chafe. Use a spiral wrap or a fabric loom tape.'
    ],
    elec: { draw: [0.08, 0.15], best: 18,
      why: 'On TAIL it dims and lifts with the rest of the dash, which is the difference ' +
           'between looking factory and looking added on.' },
    figs: [
      { p: 1278, c: 'Shift lever and control cable — C60' },
      { p: 1651, c: 'Body electrical power source — where the feeds originate' }
    ]
  },
  {
    id: 'wheel',
    name: 'Custom steering wheel',
    cat: 'Interior',
    blurb: 'Aftermarket wheel in place of the OEM airbag wheel.',
    body:
      'The wheel is the single component on this car that sits directly on top of a live ' +
      'pyrotechnic device and a rotating electrical coupling that has no slack.',
    danger:
      'Disconnect the battery negative and wait at least 90 seconds before removing the ' +
      'steering wheel pad — the SRS has a backup power supply that stays armed after the ' +
      'battery is off. Carry a removed airbag pad face away from you, and set it down face up.',
    watch: [
      'The spiral cable has a finite number of turns and no clutch. It must be centred with the road wheels straight before the wheel goes back on. Get it wrong and it tears at full lock — no horn, no airbag, and an SRS light.',
      'If the new wheel has no airbag, the squib circuit is open and the SRS lamp will stay on. That is an MOT failure, and the resistor commonly used to silence it defeats a working safety system rather than fixing it.',
      'Controls that lived on the OEM wheel — horn, cruise, audio — all route through the spiral cable connector.'
    ],
    elec: null,
    figs: [
      { p: 1575, c: 'Steering wheel pad and spiral cable — removal and centring' },
      { p: 1564, c: 'SRS airbag — precautions and the 90-second rule' },
      { p: 1515, c: 'Steering wheel' },
      { p: 1516, c: 'Tilt steering column' }
    ]
  },

  /* ---------------------------------------------------------------- electrical */
  {
    id: 'speedo',
    name: 'Custom speedometer + lift light',
    cat: 'Electrical',
    blurb: 'Reworked cluster face with an added VVTL-i lift indicator.',
    body:
      'A custom face and an extra lamp that fires when the engine crosses onto the high cam. ' +
      'The interesting part is that the cluster is now the one instrument you cannot fully ' +
      'trust by eye, because the car is also on wheels it was never calibrated for.',
    watch: [
      'The manual gives the calibration the meter was built to. At a true 100 km/h the standard cluster must read 100–105 km/h — the speedo may over-read, never under-read.',
      'Larger rolling radius pushes the reading down, toward and past the legal limit. The wheel calculator on the Specs page works out exactly where the 19s put it.',
      'The tachometer has its own tolerance band, ±200 rpm through most of the range — relevant if you are setting a shift light off it.'
    ],
    elec: { draw: [0.3, 0.6], best: null,
      why: 'Fed from the cluster harness itself; no new tap needed.' },
    figs: [
      { p: 204, c: 'Speedometer and tachometer allowable ranges — SS-54' },
      { p: 1680, c: 'Combination meter — location and components' },
      { p: 1681, c: 'Combination meter — sender and switch locations' }
    ],
    facelift: true
  },
  {
    id: 'headunit',
    name: 'CarPlay head unit',
    cat: 'Electrical',
    blurb: 'Modern touchscreen unit in the OEM aperture.',
    body:
      'The centre stack comes apart from the console upward. The manual instrument panel ' +
      'sequence covers the finish panels and the heater console that have to move first.',
    watch: [
      'A CarPlay unit peaks near 10 A with the screen bright and the amplifier working — nothing like the OEM radio it replaced. The RADIO circuit is a 15 A fuse and is the right home for it.',
      'Keep the constant memory feed and the switched feed separate. Bridging them is how a head unit flattens a battery over a weekend.',
      'The OEM aerial is amplified and needs its power lead connected, or FM reception collapses.'
    ],
    elec: { draw: [2.0, 10.0], best: 24,
      why: 'RADIO, 15 A, accessory-switched — the circuit designed for exactly this load.' },
    figs: [
      { p: 1729, c: 'Audio system — description and reception' },
      { p: 1847, c: 'Instrument panel — components and removal order' },
      { p: 1760, c: 'Antenna' }
    ]
  },
  {
    id: 'speakers',
    name: 'Aftermarket speakers',
    cat: 'Electrical',
    blurb: 'Replacement drivers front and rear.',
    body:
      'Straight swap into the OEM locations. Whether they draw anything extra depends entirely ' +
      'on whether there is an amplifier behind them.',
    watch: [
      'Head-unit powered means no new load at all — it is already counted in the head unit figure.',
      'An amplifier is a different animal: it belongs on its own fused feed from the battery with a remote turn-on from the head unit, never on a fuse tap.',
      'Door speakers need the loom routed through the door boot without stressing it.'
    ],
    elec: { draw: [0, 0], best: null,
      why: 'Passive on the head unit. Set an amplifier up separately in the load budget if one is fitted.' },
    figs: [
      { p: 1729, c: 'Audio system' },
      { p: 1781, c: 'Front door — trim removal for door speakers' }
    ]
  },

  /* ---------------------------------------------------------------- chassis + body */
  {
    id: 'wheels',
    name: '19-inch alloys',
    cat: 'Chassis',
    blurb: 'Polished multi-spoke 19s, well outside the factory fitment.',
    body:
      'Four inches over the largest wheel Toyota offered on this car. That changes the speedo, ' +
      'the effective gearing, the unsprung mass and — because the car also sits low — whether ' +
      'the factory alignment figures apply at all.',
    watch: [
      'The manual quotes alignment at a reference ride height of 190 mm front and 224 mm rear, measured to the lower arm bolt centres. A lowered car does not meet that, so the book camber and toe figures are a starting point, not a target.',
      'Balance limit is 8.0 g. A 19-inch wheel is far less forgiving of being out than a 15 was.',
      'Tyre runout limit 1.0 mm; hub backlash 0.05 mm; hub deviation 0.07 mm. Worth checking if you have any vibration.',
      'Cold pressures on the label are for a 205/55R15. A much lower-profile tyre on a wider rim wants its own pressure, not the door sticker.'
    ],
    elec: null,
    figs: [
      { p: 195, c: 'Suspension and axle service data — pressures, camber, caster, toe, ride height' },
      { p: 1365, c: 'Tire and wheel inspection — pressures, runout, rotation' },
      { p: 1367, c: 'Front wheel alignment' },
      { p: 1371, c: 'Rear wheel alignment' },
      { p: 197, c: 'Suspension and axle torque specification' }
    ]
  },
  {
    id: 'wing',
    name: 'GT-style rear wing',
    cat: 'Body',
    blurb: 'Raised wing on the tailgate in place of the factory lip.',
    body:
      'Mounted through the back door skin, which is a single pressing with a glass aperture in ' +
      'it and struts holding it up.',
    watch: [
      'Every new hole through the tailgate skin is a corrosion start point. Seal both faces and cavity-wax the inside.',
      'Added mass at the top of the tailgate is the worst place for it — the gas struts are sized for the standard panel and will start dropping the door when warm.',
      'Check the wing does not foul the roof line when the tailgate is fully open.'
    ],
    elec: null,
    figs: [
      { p: 1793, c: 'Back door — components' },
      { p: 1798, c: 'Back door stay (gas strut)' },
      { p: 1835, c: 'Back door glass' }
    ]
  },
  {
    id: 'kit',
    name: 'Weber bodykit + side skirts',
    cat: 'Body',
    blurb: 'Front lip, side skirts and rear valance.',
    body:
      'Bolt-and-bond bodywork over the standard sills and bumpers. The manual clip pages are ' +
      'the useful part — knowing which fastener is a one-use clip saves rattles later.',
    watch: [
      'Skirts cover the jacking points. Mark where the pinch welds actually are before the first time you need to lift the car in a hurry.',
      'A low front lip changes the approach angle. The manual lift and support points are still the only safe places to put a jack.',
      'Trapped water behind a bonded skirt rots sills from the inside.'
    ],
    elec: null,
    figs: [
      { p: 1772, c: 'Clip types and removal' },
      { p: 1775, c: 'Front bumper' },
      { p: 1776, c: 'Rear bumper' },
      { p: 1817, c: 'Side mud guard' },
      { p: 12, c: 'Vehicle lift and support locations' }
    ]
  }
];
