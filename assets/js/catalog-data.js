/* ============================================================================
 * 3dNakedEye — catalog-data.js
 * The product catalogue, transcribed from the manufacturer's own documents:
 *
 *   • the catalogue workbook
 *         → series, LED counts, resolutions, sizes, families, matrix builds,
 *           accessories, the centre-to-centre spacing table
 *   • the price list (newer)
 *         → input voltage, power rating, net weight, packing and carton data,
 *           the double-sided light-box signage and HDMI lines, the 300 cm
 *           outdoor unit, the cabinet matrix builds and two extra quality rows
 *
 * Where the two documents disagree the newer price list wins, because the
 * catalogue has to publish one figure per cell and the price list is the later
 * revision. The changes are listed in _extract/price-coeus/reconciliation.md.
 *
 * Prices are NOT here. The supplier's price list is internal: not one of its
 * price columns reaches a file that ships with the site (see _verify/make-zip.cjs,
 * which packages ai-ooh-marketplace only, and the price guard in site-check.cjs).
 *
 * Σ shape:  LG_SERIES      — one entry per series, with its model table
 *           LG_ADVANTAGES  — the engineering-vs-compact comparison
 *           LG_FAMILIES    — the product-family tiles
 *           LG_MATRIX      — matrix wall builds
 *           LG_ACCESSORIES — cabinets, stands, covers
 *           LG_DIMENSIONS  — the splicing/spacing table
 *           LG_MODEL_DIMS  — model → size class
 *           LG_CLOUD       — the cloud manual's own menu tree
 * ==========================================================================*/

/* ---------- series and their models --------------------------------------- */
/* cols: the models, in the order the supplier lists them.
 * rows: [ spec label key, ...one value per model ]
 * '—' means the document does not state it; nothing here is estimated.      */
