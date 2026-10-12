/* ============================================================================
 * 3dNakedEye — nav-data.js
 * The site map: the mega menu, and the spec for the nine structure pages.
 *
 * The information architecture follows the shape the immersive-display
 * category leaders use — solutions grouped by capability, an industries menu,
 * dedicated event / mobile / booth / OOH pages, a technology menu, company and
 * partnership — because that is how buyers in this category look for things.
 * Every label, description and product name here is ours; no third-party
 * product name is used anywhere in the site.
 *
 * Item shape:  { i18n, desc, href, icon }
 * Menu shape:  { columns:[{ title, items:[…] }], featured:{ label, desc, href, icon } }
 * ==========================================================================*/
window.LG_NAV = [
  {
    id: 'solutions', label: 'nav.solutions', href: 'solutions.html',
    columns: [
      {
        title: 'nav.col_displays',
        items: [
          { i18n: 'sol.fan28', desc: 'sol.fan28_d', href: 'marketplace.html?device=holo_p30s', icon: '◉' },
          { i18n: 'sol.fan65', desc: 'sol.fan65_d', href: 'marketplace.html?device=holo_p65yd', icon: '◎' },
          { i18n: 'sol.wall', desc: 'sol.wall_d', href: 'marketplace.html?device=ooh_75w', icon: '▭' },
          { i18n: 'sol.prize', desc: 'sol.prize_d', href: 'contact.html?interest=event', icon: '✦' }
        ]
      },
      {
        title: 'nav.col_interactive',
        items: [
          { i18n: 'sol.presenter', desc: 'sol.presenter_d', href: 'solutions.html#presenter', icon: '☺' },
          { i18n: 'sol.discover', desc: 'sol.discover_d', href: 'solutions.html#discover', icon: '⌕' },
          { i18n: 'sol.live', desc: 'sol.live_d', href: 'solutions.html#live', icon: '◍' },
          { i18n: 'nav.holobox', desc: 'hb.lede_short', href: 'holobox.html', icon: '⬒' },
          { i18n: 'sol.library', desc: 'sol.library_d', href: 'solutions.html#library', icon: '▤' }
        ]
      },
      {
        title: 'nav.col_content',
        items: [
          { i18n: 'sol.studio', desc: 'sol.studio_d', href: 'studio.html', icon: '✧' },
          { i18n: 'sol.convert', desc: 'sol.convert_d', href: 'preview.html', icon: '⇪' },
          { i18n: 'sol.model', desc: 'sol.model_d', href: 'studio.html', icon: '⬡' },
          { i18n: 'sol.managed', desc: 'sol.managed_d', href: 'contact.html?interest=content_production', icon: '☰' }
        ]
      }
    ],
    featured: { label: 'mg.sol_featured', desc: 'mg.sol_featured_d', href: 'solutions.html', icon: '◆' }
  },
  {
    id: 'industries', label: 'nav.industries', href: 'industries.html',
    columns: [
      {
        title: 'nav.col_industries',
        items: [
          { i18n: 'ind.industries', desc: 'ind.industries_d', href: 'industries.html', icon: '⌗' },
          { i18n: 'ind.usecases', desc: 'ind.usecases_d', href: 'industries.html#use-cases', icon: '☰' },
          { i18n: 'ind.applications', desc: 'ind.applications_d', href: 'industries.html#applications', icon: '◎' },
          { i18n: 'ind.resources', desc: 'ind.resources_d', href: 'industries.html#resources', icon: '▤' }
        ]
      },
      {
        title: 'nav.col_sectors',
        items: [
          { i18n: 'ind.retail', href: 'industries.html#retail', icon: '⌂' },
          { i18n: 'ind.automotive', href: 'industries.html#automotive', icon: '⛃' },
          { i18n: 'ind.hospitality', href: 'industries.html#hospitality', icon: '✦' },
          { i18n: 'ind.healthcare', href: 'industries.html#healthcare', icon: '✚' },
          { i18n: 'ind.education', href: 'industries.html#education', icon: '✎' },
          { i18n: 'ind.dooh', href: 'ooh.html', icon: '▭' },
          { i18n: 'ind.events', href: 'events.html', icon: '✧' }
        ]
      }
    ],
    featured: { label: 'mg.ind_featured', desc: 'mg.ind_featured_d', href: 'industries.html#use-cases', icon: '◫' }
  },
  {
    id: 'events', label: 'nav.events', href: 'events.html',
    columns: [
      {
        title: 'nav.col_event_types',
        items: [
          { i18n: 'evt.launch', desc: 'evt.launch_d', href: 'events.html#launches', icon: '◆' },
          { i18n: 'evt.expo', desc: 'evt.expo_d', href: 'events.html#expos', icon: '▤' },
          { i18n: 'evt.conference', desc: 'evt.conference_d', href: 'events.html#conferences', icon: '☺' },
          { i18n: 'evt.activation', desc: 'evt.activation_d', href: 'events.html#activations', icon: '✦' },
          { i18n: 'evt.private', desc: 'evt.private_d', href: 'events.html#private', icon: '❖' },
          { i18n: 'evt.festival', desc: 'evt.festival_d', href: 'events.html#festivals', icon: '♪' }
        ]
      },
      {
        title: 'nav.col_event_kit',
        items: [
          { i18n: 'mg.kit_units', desc: 'mg.kit_units_d', href: 'events.html#packages', icon: '◎' },
          { i18n: 'mg.kit_content', desc: 'mg.kit_content_d', href: 'studio.html', icon: '✧' },
          { i18n: 'mg.kit_crew', desc: 'mg.kit_crew_d', href: 'events.html#delivery', icon: '☰' },
          { i18n: 'nav.mobile_unit', desc: 'mu.lede', href: 'mobile-unit.html', icon: '⛟' },
          { i18n: 'nav.booth', desc: 'bt.lede', href: 'booth.html', icon: '▢' }
        ]
      }
    ],
    featured: { label: 'mg.evt_featured', desc: 'mg.evt_featured_d', href: 'events.html#packages', icon: '✷' }
  },
  {
    id: 'mobile', label: 'nav.mobile_unit', href: 'mobile-unit.html',
    columns: [
      {
        title: 'nav.col_mobile',
        items: [
          { i18n: 'mu.inside', desc: 'mu.inside_d', href: 'mobile-unit.html#inside', icon: '⛟' },
          { i18n: 'mu.route', desc: 'mu.route_d', href: 'mobile-unit.html#route', icon: '⌖' },
          { i18n: 'mu.power', desc: 'mu.power_d', href: 'mobile-unit.html#specs', icon: '⚡' },
          { i18n: 'mu.crew', desc: 'mu.crew_d', href: 'mobile-unit.html#specs', icon: '☺' }
        ]
      },
      {
        title: 'nav.col_event_kit',
        items: [
          { i18n: 'nav.events', desc: 'evt.lede', href: 'events.html', icon: '✧' },
          { i18n: 'nav.booth', desc: 'bt.lede', href: 'booth.html', icon: '▢' },
          { i18n: 'nav.ooh', desc: 'ooh.lede', href: 'ooh.html', icon: '▭' }
        ]
      }
    ]
  },
  {
    id: 'booth', label: 'nav.booth', href: 'booth.html',
    columns: [
      {
        title: 'nav.col_booth',
        items: [
          { i18n: 'nav.holobox', desc: 'hb.lede_short', href: 'holobox.html', icon: '⬒' },
          { i18n: 'bt.sizes', desc: 'bt.sizes_d', href: 'booth.html#sizes', icon: '▢' },
          { i18n: 'bt.interactive', desc: 'bt.interactive_d', href: 'booth.html#interactive', icon: '⌕' },
          { i18n: 'bt.leads', desc: 'bt.leads_d', href: 'booth.html#leads', icon: '▤' },
          { i18n: 'bt.logistics', desc: 'bt.logistics_d', href: 'booth.html#logistics', icon: '☰' }
        ]
      },
      {
        title: 'nav.col_event_kit',
        items: [
          { i18n: 'nav.events', desc: 'evt.lede', href: 'events.html', icon: '✧' },
          { i18n: 'nav.mobile_unit', desc: 'mu.lede', href: 'mobile-unit.html', icon: '⛟' },
          { i18n: 'nav.studio', desc: 'sol.studio_d', href: 'studio.html', icon: '✧' }
        ]
      }
    ]
  },
  {
    id: 'ooh', label: 'nav.ooh', href: 'ooh.html',
    columns: [
      {
        title: 'nav.col_ooh',
        items: [
          { i18n: 'ooh.inventory', desc: 'ooh.inventory_d', href: 'ooh.html#inventory', icon: '⌗' },
          { i18n: 'ooh.formats', desc: 'ooh.formats_d', href: 'ooh.html#formats', icon: '▭' },
          { i18n: 'ooh.proof', desc: 'ooh.proof_d', href: 'ooh.html#proof', icon: '✓' },
          { i18n: 'ooh.programmatic', desc: 'ooh.programmatic_d', href: 'ooh.html#programmatic', icon: '⇄' }
        ]
      },
      {
        title: 'nav.col_platform',
        items: [
          { i18n: 'nav.marketplace', href: 'marketplace.html', icon: '⌖' },
          { i18n: 'nav.preview', href: 'preview.html', icon: '⇪' },
          { i18n: 'nav.adsmanager', href: 'adsmanager.html', icon: '▤' },
          { i18n: 'nav.pricing', href: 'pricing.html', icon: '◈' }
        ]
      }
    ],
    featured: { label: 'mg.ooh_featured', desc: 'mg.ooh_featured_d', href: 'marketplace.html', icon: '◉' }
  },
  {
    id: 'technology', label: 'nav.technology', href: 'technology.html',
    columns: [
      {
        title: 'nav.col_technology',
        items: [
          { i18n: 'tec.how', desc: 'tec.how_d', href: 'technology.html#how', icon: '⌬' },
          { i18n: 'tec.content', desc: 'tec.content_d', href: 'technology.html#content', icon: '✧' },
          { i18n: 'tec.products', desc: 'tec.products_d', href: 'technology.html#products', icon: '◎' },
          { i18n: 'tec.accessories', desc: 'tec.accessories_d', href: 'technology.html#accessories', icon: '⚒' },
          { i18n: 'nav.catalog', desc: 'cat.series_lede', href: 'catalog.html', icon: '▤' },
          { i18n: 'nav.ledfilm', desc: 'lf.lede', href: 'led-film.html', icon: '▥' },
          { i18n: 'nav.dimension', desc: 'dim.spacing_lede', href: 'dimension.html', icon: '⌗' },
          { i18n: 'nav.size_calc', desc: 'sz.lede', href: 'calculator.html', icon: '⟷' },
          { i18n: 'nav.cloud', desc: 'cloud.what_1', href: 'cloud.html', icon: '☁' },
        ]
      },
      {
        title: 'nav.col_platform',
        items: [
          { i18n: 'nav.studio', href: 'studio.html', icon: '✧' },
          { i18n: 'nav.docs', href: 'docs.html', icon: '⌘' },
          { i18n: 'nav.faq', href: 'faq.html', icon: '?' },
          { i18n: 'nav.video', href: 'video.html', icon: '▶' }
        ]
      }
    ],
    featured: { label: 'mg.tec_featured', desc: 'mg.tec_featured_d', href: 'preview.html', icon: '◆' }
  },
  {
    id: 'platform', label: 'nav.platform', href: 'marketplace.html',
    columns: [
      {
        title: 'nav.col_book',
        items: [
          { i18n: 'nav.marketplace', desc: 'mg.plat_market_d', href: 'marketplace.html', icon: '⌖' },
          { i18n: 'nav.preview', desc: 'mg.plat_preview_d', href: 'preview.html', icon: '⇪' },
          { i18n: 'nav.pricing', desc: 'mg.plat_pricing_d', href: 'pricing.html', icon: '◈' },
          { i18n: 'nav.price_list', desc: 'pl.lede', href: 'price-list.html', icon: '⌗' },
          { i18n: 'nav.payments', desc: 'pm.lede', href: 'payments.html', icon: '◈' }
        ]
      },
      {
        title: 'nav.col_manage',
        items: [
          { i18n: 'nav.adsmanager', desc: 'mg.plat_ads_d', href: 'adsmanager.html', icon: '▤' },
          { i18n: 'nav.automation', desc: 'mg.plat_auto_d', href: 'automation.html', icon: '≡' },
          { i18n: 'nav.membership', desc: 'mg.plat_mem_d', href: 'membership.html', icon: '★' },
          { i18n: 'nav.cloud', desc: 'cloud.what_2', href: 'cloud.html', icon: '☁' }
        ]
      },
      {
        title: 'nav.col_account',
        items: [
          { i18n: 'nav.login', desc: 'mg.plat_login_d', href: 'login.html', icon: '☺' },
          { i18n: 'nav.advertiser', desc: 'mg.plat_adv_d', href: 'advertiser.html', icon: '◆' },
          { i18n: 'nav.landlord', desc: 'mg.plat_ll_d', href: 'landlord.html', icon: '⌂' }
        ]
      }
    ],
    featured: { label: 'mg.plat_featured', desc: 'mg.plat_featured_d', href: 'docs.html', icon: '⌘' }
  },
  {
    id: 'company', label: 'nav.company', href: 'company.html',
    columns: [
      {
        title: 'nav.col_company',
        items: [
          { i18n: 'cmp.about', desc: 'cmp.about_d', href: 'company.html#about', icon: '⌂' },
          { i18n: 'cmp.approach', desc: 'cmp.approach_d', href: 'company.html#approach', icon: '◈' },
          { i18n: 'cmp.coverage', desc: 'cmp.coverage_d', href: 'company.html#coverage', icon: '⌖' },
          { i18n: 'cmp.channels', desc: 'cmp.channels_d', href: 'company.html#channels', icon: '☏' }
        ]
      },
      {
        title: 'nav.col_more',
        items: [
          { i18n: 'nav.faq', href: 'faq.html', icon: '?' },
          { i18n: 'nav.contact', href: 'contact.html', icon: '✉' },
          { i18n: 'nav.docs', href: 'docs.html', icon: '⌘' }
        ]
      }
    ],
    featured: { label: 'mg.cmp_featured', desc: 'mg.cmp_featured_d', href: 'contact.html', icon: '✉' }
  },
  {
    id: 'partnership', label: 'nav.partnership', href: 'partnership.html',
    columns: [
      {
        title: 'nav.col_partner_types',
        items: [
          { i18n: 'part.reseller', desc: 'part.reseller_d', href: 'partnership.html#resellers', icon: '⇄' },
          { i18n: 'part.integrator', desc: 'part.integrator_d', href: 'partnership.html#integrators', icon: '⚒' },
          { i18n: 'part.venue', desc: 'part.venue_d', href: 'partnership.html#venues', icon: '⌂' },
          { i18n: 'part.agency', desc: 'part.agency_d', href: 'partnership.html#agencies', icon: '◆' },
          { i18n: 'part.ip', desc: 'part.ip_d', href: 'partnership.html#brands', icon: '✦' }
        ]
      },
      {
        title: 'nav.col_join',
        items: [
          { i18n: 'part.why', desc: 'part.why_d', href: 'partnership.html#why', icon: '◎' },
          { i18n: 'part.steps', desc: 'part.steps_d', href: 'partnership.html#steps', icon: '☰' },
          { i18n: 'nav.affiliate', desc: 'af.lede', href: 'affiliate.html', icon: '⇗' },
          { i18n: 'part.enquire', desc: 'part.enquire_d', href: 'contact.html?interest=partnership', icon: '✉' }
        ]
      }
    ],
    featured: { label: 'mg.part_featured', desc: 'mg.part_featured_d', href: 'partnership.html#steps', icon: '⇄' }
  }
];

