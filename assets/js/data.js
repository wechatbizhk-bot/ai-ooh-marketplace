/* ============================================================================
 * 3dNakedEye — data.js
 * Seeded marketplace inventory. In production every object below maps to a
 * REST resource on the inventory API (see docs.html for the data model).
 * ==========================================================================*/

/* --- Device catalogue ------------------------------------------------------ */
window.LG_DEVICES = {
  holo_p30s: {
    id: 'holo_p30s', form: 'hologram', sku: '3DNE-P30S', diameterCm: 28,
    label: { en: 'Hologram fan 28cm (3DNE-P30S)', zhHant: '全息風扇 28cm（3DNE-P30S）', zhHans: '全息风扇 28cm（3DNE-P30S）' },
    viewDistance: { en: '0.5–2 m', zhHant: '約 0.5–2 公尺', zhHans: '约 0.5–2 米' },
    install: { en: 'Desktop, wall bracket or simple stand (self-install)', zhHant: '座檯、壁掛或簡易支架（可自行安裝）', zhHans: '台式、壁挂或简易支架（可自行安装）' },
    contentSpec: { en: 'Square 1:1, pure black background, 10–30 s loop', zhHant: '正方形 1:1、純黑背景、10–30 秒循環', zhHans: '正方形 1:1、纯黑背景、10–30 秒循环' },
    useCases: { en: 'Counter, window, small shop, table display, event booth', zhHant: '櫃檯、櫥窗、小型店舖、桌面展示、活動攤位', zhHans: '柜台、橱窗、小型店铺、桌面展示、活动摊位' },
    listPrice: 880, dailyRate: 180, weight: 1
  },
  holo_p65yd: {
    id: 'holo_p65yd', form: 'hologram', sku: '3DNE-P65YD', diameterCm: 65,
    label: { en: 'Hologram fan 65cm (3DNE-P65YD)', zhHant: '全息風扇 65cm（3DNE-P65YD）', zhHans: '全息风扇 65cm（3DNE-P65YD）' },
    viewDistance: { en: '1.5–5 m', zhHant: '約 1.5–5 公尺', zhHans: '约 1.5–5 米' },
    install: { en: 'Hanging or floor stand — qualified installer + safety cable', zhHant: '吊裝或落地支架 — 建議合資格人員安裝並加裝安全索', zhHans: '吊装或落地支架 — 建议合资格人员安装并加装安全钢索' },
    contentSpec: { en: 'Square 1:1, pure black background, 10–30 s loop', zhHant: '正方形 1:1、純黑背景、10–30 秒循環', zhHans: '正方形 1:1、纯黑背景、10–30 秒循环' },
    useCases: { en: 'Mall atrium, exhibition booth, stage, flagship store, launch', zhHant: '商場中庭、展覽攤位、舞台、大型店舖、發佈會', zhHans: '商场中庭、展览摊位、舞台、大型店铺、发布会' },
    listPrice: 3200, dailyRate: 520, weight: 2.4
  },
  ooh_43v: {
    id: 'ooh_43v', form: 'screen', sku: 'OOH-43V', sizeInch: 43, orientation: 'portrait',
    label: { en: 'OOH screen 43" vertical', zhHant: 'OOH 直屏 43 吋', zhHans: 'OOH 竖屏 43 寸' },
    viewDistance: { en: '1–4 m', zhHant: '約 1–4 公尺', zhHans: '约 1–4 米' },
    install: { en: 'Wall or floor stand, mains power + network', zhHant: '壁掛或落地支架，需市電及網絡', zhHans: '壁挂或落地支架，需市电及网络' },
    contentSpec: { en: 'Portrait 9:16, MP4 H.264, 1080×1920', zhHant: '直向 9:16、MP4 H.264、1080×1920', zhHans: '竖向 9:16、MP4 H.264、1080×1920' },
    useCases: { en: 'Lobby, lift lobby, clinic queue, retail window', zhHant: '大堂、電梯大堂、診所輪候區、零售櫥窗', zhHans: '大堂、电梯厅、诊所候诊区、零售橱窗' },
    dailyRate: 320, weight: 1.2
  },
  ooh_55w: {
    id: 'ooh_55w', form: 'screen', sku: 'OOH-55W', sizeInch: 55, orientation: 'landscape',
    label: { en: 'OOH screen 55" wall', zhHant: 'OOH 掛牆屏 55 吋', zhHans: 'OOH 壁挂屏 55 寸' },
    viewDistance: { en: '2–6 m', zhHant: '約 2–6 公尺', zhHans: '约 2–6 米' },
    install: { en: 'Wall mount, mains power + network', zhHant: '掛牆安裝，需市電及網絡', zhHans: '挂墙安装，需市电及网络' },
    contentSpec: { en: 'Landscape 16:9, MP4 H.264, 1920×1080', zhHant: '橫向 16:9、MP4 H.264、1920×1080', zhHans: '横向 16:9、MP4 H.264、1920×1080' },
    useCases: { en: 'Retail entrance, restaurant, gym, office lobby', zhHant: '零售入口、餐廳、健身房、辦公室大堂', zhHans: '零售入口、餐厅、健身房、办公室大堂' },
    dailyRate: 480, weight: 1.6
  },
  ooh_75w: {
    id: 'ooh_75w', form: 'screen', sku: 'OOH-75W', sizeInch: 75, orientation: 'landscape',
    label: { en: 'OOH screen 75" outdoor-rated', zhHant: 'OOH 戶外級大屏 75 吋', zhHans: 'OOH 户外级大屏 75 寸' },
    viewDistance: { en: '3–12 m', zhHant: '約 3–12 公尺', zhHans: '约 3–12 米' },
    install: { en: 'Rigid frame mount, weatherproof power + network', zhHant: '固定框架安裝，需防水供電及網絡', zhHans: '固定框架安装，需防水供电及网络' },
    contentSpec: { en: 'Landscape 16:9, MP4 H.264, 3840×2160', zhHant: '橫向 16:9、MP4 H.264、3840×2160', zhHans: '横向 16:9、MP4 H.264、3840×2160' },
    useCases: { en: 'High-street facade, transport hub, mall entrance', zhHant: '街舖外牆、交通樞紐、商場入口', zhHans: '临街外墙、交通枢纽、商场入口' },
    dailyRate: 760, weight: 2.2
  }
};

/* --- Taxonomies ------------------------------------------------------------ */
window.LG_VENUES = [
  { id: 'mall',        mult: 1.15, label: { en: 'Shopping mall',      zhHant: '購物商場', zhHans: '购物商场' } },
  { id: 'retail',      mult: 0.95, label: { en: 'Retail store',       zhHant: '零售店舖', zhHans: '零售店铺' } },
  { id: 'restaurant',  mult: 0.85, label: { en: 'Restaurant / café',  zhHant: '餐廳／咖啡店', zhHans: '餐厅／咖啡店' } },
  { id: 'clinic',      mult: 0.80, label: { en: 'Clinic / health',    zhHant: '診所／醫療', zhHans: '诊所／医疗' } },
  { id: 'office',      mult: 0.90, label: { en: 'Office lobby',       zhHant: '辦公大樓大堂', zhHans: '办公大楼大堂' } },
  { id: 'gym',         mult: 0.80, label: { en: 'Gym / wellness',     zhHant: '健身／養生', zhHans: '健身／养生' } },
  { id: 'hotel',       mult: 1.10, label: { en: 'Hotel',              zhHant: '酒店', zhHans: '酒店' } },
  { id: 'exhibition',  mult: 1.25, label: { en: 'Exhibition / event', zhHant: '展覽／活動場地', zhHans: '展览／活动场地' } },
  { id: 'transport',   mult: 1.30, label: { en: 'Transport hub',      zhHant: '交通樞紐', zhHans: '交通枢纽' } },
  { id: 'cinema',      mult: 1.15, label: { en: 'Cinema / F&B hub',   zhHant: '戲院／餐飲集中地', zhHans: '影院／餐饮集中地' } },
  { id: 'campus',      mult: 0.75, label: { en: 'University / campus', zhHant: '大學／校園', zhHans: '大学／校园' } },
  { id: 'supermarket', mult: 0.85, label: { en: 'Supermarket',        zhHant: '超級市場', zhHans: '超级市场' } }
];