window.LG_SERIES = [
  {
    id: 'p', name: 'cat.s_p', tagline: 'cat.s_p_tag', tier: 'pro',
    cols: ['P46', 'P65', 'P80s', 'P100', 'A65S', 'A150', 'A180'],
    note: 'cat.s_p_note',
    rows: [
      ['cat.row_led', '720', '1280', '1280', '1600', '1024', '2880', '2512'],
      ['cat.row_res', '720×720', '1280×1280', '1280×1280', '1600×1600', '1024×1024', '2048×2880', '2048×2512'],
      ['cat.row_size', '46×46×7.5 cm', '65×65×4.7 cm', '77×77×5 cm', '100×100×8.7 cm', '65×65×5.5 cm', '150×150×14 cm', '180×180×14 cm'],
      ['cat.row_power', '24V 3A', '24V 3A', '24V 3A', '32V', '24V', '24V 20A', '24V 20A'],
      ['cat.row_watt', '45 W', '48 W', '48 W', '60 W', '144 W', '400 W', '400 W'],
      ['cat.row_bright', '—', '—', '—', '—', '7500 cd/m²', '—', '—'],
      ['cat.row_store', '16 GB', '16 GB', '16 GB', '16 GB', '16 GB', '16 GB', '16 GB'],
      ['cat.row_control', 'cat.ctl_cloud', 'cat.ctl_cloud', 'cat.ctl_cloud', 'cat.ctl_cloud', 'cat.ctl_cloud', 'cat.ctl_cloud', 'cat.ctl_cloud'],
      ['cat.row_audio', '✓', '✓', '✓', '✓', '✓', '✓', '✓'],
      ['cat.row_net', '0.54 kg', '0.71 kg', '0.92 kg', '1.2 kg', '1.38 kg', '4.8 kg', '5 kg'],
      ['cat.row_pack', '40×20×11 cm · 1.7 kg', '40×20×11 cm · 1.7 kg', '40×20×11 cm · 1.7 kg', '40×20×11 cm · 1.7 kg', '40×23×8 cm', '84×49×27 cm · 15 kg', '103×48×26 cm · 17.8 kg'],
      ['cat.row_ctn', '10 pcs · 55.5×53.7×42 cm · 15.7 kg', '10 pcs · 57×45×45 cm · 17 kg', '10 pcs · 63×45×44 cm · 17 kg', '4 pcs · 59.5×48.5×34.5 cm · 11.6 kg', '10 pcs', '—', '—']
    ]
  },
  {
    id: 'd', name: 'cat.s_d', tagline: 'cat.s_d_tag', tier: 'value',
    cols: ['D45', 'D52U', 'D56U', 'D60U', 'D65U', 'D80', 'D100'],
    note: 'cat.s_d_note',
    rows: [
      ['cat.row_led', '512', '1024', '1104', '1184', '1280', '928', '1184'],
      ['cat.row_res', '2000×512', '1600×1024', '1600×1104', '1600×1184', '2000×1280', '1600×928', '1600×1184'],
      ['cat.row_size', '45×9.5×7 cm', '52×52×8 cm', '56×56×8 cm', '60×60×8 cm', '65×65×8 cm', '78×78×8 cm', '99×99×9 cm'],
      ['cat.row_power', '24V 2A', '24V 3A', '24V 3A', '24V 3A', '24V 4A', '24V 4A', '24V 5A'],
      ['cat.row_watt', '48 W', '72 W', '72 W', '72 W', '96 W', '96 W', '120 W'],
      ['cat.row_bright', '2500 cd/m²', '2500 cd/m²', '2500 cd/m²', '2500 cd/m²', '2800 cd/m²', '2500 cd/m²', '2600 cd/m²'],
      ['cat.row_store', '4 GB', '8 GB', '8 GB', '8 GB', '8 GB', '8 GB', '8 GB'],
      ['cat.row_control', 'cat.ctl_tf_app', 'cat.ctl_app', 'cat.ctl_app', 'cat.ctl_app', 'cat.ctl_app', 'cat.ctl_app', 'cat.ctl_app'],
      ['cat.row_audio', '✓', '—', '—', '✓', '✓', '✓', '✓'],
      ['cat.row_net', '0.64 kg', '0.64 kg', '0.64 kg', '0.64 kg', '0.62 kg', '0.69 kg', '0.86 kg'],
      ['cat.row_pack', '40×20×11 cm · 1.7 kg', '40×20×11 cm · 1.7 kg', '40×20×11 cm · 1.7 kg', '40×20×11 cm · 1.7 kg', '40×20×11 cm · 1.7 kg', '45×20×10 cm · 1.6 kg', '55×20×12 cm · 2.2 kg'],
      ['cat.row_ctn', '14 pcs · 55×40×41 cm · 14 kg', '10 pcs · 52.5×40×41 cm · 15 kg', '10 pcs · 52.5×40×41 cm · 15 kg', '10 pcs · 52.5×40×41 cm · 15.3 kg', '10 pcs · 52×40×41 cm · 15.21 kg', '10 pcs · 52.5×46.5×40.5 cm · 16.37 kg', '4 pcs · 57×47×23 cm · 10 kg']
    ]
  },
  {
    id: 'c', name: 'cat.s_c', tagline: 'cat.s_c_tag', tier: 'entry',
    cols: ['C42', 'C42 desktop', 'C50', 'C60', 'C65'],
    note: 'cat.s_c_note',
    rows: [
      ['cat.row_led', '224', '224', '510', '640', '640'],
      ['cat.row_res', '450×224', '450×224', '2000×510', '2500×640', '2500×640'],
      ['cat.row_size', '42×6×3.3 cm', '42×6×3.3 cm', '50×7.6×5 cm', '60×7.6×5.5 cm', '65×7.6×5.5 cm'],
      ['cat.row_power', '12V 2A', '12V 2A', '24V 3A', '24V 3A', '24V 3A'],
      ['cat.row_watt', '15 W', '15 W', '40 W', '40–65 W', '40–65 W'],
      ['cat.row_store', '4 GB', '4 GB', '4 GB', '4 GB', '4 GB'],
      ['cat.row_control', 'cat.ctl_tf_app', 'cat.ctl_tf_app', 'cat.ctl_tf_app', 'cat.ctl_tf_app', 'cat.ctl_tf_app'],
      ['cat.row_net', '0.21 kg', '0.21 kg', '0.45 kg', '0.45 kg', '0.5 kg'],
      ['cat.row_pack', '25.9×13.5×6.2 cm · 0.42 kg', '25.9×13.5×6.2 cm · 0.42 kg', '34×21×6 cm · 0.76 kg', '34×21×6 cm · 0.91 kg', '37.5×25.5×6 cm · 1 kg'],
      ['cat.row_ctn', '48 pcs · 53×41×53.5 cm · 21.17 kg', '48 pcs · 53×41×53.5 cm · 21.17 kg', '25 pcs · 68×48×40 cm · 28 kg', '25 pcs · 68×48×40 cm · 30 kg', '15 pcs · 53.5×53.5×40 cm']
    ]
  },
  {
    id: 'lightbox', name: 'cat.s_lb', tagline: 'cat.s_lb_tag', tier: 'pro',
    cols: ['A42 DS', 'C42 DS', 'P65 DS', '65 cm pole case'],
    note: 'cat.s_lb_note',
    rows: [
      ['cat.row_led', '384', '224', '1280', '1280'],
      ['cat.row_res', '1024×384', '450×224', '1280×1280', '1280×1280'],
      ['cat.row_size', '52×60×16 cm', '55×53×13 cm', '65×65×4.7 cm', '86×73×14 cm'],
      ['cat.row_power', '12V 2A', '12V 2A', '24V 3A', '24V 3A'],
      ['cat.row_watt', '24 W', '15 W', '48 W', '48 W'],
      ['cat.row_bright', 'High', 'Low', 'Super high', 'Super high'],
      ['cat.row_store', '16 GB', '4 GB', '16 GB', '16 GB'],
      ['cat.row_control', 'cat.ctl_app', 'cat.ctl_tf_app', 'cat.ctl_cloud', 'cat.ctl_cloud'],
      ['cat.row_audio', '—', '—', '✓', '✓'],
      ['cat.row_net', '0.21 kg', '0.21 kg', '—', '—'],
      ['cat.row_pack', '54×62×20 cm · 6.3 kg', '60×57×17 cm · 5 kg', '54×62×20 cm · 6.3 kg', '90×78×32 cm · 14 kg']
    ]
  },
  {
    id: 'hdmi', name: 'cat.s_hdmi', tagline: 'cat.s_hdmi_tag', tier: 'pro',
    cols: ['S100', 'A150 HDMI', 'A180 HDMI'],
    note: 'cat.s_hdmi_note',
    rows: [
      ['cat.row_led', '1600', '2880', '2512'],
      ['cat.row_res', '1536×1536', '2048×2880', '2048×2512'],
      ['cat.row_size', '100×100×14 cm', '150×150×14 cm', '180×180×14 cm'],
      ['cat.row_power', '32V 4.5A', '24V 20A', '24V 20A'],
      ['cat.row_watt', '80 W', '320 W', '400 W'],
      ['cat.row_bright', 'Super high', 'Super high', 'Super high'],
      ['cat.row_store', '—', '—', '—'],
      ['cat.row_control', 'cat.ctl_hdmi', 'cat.ctl_hdmi_realtime', 'cat.ctl_hdmi_realtime'],
      ['cat.row_audio', '✓', '✓', '—'],
      ['cat.row_net', '0.21 kg', '5.42 kg', '5.62 kg'],
      ['cat.row_pack', '54×62×20 cm · 7 kg', '84×49×27 cm · 15.5 kg', '103×48×26 cm · 17.8 kg']
    ]
  },
  {
    id: 'outdoor', name: 'cat.s_out', tagline: 'cat.s_out_tag', tier: 'outdoor',
    cols: ['A80', 'A120', 'A300'],
    note: 'cat.s_out_note',
    rows: [
      ['cat.row_size', '77×77×11 cm', '120 cm class', '280×280×17 cm'],
      ['cat.row_res', '896×896', '1280×1288', '12888×12888'],
      ['cat.row_led', '896', '1288', '12288'],
      ['cat.row_power', '26V 5A', '—', '48V 32A'],
      ['cat.row_watt', '48 W', '—', '1500 W'],
      ['cat.row_store', '16 GB', '—', '16 GB'],
      ['cat.row_protect', 'IP65', 'IP65', '—'],
      ['cat.row_control', 'cat.ctl_cloud', 'cat.ctl_cloud', 'cat.ctl_cloud'],
      ['cat.row_audio', '✓', '✓', '✓'],
      ['cat.row_net', '1.55 kg', '—', '24.14 kg'],
      ['cat.row_pack', '60.7×61.5×14 cm · 3.07 kg', '—', '150×65×25.5 cm · 50.7 kg'],
      ['cat.row_ctn', '4 pcs · 63×57×62.5 cm · 18.3 kg', '—', '—']
    ]
  },
  {
    id: 'consumer', name: 'cat.s_gift', tagline: 'cat.s_gift_tag', tier: 'gift',
    cols: ['P20s', 'P30s', 'P30s desktop', 'P20s bladeless', 'P20s ad bag', 'Holo stick', 'P20S audio', 'Lyrics speaker'],
    note: 'cat.s_gift_note',
    rows: [
      ['cat.row_led', '256', '384', '384', '256', '256', '96', '256', '1024'],
      ['cat.row_res', '298×298', '1024×768', '1024×1024', '298×298', '298×298', '96×96', '—', '1024×1024'],
      ['cat.row_size', '18.5 cm', '28 cm', '33×30×8 cm', 'Ø18 cm', '18.5 cm', '37.91 cm', '18.5 cm', '41×20.6×30.2 cm'],
      ['cat.row_power', '5V 3A', '5V 3A', '12V 1.5A / 5V 3A', '100–240 V', '5V 3A', '4.5V 2A', '5V 3A', '100–240 V 50/60 Hz'],
      ['cat.row_watt', '15 W', '15 W', '15–18 W', '35 W', '15 W', '7 W', '10 W', '35 W'],
      ['cat.row_store', '4 GB', '8 GB', '4 GB', '4 GB', '4 GB', '4 GB', '8 GB', '8 GB eMMC'],
      ['cat.row_control', 'cat.ctl_app_pc', 'cat.ctl_app_win', 'cat.ctl_app_pc', 'cat.ctl_app_pc', 'cat.ctl_app_pc', 'cat.ctl_tf', 'cat.ctl_app_win', 'cat.ctl_bt'],
      ['cat.row_audio', '✓', '✓', '—', '—', '—', '—', '✓', '✓'],
      ['cat.row_net', '1.35 kg', '0.13 kg', '—', '2.72 kg', '0.74 kg', '0.08 kg', '0.91 kg', '6 kg'],
      ['cat.row_pack', '15×25×30 cm · 1.35 kg', '72 cm carton', '—', '39.2×41.5×25 cm · 3.5 kg', '30×40×10 cm · 1 kg', '40.6×7.2×4.3 cm · 0.19 kg', '26.4×33×14 cm · 1.25 kg', '51×39×28 cm · 7.5 kg'],
      ['cat.row_ctn', '12 pcs · 64×48×52 cm · 17.52 kg', '—', '—', '10 pcs · 62×41×40 cm · 8 kg', '—', '43×44×39 cm · 14 kg', '73×68×27.5 cm · 14.25 kg', '—']
    ]
  }
];

