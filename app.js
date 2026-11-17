'use strict';

// ---------- Data ----------
const AP = { CGK: 'Jakarta', SUB: 'Surabaya', DPS: 'Denpasar', KNO: 'Medan', UPG: 'Makassar' };
const AL = [['Garuda Indonesia', 'GA', 1.35], ['Lion Air', 'JT', 0.9], ['Citilink', 'QG', 1], ['Batik Air', 'ID', 1.15]];
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const STATUSES = ['Confirmed', 'Booked', 'Waiting for the payment'];
const CURRENT_YEAR = 2026;
const QUOTA = 12;
const EMP = [
  ['Andi Pratama', 'Keuangan', [['2025-03-10', '2025-03-12', 'Disetujui'], ['2026-02-02', '2026-02-06', 'Disetujui'], ['2026-12-21', '2026-12-24', 'Disetujui']]],
  ['Bella Safitri', 'HRD', [['2025-08-18', '2025-08-22', 'Disetujui'], ['2026-07-06', '2026-07-10', 'Disetujui'], ['2026-12-28', '2027-01-03', 'Menunggu']]],
  ['Chandra Wijaya', 'IT', [['2026-04-14', '2026-04-16', 'Disetujui'], ['2026-12-01', '2026-12-05', 'Disetujui']]],
  ['Dewi Anggraini', 'Pemasaran', [['2026-01-05', '2026-01-09', 'Disetujui'], ['2026-12-15', '2026-12-19', 'Menunggu']]],
  ['Eko Saputra', 'Operasional', [['2025-12-22', '2025-12-26', 'Disetujui'], ['2026-12-22', '2026-12-31', 'Disetujui']]],
];
const VIS = [
  { id: 'v1', name: 'Rina Wulandari', email: 'rina.w@example.com' },
  { id: 'v2', name: 'Budi Hartono', email: 'budi.h@example.com' },
];

// ---------- Helpers ----------
const pad = (n) => String(n).padStart(2, '0');
const hm = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
const rp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
const dt = (s) => new Date(`${s}T00:00:00`);
const fd = (s) => dt(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
const span = (a, b) => Math.round((dt(b) - dt(a)) / 864e5) + 1;
const $ = (q) => document.querySelector(q);
let seq = 0;

function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === false || v == null) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat(Infinity)) {
    if (c === false || c == null) continue;
    el.append(c instanceof Node ? c : String(c));
  }
  return el;
}

function sel(options, value = '') {
  const el = h('select', { id: `f${++seq}` });
  options.forEach(([v, l]) => el.append(h('option', { value: v, selected: String(v) === String(value) }, l)));
  return el;
}

const field = (label, ctrl) => h('div', { class: 'field' }, h('label', { for: ctrl.id }, label), ctrl);
const notice = (msg, kind) => h('p', { class: `note ${kind}`, role: kind === 'err' ? 'alert' : 'status' }, msg);
const badge = (s) => h('span', { class: `badge s-${s.toLowerCase().replace(/\W+/g, '-')}` }, s);
const cities = () => Object.entries(AP).map(([c, n]) => [c, `${n} (${c})`]);
const hours = () => Array.from({ length: 24 }, (_, i) => [i, `${pad(i)}:00`]);
const newRef = () => 'SKY' + Array.from(crypto.getRandomValues(new Uint8Array(3)), (n) => 'ABCDEFGHJKLMNPQRSTUVWXYZ'[n % 24]).join('');

function tbl(heads, rows, caption) {
  return h('div', { class: 'wrap' }, h('table', {},
    h('caption', { class: 'sr' }, caption),
    h('thead', {}, h('tr', {}, heads.map((x) => h('th', { scope: 'col' }, x)))),
    h('tbody', {}, rows.map((r) => h('tr', {}, r.map((c) => h('td', {}, c)))))));
}

