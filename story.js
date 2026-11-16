'use strict';
/* =========================================================
   THE LIST — Story campaign "The List",
   elusive targets, starting locations, NPC chatter
   ========================================================= */
const HANDLER = 'Iris';
const HERO = { first: 'Daniel', last: 'Ashworth', wife: 'Clare', daughter: 'Ellie', son: 'Noah', father: 'Frank', mother: 'Margaret', brother: 'Michael' };
const CAMPAIGN = [
  { ci: 0, act: 1, role: 'The Arsonist', name: 'Vince Kehoe', title: 'Poured the petrol at your parents\' house', brief: 'They called the fire at your parents\' house a gas leak. It wasn\'t. Vince Kehoe poured the petrol. Tonight he\'s betting on fights at the Royal Docks like nothing happened.', debrief: 'Kehoe\'s phone had one number saved under "Driver". Someone drove all three crews out of the city that night.', flash: 'parents' },
  { ci: 1, act: 1, role: 'The Getaway Driver', name: 'Tommy Sheehan', title: 'Drove all three crews away', brief: 'Tommy Sheehan drove all three crews out of London before the first engine arrived. Tonight he\'s showing off a new car at a meet in Hackney. Bought with the money for your family.', debrief: 'Sheehan dropped the crew from your brother\'s flat at a club in Soho. The owner led them.' },
  { ci: 2, act: 1, role: 'Leader, Michael\'s Fire', name: 'Rhys Dunmore', title: 'Led the crew to your brother\'s flat', brief: 'Rhys Dunmore owns Vaultline. He led the crew that went to Michael\'s flat. He sleeps fine, apparently. Five floors, a lot of muscle, and one man who deserves you.', debrief: 'Dunmore\'s guns came out of an auction house in Mayfair. Antiques in the catalogue, rifles in the crates.', flash: 'brother' },
  { ci: 3, act: 1, role: 'The Gun Fence', name: 'Lionel Harcourt', title: 'Armed all three crews', brief: 'Lionel Harcourt sells paintings to the rich and guns to everyone else. He armed all three crews that week. Tonight is the biggest sale of his year.', debrief: 'Harcourt\'s ledger has one more buyer from that week. Callum Pryce. The man who led the crew to your house.' },
  { ci: 4, act: 1, role: 'Leader, The Home Fire', name: 'Callum Pryce', title: 'Led the crew to your house', brief: 'Callum Pryce is getting married today. Flowers, a string quartet, two hundred guests. He led the crew to your house. You know what he took.', debrief: 'Three fires, three crews. The hands are gone. But someone made three murders disappear in a week. That took a liar with a clipboard, a coroner and a badge.', flash: 'home' },
  { ci: 5, act: 2, role: 'The Fire Investigator', name: 'Graham Lisle', title: 'Wrote the three false reports', brief: 'Graham Lisle signed all three reports. Electrical fault. Gas leak. Unattended candle. Tonight the fire service gives him an award for thirty years of service.', debrief: 'Lisle was paid through a solicitor. The death certificates were all signed by one coroner in Leeds. Dr Anand Mehta.' },
  { ci: 6, act: 2, role: 'The Coroner', name: 'Dr Anand Mehta', title: 'Signed the certificates unseen', spare: true, brief: 'Dr Mehta signed seven death certificates without looking at a single body. He\'s on the night shift at St Bride\'s. He has a daughter too. I\'m told that\'s why he did it. Your call.', debrief: 'Mehta\'s files had a police case number on every page. One detective in Manchester closed all three investigations before they opened.', spareLine: 'You let him live. I hope he was worth it. He gave us the detective in Manchester.' },
  { ci: 7, act: 2, role: 'The Detective', name: 'DCI Ray Bannister', title: 'Buried all three cases', brief: 'DCI Ray Bannister buried all three cases and lost the evidence boxes. He retires tonight with a full pension and a party at headquarters. Every guest is police. Tread carefully.', debrief: 'Bannister kept a burner phone for one man. Owen Carrick. He planned every minute of that night.' },
  { ci: 8, act: 2, role: 'The Planner', name: 'Owen Carrick', title: 'Timed the three attacks', brief: 'Owen Carrick timed it all. Three crews, three addresses, two minutes past two. He calls it logistics. Today he\'s in a private box at the races.', debrief: 'Carrick answered to a broker, Silas Rourke. Rourke left the country the week after. His lawyer knows where he went.' },
  { ci: 9, act: 2, role: 'The Lawyer', name: 'Helena Vance', title: 'Hid the payments as paperwork', brief: 'Helena Vance wrote the contracts that paid for your family and filed them as consultancy. She\'s celebrating a promotion on the roof of her chambers in Edinburgh.', debrief: 'Vance\'s files name the three who ran. Rourke in Marbella. A banker, Thorne, in Monaco. And a woman in Dubai they only call the Chair.' },
  { ci: 10, act: 3, role: 'The Broker', name: 'Silas Rourke', title: 'Hired the crews, then ran', brief: 'Silas Rourke hired the crews and ran to the Spanish sun. New teeth, new name, same face. He\'s throwing a pool party for people who don\'t ask questions.', debrief: 'Rourke begged. He said the order came from "the Board". And that the money moved through Monaco.' },
  { ci: 11, act: 3, role: 'The Banker', name: 'Edmund Thorne', title: 'Moved the money', brief: 'Edmund Thorne moved the money. Two million to burn three houses. He hosts a private game tonight. The house always wins. Not tonight.', debrief: 'Thorne\'s last transfer was signed by the Chair of the Board. She\'s in Dubai. She knows you\'re coming.' },
  { ci: 12, act: 3, role: 'The Chair', name: 'Nadia Volkov', title: 'Approved it in four minutes', brief: 'Nadia Volkov chairs the Board. She approved what happened to your family in a meeting that lasted four minutes. Security is doubled. She\'s expecting you.', debrief: 'Before the end she laughed. She said: "Ask Iris who told us you had retired."' },
  { ci: 13, act: 3, role: 'Iris', name: 'Iris', title: 'Your handler. She knew.', iris: true, brief: 'I knew, Daniel. Not when, not where. I knew they would come, and I said nothing because Marlow said I would be first. I\'m at the safehouse in Little Venice. I won\'t run.', debrief: 'One name left. The man who made you.', spareBrief: 'Marlow has sent Kessler, his cleaner, to the safehouse. For me. Then for you. If you want me alive, get there first.', spareDebrief: 'Kessler is done. Marlow is at Glencairn, in the Highlands. He\'s waiting for you. End it.' },
  { ci: 14, act: 3, role: 'The Man Who Trained You', name: 'Arthur Marlow', title: 'Gave the order', brief: 'Marlow trained us both. He ordered the fires because you walked away, and nobody walks away. Glencairn. Tonight. End it.', marlowBrief: 'You were the best I ever made, Daniel. Nobody leaves. Not you, not your family. I\'m at Glencairn. Come home.', debrief: 'The list is empty.' }
];