/* ---------- engineering vs compact ---------------------------------------
 * The supplier's own comparison sheet, plus the two quality points from the
 * price list's recommendation page (LED pitch and brushless-motor life).     */
window.LG_ADVANTAGES = [
  { id: 'housing', p: 'cat.a1_p', o: 'cat.a1_o' },
  { id: 'cert', p: 'cat.a2_p', o: 'cat.a2_o' },
  { id: 'led', p: 'cat.a3_p', o: 'cat.a3_o' },
  { id: 'pitch', p: 'cat.a12_p', o: 'cat.a12_o' },
  { id: 'control', p: 'cat.a4_p', o: 'cat.a4_o' },
  { id: 'matrix', p: 'cat.a5_p', o: 'cat.a5_o' },
  { id: 'seamless', p: 'cat.a6_p', o: 'cat.a6_o' },
  { id: 'remote', p: 'cat.a7_p', o: 'cat.a7_o' },
  { id: 'coat', p: 'cat.a8_p', o: 'cat.a8_o' },
  { id: 'system', p: 'cat.a9_p', o: 'cat.a9_o' },
  { id: 'storage', p: 'cat.a10_p', o: 'cat.a10_o' },
  { id: 'motor', p: 'cat.a11_p', o: 'cat.a11_o' },
  { id: 'motorlife', p: 'cat.a13_p', o: 'cat.a13_o' }
];