// ---------- Flights ----------
const F = [];
for (let d = 1; d <= 14; d++) {
  for (const a of Object.keys(AP)) {
    for (const b of Object.keys(AP)) {
      if (a === b) continue;
      const hp = [...(a + b)].sort((x, y) => x.localeCompare(y)).reduce((s, c) => (s * 31 + c.charCodeAt(0)) % 997, 7);
      [6, 9, 13, 18].forEach((hr, i) => {
        const al = AL[(hp + i + d) % 4];
        const dep = hr * 60 + ((hp + i) % 4) * 15;
        const dur = 60 + (hp % 7) * 20;
        F.push({
          id: `${a}${b}${d}${i}`, from: a, to: b, date: `2026-12-${pad(d)}`, al: al[0],
          code: al[1] + (100 + ((hp * 3 + i * 17) % 800)), dep: hm(dep), arr: hm((dep + dur) % 1440),
          price: Math.round(600 * (1 + (hp % 12) / 6) * al[2] * (1 + ((d + i * 3) % 5) * 0.03)) * 1000,
        });
      });
    }
  }
}
const FM = new Map(F.map((f) => [f.id, f]));

const S = {
  role: 'pengguna',
  tab: 0,
  profile: { nama: '', nik: '', lahir: '', telp: '', email: '' },
  bk: [
    { ref: 'SKY7K2', fid: 'CGKDPS11', pax: 'Rina Wulandari', owner: 'v1', status: 'Confirmed', ok: false },
    { ref: 'SKY3M9', fid: 'SUBKNO52', pax: 'Budi Hartono', owner: 'v2', status: 'Waiting for the payment', ok: false },
    { ref: 'SKY5Q1', fid: 'DPSUPG73', pax: 'Sari Dewi', owner: 'pengguna', status: 'Booked', ok: false },
    { ref: 'SKY9X4', fid: 'KNOCGK90', pax: 'Agus Salim', owner: 'pengguna', status: 'Confirmed', ok: false },
  ],
};

// ---------- Booking widgets ----------
function bookBtn(f, { visitor, owner }) {
  const box = h('span', { class: 'book' });
  const open = () => {
    const ctl = visitor
      ? sel(VIS.map((v) => [v.id, `${v.name} (${v.email})`]))
      : h('input', { id: `f${++seq}`, type: 'text', required: true, placeholder: 'Nama penumpang', 'aria-label': 'Nama penumpang', value: owner === 'member' ? S.profile.nama : '' });
    const submit = (e) => {
      e.preventDefault();
      const v = ctl.value.trim();
      if (!v) return;
      const vis = visitor ? VIS.find((x) => x.id === v) : null;
      const b = { ref: newRef(), fid: f.id, pax: vis ? vis.name : v, owner: vis ? vis.id : owner, status: 'Booked', ok: false };
      S.bk.unshift(b);
      const msg = vis ? `Dipesan untuk ${vis.name}. E-tiket ${b.ref} dikirim ke ${vis.email}.` : `Berhasil. Kode booking ${b.ref}.`;
      box.replaceChildren(notice(msg, 'ok'));
    };
    box.replaceChildren(h('form', { class: 'inline', onsubmit: submit }, ctl, h('button', { class: 'btn primary' }, 'Pesan')));
    ctl.focus();
  };
  return h('button', { type: 'button', class: 'btn', onclick: open }, visitor ? 'Pesan untuk pengunjung' : 'Pesan');
}

