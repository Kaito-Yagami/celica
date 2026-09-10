/* ==========================================================================
   Instrument panel junction block — 2003 Celica T-Sport (ZZT231, UK/RHD)

   Transcribed from the lid label photographed on THIS car, not from the
   manual. The manual in this site is the 2000 US-market book (RM744U1), and
   its instrument panel J/B has 23 fuses plus relays A-D (see p.1653). The
   facelift UK box has 35. Where the two disagree, the car wins.

   `cls` is the circuit class and `conf` is how much to trust it:
     hi  — the circuit name or its function settles it
     med — Toyota convention says so, but it varies by market
     lo  — genuinely unsure, measure it

   `load` is the estimated standing load already on the circuit, in amps, as
   [min, max]. These are estimates from typical bulb and module draw, NOT
   measurements. The site says so everywhere it shows them.
   ========================================================================== */
window.CELICA = window.CELICA || {};

window.CELICA.fuses = {
  box: {
    name: 'Instrument panel junction block',
    where: 'Driver side, behind the lower dash trim panel / kick panel (RHD)',
    slots: 35,
    source: 'Lid label, photographed 2025',
    manualFig: 1653,
    manualNote:
      'The manual page opposite is the 2000 US box: 23 fuses, relays A-D. ' +
      'It is here for context only. Do not use it to identify a fuse on this car.'
  },

  /* standard blade fuse body colours, for finding one by eye in the dark */
  colours: {
    5: { hex: '#D9B99B', name: 'tan' },
    7.5: { hex: '#8C6239', name: 'brown' },
    10: { hex: '#C0504A', name: 'red' },
    15: { hex: '#4A6FA5', name: 'blue' },
    20: { hex: '#C9A227', name: 'yellow' },
    25: { hex: '#D8D5D0', name: 'clear' },
    30: { hex: '#5E8C61', name: 'green' }
  },

  classes: {
    bat: { name: 'Constant', desc: 'Live with the key out. Anything here can flatten the battery.' },
    acc: { name: 'Accessory', desc: 'Live at ACC and IG. Dies when you pull the key.' },
    ig: { name: 'Ignition', desc: 'Live at IG only. Dead at ACC and while cranking on some circuits.' },
    ill: { name: 'Illumination', desc: 'Live only with the parking or head lights on. Dims with the rheostat.' }
  },

  /* the four slots this car already has add-a-circuit taps in */
  taps: [18, 19, 26, 35],

  slots: [
    { n: 1, amp: 7.5, name: 'PANEL1', cls: 'ill', conf: 'hi', load: [0.4, 0.9],
      what: 'Instrument and switch panel illumination, circuit 1.',
      note: 'Dims with the dash rheostat. A tap here follows the dimmer, which is exactly what you want for ambient lighting that should not glare at night.' },
    { n: 2, amp: 7.5, name: 'PANEL2', cls: 'ill', conf: 'hi', load: [0.4, 0.9],
      what: 'Instrument and switch panel illumination, circuit 2.',
      note: 'Same behaviour as PANEL1, split across a second group of lamps.' },
    { n: 3, amp: 7.5, name: 'ECU-ACC', cls: 'acc', conf: 'hi', load: [0.2, 0.6],
      what: 'Accessory feed to control modules.' },
    { n: 4, amp: null, name: '—', cls: null, conf: 'hi', load: [0, 0],
      what: 'Position not used on this car. Blanked on the label.',
      note: 'An empty position is not a free circuit. There is no wire behind it.' },
    { n: 5, amp: 5, name: 'BK/UP LP', cls: 'ig', conf: 'hi', load: [1.5, 2.0],
      what: 'Reversing lamps, via the park/neutral or reverse switch.',
      note: 'The natural trigger if you ever want a reverse signal at the back of the car. Trigger only — 5 A leaves nothing to borrow.' },
    { n: 6, amp: 5, name: 'DEF RLY', cls: 'ig', conf: 'hi', load: [0.1, 0.3],
      what: 'Rear defogger relay coil. The heavy current is on fuse 17.' },
    { n: 7, amp: 5, name: 'BODY ECU-IG', cls: 'ig', conf: 'hi', load: [0.3, 0.8],
      what: 'Ignition feed to the body ECU.',
      note: 'Leave alone. Load or noise here upsets central locking, lighting timers and the alarm.' },
    { n: 8, amp: 5, name: 'TENS RDC', cls: 'ig', conf: 'med', load: [0.1, 0.4],
      what: 'Seat belt tension reducer.' },
    { n: 9, amp: 7.5, name: 'MPX-B', cls: 'bat', conf: 'hi', load: [0.05, 0.3],
      what: 'Multiplex communication backup, constant.',
      note: 'Never tap. This is the body multiplex bus supply.' },
    { n: 10, amp: 7.5, name: 'RR FOG', cls: 'ill', conf: 'hi', load: [1.5, 1.9],
      what: 'Rear fog lamp, 21 W, gated by the light switch.' },
    { n: 11, amp: 7.5, name: 'DOME', cls: 'bat', conf: 'hi', load: [0.1, 1.2],
      what: 'Interior lamps, map lights, boot lamp. Constant.',
      note: 'Constant but door-switched downstream. A tap here is live with the key out — fine for something with its own off state, dangerous for anything that idles.' },
    { n: 12, amp: 7.5, name: 'ECU-B', cls: 'bat', conf: 'hi', load: [0.05, 0.3],
      what: 'ECU keep-alive memory. Constant.',
      note: 'Never tap. Pulling this loses ECU adaptations.' },
    { n: 13, amp: 5, name: 'WARNING', cls: 'bat', conf: 'med', load: [0.1, 0.4],
      what: 'Warning buzzer and warning lamp circuits.' },
    { n: 14, amp: 5, name: 'ECU-IG', cls: 'ig', conf: 'hi', load: [0.3, 0.9],
      what: 'Ignition feed to engine and chassis ECUs.',
      note: 'Never tap. Any voltage dip here is a running fault.' },
    { n: 15, amp: 5, name: 'ABS-IG', cls: 'ig', conf: 'hi', load: [0.2, 0.6],
      what: 'ABS / EBD control ignition feed.',
      note: 'Never tap. Safety system.' },
    { n: 16, amp: 5, name: 'FAN RLY', cls: 'ig', conf: 'hi', load: [0.1, 0.4],
      what: 'Cooling fan relay coil. Fan current is in the engine bay box.' },
    { n: 17, amp: 30, name: 'DEF', cls: 'ig', conf: 'hi', load: [14, 20],
      what: 'Heated rear window element, via the defogger relay.',
      note: 'The biggest single load in this box, and it runs near its rating when on. Nothing to spare.' },

    { n: 18, amp: 10, name: 'TAIL', cls: 'ill', conf: 'hi', load: [3.0, 4.2],
      what: 'Parking lamps, tail lamps, number plate lamps, and the feed that wakes the whole dash illumination circuit.',
      note: 'Live only with the lights on, which makes it the right trigger for anything that should appear at night and vanish by day. But it is already the busiest illumination circuit on the car: four position lamps, two plate lamps and the panel feed. Budget 4-5 A of real headroom, not 10.' },
    { n: 19, amp: 20, name: 'FR P/W', cls: 'ig', conf: 'med', load: [0.0, 0.2],
      what: 'Front power windows, fed via the power window relay.',
      note: 'Near-zero standing load — a window motor only draws while it is actually moving, and then it draws 8-15 A. Good average headroom, bad peak headroom: size your tap for what happens when someone drops a window while your load is on.' },
    { n: 20, amp: 10, name: 'HTR', cls: 'ig', conf: 'hi', load: [0.3, 1.0],
      what: 'Heater control panel and blower control circuit.' },
    { n: 21, amp: 15, name: 'RR WIPER', cls: 'ig', conf: 'hi', load: [0, 3.5],
      what: 'Rear wiper motor and its intermittent relay.' },
    { n: 22, amp: 7.5, name: 'TURN', cls: 'ig', conf: 'hi', load: [2.6, 3.6],
      what: 'Indicators via the flasher. Hazards are fed separately so they work with the key out.',
      note: 'The signal to tap if you want an indicator trigger — but read it through an optocoupler, never load it. Extra current here changes the flash rate on a car with bulbs.' },
    { n: 23, amp: 10, name: 'MIR HTR', cls: 'ig', conf: 'hi', load: [1.5, 2.5],
      what: 'Heated door mirrors, usually ganged with the rear defogger switch.' },
    { n: 24, amp: 15, name: 'RADIO', cls: 'acc', conf: 'med', load: [2.0, 6.0],
      what: 'Head unit switched supply.',
      note: 'This is the circuit the CarPlay unit belongs on, and probably already is. 15 A is genuine capacity for a head unit — if anything audio-related is currently tapped elsewhere, this is where it should move to.' },
    { n: 25, amp: 25, name: 'WIPER', cls: 'ig', conf: 'hi', load: [0, 6.0],
      what: 'Front wiper motor, park switch and washer interlock.',
      note: 'Large fuse, but the load is spiky and stalling a wiper in snow will use all of it.' },
    { n: 26, amp: 15, name: 'WASHER', cls: 'ig', conf: 'hi', load: [0.0, 0.1],
      what: 'Windscreen washer pump. Draws roughly 3-4 A, only while the stalk is held.',
      note: 'The best switched-supply tap on this board: 15 A of fuse, essentially zero standing load, and it is dead the moment the key comes out. The only caveat is the obvious one — the pump wants its share on a dirty morning.' },
    { n: 27, amp: 7.5, name: 'OBD', cls: 'bat', conf: 'lo', load: [0.05, 0.3],
      what: 'DLC3 diagnostic connector supply.',
      note: 'Pin 16 of the OBD port is normally permanently live. Worth confirming before assuming either way — this is the one on the board most likely to surprise you.' },
    { n: 28, amp: 7.5, name: 'SRS-IG', cls: 'ig', conf: 'hi', load: [0.2, 0.5],
      what: 'Airbag system ignition feed.',
      note: 'Never tap, never probe casually. Disturbing SRS supply sets a crash-data fault that needs clearing properly.' },
    { n: 29, amp: 15, name: 'FR FOG', cls: 'ill', conf: 'hi', load: [0, 9.2],
      what: 'Front fog lamps, 55 W each, gated by the light switch.',
      note: 'When the fogs are on this is already at 60 % of rating. Nothing to borrow.' },
    { n: 30, amp: 10, name: 'STOP', cls: 'bat', conf: 'hi', load: [0, 4.4],
      what: 'Brake lamps, via the pedal switch. Constant, so they work with the key out.',
      note: 'The brake trigger for anything at the back of the car. Read it, do not load it.' },
    { n: 31, amp: 20, name: 'DOOR', cls: 'bat', conf: 'hi', load: [0.05, 0.4],
      what: 'Central locking actuators. Constant, high peak, near-zero standing.' },
    { n: 32, amp: 20, name: 'FL P/W', cls: 'ig', conf: 'med', load: [0.0, 0.2],
      what: 'The second power window circuit.',
      note: 'Same profile as fuse 19.' },
    { n: 33, amp: 25, name: 'AM1', cls: 'bat', conf: 'hi', load: [8, 18],
      what: 'Main battery feed into the ignition switch. Everything IG and ACC downstream is fed through here.',
      note: 'Never tap. This is a trunk circuit, not a branch — its 25 A is already spoken for by everything else that switches with the key.' },
    { n: 34, amp: 15, name: 'S/ROOF', cls: 'ig', conf: 'hi', load: [0, 8.0],
      what: 'Sliding roof motor and control.',
      note: 'Zero standing load if the roof is shut, but it takes most of the fuse while moving.' },
    { n: 35, amp: 15, name: 'CIG', cls: 'acc', conf: 'med', load: [0, 10],
      what: 'Cigarette lighter socket / 12 V accessory socket.',
      note: 'The classic tap, because it is easy and reasonably big. The catch: whatever gets plugged into the socket shares the fuse with you. A 10 A tyre inflator plus your load is how a 15 A fuse dies on a motorway.' }
  ],

  /* what this car currently has hanging off each tapped circuit.
     `draw` is amps: [typical, peak]. Marked estimated until measured. */
  loads: [
    { id: 'starlight', mod: 'Starlight headliner', fuse: null, draw: [0.6, 2.0],
      measured: false,
      note: 'Fibre-optic engine plus LED source. Draw depends entirely on the illuminator — a single 6 W head is 0.5 A, a twin RGBW unit with a twinkle wheel is nearer 2 A.' },
    { id: 'shiftknob', mod: 'LED shift knob', fuse: null, draw: [0.08, 0.15],
      measured: false, note: 'A handful of LEDs. Negligible on any circuit.' },
    { id: 'seats', mod: 'Heated seats', fuse: null, draw: [7.0, 9.0],
      measured: false,
      note: 'The big one. 3.5-4.5 A per seat on high, both seats together comfortably 8 A. This must NOT be on a fuse tap — it needs its own relay-switched feed from the battery with its own fuse.' },
    { id: 'speedo', mod: 'Custom speedometer + lift light', fuse: null, draw: [0.3, 0.6],
      measured: false, note: 'Cluster backlighting plus the lift indicator driver.' },
    { id: 'headunit', mod: 'CarPlay head unit', fuse: null, draw: [2.0, 10.0],
      measured: false,
      note: 'Idle around 2 A; peaks to 10 A driving speakers hard with the screen at full brightness.' },
    { id: 'speakers', mod: 'Aftermarket speakers', fuse: null, draw: [0, 0],
      measured: false,
      note: 'Zero extra if head-unit powered — the draw is already counted in the head unit. If there is an amplifier it does not belong on a fuse tap at all.' }
  ],

  /* the probe procedure the site walks you through */
  probe: [
    { key: 'off', q: 'Key out of the ignition, everything off', hint: 'Doors shut, lights off.' },
    { key: 'acc', q: 'Key at ACC (first click, engine not running)', hint: '' },
    { key: 'ig', q: 'Key at IG / ON (dash lit, engine not running)', hint: '' },
    { key: 'lights', q: 'Key out, sidelights switched on', hint: 'Just the parking lights, not dipped beam.' }
  ]
};