/* ---------- product families -------------------------------------------- */
window.LG_FAMILIES = [
  { id: 'desktop', i18n: 'cat.f_desktop', desc: 'cat.f_desktop_d', href: 'catalog.html#series', icon: '⌂' },
  { id: 'consumer', i18n: 'cat.f_consumer', desc: 'cat.f_consumer_d', href: 'catalog.html#series', icon: '✦' },
  { id: 'commercial', i18n: 'cat.f_commercial', desc: 'cat.f_commercial_d', href: 'booth.html', icon: '▤' },
  { id: 'lightbox', i18n: 'cat.f_lightbox', desc: 'cat.f_lightbox_d', href: 'catalog.html#series-lightbox', icon: '▥' },
  { id: 'hdmi', i18n: 'cat.f_hdmi', desc: 'cat.f_hdmi_d', href: 'catalog.html#series-hdmi', icon: '⇥' },
  { id: 'matrix', i18n: 'cat.f_matrix', desc: 'cat.f_matrix_d', href: 'solutions.html#displays', icon: '▦' },
  { id: 'cabinet', i18n: 'cat.f_cabinet', desc: 'cat.f_cabinet_d', href: 'technology.html#products', icon: '▢' },
  { id: 'outdoor', i18n: 'cat.f_outdoor', desc: 'cat.f_outdoor_d', href: 'catalog.html#series-outdoor', icon: '⛨' },
  { id: 'garden', i18n: 'cat.f_garden', desc: 'cat.f_garden_d', href: 'catalog.html#series', icon: '❀' },
  { id: 'accessories', i18n: 'cat.f_acc', desc: 'cat.f_acc_d', href: 'catalog.html#accessories', icon: '⚒' }
];