function search({ multi, withHours, compare, summary, act }) {
  const from = sel([['', 'Semua asal'], ...cities()]);
  const date = h('input', { id: `f${++seq}`, type: 'date', min: '2026-12-01', max: '2026-12-14', value: '2026-12-01' });
  const to = multi
    ? h('fieldset', { class: 'chips' }, h('legend', {}, 'Tujuan (boleh lebih dari satu)'),
      Object.entries(AP).map(([c, n]) => h('label', { class: 'chip' }, h('input', { type: 'checkbox', value: c }), `${n} (${c})`)))
    : sel([['', 'Semua tujuan'], ...cities()]);
  const h1 = sel(hours(), 0);
  const h2 = sel(hours(), 23);
  const out = h('div', { 'aria-live': 'polite' });

  const go = () => {
    const ds = multi ? [...to.querySelectorAll(':checked')].map((i) => i.value) : [to.value].filter(Boolean);
    if (!date.value) { out.replaceChildren(notice('Pilih tanggal dulu.', 'err')); return; }
    const list = F.filter((f) => (!from.value || f.from === from.value) && (!ds.length || ds.includes(f.to)) && f.date === date.value
      && (!withHours || (Number(f.dep.slice(0, 2)) >= Number(h1.value) && Number(f.dep.slice(0, 2)) <= Number(h2.value))));
    if (!list.length) { out.replaceChildren(notice('Tidak ada penerbangan yang cocok.', 'warn')); return; }
    if (compare || summary) list.sort((a, b) => a.price - b.price);
    const min = list[0].price;
    const parts = [h('h2', {}, `${list.length} penerbangan ditemukan`)];
    if (summary) {
      const g = {};
      list.forEach((f) => { (g[f.to] ??= []).push(f.price); });
      parts.push(tbl(['Tujuan', 'Jumlah penerbangan', 'Harga termurah'],
        Object.entries(g).map(([c, p]) => [`${AP[c]} (${c})`, p.length, rp(Math.min(...p))]), 'Ringkasan per tujuan'));
    }
    const priceCell = (f) => rp(f.price) + (compare ? (f.price === min ? ' · Termurah' : ` · +${rp(f.price - min)}`) : '');
    parts.push(tbl(['Penerbangan', 'Rute', 'Tanggal', 'Berangkat → Tiba', 'Harga', 'Aksi'],
      list.slice(0, 40).map((f) => [`${f.al} ${f.code}`, `${AP[f.from]} → ${AP[f.to]}`, fd(f.date), `${f.dep} → ${f.arr}`, priceCell(f), act(f)]), 'Hasil pencarian'));
    out.replaceChildren(...parts);
  };

  const form = h('form', { class: 'card form', onsubmit: (e) => { e.preventDefault(); go(); } },
    field('Kota asal', from), multi ? to : field('Tujuan', to), field('Tanggal', date),
    withHours && field('Berangkat dari jam', h1), withHours && field('Sampai jam', h2),
    h('button', { class: 'btn primary' }, 'Cari penerbangan'));
  return h('div', {}, form, out);
}

function myBookings(owner) {
  const box = h('div');
  const draw = () => {
    const mine = S.bk.filter((b) => b.owner === owner);
    box.replaceChildren(...(mine.length ? mine.map((b) => {
      const f = FM.get(b.fid);
      return h('article', { class: 'card' },
        h('div', { class: 'row' }, h('strong', {}, b.ref), badge(b.status), b.ok && h('span', { class: 'badge s-confirmed' }, 'Tervalidasi')),
        h('p', {}, `${AP[f.from]} → ${AP[f.to]} · ${fd(f.date)} · ${f.dep}–${f.arr} · ${f.al} ${f.code}`),
        h('p', {}, `Penumpang: ${b.pax} · ${rp(f.price)}`),
        b.status !== 'Cancelled' && h('button', { class: 'btn danger', onclick: () => { b.status = 'Cancelled'; draw(); } }, 'Batalkan pesanan'));
    }) : [notice('Belum ada pesanan.', 'warn')]));
  };
  draw();
  return box;
}

// ---------- US1: HRD ----------
function periodWindow(y, m, d) {
  if (!m) return [new Date(y, 0, 1), new Date(y, 11, 31)];
  if (!d) return [new Date(y, m - 1, 1), new Date(y, m, 0)];
  const x = new Date(y, m - 1, d);
  return x.getMonth() === m - 1 ? [x, x] : null;
}