/* Schematic map coordinates (0–100 on both axes) — stylised, not to scale. */
window.LG_DISTRICTS = [
  { id: 'central',   x: 52, y: 74, label: { en: 'Central & Western', zhHant: '中西區', zhHans: '中西区' } },
  { id: 'wanchai',   x: 58, y: 72, label: { en: 'Wan Chai',          zhHant: '灣仔',   zhHans: '湾仔' } },
  { id: 'eastern',   x: 66, y: 70, label: { en: 'Eastern',           zhHant: '東區',   zhHans: '东区' } },
  { id: 'southern',  x: 54, y: 84, label: { en: 'Southern',          zhHant: '南區',   zhHans: '南区' } },
  { id: 'tsimshatsui', x: 55, y: 60, label: { en: 'Tsim Sha Tsui',   zhHant: '尖沙咀', zhHans: '尖沙咀' } },
  { id: 'mongkok',   x: 52, y: 55, label: { en: 'Mong Kok / Yau Tsim Mong', zhHant: '旺角／油尖旺', zhHans: '旺角／油尖旺' } },
  { id: 'shamshuipo', x: 44, y: 53, label: { en: 'Sham Shui Po',     zhHant: '深水埗', zhHans: '深水埗' } },
  { id: 'kowlooncity', x: 60, y: 52, label: { en: 'Kowloon City',    zhHant: '九龍城', zhHans: '九龙城' } },
  { id: 'kwuntong',  x: 70, y: 51, label: { en: 'Kwun Tong',         zhHant: '觀塘',   zhHans: '观塘' } },
  { id: 'wongtaisin', x: 62, y: 47, label: { en: 'Wong Tai Sin',     zhHant: '黃大仙', zhHans: '黄大仙' } },
  { id: 'tsuenwan',  x: 36, y: 40, label: { en: 'Tsuen Wan',         zhHant: '荃灣',   zhHans: '荃湾' } },
  { id: 'kwaihing',  x: 42, y: 44, label: { en: 'Kwai Chung',        zhHant: '葵涌',   zhHans: '葵涌' } },
  { id: 'shatin',    x: 58, y: 38, label: { en: 'Sha Tin',           zhHant: '沙田',   zhHans: '沙田' } },
  { id: 'taipo',     x: 63, y: 26, label: { en: 'Tai Po',            zhHant: '大埔',   zhHans: '大埔' } },
  { id: 'yuenlong',  x: 30, y: 22, label: { en: 'Yuen Long',         zhHant: '元朗',   zhHans: '元朗' } },
  { id: 'tuenmun',   x: 20, y: 30, label: { en: 'Tuen Mun',          zhHant: '屯門',   zhHans: '屯门' } },
  { id: 'saikung',   x: 78, y: 38, label: { en: 'Sai Kung',          zhHant: '西貢',   zhHans: '西贡' } },
  { id: 'tungchung', x: 14, y: 60, label: { en: 'Tung Chung / Islands', zhHant: '東涌／離島', zhHans: '东涌／离岛', th: 'ตุงชุง / เกาะต่าง ๆ' } },

  /* --- Thailand --------------------------------------------------------- */
  { id: 'siam',      x: 52, y: 44, market: 'th', label: { en: 'Siam / Pathum Wan',     zhHant: '暹羅／巴吞旺',         zhHans: '暹罗／巴吞旺',         th: 'สยาม–ปทุมวัน' } },
  { id: 'sukhumvit', x: 56, y: 46, market: 'th', label: { en: 'Sukhumvit / Asok',      zhHant: '素坤逸／阿索',         zhHans: '素坤逸／阿索',         th: 'สุขุมวิท–อโศก' } },
  { id: 'silom',     x: 53, y: 50, market: 'th', label: { en: 'Silom / Sathorn',       zhHant: '是隆／沙吞',           zhHans: '是隆／沙吞',           th: 'สีลม–สาทร' } },
  { id: 'ladprao',   x: 57, y: 38, market: 'th', label: { en: 'Lat Phrao / Chatuchak', zhHant: '拉拋／洽圖洽',         zhHans: '拉抛／乍都乍',         th: 'ลาดพร้าว–จตุจักร' } },
  { id: 'ratchada',  x: 55, y: 42, market: 'th', label: { en: 'Ratchada / Rama IX',    zhHant: '拉差達／拉瑪九',       zhHans: '拉差达／拉玛九',       th: 'รัชดา–พระราม 9' } },
  { id: 'chiangmai', x: 40, y: 12, market: 'th', label: { en: 'Chiang Mai',            zhHant: '清邁',                 zhHans: '清迈',                 th: 'เชียงใหม่' } },
  { id: 'phuket',    x: 34, y: 84, market: 'th', label: { en: 'Phuket',                zhHant: '普吉',                 zhHans: '普吉',                 th: 'ภูเก็ต' } },
  { id: 'pattaya',   x: 58, y: 58, market: 'th', label: { en: 'Pattaya / Chonburi',    zhHant: '芭堤雅／春武里',       zhHans: '芭堤雅／春武里',       th: 'พัทยา–ชลบุรี' } },
  { id: 'rayong',    x: 64, y: 60, market: 'th', label: { en: 'Rayong / EEC',          zhHant: '羅勇／東部經濟走廊',   zhHans: '罗勇／东部经济走廊',   th: 'ระยอง–อีอีซี' } },
  { id: 'huahin',    x: 48, y: 66, market: 'th', label: { en: 'Hua Hin / Prachuap',    zhHant: '華欣／巴蜀',           zhHans: '华欣／巴蜀',           th: 'หัวหิน–ประจวบฯ' } },
  { id: 'korat',     x: 62, y: 30, market: 'th', label: { en: 'Nakhon Ratchasima',     zhHant: '呵叻（那空叻差是瑪）', zhHans: '呵叻（那空叻差是玛）', th: 'นครราชสีมา' } },
  { id: 'khonkaen',  x: 64, y: 22, market: 'th', label: { en: 'Khon Kaen',             zhHant: '孔敬',                 zhHans: '孔敬',                 th: 'ขอนแก่น' } },
  { id: 'udon',      x: 66, y: 16, market: 'th', label: { en: 'Udon Thani',            zhHant: '烏隆他尼',             zhHans: '乌隆他尼',             th: 'อุดรธานี' } },
  { id: 'hatyai',    x: 40, y: 92, market: 'th', label: { en: 'Hat Yai / Songkhla',    zhHant: '合艾／宋卡',           zhHans: '合艾／宋卡',           th: 'หาดใหญ่–สงขลา' } },
  { id: 'samui',     x: 46, y: 78, market: 'th', label: { en: 'Koh Samui / Surat',     zhHant: '蘇梅島／素叻',         zhHans: '苏梅岛／素叻',         th: 'เกาะสมุย–สุราษฎร์ฯ' } }
];

window.LG_OBJECTIVES = [
  { id: 'awareness',  label: { en: 'Brand awareness',      zhHant: '品牌曝光',   zhHans: '品牌曝光' } },
  { id: 'promotion',  label: { en: 'Product promotion',    zhHant: '產品推廣',   zhHans: '产品推广' } },
  { id: 'traffic',    label: { en: 'Store traffic',        zhHant: '門店引流',   zhHans: '门店引流' } },
  { id: 'event',      label: { en: 'Event promotion',      zhHant: '活動宣傳',   zhHans: '活动宣传' } },
  { id: 'coupon',     label: { en: 'Coupon redemption',    zhHant: '優惠券核銷', zhHans: '优惠券核销' } },
  { id: 'lead',       label: { en: 'Lead generation',      zhHant: '名單收集',   zhHans: '名单收集' } }
];

window.LG_CATEGORIES = [
  { id: 'alcohol',   label: { en: 'Alcohol',        zhHant: '酒精飲品', zhHans: '酒精饮品' } },
  { id: 'tobacco',   label: { en: 'Tobacco / vaping', zhHant: '煙草／電子煙', zhHans: '烟草／电子烟' } },
  { id: 'gambling',  label: { en: 'Gambling',       zhHant: '博彩',     zhHans: '博彩' } },
  { id: 'finance',   label: { en: 'Financial products', zhHant: '金融產品', zhHans: '金融产品' } },
  { id: 'medical',   label: { en: 'Medical / health claims', zhHant: '醫療／療效聲稱', zhHans: '医疗／疗效声称' } },
  { id: 'politics',  label: { en: 'Political',      zhHant: '政治',     zhHans: '政治' } },
  { id: 'competitor',label: { en: 'Direct competitor', zhHant: '直接競爭對手', zhHans: '直接竞争对手' } },
  { id: 'gaming',    label: { en: 'Gaming / betting apps', zhHant: '遊戲／投注應用', zhHans: '游戏／投注应用' } }
];

window.LG_CREATIVE_STYLES = [
  { id: 'premium',   label: { en: 'Premium minimal', zhHant: '高端簡約', zhHans: '高端简约' } },
  { id: 'vibrant',   label: { en: 'Vibrant retail',  zhHant: '搶眼零售', zhHans: '抢眼零售' } },
  { id: 'festive',   label: { en: 'Festive',         zhHant: '節日喜慶', zhHans: '节日喜庆' } },
  { id: 'tech',      label: { en: 'Tech / futuristic', zhHant: '科技未來感', zhHans: '科技未来感' } },
  { id: 'warm',      label: { en: 'Warm & human',    zhHant: '溫暖人情味', zhHans: '温暖人情味' } }
];

/* --- Marketplace inventory -------------------------------------------------
 * x/y are schematic map positions (percent of the map panel).
 * -------------------------------------------------------------------------*/