/* ---------- matrix builds ------------------------------------------------
 * The physical builds the supplier quotes, from the catalogue (fused pixel
 * counts) and the price list (the cabinet and wall-frame versions).          */
window.LG_MATRIX = [
  { id: 'm13', name: 'cat.m_13', size: '180×65×4.7 cm', res: '2304×2304', units: '65 cm × 3' },
  { id: 'm13b', name: 'cat.m_13b', size: '180×65×4.7 cm', res: '3840×3840', units: '65 cm × 3' },
  { id: 'm23', name: 'cat.m_23', size: '200×140×4.7 cm', res: '4608×4608', units: '65 cm × 6 · 2.8 m²' },
  { id: 'm33', name: 'cat.m_33', size: '200×160×4.7 cm', res: '6912×6912', units: '65 cm × 9 · 3.2 m²' },
  { id: 'm2cab', name: 'cat.m_2cab', size: '3 m² cabinet', res: '—', units: 'cat.m_2cab_u' },
  { id: 'm3wall', name: 'cat.m_3wall', size: '4 m² / 43 sq.ft', res: '—', units: 'cat.m_3wall_u' },
  { id: 'm3floor', name: 'cat.m_3floor', size: '4 m² / 43 sq.ft', res: '—', units: 'cat.m_3floor_u' },
  { id: 'm47wall', name: 'cat.m_47wall', size: '10 m² / 110 sq.ft', res: '—', units: 'cat.m_47wall_u' },
  { id: 'm47floor', name: 'cat.m_47floor', size: '10 m² / 110 sq.ft', res: '—', units: 'cat.m_47floor_u' },
  { id: 'cyl', name: 'cat.m_cyl', size: 'Φ72 × 188 cm', res: '—', units: 'cat.m_cyl_u' },
  { id: 'semi', name: 'cat.m_semi', size: '76×50×192 cm', res: '—', units: 'cat.m_semi_u' },
  { id: 'rect', name: 'cat.m_rect', size: '195×85×60 cm', res: '—', units: 'cat.m_rect_u' },
  { id: 'rect80', name: 'cat.m_rect80', size: '216×90×55 cm', res: '—', units: 'cat.m_rect80_u' }
];

window.LG_ACCESSORIES = [
  { id: 'cube', i18n: 'cat.acc_cube', note: 'cat.acc_cube_n' },
  { id: 'lightbox', i18n: 'cat.acc_lightbox', note: 'cat.acc_lightbox_n' },
  { id: 'lshape', i18n: 'cat.acc_lshape', note: 'cat.acc_lshape_n' },
  { id: 'rshape', i18n: 'cat.acc_rshape', note: 'cat.acc_rshape_n' },
  { id: 'rect', i18n: 'cat.acc_rect', note: 'cat.acc_rect_n' },
  { id: 'cylinder', i18n: 'cat.acc_cylinder', note: 'cat.acc_cylinder_n' },
  { id: 'acrylic', i18n: 'cat.acc_acrylic', note: 'cat.acc_acrylic_n' },
  { id: 'pole', i18n: 'cat.acc_pole', note: 'cat.acc_pole_n' },
  { id: 'stand', i18n: 'cat.acc_stand', note: 'cat.acc_stand_n' },
  { id: 'hanger', i18n: 'cat.acc_hanger', note: 'cat.acc_hanger_n' },
  { id: 'wallbox', i18n: 'cat.acc_wallbox', note: 'cat.acc_wallbox_n' },
  { id: 'blade', i18n: 'cat.acc_blade', note: 'cat.acc_blade_n' }
];

