/* ============================================================================
 * 3dNakedEye — size-table-data.js
 * The five models the site calculates wall sizes for, from one document only:
 *
 *   "Dimension Calculation Table for Various Models.xlsx"
 *      header   : 3D | 56 cm | 65 cm | 80 cm | 100 cm
 *      per class: the display size in metres and the centre-to-centre spacing
 *                 when units are placed side by side (the spacing row sits one
 *                 column to the left in the sheet — 0.400 is in column A)
 *      table    : 1–50 units × the resulting display size in metres
 *      closing  : "For larger size requirements, please consult customer
 *                 service for detailed technical solutions."
 *
 * Every figure below is taken from that sheet and nowhere else. The formula the
 * sheet uses is verified cell by cell in _verify/site-check.cjs §4h:
 *
 *      display size (m) = display + (units − 1) × spacing
 *
 * The row of classes and the model mapping are the only judgement here: the
 * sheet prints size classes, not model names, so a model is shown against the
 * class whose display size matches it. A300 is a 2.80 m unit and therefore sits
 * outside a table that stops at the 100 cm class — the page says so instead of
 * inventing a spacing for it.
 * ==========================================================================*/

window.LG_SIZE_TABLE = {
  source: 'Dimension Calculation Table for Various Models.xlsx',
  maxUnits: 50,

  /* the four classes the sheet prints */
  classes: [
    { id: '56', displayM: 0.56, spacingM: 0.400 },
    { id: '65', displayM: 0.65, spacingM: 0.464 },
    { id: '80', displayM: 0.77, spacingM: 0.550 },
    { id: '100', displayM: 1.00, spacingM: 0.710 }
  ],

  /* the models this page answers for. 'class' is the table class whose display
   * size matches the model; null means the table does not cover it. */
  models: [
    { id: 'P46', class: '56', outdoor: false },
    { id: 'P65', class: '65', outdoor: false },
    { id: 'P80', class: '80', outdoor: false },
    { id: 'A80', class: '80', outdoor: true },
    { id: 'A300', class: null, outdoor: true }
  ],

  /* the sheet's own numbers, recalculated for a given class */
  sizeFor(units, classId) {
    const c = this.classes.find(x => x.id === classId) || this.classes[0];
    const n = Math.max(1, Math.round(units || 1));
    return c.displayM + (n - 1) * c.spacingM;
  },

  /* units needed to cover a width, by the same rule, and the width they make */
  unitsFor(widthM, classId) {
    const c = this.classes.find(x => x.id === classId) || this.classes[0];
    const width = Math.max(0, Number(widthM) || 0);
    let n = 1;
    while (n < this.maxUnits && this.sizeFor(n, c.id) < width - 1e-9) n++;
    return { units: n, width: this.sizeFor(n, c.id), fits: this.sizeFor(n, c.id) + 1e-9 >= width };
  },

  /* the whole printed table: 1–50 units for each class */
  rows() {
    const out = [];
    for (let n = 1; n <= this.maxUnits; n++) {
      const row = { units: n, sizes: {} };
      this.classes.forEach(c => { row.sizes[c.id] = this.sizeFor(n, c.id); });
      out.push(row);
    }
    return out;
  }
};