window.LG_SEED_LOCATIONS = [
  {
    id: 'LC-1042', verified: true, status: 'live', featured: true,
    name: { en: 'Harbour City — Ocean Terminal Atrium', zhHant: '海港城 — 海運大廈中庭', zhHans: '海港城 — 海运大厦中庭' },
    district: 'tsimshatsui', venue: 'mall',
    address: { en: '3-27 Canton Road, Tsim Sha Tsui', zhHant: '尖沙咀廣東道 3-27 號', zhHans: '尖沙咀广东道 3-27 号' },
    x: 54, y: 58, footfallPerDay: 86000, dwellSec: 42, visibility: 0.55,
    rating: 4.8, reviews: 126, bookedPct: 62, minDays: 3,
    landlord: { en: 'Harbour Front Property Management', zhHant: '海濱物業管理', zhHans: '海滨物业管理' },
    restrictions: ['alcohol', 'tobacco', 'gambling', 'politics'],
    devices: [
      { id: 'DV-1042-A', type: 'holo_p65yd', position: { en: 'Atrium centre, hanging 2.6 m', zhHant: '中庭中央，吊裝 2.6 公尺', zhHans: '中庭中央，吊装 2.6 米' }, online: true, uptime: 99.2 },
      { id: 'DV-1042-B', type: 'holo_p65yd', position: { en: 'North concourse, floor stand', zhHant: '北面走廊，落地支架', zhHans: '北面走廊，落地支架' }, online: true, uptime: 98.4 },
      { id: 'DV-1042-C', type: 'ooh_75w',   position: { en: 'Ocean Terminal entrance facade', zhHant: '海運大廈入口外牆', zhHans: '海运大厦入口外墙' }, online: true, uptime: 99.7 }
    ]
  },
  {
    id: 'LC-2087', verified: true, status: 'live',
    name: { en: 'Central Medical Tower — Lift Lobby', zhHant: '中環醫療大廈 — 電梯大堂', zhHans: '中环医疗大厦 — 电梯厅' },
    district: 'central', venue: 'clinic',
    address: { en: '12 Queen\'s Road Central', zhHant: '中環皇后大道中 12 號', zhHans: '中环皇后大道中 12 号' },
    x: 52, y: 73, footfallPerDay: 9400, dwellSec: 95, visibility: 0.7,
    rating: 4.6, reviews: 41, bookedPct: 38, minDays: 7,
    landlord: { en: 'Central Medical Tower Owners\' Corp.', zhHant: '中環醫療大廈業主立案法團', zhHans: '中环医疗大厦业主立案法团' },
    restrictions: ['alcohol', 'tobacco', 'gambling', 'competitor'],
    devices: [
      { id: 'DV-2087-A', type: 'ooh_43v', position: { en: 'Lift lobby, 6th floor', zhHant: '6 樓電梯大堂', zhHans: '6 楼电梯厅' }, online: true, uptime: 97.9 },
      { id: 'DV-2087-B', type: 'holo_p30s', position: { en: 'Reception counter', zhHant: '接待櫃檯', zhHans: '接待柜台' }, online: true, uptime: 99.1 }
    ]
  },
  {
    id: 'LC-3311', verified: true, status: 'live', featured: true,
    name: { en: 'Mong Kok Flagship Corner — Sai Yeung Choi St', zhHant: '旺角旗艦街角 — 西洋菜南街', zhHans: '旺角旗舰街角 — 西洋菜南街' },
    district: 'mongkok', venue: 'retail',
    address: { en: 'Sai Yeung Choi Street South, Mong Kok', zhHant: '旺角西洋菜南街', zhHans: '旺角西洋菜南街' },
    x: 51, y: 55, footfallPerDay: 128000, dwellSec: 18, visibility: 0.4,
    rating: 4.4, reviews: 208, bookedPct: 78, minDays: 1,
    landlord: { en: 'Kowloon High Street Retail Ltd', zhHant: '九龍高街零售有限公司', zhHans: '九龙高街零售有限公司' },
    restrictions: ['tobacco', 'gambling'],
    devices: [
      { id: 'DV-3311-A', type: 'ooh_75w',   position: { en: 'Shop facade, street level', zhHant: '地舖外牆', zhHans: '地铺外墙' }, online: true, uptime: 96.8 },
      { id: 'DV-3311-B', type: 'holo_p65yd', position: { en: 'Entrance canopy', zhHant: '入口簷篷', zhHans: '入口雨棚' }, online: false, uptime: 88.2 }
    ]
  },
  {
    id: 'LC-4520', verified: true, status: 'live',
    name: { en: 'Kwun Tong Harbourfront Office Lobby', zhHant: '觀塘海濱辦公大樓大堂', zhHans: '观塘海滨办公大楼大堂' },
    district: 'kwuntong', venue: 'office',
    address: { en: 'Hoi Bun Road, Kwun Tong', zhHant: '觀塘海濱道', zhHans: '观塘海滨道' },
    x: 69, y: 51, footfallPerDay: 15600, dwellSec: 55, visibility: 0.62,
    rating: 4.5, reviews: 63, bookedPct: 45, minDays: 7,
    landlord: { en: 'East Kowloon Business Park', zhHant: '東九龍商業園', zhHans: '东九龙商业园' },
    restrictions: ['politics', 'competitor'],
    devices: [
      { id: 'DV-4520-A', type: 'ooh_55w', position: { en: 'Main lobby turnstiles', zhHant: '主大堂閘機前', zhHans: '主大堂闸机前' }, online: true, uptime: 99.4 },
      { id: 'DV-4520-B', type: 'holo_p30s', position: { en: 'Concierge desk', zhHant: '禮賓櫃檯', zhHans: '礼宾柜台' }, online: true, uptime: 98.9 }
    ]
  },
  {
    id: 'LC-5104', verified: true, status: 'live',
    name: { en: 'Sha Tin New Town Plaza — Dining Concourse', zhHant: '沙田新城市廣場 — 食肆樓層', zhHans: '沙田新城市广场 — 餐饮楼层' },
    district: 'shatin', venue: 'restaurant',
    address: { en: '18 Sha Tin Centre Street', zhHant: '沙田正街 18 號', zhHans: '沙田正街 18 号' },
    x: 57, y: 39, footfallPerDay: 42000, dwellSec: 68, visibility: 0.66,
    rating: 4.7, reviews: 94, bookedPct: 55, minDays: 3,
    landlord: { en: 'New Territories Malls Management', zhHant: '新界商場管理', zhHans: '新界商场管理' },
    restrictions: ['tobacco', 'gambling', 'politics'],
    devices: [
      { id: 'DV-5104-A', type: 'holo_p65yd', position: { en: 'Dining concourse centre', zhHant: '食肆樓層中央', zhHans: '餐饮楼层中央' }, online: true, uptime: 99.0 },
      { id: 'DV-5104-B', type: 'ooh_43v',   position: { en: 'Queue area, L1', zhHant: 'L1 輪候區', zhHans: 'L1 候餐区' }, online: true, uptime: 97.5 }
    ]
  },
  {
    id: 'LC-6233', verified: true, status: 'live',
    name: { en: 'Tsuen Wan Fitness & Wellness Studio', zhHant: '荃灣健身及養生中心', zhHans: '荃湾健身及养生中心' },
    district: 'tsuenwan', venue: 'gym',
    address: { en: 'Castle Peak Road, Tsuen Wan', zhHant: '荃灣青山公路', zhHans: '荃湾青山公路' },
    x: 36, y: 41, footfallPerDay: 3200, dwellSec: 2400, visibility: 0.75,
    rating: 4.3, reviews: 28, bookedPct: 22, minDays: 14,
    landlord: { en: 'Pulse Wellness Group', zhHant: 'Pulse 養生集團', zhHans: 'Pulse 养生集团' },
    restrictions: ['alcohol', 'tobacco', 'gambling', 'medical'],
    devices: [
      { id: 'DV-6233-A', type: 'ooh_55w', position: { en: 'Cardio zone wall', zhHant: '帶氧運動區牆面', zhHans: '有氧运动区墙面' }, online: true, uptime: 99.6 }
    ]
  },
  {
    id: 'LC-7712', verified: true, status: 'live',
    name: { en: 'Hong Kong Convention Centre — Hall 3 Foyer', zhHant: '香港會議展覽中心 — 3 號展廳前廳', zhHans: '香港会议展览中心 — 3 号展厅前厅' },
    district: 'wanchai', venue: 'exhibition',
    address: { en: '1 Expo Drive, Wan Chai', zhHant: '灣仔博覽道 1 號', zhHans: '湾仔博览道 1 号' },
    x: 58, y: 71, footfallPerDay: 31000, dwellSec: 35, visibility: 0.6,
    rating: 4.9, reviews: 77, bookedPct: 88, minDays: 1,
    landlord: { en: 'Ventures Exhibition Services', zhHant: '會展展覽服務', zhHans: '会展展览服务' },
    restrictions: ['tobacco', 'gambling', 'politics'],
    devices: [
      { id: 'DV-7712-A', type: 'holo_p65yd', position: { en: 'Hall 3 foyer, hanging banner rig', zhHant: '3 號展廳前廳吊裝', zhHans: '3 号展厅前厅吊装' }, online: true, uptime: 99.8 },
      { id: 'DV-7712-B', type: 'holo_p65yd', position: { en: 'Registration desk cluster', zhHant: '登記櫃檯群', zhHans: '登记柜台群' }, online: true, uptime: 99.1 },
      { id: 'DV-7712-C', type: 'ooh_55w',   position: { en: 'Escalator landing', zhHant: '扶手電梯出口', zhHans: '扶梯出口' }, online: true, uptime: 98.6 }
    ]
  },
  {
    id: 'LC-8145', verified: true, status: 'live',
    name: { en: 'Tung Chung Citygate — Transport Interchange', zhHant: '東涌東薈城 — 交通交匯處', zhHans: '东涌东荟城 — 交通交汇处' },
    district: 'tungchung', venue: 'transport',
    address: { en: '20 Tat Tung Road, Tung Chung', zhHant: '東涌達東路 20 號', zhHans: '东涌达东路 20 号' },
    x: 15, y: 60, footfallPerDay: 64000, dwellSec: 26, visibility: 0.48,
    rating: 4.5, reviews: 58, bookedPct: 70, minDays: 3,
    landlord: { en: 'Lantau Interchange Retail', zhHant: '大嶼山交匯零售', zhHans: '大屿山交汇零售' },
    restrictions: ['tobacco', 'gambling', 'politics'],
    devices: [
      { id: 'DV-8145-A', type: 'ooh_75w',   position: { en: 'Bus terminus concourse', zhHant: '巴士總站大堂', zhHans: '巴士总站大堂' }, online: true, uptime: 98.1 },
      { id: 'DV-8145-B', type: 'holo_p65yd', position: { en: 'Mall link bridge', zhHant: '商場連接橋', zhHans: '商场连接桥' }, online: true, uptime: 97.2 }
    ]
  },
  {
    id: 'LC-9022', verified: true, status: 'live',
    name: { en: 'Causeway Bay Cinema & F&B Hub', zhHant: '銅鑼灣戲院及餐飲集中地', zhHans: '铜锣湾影院及餐饮集中地' },
    district: 'wanchai', venue: 'cinema',
    address: { en: 'Paterson Street, Causeway Bay', zhHant: '銅鑼灣百德新街', zhHans: '铜锣湾百德新街' },
    x: 59, y: 72, footfallPerDay: 52000, dwellSec: 46, visibility: 0.58,
    rating: 4.6, reviews: 143, bookedPct: 66, minDays: 3,
    landlord: { en: 'Island East Entertainment Ltd', zhHant: '港島東娛樂有限公司', zhHans: '港岛东娱乐有限公司' },
    restrictions: ['tobacco', 'gambling'],
    devices: [
      { id: 'DV-9022-A', type: 'holo_p65yd', position: { en: 'Cinema foyer centre', zhHant: '戲院大堂中央', zhHans: '影院大堂中央' }, online: true, uptime: 99.3 },
      { id: 'DV-9022-B', type: 'ooh_43v',   position: { en: 'Lift lobby, 3/F', zhHant: '3 樓電梯大堂', zhHans: '3 楼电梯厅' }, online: true, uptime: 98.8 }
    ]
  },
  {
    id: 'LC-1188', verified: true, status: 'live',
    name: { en: 'HKU Campus — Main Building Concourse', zhHant: '香港大學 — 本部大樓大堂', zhHans: '香港大学 — 本部大楼大堂' },
    district: 'central', venue: 'campus',
    address: { en: 'Pok Fu Lam Road, Hong Kong', zhHant: '香港薄扶林道', zhHans: '香港薄扶林道' },
    x: 50, y: 77, footfallPerDay: 26000, dwellSec: 38, visibility: 0.5,
    rating: 4.4, reviews: 19, bookedPct: 15, minDays: 14,
    landlord: { en: 'University Estates Office', zhHant: '大學物業處', zhHans: '大学物业处' },
    restrictions: ['alcohol', 'tobacco', 'gambling', 'politics'],
    devices: [
      { id: 'DV-1188-A', type: 'ooh_55w', position: { en: 'Concourse pillar', zhHant: '大堂柱位', zhHans: '大堂柱位' }, online: true, uptime: 99.5 },
      { id: 'DV-1188-B', type: 'holo_p30s', position: { en: 'Student union counter', zhHant: '學生會櫃檯', zhHans: '学生会柜台' }, online: true, uptime: 98.0 }
    ]
  },
  {
    id: 'LC-6677', verified: true, status: 'live', featured: true,
    name: { en: 'Wan Chai Hotel — Lobby & Lift Lobby', zhHant: '灣仔酒店 — 大堂及電梯大堂', zhHans: '湾仔酒店 — 大堂及电梯厅' },
    district: 'wanchai', venue: 'hotel',
    address: { en: 'Jaffe Road, Wan Chai', zhHant: '灣仔謝斐道', zhHans: '湾仔谢斐道' },
    x: 57, y: 72, footfallPerDay: 7800, dwellSec: 52, visibility: 0.68,
    rating: 4.7, reviews: 36, bookedPct: 41, minDays: 7,
    landlord: { en: 'Harbour View Hospitality', zhHant: '海景酒店管理', zhHans: '海景酒店管理' },
    restrictions: ['tobacco', 'gambling', 'politics'],
    devices: [
      { id: 'DV-6677-A', type: 'holo_p30s', position: { en: 'Front desk counter', zhHant: '前台櫃檯', zhHans: '前台柜台' }, online: true, uptime: 99.2 },
      { id: 'DV-6677-B', type: 'ooh_43v',   position: { en: 'Lift lobby, guest floors', zhHant: '客房樓層電梯大堂', zhHans: '客房楼层电梯厅' }, online: true, uptime: 97.7 }
    ]
  },
  {
    id: 'LC-3390', verified: true, status: 'live',
    name: { en: 'Sai Kung Waterfront Supermarket', zhHant: '西貢海濱超級市場', zhHans: '西贡海滨超级市场' },
    district: 'saikung', venue: 'supermarket',
    address: { en: 'Man Nin Street, Sai Kung', zhHant: '西貢萬年街', zhHans: '西贡万年街' },
    x: 78, y: 39, footfallPerDay: 12000, dwellSec: 34, visibility: 0.55,
    rating: 4.2, reviews: 24, bookedPct: 30, minDays: 7,
    landlord: { en: 'Sai Kung Community Retail', zhHant: '西貢社區零售', zhHans: '西贡社区零售' },
    restrictions: ['tobacco', 'gambling'],
    devices: [
      { id: 'DV-3390-A', type: 'holo_p30s', position: { en: 'Checkout queue line', zhHant: '收銀輪候線', zhHans: '收银排队线' }, online: true, uptime: 98.3 }
    ]
  },
  /* --- Awaiting operator verification (landlord-submitted) ------------------ */
  {
    id: 'LC-4401', verified: false, status: 'pending',
    name: { en: 'Yuen Long YOHO Mall — L2 Link Bridge', zhHant: '元朗形點 — L2 連接橋', zhHans: '元朗形点 — L2 连接桥' },
    district: 'yuenlong', venue: 'mall',
    address: { en: '9 Long Yat Road, Yuen Long', zhHant: '元朗朗日路 9 號', zhHans: '元朗朗日路 9 号' },
    x: 30, y: 23, footfallPerDay: 38000, dwellSec: 40, visibility: 0.52,
    rating: 0, reviews: 0, bookedPct: 0, minDays: 3,
    landlord: { en: 'Northwest Malls Ltd', zhHant: '西北商場有限公司', zhHans: '西北商场有限公司' },
    restrictions: ['tobacco', 'gambling', 'politics'],
    devices: [
      { id: 'DV-4401-A', type: 'holo_p65yd', position: { en: 'Link bridge, L2', zhHant: 'L2 連接橋', zhHans: 'L2 连接桥' }, online: false, uptime: 0 }
    ]
  },
  {
    id: 'LC-4402', verified: false, status: 'pending',
    name: { en: 'Tai Po Market — Clinic Waiting Hall', zhHant: '大埔街市 — 診所輪候大堂', zhHans: '大埔街市 — 诊所候诊大堂' },
    district: 'taipo', venue: 'clinic',
    address: { en: 'Tai Po Market, New Territories', zhHant: '新界大埔墟', zhHans: '新界大埔墟' },
    x: 63, y: 27, footfallPerDay: 6800, dwellSec: 110, visibility: 0.72,
    rating: 0, reviews: 0, bookedPct: 0, minDays: 7,
    landlord: { en: 'Tai Po Health Centre', zhHant: '大埔健康中心', zhHans: '大埔健康中心' },
    restrictions: ['alcohol', 'tobacco', 'gambling'],
    devices: [
      { id: 'DV-4402-A', type: 'ooh_43v', position: { en: 'Waiting hall wall', zhHant: '輪候大堂牆面', zhHans: '候诊大堂墙面' }, online: false, uptime: 0 }
    ]
  },

  /* ======================= THAILAND MARKET ============================= */
  {
    id: 'TH-2001', market: 'th', verified: true, status: 'live', featured: true,
    name: { en: 'Siam Paragon — Parc Paragon Atrium', th: 'สยามพารากอน — เอเทรียม พาร์ค พารากอน', zhHant: '暹羅百麗宮 — Parc Paragon 中庭', zhHans: '暹罗百丽宫 — Parc Paragon 中庭' },
    district: 'siam', venue: 'mall',
    address: { en: '991 Rama I Road, Pathum Wan, Bangkok', th: '991 ถนนพระรามที่ 1 ปทุมวัน กรุงเทพฯ', zhHant: '曼谷巴吞旺拉瑪一世路 991 號', zhHans: '曼谷巴吞旺拉玛一世路 991 号' },
    x: 52, y: 44, footfallPerDay: 95000, dwellSec: 40, visibility: 0.55,
    rating: 4.8, reviews: 118, bookedPct: 58, minDays: 3,
    landlord: { en: 'Siam Retail Group', th: 'สยามรีเทลกรุ๊ป', zhHant: '暹羅零售集團', zhHans: '暹罗零售集团' },
    restrictions: ['tobacco', 'gambling', 'politics'],
    devices: [
      { id: 'DV-2001-A', type: 'holo_p65yd', position: { en: 'Atrium centre, hanging 2.8 m', th: 'กลางเอเทรียม แขวน 2.8 ม.', zhHant: '中庭中央，吊裝 2.8 公尺', zhHans: '中庭中央，吊装 2.8 米' }, online: true, uptime: 99.1 },
      { id: 'DV-2001-B', type: 'holo_p65yd', position: { en: 'North walkway, floor stand', th: 'ทางเดินเหนือ ชุดขาตั้งพื้น', zhHant: '北面走廊，落地支架', zhHans: '北面走廊，落地支架' }, online: true, uptime: 98.6 },
      { id: 'DV-2001-C', type: 'ooh_75w', position: { en: 'Rama I entrance facade', th: 'ด้านหน้าทางเข้าถนนพระรามที่ 1', zhHant: '拉瑪一世路入口外牆', zhHans: '拉玛一世路入口外墙' }, online: true, uptime: 99.4 }
    ]
  },
  {
    id: 'TH-2002', market: 'th', verified: true, status: 'live',
    name: { en: 'Terminal 21 Asok — Floor 2 Link', th: 'เทอร์มินัล 21 อโศก — ทางเชื่อมชั้น 2', zhHant: 'Terminal 21 阿索 — 二樓連接通道', zhHans: 'Terminal 21 阿索 — 二楼连廊' },
    district: 'sukhumvit', venue: 'mall',
    address: { en: '88 Sukhumvit Soi 19, Watthana, Bangkok', th: '88 สุขุมวิท ซอย 19 วัฒนา กรุงเทพฯ', zhHant: '曼谷瓦他那素坤逸 19 巷 88 號', zhHans: '曼谷瓦他那素坤逸 19 巷 88 号' },
    x: 56, y: 46, footfallPerDay: 62000, dwellSec: 34, visibility: 0.5,
    rating: 4.6, reviews: 86, bookedPct: 66, minDays: 3,
    landlord: { en: 'Sukhumvit Mall Management', th: 'สุขุมวิท มอลล์ แมเนจเมนต์', zhHant: '素坤逸商場管理', zhHans: '素坤逸商场管理' },
    restrictions: ['tobacco', 'gambling'],
    devices: [
      { id: 'DV-2002-A', type: 'holo_p65yd', position: { en: 'BTS skywalk link, hanging', th: 'ทางเชื่อม BTS แขวน', zhHant: 'BTS 天橋連接處吊裝', zhHans: 'BTS 天桥连接处吊装' }, online: true, uptime: 98.9 },
      { id: 'DV-2002-B', type: 'ooh_55w', position: { en: 'MRT entrance wall', th: 'ผนังทางเข้า MRT', zhHant: 'MRT 入口牆面', zhHans: 'MRT 入口墙面' }, online: true, uptime: 97.8 }
    ]
  },
  {
    id: 'TH-2003', market: 'th', verified: true, status: 'live',
    name: { en: 'Silom Complex — BTS Sala Daeng Lobby', th: 'สีลมคอมเพล็กซ์ — ล็อบบี้ BTS ศาลาแดง', zhHant: '是隆複合大樓 — BTS 沙拉鈴大堂', zhHans: '是隆复合大楼 — BTS 沙拉铃大堂' },
    district: 'silom', venue: 'office',
    address: { en: '191 Silom Road, Bang Rak, Bangkok', th: '191 ถนนสีลม บางรัก กรุงเทพฯ', zhHant: '曼谷邦拉是隆路 191 號', zhHans: '曼谷邦拉是隆路 191 号' },
    x: 53, y: 50, footfallPerDay: 24000, dwellSec: 62, visibility: 0.66,
    rating: 4.5, reviews: 44, bookedPct: 44, minDays: 7,
    landlord: { en: 'Silom Property Co.', th: 'สีลม พร็อพเพอร์ตี้', zhHant: '是隆物業', zhHans: '是隆物业' },
    restrictions: ['alcohol', 'tobacco', 'gambling', 'competitor'],
    devices: [
      { id: 'DV-2003-A', type: 'ooh_43v', position: { en: 'Office lift lobby, 12th floor', th: 'ล็อบบี้ลิฟต์สำนักงาน ชั้น 12', zhHant: '12 樓辦公電梯大堂', zhHans: '12 楼办公电梯厅' }, online: true, uptime: 99.3 },
      { id: 'DV-2003-B', type: 'holo_p30s', position: { en: 'Reception counter', th: 'เคาน์เตอร์ต้อนรับ', zhHant: '接待櫃檯', zhHans: '接待柜台' }, online: true, uptime: 98.4 }
    ]
  },
  {
    id: 'TH-2004', market: 'th', verified: true, status: 'live', featured: true,
    name: { en: 'Central Plaza Lat Phrao — Weekend Market Link', th: 'เซ็นทรัลพลาซา ลาดพร้าว — ทางเชื่อมตลาดนัด', zhHant: '拉拋中央廣場 — 週末市集連廊', zhHans: '拉抛中央广场 — 周末市集连廊' },
    district: 'ladprao', venue: 'retail',
    address: { en: '1693 Phahonyothin Road, Chatuchak, Bangkok', th: '1693 ถนนพหลโยธิน จตุจักร กรุงเทพฯ', zhHant: '曼谷乍都乍拍鳳裕庭路 1693 號', zhHans: '曼谷乍都乍拍凤裕庭路 1693 号' },
    x: 57, y: 38, footfallPerDay: 78000, dwellSec: 22, visibility: 0.42,
    rating: 4.4, reviews: 132, bookedPct: 71, minDays: 1,
    landlord: { en: 'CPN Retail Growth', th: 'ซีพีเอ็น รีเทล โกรว์ธ', zhHant: 'CPN 零售發展', zhHans: 'CPN 零售发展' },
    restrictions: ['tobacco', 'gambling'],
    devices: [
      { id: 'DV-2004-A', type: 'ooh_75w', position: { en: 'MRT Phahon Yothin exit facade', th: 'ด้านหน้าทางออก MRT พหลโยธิน', zhHant: 'MRT 拍鳳裕庭站出口外牆', zhHans: 'MRT 拍凤裕庭站出口外墙' }, online: true, uptime: 98.2 },
      { id: 'DV-2004-B', type: 'holo_p65yd', position: { en: 'Market walkway entrance', th: 'ทางเข้าลานตลาดนัด', zhHant: '市集入口通道', zhHans: '市集入口通道' }, online: true, uptime: 97.6 }
    ]
  },
  {
    id: 'TH-2005', market: 'th', verified: true, status: 'live',
    name: { en: 'RCA / Rama IX Entertainment Strip', th: 'อาร์ซีเอ — พระราม 9 ย่านบันเทิง', zhHant: 'RCA／拉瑪九娛樂區', zhHans: 'RCA／拉玛九娱乐区' },
    district: 'ratchada', venue: 'cinema',
    address: { en: 'Royal City Avenue, Rama IX, Bangkok', th: 'ถนนRoyal City Avenue พระราม 9 กรุงเทพฯ', zhHant: '曼谷拉瑪九 Royal City Avenue', zhHans: '曼谷拉玛九 Royal City Avenue' },
    x: 55, y: 42, footfallPerDay: 38000, dwellSec: 48, visibility: 0.58,
    rating: 4.3, reviews: 57, bookedPct: 52, minDays: 3,
    landlord: { en: 'RCA Entertainment Association', th: 'สมาคมบันเทิงอาร์ซีเอ', zhHant: 'RCA 娛樂協會', zhHans: 'RCA 娱乐协会' },
    restrictions: ['tobacco', 'gambling', 'politics'],
    devices: [
      { id: 'DV-2005-A', type: 'holo_p65yd', position: { en: 'Cinema foyer centre', th: 'กลางโถงโรงภาพยนตร์', zhHant: '戲院大堂中央', zhHans: '影院大堂中央' }, online: true, uptime: 99.0 },
      { id: 'DV-2005-B', type: 'ooh_55w', position: { en: 'Pedestrian street wall', th: 'ผนังทางเดินคนเดิน', zhHant: '行人街道牆面', zhHans: '步行街道墙面' }, online: true, uptime: 96.9 }
    ]
  },
  {
    id: 'TH-2006', market: 'th', verified: true, status: 'live',
    name: { en: 'One Nimman Chiang Mai — Lifestyle Court', th: 'วันนิมมาน เชียงใหม่ — ลานไลฟ์สไตล์', zhHant: 'One Nimman 清邁 — 生活廣場', zhHans: 'One Nimman 清迈 — 生活广场' },
    district: 'chiangmai', venue: 'restaurant',
    address: { en: 'Nimmanahaeminda Road, Suthep, Chiang Mai', th: 'ถนนนิมมานเหมินท์ สุเทพ เชียงใหม่', zhHant: '清邁素貼尼曼路', zhHans: '清迈素贴尼曼路' },
    x: 40, y: 12, footfallPerDay: 12000, dwellSec: 78, visibility: 0.7,
    rating: 4.7, reviews: 39, bookedPct: 30, minDays: 7,
    landlord: { en: 'Nimman One Co.', th: 'นิมมาน วัน', zhHant: 'Nimman One', zhHans: 'Nimman One' },
    restrictions: ['tobacco', 'gambling', 'politics'],
    devices: [
      { id: 'DV-2006-A', type: 'holo_p30s', position: { en: 'Café counter row', th: 'แถวเคาน์เตอร์คาเฟ่', zhHant: '咖啡店櫃檯列', zhHans: '咖啡店柜台排' }, online: true, uptime: 98.8 },
      { id: 'DV-2006-B', type: 'ooh_43v', position: { en: 'Courtyard entrance', th: 'ทางเข้าลานกลาง', zhHant: '中庭入口', zhHans: '中庭入口' }, online: true, uptime: 99.2 }
    ]
  },
  {
    id: 'TH-2007', market: 'th', verified: true, status: 'live',
    name: { en: 'Jungceylon Patong — Phuket', th: 'จังซีลอน ป่าตอง — ภูเก็ต', zhHant: '普吉芭東江西冷購物中心', zhHans: '普吉芭东江西冷购物中心' },
    district: 'phuket', venue: 'mall',
    address: { en: 'Rat-U-Thit 200 Pee Road, Patong, Phuket', th: 'ถนนราษฎร์อุทิศ 200 ปี ป่าตอง ภูเก็ต', zhHant: '普吉芭東拉差烏提 200 年路', zhHans: '普吉芭东拉差乌提 200 年路' },
    x: 34, y: 84, footfallPerDay: 44000, dwellSec: 36, visibility: 0.52,
    rating: 4.6, reviews: 74, bookedPct: 61, minDays: 3,
    landlord: { en: 'Jungceylon Management', th: 'จังซีลอน แมเนจเมนต์', zhHant: '江西冷管理公司', zhHans: '江西冷管理公司' },
    restrictions: ['tobacco', 'gambling'],
    devices: [
      { id: 'DV-2007-A', type: 'holo_p65yd', position: { en: 'Bazaar wing atrium', th: 'เอเทรียมโซนบาซาร์', zhHant: '市集區中庭', zhHans: '市集区中庭' }, online: true, uptime: 98.5 },
      { id: 'DV-2007-B', type: 'ooh_55w', position: { en: 'Beach-side entrance', th: 'ทางเข้าฝั่งหาด', zhHant: '海灘側入口', zhHans: '海滩侧入口' }, online: true, uptime: 97.4 }
    ]
  },
  {
    id: 'TH-2008', market: 'th', verified: true, status: 'live', featured: true,
    name: { en: 'Central Festival Pattaya Beach', th: 'เซ็นทรัลเฟสติวัล พัทยาบีช', zhHant: '芭堤雅中央節慶海灘購物中心', zhHans: '芭堤雅中央节庆海滩购物中心' },
    district: 'pattaya', venue: 'mall',
    address: { en: '333/99 Moo 9, Pattaya Beach Road, Chonburi', th: '333/99 หมู่ 9 ถนนพัทยาบีช ชลบุรี', zhHant: '春武里芭堤雅海灘路 333/99 號', zhHans: '春武里芭堤雅海滩路 333/99 号' },
    x: 58, y: 58, footfallPerDay: 52000, dwellSec: 33, visibility: 0.48,
    rating: 4.5, reviews: 91, bookedPct: 64, minDays: 3,
    landlord: { en: 'Pattaya Beach Retail', th: 'พัทยาบีช รีเทล', zhHant: '芭堤雅海灘零售', zhHans: '芭堤雅海滩零售' },
    restrictions: ['tobacco', 'gambling', 'politics'],
    devices: [
      { id: 'DV-2008-A', type: 'holo_p65yd', position: { en: 'Beach entrance atrium', th: 'เอเทรียมทางเข้าหาด', zhHant: '海灘入口中庭', zhHans: '海滩入口中庭' }, online: true, uptime: 99.0 },
      { id: 'DV-2008-B', type: 'holo_p65yd', position: { en: 'Food court level 3', th: 'ศูนย์อาหารชั้น 3', zhHant: '三樓美食廣場', zhHans: '三楼美食广场' }, online: true, uptime: 98.1 }
    ]
  },
  {
    id: 'TH-2009', market: 'th', verified: true, status: 'live',
    name: { en: 'BluPort Hua Hin — Resort Mall', th: 'บลูพอร์ต หัวหิน — รีสอร์ตมอลล์', zhHant: 'BluPort 華欣渡假購物中心', zhHans: 'BluPort 华欣度假购物中心' },
    district: 'huahin', venue: 'supermarket',
    address: { en: '8/89 Petchkasem Road, Hua Hin, Prachuap Khiri Khan', th: '8/89 ถนนเพชรเกษม หัวหิน ประจวบคีรีขันธ์', zhHant: '巴蜀華欣碧甲盛路 8/89 號', zhHans: '巴蜀华欣碧甲盛路 8/89 号' },
    x: 48, y: 66, footfallPerDay: 9500, dwellSec: 41, visibility: 0.6,
    rating: 4.4, reviews: 27, bookedPct: 26, minDays: 7,
    landlord: { en: 'BluPort Hua Hin', th: 'บลูพอร์ต หัวหิน', zhHant: 'BluPort 華欣', zhHans: 'BluPort 华欣' },
    restrictions: ['tobacco', 'gambling'],
    devices: [
      { id: 'DV-2009-A', type: 'holo_p30s', position: { en: 'Checkout queue line', th: 'แถวคิวชำระเงิน', zhHant: '收銀輪候線', zhHans: '收银排队线' }, online: true, uptime: 98.7 },
      { id: 'DV-2009-B', type: 'ooh_55w', position: { en: 'Resort lobby corridor', th: 'ทางเดินล็อบบี้รีสอร์ต', zhHant: '渡假村大堂走廊', zhHans: '度假村大堂走廊' }, online: true, uptime: 97.9 }
    ]
  },
  {
    id: 'TH-2010', market: 'th', verified: true, status: 'live',
    name: { en: 'Central Plaza Khon Kaen — Isaan Hub', th: 'เซ็นทรัลพลาซา ขอนแก่น — ศูนย์อีสาน', zhHant: '孔敬中央廣場 — 東北樞紐', zhHans: '孔敬中央广场 — 东北枢纽' },
    district: 'khonkaen', venue: 'mall',
    address: { en: '99/1 Mittraphap Road, Khon Kaen', th: '99/1 ถนนมิตรภาพ ขอนแก่น', zhHant: '孔敬友誼路 99/1 號', zhHans: '孔敬友谊路 99/1 号' },
    x: 64, y: 22, footfallPerDay: 31000, dwellSec: 30, visibility: 0.5,
    rating: 4.5, reviews: 52, bookedPct: 39, minDays: 7,
    landlord: { en: 'Khon Kaen Retail', th: 'ขอนแก่น รีเทล', zhHant: '孔敬零售', zhHans: '孔敬零售' },
    restrictions: ['tobacco', 'gambling', 'politics'],
    devices: [
      { id: 'DV-2010-A', type: 'holo_p65yd', position: { en: 'Main atrium', th: 'เอเทรียมหลัก', zhHant: '主中庭', zhHans: '主中庭' }, online: true, uptime: 98.3 },
      { id: 'DV-2010-B', type: 'ooh_43v', position: { en: 'Cinema lobby', th: 'ล็อบบี้โรงภาพยนตร์', zhHant: '戲院大堂', zhHans: '影院大堂' }, online: true, uptime: 97.1 }
    ]
  },
  {
    id: 'TH-2011', market: 'th', verified: true, status: 'live',
    name: { en: 'Central Festival Hat Yai — Southern Gateway', th: 'เซ็นทรัลเฟสติวัล หาดใหญ่ — ประตูใต้', zhHant: '合艾中央節慶 — 南部門戶', zhHans: '合艾中央节庆 — 南部门户' },
    district: 'hatyai', venue: 'mall',
    address: { en: '1518 Kanjanavanit Road, Hat Yai, Songkhla', th: '1518 ถนนกาญจนวนิช หาดใหญ่ สงขลา', zhHant: '宋卡合艾甘乍那翁路 1518 號', zhHans: '宋卡合艾甘乍那翁路 1518 号' },
    x: 40, y: 92, footfallPerDay: 28000, dwellSec: 32, visibility: 0.5,
    rating: 4.4, reviews: 61, bookedPct: 42, minDays: 7,
    landlord: { en: 'Hat Yai Mall Group', th: 'หาดใหญ่ มอลล์ กรุ๊ป', zhHant: '合艾商場集團', zhHans: '合艾商场集团' },
    restrictions: ['tobacco', 'gambling', 'politics'],
    devices: [
      { id: 'DV-2011-A', type: 'holo_p65yd', position: { en: 'Food hall atrium', th: 'เอเทรียมโซนอาหาร', zhHant: '美食廣場中庭', zhHans: '美食广场中庭' }, online: true, uptime: 98.0 },
      { id: 'DV-2011-B', type: 'ooh_55w', position: { en: 'Malaysia border shuttle bay', th: 'จุดรับส่งชายแดนมาเลเซีย', zhHant: '馬來西亞邊境接駁區', zhHans: '马来西亚边境接驳区' }, online: true, uptime: 96.8 }
    ]
  },
  {
    id: 'TH-2012', market: 'th', verified: true, status: 'live',
    name: { en: 'Central Festival Samui — Chaweng', th: 'เซ็นทรัลเฟสติวัล สมุย — เฉวง', zhHant: '蘇梅中央節慶 — 查汶', zhHans: '苏梅中央节庆 — 查汶' },
    district: 'samui', venue: 'hotel',
    address: { en: '209 Moo 2, Chaweng Beach Road, Koh Samui, Surat Thani', th: '209 หมู่ 2 ถนนหาดเฉวง เกาะสมุย สุราษฎร์ธานี', zhHant: '素叻蘇梅查汶海灘路 209 號', zhHans: '素叻苏梅查汶海滩路 209 号' },
    x: 46, y: 78, footfallPerDay: 15000, dwellSec: 55, visibility: 0.62,
    rating: 4.6, reviews: 33, bookedPct: 33, minDays: 7,
    landlord: { en: 'Samui Island Retail', th: 'สมุย ไอส์แลนด์ รีเทล', zhHant: '蘇梅島零售', zhHans: '苏梅岛零售' },
    restrictions: ['tobacco', 'gambling'],
    devices: [
      { id: 'DV-2012-A', type: 'holo_p30s', position: { en: 'Resort reception counter', th: 'เคาน์เตอร์ต้อนรับรีสอร์ต', zhHant: '渡假村接待櫃檯', zhHans: '度假村接待柜台' }, online: true, uptime: 98.9 },
      { id: 'DV-2012-B', type: 'ooh_43v', position: { en: 'Beach promenade wall', th: 'ผนังทางเดินริมหาด', zhHant: '海濱長廊牆面', zhHans: '海滨长廊墙面' }, online: true, uptime: 97.5 }
    ]
  },
  {
    id: 'TH-2013', market: 'th', verified: true, status: 'live',
    name: { en: 'Bumrungrad International — Outpatient Hall', th: 'โรงพยาบาลบำรุงราษฎร์ — โถงผู้ป่วยนอก', zhHant: '康民國際醫院 — 門診大堂', zhHans: '康民国际医院 — 门诊大堂' },
    district: 'sukhumvit', venue: 'clinic',
    address: { en: '33 Sukhumvit Soi 3, Watthana, Bangkok', th: '33 สุขุมวิท ซอย 3 วัฒนา กรุงเทพฯ', zhHant: '曼谷瓦他那素坤逸 3 巷 33 號', zhHans: '曼谷瓦他那素坤逸 3 巷 33 号' },
    x: 56, y: 46, footfallPerDay: 7200, dwellSec: 105, visibility: 0.74,
    rating: 4.9, reviews: 48, bookedPct: 21, minDays: 14,
    landlord: { en: 'Bumrungrad International', th: 'บำรุงราษฎร์ อินเตอร์เนชั่นแนล', zhHant: '康民國際醫院', zhHans: '康民国际医院' },
    restrictions: ['alcohol', 'tobacco', 'gambling', 'medical', 'competitor'],
    devices: [
      { id: 'DV-2013-A', type: 'ooh_43v', position: { en: 'Outpatient waiting hall, level 2', th: 'โถงรอผู้ป่วยนอก ชั้น 2', zhHant: '二樓門診輪候大堂', zhHans: '二楼门诊候诊大堂' }, online: true, uptime: 99.5 },
      { id: 'DV-2013-B', type: 'ooh_43v', position: { en: 'International clinic lobby', th: 'ล็อบบี้คลินิกนานาชาติ', zhHant: '國際門診大堂', zhHans: '国际门诊大堂' }, online: true, uptime: 99.1 }
    ]
  },
  {
    id: 'TH-2014', market: 'th', verified: true, status: 'live',
    name: { en: 'Airport Rail Link Phaya Thai — Interchange', th: 'แอร์พอร์ต เรล ลิงก์ พญาไท — จุดเชื่อมต่อ', zhHant: '機場快線披耶泰站 — 交匯處', zhHans: '机场快线披耶泰站 — 交汇处' },
    district: 'siam', venue: 'transport',
    address: { en: 'Phaya Thai Station, Ratchathewi, Bangkok', th: 'สถานีพญาไท ราชเทวี กรุงเทพฯ', zhHant: '曼谷拉差貼威披耶泰站', zhHans: '曼谷拉差贴威披耶泰站' },
    x: 52, y: 45, footfallPerDay: 120000, dwellSec: 18, visibility: 0.4,
    rating: 4.3, reviews: 156, bookedPct: 82, minDays: 3,
    landlord: { en: 'SRTET Retail', th: 'การรถไฟฯ เรล ลิงก์', zhHant: 'SRTET 零售', zhHans: 'SRTET 零售' },
    restrictions: ['tobacco', 'gambling', 'politics'],
    devices: [
      { id: 'DV-2014-A', type: 'ooh_75w', position: { en: 'Concourse gable wall', th: 'ผนังหน้าจั่วโถงสถานี', zhHant: '大堂山牆', zhHans: '大堂山墙' }, online: true, uptime: 98.6 },
      { id: 'DV-2014-B', type: 'holo_p65yd', position: { en: 'BTS transfer stairwell', th: 'บันไดเชื่อม BTS', zhHant: 'BTS 轉乘樓梯口', zhHans: 'BTS 换乘楼梯口' }, online: true, uptime: 97.2 }
    ]
  },
  /* --- Thailand sites awaiting operator verification -------------------- */
  {
    id: 'TH-2015', market: 'th', verified: false, status: 'pending',
    name: { en: 'Central Plaza Udon Thani — North East Mall', th: 'เซ็นทรัลพลาซา อุดรธานี', zhHant: '烏隆他尼中央廣場', zhHans: '乌隆他尼中央广场' },
    district: 'udon', venue: 'mall',
    address: { en: '277/1 Prajak Road, Udon Thani', th: '277/1 ถนนประจักษ์ อุดรธานี', zhHant: '烏隆他尼巴乍路 277/1 號', zhHans: '乌隆他尼巴乍路 277/1 号' },
    x: 66, y: 16, footfallPerDay: 22000, dwellSec: 29, visibility: 0.48,
    rating: 0, reviews: 0, bookedPct: 0, minDays: 7,
    landlord: { en: 'Udon Retail Partners', th: 'อุดร รีเทล พาร์ทเนอร์ส', zhHant: '烏隆零售夥伴', zhHans: '乌隆零售伙伴' },
    restrictions: ['tobacco', 'gambling'],
    devices: [
      { id: 'DV-2015-A', type: 'holo_p65yd', position: { en: 'Atrium, pending survey', th: 'เอเทรียม รอสำรวจ', zhHant: '中庭，待現場評估', zhHans: '中庭，待现场评估' }, online: false, uptime: 0 }
    ]
  },
  {
    id: 'TH-2016', market: 'th', verified: false, status: 'pending',
    name: { en: 'Terminal 21 Korat — Food Hall Link', th: 'เทอร์มินัล 21 โคราช — ทางเชื่อมศูนย์อาหาร', zhHant: 'Terminal 21 呵叻 — 美食廣場連廊', zhHans: 'Terminal 21 呵叻 — 美食广场连廊' },
    district: 'korat', venue: 'mall',
    address: { en: 'Mitraphap Road, Nakhon Ratchasima', th: 'ถนนมิตรภาพ นครราชสีมา', zhHant: '呵叻友誼路', zhHans: '呵叻友谊路' },
    x: 62, y: 30, footfallPerDay: 26000, dwellSec: 31, visibility: 0.5,
    rating: 0, reviews: 0, bookedPct: 0, minDays: 7,
    landlord: { en: 'Korat Mall Ventures', th: 'โคราช มอลล์ เวนเจอร์ส', zhHant: '呵叻商場投資', zhHans: '呵叻商场投资' },
    restrictions: ['tobacco', 'gambling', 'politics'],
    devices: [
      { id: 'DV-2016-A', type: 'ooh_55w', position: { en: 'Food hall wall, pending survey', th: 'ผนังศูนย์อาหาร รอสำรวจ', zhHant: '美食廣場牆面，待評估', zhHans: '美食广场墙面，待评估' }, online: false, uptime: 0 }
    ]
  }
];