/* ---------- the manufacturer's splicing table ---------------------------
 * From the supplier's dimension-calculation workbook: for each display size,
 * the display itself, the recommended centre-to-centre spacing when several
 * units are spliced into one image, and the per-unit wattage.              */
window.LG_DIMENSIONS = [
  { id: '56', label: '56 cm', displayM: 0.56, spacingM: 0.400, px: '—', watts: '—' },
  { id: '65', label: '65 cm', displayM: 0.65, spacingM: 0.464, px: '1280×1280', watts: '48 W' },
  { id: '80', label: '80 cm', displayM: 0.77, spacingM: 0.550, px: '1280×1280', watts: '60 W' },
  { id: '100', label: '100 cm', displayM: 1.00, spacingM: 0.710, px: '1600×1600', watts: '144 W' }
];

/* Model -> the dimension row used by the calculator. Only the fan sizes the
 * supplier's calculation workbook covers get a class; the light-box housings,
 * the HDMI units and the 150/180 cm models are quoted case by case. */
window.LG_MODEL_DIMS = {
  'P46': '56', 'D45': '56', 'C42': '56', 'C50': '56',
  'P65': '65', 'A65S': '65', 'D52U': '65', 'D56U': '65', 'D60U': '65', 'D65U': '65', 'C60': '65', 'C65': '65',
  'P80s': '80', 'D80': '80', 'A80': '80',
  'P100': '100', 'D100': '100', 'A120': '100', 'A150': '100', 'A180': '100'
};

/* ---------- cloud platform, transcribed from the operation manual ---------
 * The manual's own section tree, in its own order. */
window.LG_CLOUD = [
  { id: 'start', i18n: 'cloud.s1', items: ['cloud.s1_1', 'cloud.s1_2'] },
  { id: 'home', i18n: 'cloud.s2', items: [] },
  { id: 'account', i18n: 'cloud.s3', items: ['cloud.s3_1', 'cloud.s3_2'] },
  {
    id: 'devices', i18n: 'cloud.s4', items: [
      'cloud.s4_1', 'cloud.s4_2', 'cloud.s4_3', 'cloud.s4_4', 'cloud.s4_5', 'cloud.s4_6',
      'cloud.s4_7', 'cloud.s4_8', 'cloud.s4_9', 'cloud.s4_10', 'cloud.s4_11', 'cloud.s4_12'
    ]
  },
  {
    id: 'console', i18n: 'cloud.s5', items: [
      'cloud.s5_1', 'cloud.s5_2', 'cloud.s5_3', 'cloud.s5_4', 'cloud.s5_5', 'cloud.s5_6'
    ]
  },
  { id: 'grouping', i18n: 'cloud.s6', items: ['cloud.s6_1', 'cloud.s6_2'] },
  {
    id: 'matrix', i18n: 'cloud.s7', items: [
      'cloud.s7_1', 'cloud.s7_2', 'cloud.s7_3', 'cloud.s7_4', 'cloud.s7_5', 'cloud.s7_6', 'cloud.s7_7'
    ]
  },
  { id: 'videogroup', i18n: 'cloud.s8', items: ['cloud.s8_1', 'cloud.s8_2', 'cloud.s8_3'] },
  { id: 'videolist', i18n: 'cloud.s9', items: ['cloud.s9_1', 'cloud.s9_2', 'cloud.s9_3', 'cloud.s9_4', 'cloud.s9_5'] },
  { id: 'matrixvideo', i18n: 'cloud.s10', items: ['cloud.s10_1', 'cloud.s10_2', 'cloud.s10_3', 'cloud.s10_4', 'cloud.s10_5'] },
  { id: 'tasks', i18n: 'cloud.s11', items: ['cloud.s11_1', 'cloud.s11_2', 'cloud.s11_3', 'cloud.s11_4', 'cloud.s11_5'] }
];