function viewCuti() {
  const sd = sel([['', 'Semua tanggal'], ...Array.from({ length: 31 }, (_, i) => [i + 1, i + 1])]);
  const sm = sel([['', 'Semua bulan'], ...MONTHS.map((m, i) => [i + 1, m])], 12);
  const sy = sel([2025, 2026, 2027].map((y) => [y, y]), CURRENT_YEAR);
  const out = h('div', { 'aria-live': 'polite' });
  const detail = h('div');

  const showDetail = ([name, dept, leaves]) => {
    const used = leaves.filter((l) => l[2] === 'Disetujui' && l[0].startsWith(String(CURRENT_YEAR))).reduce((s, l) => s + span(l[0], l[1]), 0);
    detail.replaceChildren(h('section', { class: 'card' },
      h('h2', {}, `${name} · ${dept}`),
      h('p', {}, `Jatah ${CURRENT_YEAR}: ${QUOTA} hari · Terpakai: ${used} hari · `, h('strong', {}, `Sisa: ${QUOTA - used} hari`)),
      tbl(['Periode', 'Lama', 'Status'], [...leaves].reverse().map((l) => [`${fd(l[0])} – ${fd(l[1])}`, `${span(l[0], l[1])} hari`, l[2]]), 'Riwayat cuti')));
  };

  const refresh = () => {
    sd.disabled = sm.value === '';
    if (sd.disabled) sd.value = '';
    const win = periodWindow(Number(sy.value), Number(sm.value), Number(sd.value));
    if (!win) { out.replaceChildren(notice('Tanggal tidak valid untuk bulan ini.', 'err')); return; }
    const rows = EMP.flatMap((e) => e[2].filter((l) => dt(l[0]) <= win[1] && dt(l[1]) >= win[0]).map((l) => [e, l]))
      .sort((a, b) => a[1][0].localeCompare(b[1][0]));
    out.replaceChildren(rows.length ? tbl(['Pegawai', 'Periode cuti', 'Lama', 'Status'],
      rows.map(([e, l]) => [h('button', { type: 'button', class: 'link', onclick: () => showDetail(e) }, e[0]), `${fd(l[0])} – ${fd(l[1])}`, `${span(l[0], l[1])} hari`, l[2]]), 'Pengajuan cuti')
      : notice('Tidak ada pengajuan cuti pada periode ini.', 'warn'));
  };
  [sd, sm, sy].forEach((s) => s.addEventListener('change', refresh));
  refresh();
  return h('div', {}, h('div', { class: 'card form' }, field('Tanggal', sd), field('Bulan', sm), field('Tahun', sy)), out, detail);
}

// ---------- US5: profil & validasi ----------
function viewProfil() {
  const fl = [['nama', 'Nama lengkap', 'text'], ['nik', 'No. KTP / paspor', 'text'], ['lahir', 'Tanggal lahir', 'date'], ['telp', 'No. telepon', 'tel'], ['email', 'Email', 'email']];
  const ins = fl.map(([k, , t]) => h('input', { id: `f${++seq}`, type: t, name: k, value: S.profile[k] }));
  const msg = h('div', { 'aria-live': 'polite' });
  const save = (e) => {
    e.preventDefault();
    ins.forEach((i) => { S.profile[i.name] = i.value.trim(); });
    msg.replaceChildren(notice('Data profil disimpan.', 'ok'));
  };
  const open = S.bk.filter((b) => b.owner === 'member' && b.status !== 'Cancelled' && !b.ok);
  const pick = sel(open.map((b) => [b.ref, `${b.ref} – ${b.pax}`]));
  const vmsg = h('div', { 'aria-live': 'polite' });
  const validate = () => {
    const b = open.find((x) => x.ref === pick.value);
    if (!b) { vmsg.replaceChildren(notice('Belum ada tiket untuk divalidasi.', 'warn')); return; }
    if (Object.values(S.profile).some((v) => !v)) {
      vmsg.replaceChildren(notice('Data profil tidak lengkap. Validasi tiket ditolak sampai data profil lengkap.', 'err'));
      return;
    }
    b.ok = true;
    vmsg.replaceChildren(notice(`Tiket ${b.ref} berhasil divalidasi.`, 'ok'));
  };
  return h('div', {},
    h('form', { class: 'card form', onsubmit: save }, ...fl.map(([, l], i) => field(l, ins[i])), h('button', { class: 'btn primary' }, 'Simpan profil')), msg,
    h('section', { class: 'card form' }, open.length ? field('Tiket', pick) : notice('Belum ada tiket untuk divalidasi. Pesan tiket dulu.', 'warn'),
      open.length && h('button', { type: 'button', class: 'btn primary', onclick: validate }, 'Validasi tiket')), vmsg);
}