const STARTS = [
  { id: 'street', name: 'Main Street', icon: '{i:walk}', req: 0, desc: 'Arrive with the guests.' },
  { id: 'alley', name: 'Back Alley', icon: '{i:moon}', req: 1, desc: 'Slip in near the service entrance.' },
  { id: 'staff', name: 'Staff Room', icon: '{i:glass}', req: 2, outfit: 'waiter', desc: 'Start inside, dressed as a waiter.' },
  { id: 'kitchen', name: 'Kitchen', icon: '{i:chef}', req: 3, outfit: 'chef', desc: 'Start in the kitchen as a chef.' },
  { id: 'security', name: 'Security Office', icon: '{i:shield}', req: 5, outfit: 'guard', desc: 'Start as a guard. Watch the enforcers.' }
];

const Elusive = {
  today() {
    const d = Progress.dayStr(), seed = parseInt(d.replace(/-/g, ''), 10) * 31 + 7;
    const rng = RNG(seed);
    const unlocked = CITIES.map((c, i) => i).filter(i => Game.cityUnlocked(i));
    return { date: d, ci: rng.pick(unlocked.length ? unlocked : [0]), seed: (seed * 2654435761) >>> 0 };
  },
  state() {
    const P = Game.S.prog, e = this.today();
    if (!P.elusive || P.elusive.date !== e.date) P.elusive = { date: e.date, status: 'open', ci: e.ci, seed: e.seed };
    if (P.elusive.ci === undefined) { P.elusive.ci = e.ci; P.elusive.seed = e.seed; }
    return Object.assign({}, e, P.elusive);
  },
  timeLeft() { const n = new Date(), m = new Date(n); m.setHours(24, 0, 0, 0); const ms = m - n; return `${Math.floor(ms / 3.6e6)}h ${Math.floor(ms / 6e4) % 60}m`; }
};