/* --- Geospatial reference (LBS) -------------------------------------------
 * Real WGS-84 coordinates: district centres plus one point per seeded
 * location. Landlord-added locations fall back to their district centre with
 * a small deterministic offset (see store.locationGeo).
 * -------------------------------------------------------------------------*/
window.LG_GEO = {
  /* Which market each district belongs to. */
  districtMarket: {
    central: 'hk', wanchai: 'hk', eastern: 'hk', southern: 'hk', tsimshatsui: 'hk',
    mongkok: 'hk', shamshuipo: 'hk', kowlooncity: 'hk', kwuntong: 'hk', wongtaisin: 'hk',
    tsuenwan: 'hk', kwaihing: 'hk', shatin: 'hk', taipo: 'hk', yuenlong: 'hk',
    tuenmun: 'hk', saikung: 'hk', tungchung: 'hk',
    siam: 'th', sukhumvit: 'th', silom: 'th', ladprao: 'th', ratchada: 'th',
    chiangmai: 'th', phuket: 'th', pattaya: 'th', rayong: 'th', huahin: 'th',
    korat: 'th', khonkaen: 'th', udon: 'th', hatyai: 'th', samui: 'th'
  },
  centers: {
    central:      { lat: 22.2819, lng: 114.1582 },
    wanchai:      { lat: 22.2775, lng: 114.1730 },
    eastern:      { lat: 22.2840, lng: 114.2180 },
    southern:     { lat: 22.2450, lng: 114.1600 },
    tsimshatsui:  { lat: 22.2975, lng: 114.1722 },
    mongkok:      { lat: 22.3193, lng: 114.1694 },
    shamshuipo:   { lat: 22.3307, lng: 114.1622 },
    kowlooncity:  { lat: 22.3282, lng: 114.1915 },
    kwuntong:     { lat: 22.3125, lng: 114.2190 },
    wongtaisin:   { lat: 22.3419, lng: 114.1953 },
    tsuenwan:     { lat: 22.3710, lng: 114.1130 },
    kwaihing:     { lat: 22.3560, lng: 114.1300 },
    shatin:       { lat: 22.3815, lng: 114.1883 },
    taipo:        { lat: 22.4480, lng: 114.1680 },
    yuenlong:     { lat: 22.4420, lng: 114.0350 },
    tuenmun:      { lat: 22.3910, lng: 113.9770 },
    saikung:      { lat: 22.3815, lng: 114.2710 },
    tungchung:    { lat: 22.2890, lng: 113.9410 },
    /* Thailand */
    siam:         { lat: 13.7455, lng: 100.5331 },
    sukhumvit:    { lat: 13.7308, lng: 100.5697 },
    silom:        { lat: 13.7290, lng: 100.5340 },
    ladprao:      { lat: 13.8167, lng: 100.5610 },
    ratchada:     { lat: 13.7540, lng: 100.5650 },
    chiangmai:    { lat: 18.7883, lng: 98.9853 },
    phuket:       { lat: 7.8804, lng: 98.3923 },
    pattaya:      { lat: 12.9236, lng: 100.8825 },
    rayong:       { lat: 12.6810, lng: 101.2810 },
    huahin:       { lat: 12.5684, lng: 99.9577 },
    korat:        { lat: 14.9799, lng: 102.0977 },
    khonkaen:     { lat: 16.4322, lng: 102.8236 },
    udon:         { lat: 17.4138, lng: 102.7872 },
    hatyai:       { lat: 7.0084, lng: 100.4767 },
    samui:        { lat: 9.5120, lng: 100.0136 }
  },
  locations: {
    /* Hong Kong */
    'LC-1042': { lat: 22.2965, lng: 114.1686 },
    'LC-2087': { lat: 22.2839, lng: 114.1553 },
    'LC-3311': { lat: 22.3193, lng: 114.1694 },
    'LC-4520': { lat: 22.3125, lng: 114.2190 },
    'LC-5104': { lat: 22.3815, lng: 114.1883 },
    'LC-6233': { lat: 22.3710, lng: 114.1130 },
    'LC-7712': { lat: 22.2836, lng: 114.1730 },
    'LC-8145': { lat: 22.2890, lng: 113.9410 },
    'LC-9022': { lat: 22.2799, lng: 114.1850 },
    'LC-1188': { lat: 22.2830, lng: 114.1370 },
    'LC-6677': { lat: 22.2775, lng: 114.1745 },
    'LC-3390': { lat: 22.3815, lng: 114.2710 },
    'LC-4401': { lat: 22.4420, lng: 114.0350 },
    'LC-4402': { lat: 22.4480, lng: 114.1680 },
    /* Thailand */
    'TH-2001': { lat: 13.7466, lng: 100.5350 },
    'TH-2002': { lat: 13.7373, lng: 100.5602 },
    'TH-2003': { lat: 13.7285, lng: 100.5345 },
    'TH-2004': { lat: 13.8167, lng: 100.5610 },
    'TH-2005': { lat: 13.7483, lng: 100.5689 },
    'TH-2006': { lat: 18.7972, lng: 98.9676 },
    'TH-2007': { lat: 7.8920, lng: 98.2960 },
    'TH-2008': { lat: 12.9350, lng: 100.8830 },
    'TH-2009': { lat: 12.5520, lng: 99.9600 },
    'TH-2010': { lat: 16.4380, lng: 102.8280 },
    'TH-2011': { lat: 7.0000, lng: 100.4700 },
    'TH-2012': { lat: 9.5350, lng: 100.0620 },
    'TH-2013': { lat: 13.7460, lng: 100.5530 },
    'TH-2014': { lat: 13.7560, lng: 100.5390 },
    'TH-2015': { lat: 17.4030, lng: 102.7990 },
    'TH-2016': { lat: 14.9700, lng: 102.0900 }
  }
};

