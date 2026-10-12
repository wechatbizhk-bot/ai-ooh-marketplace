/* ============================================================================
 * 3dNakedEye — pricelist-data.js
 * The Hong Kong price list, transcribed from our own documents:
 *
 *   • "3D Naked Eye Line Sheet 01032026_30062026.pptx" — the line sheet for
 *     1 Mar – 30 Jun 2026: five series, 23 models, HKD suggested retail.
 *   • "智能廣告機-價格表-03.13（HK）-V1.xlsx" — the same 23 models with full
 *     parameters and the same HKD figures (one sheet, "Product").
 *   • "廣告機配件價格表20260313（HK）-V1.xlsx" — accessories, HKD, two sheets
 *     (single-machine accessories, matrix accessories).
 *
 * These are our own retail documents, so unlike the manufacturer's price list
 * they are published. Everything here is transcribed, not computed: a '/' means
 * the document quotes no price, and a spec the document does not give is left
 * out rather than estimated.
 * ==========================================================================*/

window.LG_PRICE_LIST = {
  currency: 'HKD',
  valid: { from: '2026-03-01', to: '2026-06-30' },
  /* the three notes the accessory sheet carries, plus the validity line */
  noteKeys: ['pl.note_valid', 'pl.note_crate', 'pl.note_quote'],

  /* ---------- machines ---------------------------------------------------- */
  /* name: the variant, in four languages. led: as the price list states it.
   * price: HKD suggested retail, or null where the document prints '/'.      */
  series: [
    {
      id: 'holoscope',
      name: { en: 'Holoscope', zhHant: 'Holoscope 全息視界', zhHans: 'Holoscope 全息视界', th: 'Holoscope' },
      lede: {
        en: 'The desktop family: 128 LED and 384 LED units, mains or battery, with app and Windows upload.',
        zhHant: '桌面系列：128 顆與 384 顆 LED，可插電或用電池，支援 App 與 Windows 上傳。',
        zhHans: '桌面系列：128 颗与 384 颗 LED，可插电或用电池，支持 App 与 Windows 上传。',
        th: 'กลุ่มตั้งโต๊ะ: 128 และ 384 LED ใช้ไฟบ้านหรือแบตเตอรี่ อัปโหลดผ่านแอปและ Windows'
      },
      items: [
        { code: 'P20S', led: '128 LED', price: 680,
          name: { en: 'Desktop, mains + speaker', zhHant: '桌面款・帶電＋帶喇叭', zhHans: '桌面款・带电＋带喇叭', th: 'ตั้งโต๊ะ ใช้ไฟบ้าน + ลำโพง' } },
        { code: 'P20S', led: '128 LED', price: 1100,
          name: { en: 'Audio model', zhHant: '音響款', zhHans: '音响款', th: 'รุ่นเครื่องเสียง' } },
        { code: 'P20S', led: '128 LED', price: 580,
          name: { en: 'Globe', zhHant: '地球儀', zhHans: '地球仪', th: 'ลูกโลก' } },
        { code: 'P20S', led: '128 LED', price: 1200,
          name: { en: 'Bladeless fan', zhHant: '無葉風扇', zhHans: '无叶风扇', th: 'พัดลมไร้ใบ' } },
        { code: 'P30S', led: '384 LED', price: 880,
          name: { en: 'Desktop, battery + speaker + display', zhHant: '桌面款・帶電池＋帶喇叭＋帶數顯', zhHans: '桌面款・带电池＋带喇叭＋带数显', th: 'ตั้งโต๊ะ แบตเตอรี่ + ลำโพง + จอแสดงผล' } },
        { code: 'P30S', led: '384 LED', price: 800,
          name: { en: 'Backpack model (power bank not included)', zhHant: '背包款（未含移動電源）', zhHans: '背包款（未含移动电源）', th: 'รุ่นเป้ (ไม่รวมพาวเวอร์แบงก์)' } },
        { code: 'Fan stick', led: '96 LED', price: 190,
          name: { en: 'Fan stick', zhHant: '粉絲助力棒', zhHans: '粉丝助力棒', th: 'แท่งพัดลมเชียร์' } }
      ]
    },
    {
      id: 'magic',
      name: { en: '3D Magic', zhHant: '3D Magic 商業系列', zhHans: '3D Magic 商业系列', th: '3D Magic' },
      lede: {
        en: 'The commercial fans: 46 cm to 100 cm, cloud control, matrix splicing, plus the waterproof 80 cm unit.',
        zhHant: '商業風扇：46 至 100 公分，雲端控制、可拼接，另有 80 公分戶外防水款。',
        zhHans: '商业风扇：46 至 100 厘米，云端控制、可拼接，另有 80 厘米户外防水款。',
        th: 'พัดลมงานพาณิชย์: 46–100 ซม. ควบคุมผ่านคลาวด์ ต่อเมทริกซ์ได้ พร้อมรุ่นกันน้ำ 80 ซม.'
      },
      items: [
        { code: 'P46', led: '720 LED', price: 1600 },
        { code: 'P65', led: '1280 LED', price: 3200,
          name: { en: 'Matrix flagship', zhHant: '拼接主推', zhHans: '拼接主推', th: 'รุ่นหลักสำหรับต่อเมทริกซ์' } },
        { code: 'P80-s', led: '1280 LED', price: 3400,
          name: { en: 'Matrix flagship', zhHant: '拼接主推', zhHans: '拼接主推', th: 'รุ่นหลักสำหรับต่อเมทริกซ์' } },
        { code: 'P100', led: '1600 LED', price: 3900 },
        { code: 'A80', led: '896 LED', price: 6800,
          name: { en: 'Outdoor, waterproof', zhHant: '戶外防水', zhHans: '户外防水', th: 'กลางแจ้ง กันน้ำ' } }
      ]
    },
    {
      id: 'circle',
      name: { en: '3D Circle', zhHant: '3D Circle 圓形系列', zhHans: '3D Circle 圆形系列', th: '3D Circle' },
      lede: {
        en: 'The entry-level round fan, for a shelf or a counter.',
        zhHant: '入門級圓形風扇，適合貨架或櫃檯。',
        zhHans: '入门级圆形风扇，适合货架或柜台。',
        th: 'พัดลมทรงกลมระดับเริ่มต้น สำหรับชั้นวางหรือเคาน์เตอร์'
      },
      items: [
        { code: 'C42', led: '224 LED', price: 340 }
      ]
    },
    {
      id: 'hdmi',
      name: { en: 'HDMI real-time', zhHant: 'HDMI 即時顯示', zhHans: 'HDMI 实时显示', th: 'HDMI เรียลไทม์' },
      lede: {
        en: 'Live input instead of stored files. Splicing requires the 4-in-1 box.',
        zhHant: '以即時輸入取代儲存檔案；拼接時必須加拼接盒。',
        zhHans: '以实时输入取代存储文件；拼接时必须加拼接盒。',
        th: 'รับสัญญาณสดแทนไฟล์ที่เก็บไว้ การต่อเมทริกซ์ต้องใช้กล่อง 4-in-1'
      },
      items: [
        { code: 'S65', led: '1280 LED', price: 12500 },
        { code: 'S100', led: '1536 LED', price: 15500 },
        { code: 'S-box', led: null, price: null,
          name: { en: 'HDMI splice box', zhHant: 'HDMI 拼接盒', zhHans: 'HDMI 拼接盒', th: 'กล่องต่อ HDMI' } },
        { code: 'A150 HDMI', led: '2880 LED', price: 32000 },
        { code: 'A180 HDMI', led: '2512 LED', price: 29500 },
        { code: 'A-box', led: null, price: 5000,
          name: { en: 'HDMI 4-in-1 splice box', zhHant: '4 合 1 拼接盒', zhHans: '4 合 1 拼接盒', th: 'กล่องต่อ 4-in-1' } }
      ]
    },
    {
      id: 'fan',
      name: { en: '3D LED fan', zhHant: '3D LED FAN 大型風扇', zhHans: '3D LED FAN 大型风扇', th: '3D LED FAN' },
      lede: {
        en: 'The large formats: the 360° hologram ball, the 150 and 180 cm fans, and the 300 cm waterproof unit.',
        zhHant: '大型規格：360° 全息球、150 與 180 公分風扇，以及 300 公分防水款。',
        zhHans: '大型规格：360° 全息球、150 与 180 厘米风扇，以及 300 厘米防水款。',
        th: 'ขนาดใหญ่: ลูกบอลโฮโลแกรม 360° พัดลม 150 และ 180 ซม. และรุ่นกันน้ำ 300 ซม.'
      },
      items: [
        { code: 'A50Q', led: '1536 LED', price: 15800,
          name: { en: '360° hologram ball', zhHant: '360° 全息球', zhHans: '360° 全息球', th: 'ลูกบอลโฮโลแกรม 360°' } },
        { code: 'A150', led: '2880 LED', price: 17000 },
        { code: 'A180', led: '2512 LED', price: 24000 },
        { code: 'A300', led: '12288 LED', price: 204000,
          name: { en: 'Waterproof', zhHant: '防水', zhHans: '防水', th: 'กันน้ำ' } }
      ]
    }
  ],

  /* ---------- accessories ------------------------------------------------- */
  /* Two sheets in the supplier's own order. price: HKD sales quote.          */
  accessories: [
    {
      id: 'single',
      titleKey: 'pl.acc_single',
      items: [
        { price: 1000, spec: '93.5×62×13 cm · 15.5 kg · column 1–1.6 m · base 84×60×15 cm',
          name: { en: '150/180 floor stand', zhHant: '150／180 落地支架', zhHans: '150／180 落地支架', th: 'ขาตั้งพื้น 150/180' } },
        { price: 615, spec: '20.5×12.5×1.5 cm · packed 23×13×7 cm · cable 1.4 + 0.8 m',
          name: { en: 'Portable power 5–24V, 20 000 mAh', zhHant: '5–24V 移動電源 20000mAh', zhHans: '5–24V 移动电源 20000mAh', th: 'พาวเวอร์แบงก์ 5–24V 20,000 mAh' } },
        { price: 1380, spec: '5–24V adjustable',
          name: { en: 'Portable power 5–24V, 40 000 mAh', zhHant: '5–24V 移動電源 40000mAh', zhHans: '5–24V 移动电源 40000mAh', th: 'พาวเวอร์แบงก์ 5–24V 40,000 mAh' } },
        { price: 860, spec: '52×60×16 cm · packed 54×62×20 cm · 6.3 kg',
          name: { en: 'Double-sided light box, plain edge, 42 cm', zhHant: '無花邊雙面燈箱 42cm', zhHans: '无花边双面灯箱 42cm', th: 'ไลต์บ็อกซ์สองหน้า ขอบเรียบ 42 ซม.' } },
        { price: 1200, spec: 'for 46–52 cm units',
          name: { en: 'Double-sided light box, plain edge, 46–52 cm', zhHant: '無花邊雙面燈箱 46–52cm', zhHans: '无花边双面灯箱 46–52cm', th: 'ไลต์บ็อกซ์สองหน้า ขอบเรียบ 46–52 ซม.' } },
        { price: 570, spec: '58×47×7 cm · 3.2 kg · packed 57×57×11.5 cm · 4.8 kg',
          name: { en: 'Round single-sided light box, 42 cm (C42 / A42)', zhHant: '42cm 單面圓形廣告燈箱（C42／A42 可用）', zhHans: '42cm 单面圆形广告灯箱（C42／A42 可用）', th: 'ไลต์บ็อกซ์ทรงกลมหน้าเดียว 42 ซม. (C42 / A42)' } },
        { price: 1000, spec: '68×57×8 cm · 6 kg · packed 63.5×63.5×11.5 cm · 8.5 kg',
          name: { en: 'Round single-sided light box, 50 cm (C45 / C50 / A52 / H50)', zhHant: '50cm 單面圓形廣告燈箱（C45／C50／A52／H50 可用）', zhHans: '50cm 单面圆形广告灯箱（C45／C50／A52／H50 可用）', th: 'ไลต์บ็อกซ์ทรงกลมหน้าเดียว 50 ซม. (C45 / C50 / A52 / H50)' } },
        { price: 800, spec: 'GGJPJ-413 · 55×53×13 cm · 3.5 kg · packed 60×57×17 cm · 5 kg',
          name: { en: 'Round double-sided light box, laced, 42 cm', zhHant: '42cm 雙面花邊款圓形燈箱', zhHans: '42cm 双面花边款圆形灯箱', th: 'ไลต์บ็อกซ์ทรงกลมสองหน้า แบบขอบลาย 42 ซม.' } },
        { price: 1200, spec: '69×66×18 cm · 6.5 kg · packed 74×70×23 cm · 9.5 kg',
          name: { en: 'Round double-sided light box, 50 cm', zhHant: '50cm 雙面廣告燈箱', zhHans: '50cm 双面广告灯箱', th: 'ไลต์บ็อกซ์ทรงกลมสองหน้า 50 ซม.' } },
        { price: 1700, spec: '85×83×21 cm · 11 kg · packed 90×88×26 cm · 15 kg',
          name: { en: 'Double-sided light box, 65 cm (P65 / A65 / C65)', zhHant: '65cm 雙面廣告燈箱（P65／A65／C65 可用）', zhHans: '65cm 双面广告灯箱（P65／A65／C65 可用）', th: 'ไลต์บ็อกซ์สองหน้า 65 ซม. (P65 / A65 / C65)' } },
        { price: 2500, spec: '100×95×21 cm · 14 kg · packed 105×100×27 cm · 17 kg',
          name: { en: 'Double-sided light box, 80 cm (P80s)', zhHant: '80cm 雙面廣告燈箱（P80s 可用）', zhHans: '80cm 双面广告灯箱（P80s 可用）', th: 'ไลต์บ็อกซ์สองหน้า 80 ซม. (P80s)' } },
        { price: 3200, spec: '86×73×14 cm · 9 kg · packed 90×78×32 cm · 14 kg',
          name: { en: 'Double-sided pole light box, 65 cm', zhHant: '65cm 雙面燈杆款燈箱', zhHans: '65cm 双面灯杆款灯箱', th: 'ไลต์บ็อกซ์สองหน้าแบบเสา 65 ซม.' } },
        { price: 3500, spec: '100×86×28 cm · 18 kg · packed 106×92×34 cm · 22 kg',
          name: { en: 'Double-sided pole light box, large', zhHant: '雙面燈杆款燈箱（大）', zhHans: '双面灯杆款灯箱（大）', th: 'ไลต์บ็อกซ์สองหน้าแบบเสา (ใหญ่)' } },
        { price: 4100, spec: '125×112×34 cm',
          name: { en: 'Double-sided pole light box, extra large', zhHant: '雙面燈杆款燈箱（加大）', zhHans: '双面灯杆款灯箱（加大）', th: 'ไลต์บ็อกซ์สองหน้าแบบเสา (ใหญ่พิเศษ)' } },
        { price: 5250, spec: 'double-sided, acrylic hemispheres + sheet metal',
          name: { en: 'Clamp-on lantern cover, 65 cm', zhHant: '抱箍式燈籠罩 65cm', zhHans: '抱箍式灯笼罩 65cm', th: 'ฝาครอบโคมแบบรัด 65 ซม.' } },
        { price: 870, spec: 'GGJPJ-207 · for P46 / X50',
          name: { en: 'Aluminium square frame (P46 / X50)', zhHant: '鋁方框（P46／X50 專用）', zhHans: '铝方框（P46／X50 专用）', th: 'กรอบอลูมิเนียมสี่เหลี่ยม (P46 / X50)' } },
        { price: 680, spec: '56×10×54 cm · 3.4 kg',
          name: { en: 'H-type aluminium frame, 45 cm', zhHant: 'H 款鋁方框 45cm', zhHans: 'H 款铝方框 45cm', th: 'กรอบอลูมิเนียมแบบ H 45 ซม.' } },
        { price: 800, spec: '60×60×10 cm · 4.5 kg',
          name: { en: 'H-type aluminium frame, 60 cm', zhHant: 'H 款鋁方框 60cm', zhHans: 'H 款铝方框 60cm', th: 'กรอบอลูมิเนียมแบบ H 60 ซม.' } },
        { price: 1000, spec: '74×74×10 cm · 6.5 kg',
          name: { en: 'H-type aluminium frame, 74 cm', zhHant: 'H 款鋁方框 74cm', zhHans: 'H 款铝方框 74cm', th: 'กรอบอลูมิเนียมแบบ H 74 ซม.' } },
        { price: 1500, spec: '89×89×10 cm · 10.5 kg',
          name: { en: 'H-type aluminium frame, 89 cm', zhHant: 'H 款鋁方框 89cm', zhHans: 'H 款铝方框 89cm', th: 'กรอบอลูมิเนียมแบบ H 89 ซม.' } },
        { price: 1900, spec: '109×109×10 cm · 15.5 kg',
          name: { en: 'H-type aluminium frame, 109 cm', zhHant: 'H 款鋁方框 109cm', zhHans: 'H 款铝方框 109cm', th: 'กรอบอลูมิเนียมแบบ H 109 ซม.' } },
        { price: 660, spec: 'magnetic, square',
          name: { en: 'Square magnetic protective cover, 42 cm', zhHant: '方形磁吸保護罩 42cm', zhHans: '方形磁吸保护罩 42cm', th: 'ฝาครอบแม่เหล็กสี่เหลี่ยม 42 ซม.' } },
        { price: 1250, spec: '57×57×15 cm · 8 kg',
          name: { en: 'Square transparent cover, 57 cm', zhHant: '方形透明罩 57cm', zhHans: '方形透明罩 57cm', th: 'ฝาครอบโปร่งใสสี่เหลี่ยม 57 ซม.' } },
        { price: 1450, spec: '64×64×15 cm · 10 kg',
          name: { en: 'Square transparent cover, 64 cm', zhHant: '方形透明罩 64cm', zhHans: '方形透明罩 64cm', th: 'ฝาครอบโปร่งใสสี่เหลี่ยม 64 ซม.' } },
        { price: 1700, spec: '71×71×15 cm · 12 kg',
          name: { en: 'Square transparent cover, 71 cm', zhHant: '方形透明罩 71cm', zhHans: '方形透明罩 71cm', th: 'ฝาครอบโปร่งใสสี่เหลี่ยม 71 ซม.' } },
        { price: 2600, spec: '87×87×15 cm · 15 kg',
          name: { en: 'Square transparent cover, 87 cm', zhHant: '方形透明罩 87cm', zhHans: '方形透明罩 87cm', th: 'ฝาครอบโปร่งใสสี่เหลี่ยม 87 ซม.' } },
        { price: 1480, spec: 'up to 52 cm · telescopic 80–150 cm · floor, hanging or side-mounted',
          name: { en: 'Telescopic H-frame display cabinet', zhHant: '伸縮杆款工字櫃', zhHans: '伸缩杆款工字柜', th: 'ตู้โชว์โครง H แบบยืดหด' } },
        { price: 1150, spec: 'up to 52 cm · telescopic',
          name: { en: 'Telescopic display cabinet, compact', zhHant: '伸縮杆款展示櫃（小）', zhHans: '伸缩杆款展示柜（小）', th: 'ตู้โชว์แบบยืดหด (เล็ก)' } },
        { price: 1300, spec: 'up to 52 cm · telescopic',
          name: { en: 'Telescopic display cabinet, tall', zhHant: '伸縮杆款展示櫃（高）', zhHans: '伸缩杆款展示柜（高）', th: 'ตู้โชว์แบบยืดหด (สูง)' } },
        { price: 6300, spec: '150 cm metal frame',
          name: { en: 'Wall-mounted square frame, 150 cm', zhHant: '150cm 牆裝金屬方框', zhHans: '150cm 墙装金属方框', th: 'กรอบสี่เหลี่ยมยึดผนัง 150 ซม.' } },
        { price: 7200, spec: '180 cm metal frame',
          name: { en: 'Wall-mounted square frame, 180 cm', zhHant: '180cm 牆裝金屬方框', zhHans: '180cm 墙装金属方框', th: 'กรอบสี่เหลี่ยมยึดผนัง 180 ซม.' } },
        { price: 19200, spec: 'floor-standing, for 180 cm units',
          name: { en: '180 cm floor-standing transparent cabinet', zhHant: '180CM 機器落地透明櫃', zhHans: '180CM 机器落地透明柜', th: 'ตู้โปร่งใสตั้งพื้นสำหรับเครื่อง 180 ซม.' } }
      ]
    },
    {
      id: 'matrix',
      titleKey: 'pl.acc_matrix',
      items: [
        { price: 5900, spec: '57×83×195 cm · cabinet 60 kg · crated 105 kg · crate 205×86×59 cm',
          name: { en: '65 cm 1×3 triple cabinet (not for HDMI units)', zhHant: '65cm 1×3 拼接櫃（HDMI 機器不適用）', zhHans: '65cm 1×3 拼接柜（HDMI 机器不适用）', th: 'ตู้ 1×3 สำหรับ 65 ซม. (ใช้กับเครื่อง HDMI ไม่ได้)' } },
        { price: 8000, spec: '90×52×216 cm · crated 115 kg · crate 228×96×59 cm',
          name: { en: '80 cm 1×3 triple cabinet', zhHant: '80cm 1×3 拼接櫃', zhHans: '80cm 1×3 拼接柜', th: 'ตู้ 1×3 สำหรับ 80 ซม.' } },
        { price: 2500, spec: 'crate 44×44×106 cm · 32.5 kg',
          name: { en: 'D30 small cylinder cabinet', zhHant: 'D30 小圓柱櫃', zhHans: 'D30 小圆柱柜', th: 'ตู้ทรงกระบอกเล็ก D30' } },
        { price: 9600, spec: 'Φ72 × 188 cm · 3 × 65 cm fans · packed 80×80×210 cm · ≈76 kg',
          name: { en: '65 cm 1×3 cylinder, single-sided, one-piece acrylic', zhHant: '65cm 1×3 圓柱（單面 3 台・亞克力一體式）', zhHans: '65cm 1×3 圆柱（单面 3 台・亚克力一体式）', th: 'ตู้ทรงกระบอก 1×3 สำหรับ 65 ซม. หน้าเดียว อะคริลิคชิ้นเดียว' } },
        { price: 9100, spec: 'Φ72 × 188 cm · 3 × 65 cm fans · PC jointed · no audio',
          name: { en: '65 cm 1×3 cylinder, single-sided, PC jointed', zhHant: '65cm 1×3 圓柱（單面 3 台・PC 合口式）', zhHans: '65cm 1×3 圆柱（单面 3 台・PC 合口式）', th: 'ตู้ทรงกระบอก 1×3 สำหรับ 65 ซม. หน้าเดียว แบบประกบ PC' } },
        { price: 16500, spec: 'Φ82 × 188 cm · 6 × 65 cm fans · frame 88×88×210 cm · 83 kg',
          name: { en: '65 cm 1×3 cylinder, double-sided (6 units, not for HDMI)', zhHant: '65cm 1×3 圓柱（雙面 6 台・HDMI 不適用）', zhHans: '65cm 1×3 圆柱（双面 6 台・HDMI 不适用）', th: 'ตู้ทรงกระบอก 1×3 สำหรับ 65 ซม. สองหน้า (6 เครื่อง ใช้กับ HDMI ไม่ได้)' } },
        { price: 11000, spec: '85×85×210 cm · ≈70 kg · packed ≈91×91×217 cm · ≈115 kg',
          name: { en: '80 cm 1×3 cylinder, single-sided, jointed', zhHant: '80cm 1×3 圓柱（單面 3 台・合口款）', zhHans: '80cm 1×3 圆柱（单面 3 台・合口款）', th: 'ตู้ทรงกระบอก 1×3 สำหรับ 80 ซม. หน้าเดียว แบบประกบ' } },
        { price: 17000, spec: '90×90×210 cm · ≈80 kg · packed ≈96×96×217 cm · ≈120 kg',
          name: { en: '80 cm 1×3 cylinder, single-sided, one-piece acrylic', zhHant: '80cm 1×3 圓柱（單面 3 台・一體亞克力款）', zhHans: '80cm 1×3 圆柱（单面 3 台・一体亚克力款）', th: 'ตู้ทรงกระบอก 1×3 สำหรับ 80 ซม. หน้าเดียว อะคริลิคชิ้นเดียว' } },
        { price: 8000, spec: '76×50×192 cm · ≈70 kg · crated ≈204×80×54 cm · 80 kg',
          name: { en: '65 cm 1×3 half-cylinder, single-sided', zhHant: '65cm 1×3 半圓柱（單面 3 台）', zhHans: '65cm 1×3 半圆柱（单面 3 台）', th: 'ตู้ครึ่งทรงกระบอก 1×3 สำหรับ 65 ซม. หน้าเดียว' } },
        { price: 5500, spec: '1850×750×450 mm with wheels (stainless instead of sheet metal +200)',
          name: { en: '65 cm 1×3 linked-screen transparent cabinet', zhHant: '65cm 1×3 連屏透明展示櫃', zhHans: '65cm 1×3 连屏透明展示柜', th: 'ตู้โปร่งใสจอเชื่อม 1×3 สำหรับ 65 ซม.' } },
        { price: 9500, spec: 'to drawing',
          name: { en: '65 cm 2×3 linked-screen transparent cabinet', zhHant: '65cm 2×3 連屏透明展示櫃', zhHans: '65cm 2×3 连屏透明展示柜', th: 'ตู้โปร่งใสจอเชื่อม 2×3 สำหรับ 65 ซม.' } },
        { price: 14800, spec: 'to drawing',
          name: { en: 'Large transparent acrylic splice cabinet (A)', zhHant: '透明亞克力拼接櫃（A）', zhHans: '透明亚克力拼接柜（A）', th: 'ตู้ต่ออะคริลิคโปร่งใส (A)' } },
        { price: 9300, spec: 'to drawing',
          name: { en: 'Large transparent acrylic splice cabinet (B)', zhHant: '透明亞克力拼接櫃（B）', zhHans: '透明亚克力拼接柜（B）', th: 'ตู้ต่ออะคริลิคโปร่งใส (B)' } },
        { price: 12800, spec: 'to drawing',
          name: { en: 'Large transparent acrylic splice cabinet (C)', zhHant: '透明亞克力拼接櫃（C）', zhHans: '透明亚克力拼接柜（C）', th: 'ตู้ต่ออะคริลิคโปร่งใส (C)' } },
        { price: 5500, spec: 'to drawing',
          name: { en: '100 cm HDMI single-unit display cabinet', zhHant: '100CM HDMI 單台展示櫃', zhHans: '100CM HDMI 单台展示柜', th: 'ตู้โชว์เครื่องเดียว 100 ซม. สำหรับ HDMI' } },
        { price: 7800, spec: 'to drawing',
          name: { en: '65 cm six-unit linked-screen transparent cabinet', zhHant: '65cm 6 拼連屏透明展示櫃', zhHans: '65cm 6 拼连屏透明展示柜', th: 'ตู้โปร่งใสจอเชื่อม 6 เครื่อง 65 ซม.' } },
        { price: 10700, spec: 'to drawing',
          name: { en: '80 cm six-unit linked-screen transparent cabinet', zhHant: '80cm 6 拼櫃連屏透明展示櫃', zhHans: '80cm 6 拼柜连屏透明展示柜', th: 'ตู้โปร่งใสจอเชื่อม 6 เครื่อง 80 ซม.' } },
        { price: 11000, spec: 'to drawing',
          name: { en: '65 cm nine/twelve-unit linked-screen transparent cabinet', zhHant: '65cm 9／12 拼櫃連屏透明展示櫃', zhHans: '65cm 9／12 拼柜连屏透明展示柜', th: 'ตู้โปร่งใสจอเชื่อม 9/12 เครื่อง 65 ซม.' } },
        { price: 8000, spec: 'to drawing',
          name: { en: '65 cm 4×2 linked-screen transparent hanging cabinet', zhHant: '65cm 4×2 連屏透明吊櫃', zhHans: '65cm 4×2 连屏透明吊柜', th: 'ตู้แขวนโปร่งใสจอเชื่อม 4×2 สำหรับ 65 ซม.' } }
      ]
    }
  ]
};