/* ---------- chatter ---------- */
const LINES = {
  guest: ['Have you tried the canapés? Divine.', 'I heard the host owes money to very bad people.', 'This champagne is older than I am.', 'Did you see who just walked in?', 'I only came for the free bar.', 'My yacht is bigger, for the record.', 'Security is tight tonight. Something\'s up.', 'Darling, you look fabulous.', 'I invested in crypto. Don\'t ask.', 'Is that a real Picasso?', 'The band is terrible, isn\'t it?', 'Someone said there\'s a pool on the roof!'],
  hint: [
    t => `${t} never misses a chance to make a toast under the chandelier.`,
    t => `They say ${t} drinks like a fish. Always at the bar.`,
    t => `${t} sneaks out to the balcony to smoke. Filthy habit.`,
    t => `I heard ${t} spends ages in the sauna. Must be stressed.`,
    t => `${t} goes for a swim on the roof every party. Show-off.`,
    t => `${t} inspects the kitchen personally. Doesn't trust the chefs.`,
    t => `Apparently ${t} keeps the good whisky in the office.`
  ],
  staff: ['Table six wants more ice. Again.', 'If I drop this tray, I\'m fired.', 'The chef is in a mood tonight.', 'Two more hours of this...', 'Who keeps leaving coins everywhere?', 'Kitchen\'s through the back, staff only.'],
  guard: ['All quiet on my side.', 'Copy that, moving to the next checkpoint.', 'Keep your eyes open, people.', 'I hate these monkey suits.', 'Nobody goes upstairs without clearance.', 'Did you hear something?', 'Radio check. Over.'],
  target: ['Another drink. The strong stuff.', 'Where is my security? Useless!', 'Get me away from these people.', 'Do you know who I am?', 'Ha! Wonderful party, isn\'t it?'],
  hintStop: { speech: 0, bar: 1, balcony: 2, sauna: 3, pool: 4, kitchen: 5, office: 6 }
};

/* ---------- weekly challenge contract ---------- */
const Weekly = {
  week() { const d = new Date(), j = new Date(d.getFullYear(), 0, 1); return d.getFullYear() * 100 + Math.ceil(((d - j) / 86400000 + j.getDay() + 1) / 7); },
  state() {
    const w = this.week(), P = Game.S.prog;
    if (!P.weeklyPick || P.weeklyPick.week !== w) {
      const rng = RNG(w * 7 + 3), unlocked = CITIES.map((c, i) => i).filter(i => Game.cityUnlocked(i));
      let ids = rng.shuffle(WEEKLY_RULES.map(r => r.id));
      const pick = []; for (const id of ids) { if (pick.length >= 3) break; if ((id === 'accident' && pick.includes('poison')) || (id === 'poison' && pick.includes('accident'))) continue; pick.push(id); }
      P.weeklyPick = { week: w, ci: rng.pick(unlocked.length ? unlocked : [0]), seed: (w * 2246822519) >>> 0, rules: pick };
    }
    const wp = P.weeklyPick;
    return { week: w, ci: wp.ci, seed: wp.seed, rules: wp.rules, done: !!(P.weekly && P.weekly.week === w && P.weekly.done) };
  },
  timeLeft() { const n = new Date(), m = new Date(n); m.setDate(n.getDate() + ((8 - n.getDay()) % 7 || 7)); m.setHours(0, 0, 0, 0); const ms = m - n; return `${Math.floor(ms / 8.64e7)}d ${Math.floor(ms / 3.6e6) % 24}h`; }
};
STOP_INFO.signature = { kind: 'accident', steps: ['Find the city\'s signature object (red outline)', 'Set it up (rig it with a wrench, poison it, or wait under it)', 'Wait for the target to use it'] };