/* --- Seeded campaigns, proof-of-play and finance --------------------------- */
window.LG_SEED_CAMPAIGNS = [
  {
    id: 'CMP-2026-0417', advertiser: { en: 'Wing Fat Bakery', zhHant: '榮發餅家', zhHans: '荣发饼家' },
    objective: 'promotion', status: 'live',
    locationIds: ['LC-3311', 'LC-5104'], days: 14, sov: 50,
    start: '2026-09-14', end: '2026-09-27', created: '2026-09-02',
    spend: 11900, aiUsed: true,
    creative: { name: 'Mooncake_hero_1x1.mp4', form: 'hologram', languages: ['zh-HK', 'en'] }
  },
  {
    id: 'CMP-2026-0418', advertiser: { en: 'Pulse Dental Studio', zhHant: 'Pulse 牙科', zhHans: 'Pulse 牙科' },
    objective: 'lead', status: 'in_review',
    locationIds: ['LC-2087'], days: 30, sov: 100,
    start: '2026-10-01', end: '2026-10-30', created: '2026-09-18',
    spend: 8400, aiUsed: false,
    creative: { name: 'dental_whitening_9x16.mp4', form: 'screen', languages: ['zh-HK'] }
  },
  {
    id: 'CMP-2026-0419', advertiser: { en: 'Lantau Adventures', zhHant: '大嶼山歷險', zhHans: '大屿山历险' },
    objective: 'traffic', status: 'scheduled',
    locationIds: ['LC-8145', 'LC-7712'], days: 7, sov: 25,
    start: '2026-10-05', end: '2026-10-11', created: '2026-09-19',
    spend: 5350, aiUsed: true,
    creative: { name: 'cable_car_promo_1x1.mp4', form: 'hologram', languages: ['en', 'zh-HK', 'zh-CN'] }
  },
  {
    id: 'CMP-2026-0420', advertiser: { en: 'Kowloon Optical', zhHant: '九龍眼鏡', zhHans: '九龙眼镜' },
    objective: 'coupon', status: 'completed',
    locationIds: ['LC-1042'], days: 21, sov: 100,
    start: '2026-08-01', end: '2026-08-21', created: '2026-07-20',
    spend: 27300, aiUsed: true,
    creative: { name: 'summer_shades_1x1.mp4', form: 'hologram', languages: ['zh-HK', 'en'] }
  },
  {
    id: 'CMP-2026-0421', advertiser: { en: 'Harbour View Spa', zhHant: '海景水療', zhHans: '海景水疗' },
    objective: 'lead', status: 'in_review', approval: 'pending_landlord',
    locationIds: ['LC-6677'], deviceIds: ['DV-6677-B'], days: 14, sov: 50,
    start: '2026-10-01', end: '2026-10-14', created: '2026-09-20',
    spend: 4020, aiUsed: true,
    creative: { name: 'spa_autumn_9x16.mp4', form: 'screen', languages: ['zh-HK', 'en'] }
  }
];