/* ---------------------------------------------------------------------------
 * The nine structure pages. One module (page-mega.js) renders all of them from
 * this spec, so they stay consistent and a tenth page is a data change.
 * block kinds: cards | steps | list | table | stats | note | faq
 * -------------------------------------------------------------------------*/
window.LG_MEGA_PAGES = {
  solutions: {
    eyebrow: 'sol.eyebrow', title: 'sol.title', lede: 'sol.lede',
    stats: ['sol.stat1', 'sol.stat2', 'sol.stat3', 'sol.stat4'],
    blocks: [
      { kind: 'cards', id: 'displays', title: 'sol.b1', lede: 'sol.b1_lede', cols: 4,
        items: [
          { i18n: 'sol.fan28', text: 'sol.fan28_d', href: 'marketplace.html?device=holo_p30s', icon: '◉' },
          { i18n: 'sol.fan65', text: 'sol.fan65_d', href: 'marketplace.html?device=holo_p65yd', icon: '◎' },
          { i18n: 'sol.wall', text: 'sol.wall_d', href: 'marketplace.html?device=ooh_75w', icon: '▭' },
          { i18n: 'sol.prize', text: 'sol.prize_d', href: 'contact.html?interest=event', icon: '✦' }
        ] },
      { kind: 'cards', id: 'presenter', title: 'sol.b2', lede: 'sol.b2_lede', cols: 2,
        items: [
          { i18n: 'sol.presenter', text: 'sol.presenter_x', href: 'contact.html?interest=event', icon: '☺' },
          { id: 'discover', i18n: 'sol.discover', text: 'sol.discover_x', href: 'contact.html?interest=content_production', icon: '⌕' }
        ] },
      { kind: 'cards', id: 'live', title: 'sol.b3', lede: 'sol.b3_lede', cols: 2,
        items: [
          { i18n: 'sol.live', text: 'sol.live_x', href: 'contact.html?interest=event', icon: '◍' },
          { id: 'library', i18n: 'sol.library', text: 'sol.library_x', href: 'studio.html', icon: '▤' }
        ] },
      { kind: 'cards', id: 'content-studio', title: 'sol.b4', lede: 'sol.b4_lede', cols: 3,
        items: [
          { i18n: 'sol.studio', text: 'sol.studio_d', href: 'studio.html', icon: '✧' },
          { i18n: 'sol.convert', text: 'sol.convert_d', href: 'preview.html', icon: '⇪' },
          { i18n: 'sol.model', text: 'sol.model_d', href: 'studio.html', icon: '⬡' }
        ] },
      { kind: 'steps', title: 'sol.b5', lede: 'sol.b5_lede', items: ['sol.s1', 'sol.s2', 'sol.s3', 'sol.s4'] },
      { kind: 'faq', title: 'sol.b6', items: ['faq.holo_choose', 'faq.svc_pricing', 'faq.svc_approval'] }
    ]
  },
  industries: {
    eyebrow: 'ind.eyebrow', title: 'ind.title', lede: 'ind.lede',
    stats: ['ind.stat1', 'ind.stat2', 'ind.stat3'],
    blocks: [
      { kind: 'cards', id: 'industries', title: 'ind.b1', lede: 'ind.b1_lede', cols: 3,
        items: [
          { id: 'retail', i18n: 'ind.retail', text: 'ind.retail_d', href: 'industries.html#retail', icon: '⌂' },
          { id: 'automotive', i18n: 'ind.automotive', text: 'ind.automotive_d', href: 'industries.html#automotive', icon: '⛃' },
          { id: 'hospitality', i18n: 'ind.hospitality', text: 'ind.hospitality_d', href: 'industries.html#hospitality', icon: '✦' },
          { id: 'healthcare', i18n: 'ind.healthcare', text: 'ind.healthcare_d', href: 'industries.html#healthcare', icon: '✚' },
          { id: 'education', i18n: 'ind.education', text: 'ind.education_d', href: 'industries.html#education', icon: '✎' },
          { id: 'sector-events', i18n: 'ind.events', text: 'ind.events_d', href: 'events.html', icon: '✧' }
        ] },
      { kind: 'list', id: 'use-cases', title: 'ind.b2', lede: 'ind.b2_lede',
        items: ['ind.u1', 'ind.u2', 'ind.u3', 'ind.u4', 'ind.u5', 'ind.u6'] },
      { kind: 'cards', id: 'applications', title: 'ind.b3', lede: 'ind.b3_lede', cols: 2,
        items: [
          { i18n: 'ind.a1', text: 'ind.a1_d', href: 'solutions.html', icon: '◉' },
          { i18n: 'ind.a2', text: 'ind.a2_d', href: 'preview.html', icon: '⇪' }
        ] },
      { kind: 'table', id: 'resources', title: 'ind.b4', lede: 'ind.b4_lede',
        head: ['ind.col_need', 'ind.col_where', 'ind.col_what'],
        rows: [['ind.r1', 'ind.r1_where', 'ind.r1_what'],
               ['ind.r2', 'ind.r2_where', 'ind.r2_what'],
               ['ind.r3', 'ind.r3_where', 'ind.r3_what']] }
    ]
  },
  events: {
    eyebrow: 'evt.eyebrow', title: 'evt.title', lede: 'evt.lede',
    stats: ['evt.stat1', 'evt.stat2', 'evt.stat3'],
    blocks: [
      { kind: 'cards', id: 'launches', title: 'evt.b1', lede: 'evt.b1_lede', cols: 3,
        items: [
          { id: 'launches', i18n: 'evt.launch', text: 'evt.launch_d', href: 'contact.html?interest=event', icon: '◆' },
          { id: 'expos', i18n: 'evt.expo', text: 'evt.expo_d', href: 'booth.html', icon: '▤' },
          { id: 'conferences', i18n: 'evt.conference', text: 'evt.conference_d', href: 'contact.html?interest=event', icon: '☺' }
        ] },
      { kind: 'cards', id: 'activations', title: 'evt.b2', lede: 'evt.b2_lede', cols: 3,
        items: [
          { id: 'activations', i18n: 'evt.activation', text: 'evt.activation_d', href: 'contact.html?interest=event', icon: '✦' },
          { id: 'private', i18n: 'evt.private', text: 'evt.private_d', href: 'contact.html?interest=event', icon: '❖' },
          { id: 'festivals', i18n: 'evt.festival', text: 'evt.festival_d', href: 'mobile-unit.html', icon: '♪' }
        ] },
      { kind: 'table', id: 'packages', title: 'evt.b3', lede: 'evt.b3_lede',
        head: ['evt.col_pkg', 'evt.col_fits', 'evt.col_includes'],
        rows: [['evt.p1', 'evt.p1_fits', 'evt.p1_inc'],
               ['evt.p2', 'evt.p2_fits', 'evt.p2_inc'],
               ['evt.p3', 'evt.p3_fits', 'evt.p3_inc']] },
      { kind: 'steps', id: 'delivery', title: 'evt.b4', lede: 'evt.b4_lede',
        items: ['evt.s1', 'evt.s2', 'evt.s3', 'evt.s4'] },
      { kind: 'note', text: 'evt.note', href: 'contact.html?interest=event', cta: 'cta.demo' }
    ]
  },
  'mobile-unit': {
    eyebrow: 'mu.eyebrow', title: 'mu.title', lede: 'mu.lede',
    stats: ['mu.stat1', 'mu.stat2', 'mu.stat3'],
    blocks: [
      { kind: 'list', id: 'inside', title: 'mu.b1', lede: 'mu.b1_lede',
        items: ['mu.i1', 'mu.i2', 'mu.i3', 'mu.i4', 'mu.i5', 'mu.i6'] },
      { kind: 'steps', id: 'route', title: 'mu.b2', lede: 'mu.b2_lede',
        items: ['mu.s1', 'mu.s2', 'mu.s3', 'mu.s4'] },
      { kind: 'table', id: 'specs', title: 'mu.b3', lede: 'mu.b3_lede',
        head: ['mu.col_item', 'mu.col_detail'],
        rows: [['mu.sp1', 'mu.sp1_v'], ['mu.sp2', 'mu.sp2_v'], ['mu.sp3', 'mu.sp3_v'],
               ['mu.sp4', 'mu.sp4_v'], ['mu.sp5', 'mu.sp5_v']] },
      { kind: 'note', text: 'mu.note', href: 'contact.html?interest=event', cta: 'cta.demo' }
    ]
  },
  booth: {
    eyebrow: 'bt.eyebrow', title: 'bt.title', lede: 'bt.lede',
    stats: ['bt.stat1', 'bt.stat2', 'bt.stat3'],
    blocks: [
      { kind: 'table', id: 'sizes', title: 'bt.b1', lede: 'bt.b1_lede',
        head: ['bt.col_size', 'bt.col_fits', 'bt.col_units'],
        rows: [['bt.s1', 'bt.s1_fits', 'bt.s1_units'],
               ['bt.s2', 'bt.s2_fits', 'bt.s2_units'],
               ['bt.s3', 'bt.s3_fits', 'bt.s3_units']] },
      { kind: 'cards', id: 'interactive', title: 'bt.b2', lede: 'bt.b2_lede', cols: 3,
        items: [
          { i18n: 'bt.i1', text: 'bt.i1_d', href: 'contact.html?interest=event', icon: '⌕' },
          { i18n: 'bt.i2', text: 'bt.i2_d', href: 'contact.html?interest=event', icon: '▤' },
          { i18n: 'bt.i3', text: 'bt.i3_d', href: 'studio.html', icon: '✧' }
        ] },
      { kind: 'list', id: 'leads', title: 'bt.b3', lede: 'bt.b3_lede', items: ['bt.l1', 'bt.l2', 'bt.l3', 'bt.l4'] },
      { kind: 'list', id: 'logistics', title: 'bt.b4', lede: 'bt.b4_lede', items: ['bt.g1', 'bt.g2', 'bt.g3', 'bt.g4'] },
      { kind: 'note', text: 'bt.note', href: 'contact.html?interest=event', cta: 'cta.demo' }
    ]
  },
  holobox: {
    eyebrow: 'hb.eyebrow', title: 'hb.title', lede: 'hb.lede',
    stats: ['hb.stat1', 'hb.stat2', 'hb.stat3', 'hb.stat4'],
    blocks: [
      /* the animated explainer is drawn by page-holobox.js into this host */
      { kind: 'stage', id: 'how', title: 'hb.b1', lede: 'hb.b1_lede', visual: 'holobox', caption: 'hb.b1_cap' },
      { kind: 'cards', id: 'ways', title: 'hb.b2', lede: 'hb.b2_lede', cols: 3,
        items: [
          { i18n: 'hb.l1', text: 'hb.l1_d', icon: '▶' },
          { i18n: 'hb.l2', text: 'hb.l2_d', icon: '◍' },
          { i18n: 'hb.l3', text: 'hb.l3_d', icon: '✦' }
        ] },
      { kind: 'list', id: 'plug', title: 'hb.b3', lede: 'hb.b3_lede', items: ['hb.p1', 'hb.p2', 'hb.p3', 'hb.p4', 'hb.p5'] },
      { kind: 'table', id: 'sectors', title: 'hb.b4', lede: 'hb.b4_lede',
        head: ['hb.col_sector', 'hb.col_job', 'hb.col_who'],
        rows: [['hb.r1', 'hb.r1_job', 'hb.r1_who'],
               ['hb.r2', 'hb.r2_job', 'hb.r2_who'],
               ['hb.r3', 'hb.r3_job', 'hb.r3_who'],
               ['hb.r4', 'hb.r4_job', 'hb.r4_who'],
               ['hb.r5', 'hb.r5_job', 'hb.r5_who'],
               ['hb.r6', 'hb.r6_job', 'hb.r6_who']] },
      { kind: 'table', id: 'specs', title: 'hb.b5', lede: 'hb.b5_lede',
        head: ['hb.col_item2', 'hb.col_confirm'],
        rows: [['hb.s1', 'hb.s1_v'], ['hb.s2', 'hb.s2_v'], ['hb.s3', 'hb.s3_v'], ['hb.s4', 'hb.s4_v'],
               ['hb.s5', 'hb.s5_v'], ['hb.s6', 'hb.s6_v'], ['hb.s7', 'hb.s7_v'], ['hb.s8', 'hb.s8_v'],
               ['hb.s9', 'hb.s9_v'], ['hb.s10', 'hb.s10_v']] },
      { kind: 'steps', id: 'delivery', title: 'hb.b6', items: ['hb.d1', 'hb.d2', 'hb.d3', 'hb.d4', 'hb.d5'] },
      { kind: 'cards', id: 'sizes', title: 'hb.b7', cols: 3,
        items: [
          { i18n: 'hb.k1', text: 'hb.k1_d', href: 'catalog.html#series', icon: '▭' },
          { i18n: 'hb.k2', text: 'hb.k2_d', href: 'contact.html?interest=holobox', icon: '⬒', id: 'life-size' },
          { i18n: 'hb.k3', text: 'hb.k3_d', href: 'contact.html?interest=holobox', icon: '✷' }
        ] },
      { kind: 'faq', id: 'questions', title: 'hb.b8',
        items: ['faq.hb_box_what', 'faq.hb_box_room', 'faq.hb_box_live', 'faq.hb_box_avatar'] },
      { kind: 'note', text: 'hb.also', href: 'booth.html', cta: 'hb.also_cta' },
      { kind: 'note', text: 'hb.note', href: 'contact.html?interest=holobox', cta: 'hb.note_cta' }
    ]
  },
  /* ---- 3D media glass and LED film ---------------------------------------
   * The third display technology: the surface itself becomes the screen. The
   * parameter table is transcribed from the manufacturer's catalogue and
   * verified in _verify/site-check.cjs §4i against _extract/led-film/parameters.json */
  ledfilm: {
    eyebrow: 'lf.eyebrow', title: 'lf.title', lede: 'lf.lede', source: 'lf.source',
    stats: ['lf.stat1', 'lf.stat2', 'lf.stat3', 'lf.stat4'],
    blocks: [
      { kind: 'cards', id: 'forms', title: 'lf.b1', lede: 'lf.b1_lede', cols: 3,
        items: [
          { i18n: 'lf.f1', text: 'lf.f1_d', icon: '▤' },
          { i18n: 'lf.f2', text: 'lf.f2_d', icon: '▥' },
          { i18n: 'lf.f3', text: 'lf.f3_d', icon: '◜' }
        ] },
      { kind: 'list', id: 'why-glass', title: 'lf.b2', lede: 'lf.b2_lede',
        items: ['lf.w1', 'lf.w2', 'lf.w3', 'lf.w4', 'lf.w5', 'lf.w6'] },
      { kind: 'table', id: 'parameters', title: 'lf.b3', lede: 'lf.b3_lede',
        head: ['lf.col_product', 'lf.col_pixelpitch', 'lf.col_bright', 'lf.col_trans', 'lf.col_density', 'lf.col_view', 'lf.col_angle', 'lf.col_power'],
        rows: [
          ['lf.p4', 'lf.p4_pp', 'lf.p4_b', 'lf.p4_t', 'lf.p4_d', 'lf.p4_v', 'lf.p4_a', 'lf.p4_w'],
          ['lf.p5', 'lf.p5_pp', 'lf.p5_b', 'lf.p5_t', 'lf.p5_d', 'lf.p5_v', 'lf.p5_a', 'lf.p5_w'],
          ['lf.p6', 'lf.p6_pp', 'lf.p6_b', 'lf.p6_t', 'lf.p6_d', 'lf.p6_v', 'lf.p6_a', 'lf.p6_w'],
          ['lf.p8', 'lf.p8_pp', 'lf.p8_b', 'lf.p8_t', 'lf.p8_d', 'lf.p8_v', 'lf.p8_a', 'lf.p8_w'],
          ['lf.p10', 'lf.p10_pp', 'lf.p10_b', 'lf.p10_t', 'lf.p10_d', 'lf.p10_v', 'lf.p10_a', 'lf.p10_w'],
          ['lf.p15', 'lf.p15_pp', 'lf.p15_b', 'lf.p15_t', 'lf.p15_d', 'lf.p15_v', 'lf.p15_a', 'lf.p15_w'],
          ['lf.p20', 'lf.p20_pp', 'lf.p20_b', 'lf.p20_t', 'lf.p20_d', 'lf.p20_v', 'lf.p20_a', 'lf.p20_w']
        ] },
      { kind: 'table', id: 'compared', title: 'lf.b4', lede: 'lf.b4_lede',
        head: ['lf.col_tech', 'lf.col_see', 'lf.col_where', 'lf.col_light', 'lf.col_best'],
        rows: [
          ['lf.t1', 'lf.t1_see', 'lf.t1_where', 'lf.t1_light', 'lf.t1_best'],
          ['lf.t2', 'lf.t2_see', 'lf.t2_where', 'lf.t2_light', 'lf.t2_best'],
          ['lf.t3', 'lf.t3_see', 'lf.t3_where', 'lf.t3_light', 'lf.t3_best']
        ] },
      { kind: 'cards', id: 'where', title: 'lf.b5', lede: 'lf.b5_lede', cols: 4,
        items: [
          { i18n: 'lf.a1', text: 'lf.a1_d', icon: '⌂' },
          { i18n: 'lf.a2', text: 'lf.a2_d', icon: '▦' },
          { i18n: 'lf.a3', text: 'lf.a3_d', icon: '⛨' },
          { i18n: 'lf.a4', text: 'lf.a4_d', icon: '⛟' }
        ] },
      { kind: 'cards', id: 'family', title: 'lf.b6', lede: 'lf.b6_lede', cols: 4,
        items: [
          { i18n: 'lf.r1', text: 'lf.r1_d', icon: '◐' },
          { i18n: 'lf.r2', text: 'lf.r2_d', icon: '▢' },
          { i18n: 'lf.r3', text: 'lf.r3_d', icon: '⌸' },
          { i18n: 'lf.r4', text: 'lf.r4_d', icon: '✈' }
        ] },
      { kind: 'note', text: 'lf.cta_lede', href: 'contact.html?interest=led_film', cta: 'lf.cta' }
    ]
  },
  /* ---- the affiliate share-link model ------------------------------------
   * The working demo lives in store.share (the click record, the cookie window
   * and the attribution) and in page-affiliate.js (the panel). */
  affiliate: {
    eyebrow: 'af.eyebrow', title: 'af.title', lede: 'af.lede', source: 'af.source',
    stats: ['af.stat1', 'af.stat2', 'af.stat3', 'af.stat4'],
    blocks: [
      { kind: 'steps', id: 'chain', title: 'af.b1', lede: 'af.b1_lede', items: ['af.s1', 'af.s2', 'af.s3'] },
      { kind: 'cards', id: 'parties', title: 'af.b2', lede: 'af.b2_lede', cols: 4,
        items: [
          { i18n: 'af.c1', text: 'af.c1_d', icon: '⌂' },
          { i18n: 'af.c2', text: 'af.c2_d', icon: '☺' },
          { i18n: 'af.c3', text: 'af.c3_d', icon: '⇄' },
          { i18n: 'af.c4', text: 'af.c4_d', icon: '⌖' }
        ] },
      { kind: 'cards', id: 'channels', title: 'af.b3', lede: 'af.b3_lede', cols: 3,
        items: [
          { i18n: 'af.ch1', text: 'af.ch1_d', icon: '◍' },
          { i18n: 'af.ch2', text: 'af.ch2_d', icon: '▶' },
          { i18n: 'af.ch3', text: 'af.ch3_d', icon: '✉' }
        ] },
      { kind: 'stage', id: 'demo', title: 'af.b4', lede: 'af.b4_lede', visual: 'affiliate' },
      { kind: 'stage', id: 'console', title: 'af.b7', lede: 'af.b7_lede', visual: 'affiliate-console' },
      { kind: 'list', id: 'rules', title: 'af.b5', lede: 'af.b5_lede', items: ['af.r1', 'af.r2', 'af.r3', 'af.r4', 'af.r5', 'af.r6'] },
      { kind: 'faq', id: 'faq', title: 'af.b8', lede: 'af.b8_lede',
        items: ['faq.aff_what', 'faq.aff_track', 'faq.aff_cookie', 'faq.aff_commission', 'faq.aff_payout',
                'faq.aff_more', 'faq.aff_self', 'faq.aff_privacy', 'faq.aff_join'] },
      { kind: 'cards', id: 'networks', title: 'af.b6', lede: 'af.b6_lede', cols: 3,
        items: [
          { i18n: 'af.n1', text: 'af.n1_d', href: 'https://www.awin.com/', icon: '⇗' },
          { i18n: 'af.n2', text: 'af.n2_d', href: 'https://impact.com/', icon: '⇗' },
          { i18n: 'af.n3', text: 'af.n3_d', icon: '◆' }
        ] },
      { kind: 'note', text: 'af.cta_lede', href: 'contact.html?interest=partnership', cta: 'af.cta' }
    ]
  },
  ooh: {
    eyebrow: 'ooh.eyebrow', title: 'ooh.title', lede: 'ooh.lede',
    stats: ['ooh.stat1', 'ooh.stat2', 'ooh.stat3', 'ooh.stat4'],
    blocks: [
      { kind: 'cards', id: 'inventory', title: 'ooh.b1', lede: 'ooh.b1_lede', cols: 3,
        items: [
          { i18n: 'ooh.inv_hk', text: 'ooh.inv_hk_d', href: 'marketplace.html?market=hk', icon: '⌗' },
          { i18n: 'ooh.inv_th', text: 'ooh.inv_th_d', href: 'marketplace.html?market=th', icon: '⌗' },
          { i18n: 'ooh.inv_list', text: 'ooh.inv_list_d', href: 'landlord.html#register', icon: '⌂' }
        ] },
      { kind: 'cards', id: 'formats', title: 'ooh.b2', lede: 'ooh.b2_lede', cols: 3,
        items: [
          { i18n: 'ooh.f1', text: 'ooh.f1_d', href: 'marketplace.html?device=holo_p65yd', icon: '◎' },
          { i18n: 'ooh.f2', text: 'ooh.f2_d', href: 'marketplace.html?device=ooh_43v', icon: '▭' },
          { i18n: 'ooh.f3', text: 'ooh.f3_d', href: 'marketplace.html?device=ooh_75w', icon: '▬' }
        ] },
      { kind: 'list', id: 'proof', title: 'ooh.b3', lede: 'ooh.b3_lede', items: ['ooh.p1', 'ooh.p2', 'ooh.p3', 'ooh.p4'] },
      { kind: 'steps', id: 'programmatic', title: 'ooh.b4', lede: 'ooh.b4_lede', items: ['ooh.g1', 'ooh.g2', 'ooh.g3'] },
      { kind: 'note', text: 'ooh.note', href: 'marketplace.html', cta: 'hero.cta_browse' }
    ]
  },
  technology: {
    eyebrow: 'tec.eyebrow', title: 'tec.title', lede: 'tec.lede',
    stats: ['tec.stat1', 'tec.stat2', 'tec.stat3'],
    blocks: [
      { kind: 'steps', id: 'how', title: 'tec.b1', lede: 'tec.b1_lede', items: ['tec.h1', 'tec.h2', 'tec.h3', 'tec.h4'] },
      { kind: 'cards', id: 'content', title: 'tec.b2', lede: 'tec.b2_lede', cols: 3,
        items: [
          { i18n: 'tec.c1', text: 'tec.c1_d', href: 'studio.html', icon: '✧' },
          { i18n: 'tec.c2', text: 'tec.c2_d', href: 'preview.html', icon: '⇪' },
          { i18n: 'tec.c3', text: 'tec.c3_d', href: 'contact.html?interest=content_production', icon: '☰' }
        ] },
      { kind: 'table', id: 'products', title: 'tec.b3', lede: 'tec.b3_lede',
        head: ['tec.col_device', 'tec.col_form', 'tec.col_use'],
        rows: [['tec.p1', 'tec.p1_form', 'tec.p1_use'],
               ['tec.p2', 'tec.p2_form', 'tec.p2_use'],
               ['tec.p3', 'tec.p3_form', 'tec.p3_use'],
               ['tec.p4', 'tec.p4_form', 'tec.p4_use']] },
      { kind: 'cards', id: 'accessories', title: 'tec.b4', lede: 'tec.b4_lede', cols: 3,
        items: [
          { i18n: 'tec.a1', text: 'tec.a1_d', href: 'contact.html?interest=hologram_buy', icon: '⚒' },
          { i18n: 'tec.a2', text: 'tec.a2_d', href: 'contact.html?interest=hologram_buy', icon: '⚡' },
          { i18n: 'tec.a3', text: 'tec.a3_d', href: 'faq.html#faq-saf_rules', icon: '⛨' }
        ] },
      { kind: 'faq', title: 'tec.b5', items: ['faq.holo_what', 'faq.con_spec', 'faq.holo_dark'] }
    ]
  },
  company: {
    eyebrow: 'cmp.eyebrow', title: 'cmp.title', lede: 'cmp.lede',
    stats: ['cmp.stat1', 'cmp.stat2', 'cmp.stat3', 'cmp.stat4'],
    blocks: [
      { kind: 'cards', id: 'about', title: 'cmp.b1', lede: 'cmp.b1_lede', cols: 3,
        items: [
          { i18n: 'cmp.what', text: 'cmp.what_d', href: 'docs.html', icon: '◆' },
          { i18n: 'cmp.who', text: 'cmp.who_d', href: 'advertiser.html', icon: '☺' },
          { i18n: 'cmp.how', text: 'cmp.how_d', href: 'landlord.html', icon: '⌂' }
        ] },
      { kind: 'list', id: 'approach', title: 'cmp.b2', lede: 'cmp.b2_lede', items: ['cmp.a1', 'cmp.a2', 'cmp.a3', 'cmp.a4'] },
      { kind: 'cards', id: 'coverage', title: 'cmp.b3', lede: 'cmp.b3_lede', cols: 2,
        items: [
          { i18n: 'cmp.hk', text: 'cmp.hk_d', href: 'marketplace.html?market=hk', icon: '⌗' },
          { i18n: 'cmp.th', text: 'cmp.th_d', href: 'marketplace.html?market=th', icon: '⌗' }
        ] },
      { kind: 'table', id: 'channels', title: 'cmp.b4', lede: 'cmp.b4_lede',
        head: ['cmp.col_channel', 'cmp.col_detail'],
        rows: [['cmp.c1', 'cmp.c1_v'], ['cmp.c2', 'cmp.c2_v'], ['cmp.c3', 'cmp.c3_v'], ['cmp.c4', 'cmp.c4_v']] },
      { kind: 'note', text: 'cmp.note', href: 'contact.html', cta: 'cta.contact' }
    ]
  },
  partnership: {
    eyebrow: 'part.eyebrow', title: 'part.title', lede: 'part.lede',
    stats: ['part.stat1', 'part.stat2', 'part.stat3'],
    blocks: [
      { kind: 'cards', id: 'resellers', title: 'part.b1', lede: 'part.b1_lede', cols: 2,
        items: [
          { i18n: 'part.reseller', text: 'part.reseller_x', href: 'contact.html?interest=partnership', icon: '⇄' },
          { id: 'integrators', i18n: 'part.integrator', text: 'part.integrator_x', href: 'contact.html?interest=partnership', icon: '⚒' }
        ] },
      { kind: 'cards', id: 'venues', title: 'part.b2', lede: 'part.b2_lede', cols: 2,
        items: [
          { i18n: 'part.venue', text: 'part.venue_x', href: 'landlord.html#register', icon: '⌂' },
          { id: 'agencies', i18n: 'part.agency', text: 'part.agency_x', href: 'contact.html?interest=agency', icon: '◆' }
        ] },
      { kind: 'cards', id: 'brands', title: 'part.b3', lede: 'part.b3_lede', cols: 2,
        items: [
          { i18n: 'part.ip', text: 'part.ip_x', href: 'contact.html?interest=partnership', icon: '✦' },
          { i18n: 'part.media', text: 'part.media_x', href: 'contact.html?interest=press', icon: '✎' }
        ] },
      { kind: 'list', id: 'why', title: 'part.b4', lede: 'part.b4_lede', items: ['part.w1', 'part.w2', 'part.w3', 'part.w4'] },
      { kind: 'steps', id: 'steps', title: 'part.b5', lede: 'part.b5_lede', items: ['part.s1', 'part.s2', 'part.s3'] },
      { kind: 'note', text: 'part.note', href: 'contact.html?interest=partnership', cta: 'part.cta' }
    ]
  }
};