// ---------- US7-9: manajer travel ----------
function viewStatus() {
  const st = sel([['', 'Semua'], ...STATUSES.map((s) => [s, s])]);
  const out = h('div', { 'aria-live': 'polite' });
  const draw = () => {
    const l = S.bk.filter((b) => !st.value || b.status === st.value);
    out.replaceChildren(h('p', {}, `${l.length} booking`), tbl(['Kode', 'Penumpang', 'Rute', 'Tanggal', 'Status'],
      l.map((b) => { const f = FM.get(b.fid); return [b.ref, b.pax, `${f.from} → ${f.to}`, fd(f.date), badge(b.status)]; }), 'Status booking'));
  };
  st.addEventListener('change', draw);
  draw();
  return h('div', {}, h('div', { class: 'card form' }, field('Filter status', st)), out);
}

function viewPesankan() {
  const vs = sel(VIS.map((v) => [v.id, `${v.name} (${v.email})`]));
  const box = h('div');
  const sync = () => box.replaceChildren(myBookings(vs.value));
  vs.addEventListener('change', sync);
  sync();
  return h('div', {}, search({ act: (f) => bookBtn(f, { visitor: true }) }),
    h('h2', {}, 'Akun pengunjung'), h('div', { class: 'card form' }, field('Pengunjung', vs)), box);
}

function viewOtorisasi() {
  const inp = h('input', { id: `f${++seq}`, type: 'text', maxlength: 6, autocomplete: 'off', required: true, placeholder: 'mis. SKY7K2' });
  const out = h('div', { 'aria-live': 'polite' });
  const submit = (e) => {
    e.preventDefault();
    const b = S.bk.find((x) => x.ref === inp.value.trim().toUpperCase());
    if (!b) {
      out.replaceChildren(notice('Kode booking reference tidak sesuai. Silakan ulangi input kode booking reference.', 'err'));
      inp.select();
      return;
    }
    const f = FM.get(b.fid);
    out.replaceChildren(h('article', { class: 'card' }, h('div', { class: 'row' }, h('strong', {}, b.ref), badge(b.status)),
      h('p', {}, `${b.pax} · ${AP[f.from]} → ${AP[f.to]} · ${fd(f.date)} · ${f.dep}`), notice('Tiket teroutorisasi.', 'ok')));
  };
  return h('div', {}, h('form', { class: 'card form', onsubmit: submit }, field('Kode booking reference', inp), h('button', { class: 'btn primary' }, 'Otorisasi')), out);
}

// ---------- Shell ----------
const R = {
  hrd: ['HRD Manajer', [['Cuti Pegawai', viewCuti]]],
  pengguna: ['Pengguna', [
    ['Cari & Pesan Tiket', () => search({ multi: true, act: (f) => bookBtn(f, { owner: 'pengguna' }) })],
    ['Pesanan Saya', () => myBookings('pengguna')]]],
  member: ['Member Frequent Traveller', [
    ['Multi-Destinasi', () => search({ multi: true, summary: true, act: (f) => bookBtn(f, { owner: 'member' }) })],
    ['Bandingkan Penerbangan', () => search({ withHours: true, compare: true, act: (f) => bookBtn(f, { owner: 'member' }) })],
    ['Profil & Validasi', viewProfil],
    ['Tiket Saya', () => myBookings('member')]]],
  manajer: ['Manajer Travel', [
    ['Status Booking', viewStatus], ['Pesan untuk Pengunjung', viewPesankan], ['Otorisasi Tiket', viewOtorisasi]]],
};

function render() {
  const tabs = R[S.role][1];
  $('#tabs').replaceChildren(...tabs.map(([l], i) =>
    h('button', { type: 'button', class: 'tab', 'aria-current': i === S.tab ? 'page' : null, onclick: () => { S.tab = i; render(); } }, l)));
  $('#app').replaceChildren(h('h1', {}, tabs[S.tab][0]), tabs[S.tab][1]());
}

$('#role').replaceChildren(...Object.entries(R).map(([k, [l]]) => h('option', { value: k, selected: k === S.role }, l)));
$('#role').addEventListener('change', (e) => { S.role = e.target.value; S.tab = 0; render(); });
render();