/* Landlord-side approval queue (seeded so the portal has work to show). */
window.LG_SEED_APPROVALS = [
  {
    id: 'AP-3001', campaignId: 'CMP-2026-0421', locationId: 'LC-6677',
    landlord: { en: 'Harbour View Hospitality', zhHant: '海景酒店管理', zhHans: '海景酒店管理' },
    status: 'pending', created: '2026-09-20', note: null
  },
  {
    id: 'AP-3002', campaignId: 'CMP-2026-0420', locationId: 'LC-1042',
    landlord: { en: 'Harbour Front Property Management', zhHant: '海濱物業管理', zhHans: '海滨物业管理' },
    status: 'approved', created: '2026-07-22', decided: '2026-07-23',
    note: { en: 'Approved. Keep audio disabled before 11:00.', zhHant: '已批准。上午 11 時前請保持靜音。', zhHans: '已批准。上午 11 时前请保持静音。' }
  }
];

window.LG_SEED_LEDGER = [
  { id: 'ST-2026-08-A', landlord: 'Kowloon High Street Retail Ltd', period: '2026-08', gross: 27300, plays: 412608, status: 'paid' },
  { id: 'ST-2026-08-B', landlord: 'New Territories Malls Management', period: '2026-08', gross: 16400, plays: 208340, status: 'paid' },
  { id: 'ST-2026-09-A', landlord: 'Harbour Front Property Management', period: '2026-09', gross: 38600, plays: 512870, status: 'pending' },
  { id: 'ST-2026-09-B', landlord: 'Harbour View Hospitality', period: '2026-09', gross: 9200, plays: 96520, status: 'pending' }
];

window.LG_SEED_MAINTENANCE = [
  { id: 'MT-0091', deviceId: 'DV-3311-B', locationId: 'LC-3311', issue: { en: 'Device offline — no heartbeat for 6 h', zhHant: '設備離線 — 已 6 小時無心跳', zhHans: '设备离线 — 已 6 小时无心跳' }, priority: 'high', status: 'in_progress', opened: '2026-09-19' },
  { id: 'MT-0088', deviceId: 'DV-8145-B', locationId: 'LC-8145', issue: { en: 'Playback stutter reported by venue staff', zhHant: '場地人員報告播放卡頓', zhHans: '场地人员报告播放卡顿' }, priority: 'medium', status: 'resolved', opened: '2026-09-11' },
  { id: 'MT-0085', deviceId: 'DV-5104-B', locationId: 'LC-5104', issue: { en: 'Scheduled cleaning and blade inspection', zhHant: '定期清潔及葉片檢查', zhHans: '定期清洁及叶片检查' }, priority: 'low', status: 'scheduled', opened: '2026-09-20' }
];

/* ============================================================================
 * FAQ CORPUS
 * Questions live here, the wording lives in i18n (faq.<id>.q / faq.<id>.a), so
 * every question exists in all four languages. `tags` are the retrieval keys
 * used by the instant-reply assistant and the FAQ search box — they include
 * Chinese and Thai words on purpose, because a visitor may type in any of the
 * four languages regardless of the interface language.
 * Hardware answers follow the 3DNE-P30S / 3DNE-P65YD FAQ supplied by the
 * manufacturer; anything that depends on the shipping spec sheet says so
 * instead of inventing a number.
 * ==========================================================================*/
window.LG_FAQ = [
  {
    id: 'holo', icon: '◉',
    items: [
      { id: 'holo_what', tags: 'hologram fan holobox holographic display 3D 全息風扇 全息风扇 全息箱 โฮโลแกรม พัดลม', link: 'marketplace.html' },
      { id: 'holo_real', tags: 'real holography pepper ghost pseudo volumetric 真正 全息 光學 holography แท้จริง' },
      { id: 'holo_dark', tags: 'dark room daylight bright ambient light 環境光 日光 戶外 ความสว่าง แสง' },
      { id: 'holo_360', tags: '360 view all sides angle 360度 環繞 观看角度 มุมมอง รอบทิศ' },
      { id: 'holo_vs_screen', tags: 'compare led screen transparent panel lcd 比較 透明屏 顯示屏 เปรียบเทียบ จอ' },
      { id: 'holo_models', tags: 'P30S P65YD model size 28cm 65cm 型號 尺寸 รุ่น ขนาด' },
      { id: 'holo_names', tags: 'model name meaning sku 型號名稱 意思 ความหมายรุ่น' },
      { id: 'holo_choose', tags: 'which model choose budget 選擇 建議 เลือกรุ่น' },
      { id: 'holo_sync', tags: 'sync group multiple units 同步 群組 多台 ประสาน กลุ่ม' },
      { id: 'holo_distance', tags: 'viewing distance how far 觀看距離 距離 ระยะมอง' },
      { id: 'holo_power', tags: 'power consumption socket battery portable 耗電 電源 插座 แบตเตอรี่ ไฟ' },
      { id: 'holo_brightness', tags: 'brightness resolution led count nits 亮度 解析度 規格 ความสว่าง ความละเอียด' },
      { id: 'holo_size_weight', tags: 'weight size height ceiling mount 重量 尺寸 高度 吊裝 น้ำหนัก ความสูง' },
      { id: 'hb_box_what', tags: 'holobox cabinet transparent lcd light box life size 全息箱 透明屏 燈箱 真人比例 ตู้โฮโลแกรม จอโปร่งใส' },
      { id: 'hb_box_room', tags: 'dark room projector daylight anti glare ambient light 暗房 投影 日光 防眩 แสง ห้องมืด โปรเจกเตอร์' },
      { id: 'hb_box_live', tags: 'live two way 4k camera microphone telepresence remote 即時 雙向 鏡頭 麥克風 遠端 สด สองทาง กล้อง ไมโครโฟน' },
      { id: 'hb_box_avatar', tags: 'ai avatar metahuman voice languages chatbot 虛擬人物 語音 語言 對話 อวตาร เสียง ภาษา' }
    ]
  },
  {
    id: 'content', icon: '▣',
    items: [
      { id: 'con_formats', tags: 'video format mp4 gif jpg resolution 格式 影片 檔案 รูปแบบไฟล์ วิดีโอ' },
      { id: 'con_black', tags: 'black background transparent keying 黑底 純黑 去背 พื้นหลังดำ' },
      { id: 'con_spec', tags: 'spec duration seconds file size bitrate 規格 秒數 檔案大小 位元率 ขนาดไฟล์ วินาที' },
      { id: 'con_service', tags: 'content production conversion design service 內容製作 轉檔 設計 บริการผลิตคอนเทนต์' },
      { id: 'con_upload', tags: 'upload app wifi sd card hotspot 上傳 應用程式 記憶卡 อัปโหลด แอป' },
      { id: 'con_playlist', tags: 'playlist loop schedule rotation 輪播 播放清單 排程 เพลย์ลิสต์ วนซ้ำ' },
      { id: 'con_upload_tips', tags: 'upload failed filename tips troubleshooting 上傳失敗 檔名 ปัญหาอัปโหลด' },
      { id: 'con_copyright', tags: 'copyright music licence responsibility 版權 音樂 授權 ลิขสิทธิ์ เพลง' },
      { id: 'con_ai', tags: 'AI studio generate creative hologram conversion 人工智能 生成 創作室 AI สร้างสรรค์' },
      { id: 'con_approve', tags: 'approval content review compliance 審核 合規 批准 การอนุมัติ ตรวจสอบ' }
    ]
  },
  {
    id: 'safety', icon: '⚑',
    items: [
      { id: 'saf_onoff', tags: 'power on off shutdown spin down 開機 關機 斷電 เปิด ปิด' },
      { id: 'saf_noise', tags: 'noise heat vibration smell 風聲 發熱 震動 異味 เสียง ความร้อน สั่น' },
      { id: 'saf_hours', tags: 'continuous running hours duty cycle 連續運轉 時間 ชั่วโมง ทำงานต่อเนื่อง' },
      { id: 'saf_rules', tags: 'safety rules children guard touching 安全 兒童 觸碰 ความปลอดภัย เด็ก' },
      { id: 'saf_clean', tags: 'clean dust blade cloth 清潔 除塵 葉片 ทำความสะอาด ฝุ่น' },
      { id: 'saf_service', tags: 'maintenance interval service schedule 保養 週期 บำรุงรักษา' },
      { id: 'saf_bearing', tags: 'bearing motor lubricant oil 軸承 馬達 潤滑油 ตลับลูกปืน น้ำมัน' },
      { id: 'saf_blade', tags: 'blade bent broken replace 葉片 變形 斷裂 更換 ใบพัด' },
      { id: 'saf_storage', tags: 'storage long term idle packing 存放 長期 收藏 จัดเก็บ' },
      { id: 'saf_camera', tags: 'camera filming black band flicker photo 拍攝 黑帶 手機 ถ่ายรูป แถบดำ' },
      { id: 'saf_warranty', tags: 'warranty guarantee repair coverage 保用 保固 維修 การรับประกัน' }
    ]
  },
  {
    id: 'service', icon: '◆',
    items: [
      { id: 'svc_what', tags: 'what is 3dNakedEye platform marketplace 什麼是 平台 交易平台 3dNakedEye คืออะไร' },
      { id: 'svc_two_sided', tags: 'advertiser landlord two sided how it works 廣告客戶 場地 雙方 ผู้ลงโฆษณา เจ้าของสถานที่' },
      { id: 'svc_book', tags: 'book booking basket steps 預訂 流程 下單 การจอง ขั้นตอน' },
      { id: 'svc_availability', tags: 'availability occupied free colours 可用 空置 顏色 ว่าง ไม่ว่าง' },
      { id: 'svc_approval', tags: 'approval campaign review how long 審核 批准 時間 การอนุมัติ' },
      { id: 'svc_pop', tags: 'proof of play verified plays report 播放證明 播放報告 หลักฐานการเล่น' },
      { id: 'svc_pricing', tags: 'price pricing day rate cost 價格 報價 費用 ราคา' },
      { id: 'svc_sov', tags: 'share of voice loop exclusive 播放佔比 獨佔 ส่วนแบ่งการออกอากาศ' },
      { id: 'svc_payment', tags: 'payment stripe paypal crypto fps payme 付款 支付 加密貨幣 การชำระเงิน' },
      { id: 'svc_refund', tags: 'refund rejected cancellation money back 退款 取消 การคืนเงิน' },
      { id: 'svc_revenue', tags: 'landlord revenue split commission earn 收益 分帳 佣金 รายได้ ค่าคอมมิชชัน' },
      { id: 'svc_own_device', tags: 'buy device capital cost free hardware 購買 硬件 資本 ต้นทุนอุปกรณ์' },
      { id: 'svc_lbs', tags: 'lbs location based services gps wifi beacon targeting 定位 地理 目標 ปักหมุด ตำแหน่ง' },
      { id: 'svc_measure', tags: 'measurement impressions cpm ctr conversion 成效 指標 量度 การวัดผล' },
      { id: 'svc_dsp', tags: 'dsp demand side platform trade desk programmatic dsp 需求方平台 程序化' },
      { id: 'svc_adsmanager', tags: 'ads manager dashboard campaign meta google 廣告管理 儀表板 ตัวจัดการโฆษณา' },
      { id: 'svc_automation', tags: 'automation email notify alert 自動化 電郵 通知 ระบบอัตโนมัติ อีเมล' },
      { id: 'svc_market', tags: 'hong kong thailand market coverage 香港 泰國 市場 ฮ่องกง ไทย' },
      { id: 'svc_pilot', tags: 'pilot start trial onboarding 試點 開始 導入 เริ่มต้น ทดลอง' },
      { id: 'svc_dashboard', tags: 'login dashboard backend advertiser landlord 登入 後台 儀表板 เข้าสู่ระบบ แดชบอร์ด' },
      { id: 'svc_membership', tags: 'membership plan subscription tier 會員 方案 訂閱 สมาชิก แพ็กเกจ' },
      { id: 'svc_install', tags: 'installation maintenance who installs 安裝 維護 保養 การติดตั้ง ดูแล' },
      { id: 'svc_support', tags: 'support hours contact whatsapp email 支援 客服 聯絡 ช่วยเหลือ ติดต่อ' },
      { id: 'svc_p30s_rental', tags: 'rental rent hologram device event 租用 租賃 活動 เช่า อีเวนต์' }
    ]
  },
  {
    id: 'partner', icon: '⇗',
    items: [
      { id: 'aff_what', tags: 'affiliate share link referral partner track url 聯盟 分享 連結 推薦 佣金 พันธมิตร ลิงก์ แชร์ ค่าคอมมิชชัน' },
      { id: 'aff_track', tags: 'track attribution ref cid click record cookie 追蹤 歸因 點擊 記錄 ระบุที่มา คลิก บันทึก' },
      { id: 'aff_cookie', tags: 'cookie window expiry blocked first party storage 有效期 到期 封鎖 封存 ข้อความคุกกี้ หมดอายุ' },
      { id: 'aff_commission', tags: 'commission rate percentage flat fee earn 佣金 比例 定額 收益 ค่าคอมมิชชัน เปอร์เซ็นต์' },
      { id: 'aff_payout', tags: 'payout when paid schedule monthly invoice 付款 結算 每月 支付 จ่ายเงิน รอบบัญชี' },
      { id: 'aff_more', tags: 'earn more income more traffic channel content list 賺更多 收入 流量 渠道 更多 รายได้ เพิ่ม ช่องทาง' },
      { id: 'aff_self', tags: 'self referral own link buy myself fraud 自我推薦 自己 購買 欺詐 แนะนำตัวเอง ฉ้อโกง' },
      { id: 'aff_privacy', tags: 'privacy data gdpr ip hash personal 私隱 資料 個資 ความเป็นส่วนตัว ข้อมูล' },
      { id: 'aff_join', tags: 'join apply register sign up become partner 加入 申請 註冊 成為夥伴 สมัคร เข้าร่วม' }
    ]
  },
  {
    id: 'account', icon: '☺',
    items: [
      { id: 'acc_signup', tags: 'sign up create account register 註冊 開戶 สมัครสมาชิก' },
      { id: 'acc_login', tags: 'sign in login password advertiser landlord 登入 帳號 密碼 เข้าสู่ระบบ รหัสผ่าน' },
      { id: 'acc_forgot', tags: 'forgot password reset 忘記密碼 重設 ลืมรหัสผ่าน' },
      { id: 'acc_tiers', tags: 'membership tiers price free pro 會員等級 價格 ระดับสมาชิก ราคา' },
      { id: 'acc_cancel', tags: 'cancel downgrade unsubscribe 取消 降級 ยกเลิก' },
      { id: 'acc_invoice', tags: 'invoice receipt vat tax 發票 收據 稅 ใบเสร็จ ภาษี' },
      { id: 'acc_trial', tags: 'free trial limits 免費 試用 ทดลองฟรี' },
      { id: 'acc_privacy', tags: 'privacy pdpo gdpr personal data cookies 私隱 個人資料  cookies ความเป็นส่วนตัว ข้อมูล' },
      { id: 'acc_export', tags: 'export data download gdpr request 匯出 資料下載 ส่งออกข้อมูล' },
      { id: 'acc_chat', tags: 'chatbot assistant ai human real person 聊天 機械人 人工智能 แชท บอท' }
    ]
  },
  {
    id: 'pay', icon: '◈',
    items: [
      { id: 'pay_methods', tags: 'payment methods card visa mastercard unionpay stripe paypal bank swift tt crypto token 付款 方式 信用卡 Visa Master 銀聯 銀行 匯款 加密貨幣 วิธีชำระ เงิน บัตร โอน ธนาคาร คริปโต' },
      { id: 'pay_setup', tags: 'setup configure enable disable operator backend keys credentials test 設定 開通 後台 金鑰 憑證 測試 ตั้งค่า เปิดใช้ คีย์ ทดสอบ' },
      { id: 'pay_card', tags: 'visa mastercard unionpay 3d secure pci tokenisation chargeback 信用卡 銀聯 3D 安全 代碼化 拒付 บัตร 3D ปลอดภัย' },
      { id: 'pay_swift', tags: 'swift tt bank transfer remittance iban bic reference proof 銀行 匯款 電匯 匯款單 參考編號 โอนเงิน ธนาคาร อ้างอิง หลักฐาน' },
      { id: 'pay_crypto', tags: 'crypto usdt usdc btc eth token stablecoin network rate lock wallet 加密貨幣 穩定幣 匯率 鎖定 錢包 คริปโต USDT เครือข่าย เรต' },
      { id: 'pay_fees', tags: 'fees cost percent fixed settlement payout fee pass on 手續費 成本 百分比 定額 結算 ค่าธรรมเนียม ต้นทุน เปอร์เซ็นต์' },
      { id: 'pay_security', tags: 'security secrets pci dss 3ds fraud refund chargeback 保安 密鑰 合規 欺詐 退款 ความปลอดภัย คีย์ ฉ้อโกง คืนเงิน' },
      { id: 'pay_reconcile', tags: 'reconcile settlement statement invoice match order reference 對帳 結算 對賬單 發票 核對 กระทบยอด ชำระ ใบแจ้ง' }
    ]
  }
];

/* Instant-reply assistant intents that are not FAQ questions: greetings,
 * navigation help, hand-offs and quote starters. Same key contract. */
window.LG_CHAT_EXTRA = [
  { id: 'chat_hello', tags: 'hello hi hey good morning 你好 您好 สวัสดี' },
  { id: 'chat_help', tags: 'help what can you do 幫助 你可以做什麼 ช่วยได้อะไร' },
  { id: 'chat_quote', tags: 'quote estimate how much budget 報價 預算 ประเมิน งบประมาณ' },
  { id: 'chat_demo', tags: 'demo meeting call sales 示範 預約 會面 นัดหมาย สาธิต' },
  { id: 'chat_human', tags: 'human agent person whatsapp call 真人 客服 聯絡 whatsapp คุยกับคน' },
  { id: 'chat_visit', tags: 'visit location see screen tour 參觀 現場 ดูสถานที่ เยี่ยมชม' },
  { id: 'chat_enquiry', tags: 'enquiry form contact send message 查詢 表格 聯絡 แบบฟอร์ม สอบถาม' },
  { id: 'chat_partner', tags: 'reseller partner distributor agency 經銷 代理 合作 พาร์ตเนอร์ ตัวแทน' }
];

/* Enquiry form option lists — labels come from i18n (enq.<id>.<value>). */
window.LG_ENQUIRY_ROLES = ['advertiser', 'landlord', 'agency', 'partner', 'press', 'other'];
window.LG_ENQUIRY_INTERESTS = [
  'ooh_booking', 'hologram_buy', 'hologram_rent', 'holobox', 'led_film', 'content_production',
  'list_venue', 'ads_manager', 'partnership', 'enterprise', 'other'
];window.LG_ENQUIRY_BUDGETS = ['under_10k', '10k_50k', '50k_200k', 'over_200k', 'not_sure'];
window.LG_ENQUIRY_DEVICES = ['holo_p30s', 'holo_p65yd', 'holo_box', 'screens', 'not_sure'];
window.LG_ENQUIRY_CHANNELS = ['whatsapp', 'line', 'wechat', 'email', 'phone', 'any'];
window.LG_ENQUIRY_TIMELINES = ['now', 'month', 'quarter', 'later'];
