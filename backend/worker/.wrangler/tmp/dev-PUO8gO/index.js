var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// wrangler-modules-watch:wrangler:modules-watch
var init_wrangler_modules_watch = __esm({
  "wrangler-modules-watch:wrangler:modules-watch"() {
    init_modules_watch_stub();
  }
});

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/templates/modules-watch-stub.js
var init_modules_watch_stub = __esm({
  "../../../../../AppData/Roaming/npm/node_modules/wrangler/templates/modules-watch-stub.js"() {
    init_wrangler_modules_watch();
  }
});

// node_modules/qrcode/lib/can-promise.js
var require_can_promise = __commonJS({
  "node_modules/qrcode/lib/can-promise.js"(exports, module) {
    init_modules_watch_stub();
    module.exports = function() {
      return typeof Promise === "function" && Promise.prototype && Promise.prototype.then;
    };
  }
});

// node_modules/qrcode/lib/core/utils.js
var require_utils = __commonJS({
  "node_modules/qrcode/lib/core/utils.js"(exports) {
    init_modules_watch_stub();
    var toSJISFunction;
    var CODEWORDS_COUNT = [
      0,
      // Not used
      26,
      44,
      70,
      100,
      134,
      172,
      196,
      242,
      292,
      346,
      404,
      466,
      532,
      581,
      655,
      733,
      815,
      901,
      991,
      1085,
      1156,
      1258,
      1364,
      1474,
      1588,
      1706,
      1828,
      1921,
      2051,
      2185,
      2323,
      2465,
      2611,
      2761,
      2876,
      3034,
      3196,
      3362,
      3532,
      3706
    ];
    exports.getSymbolSize = /* @__PURE__ */ __name(function getSymbolSize(version) {
      if (!version) throw new Error('"version" cannot be null or undefined');
      if (version < 1 || version > 40) throw new Error('"version" should be in range from 1 to 40');
      return version * 4 + 17;
    }, "getSymbolSize");
    exports.getSymbolTotalCodewords = /* @__PURE__ */ __name(function getSymbolTotalCodewords(version) {
      return CODEWORDS_COUNT[version];
    }, "getSymbolTotalCodewords");
    exports.getBCHDigit = function(data) {
      let digit = 0;
      while (data !== 0) {
        digit++;
        data >>>= 1;
      }
      return digit;
    };
    exports.setToSJISFunction = /* @__PURE__ */ __name(function setToSJISFunction(f) {
      if (typeof f !== "function") {
        throw new Error('"toSJISFunc" is not a valid function.');
      }
      toSJISFunction = f;
    }, "setToSJISFunction");
    exports.isKanjiModeEnabled = function() {
      return typeof toSJISFunction !== "undefined";
    };
    exports.toSJIS = /* @__PURE__ */ __name(function toSJIS(kanji) {
      return toSJISFunction(kanji);
    }, "toSJIS");
  }
});

// node_modules/qrcode/lib/core/error-correction-level.js
var require_error_correction_level = __commonJS({
  "node_modules/qrcode/lib/core/error-correction-level.js"(exports) {
    init_modules_watch_stub();
    exports.L = { bit: 1 };
    exports.M = { bit: 0 };
    exports.Q = { bit: 3 };
    exports.H = { bit: 2 };
    function fromString(string) {
      if (typeof string !== "string") {
        throw new Error("Param is not a string");
      }
      const lcStr = string.toLowerCase();
      switch (lcStr) {
        case "l":
        case "low":
          return exports.L;
        case "m":
        case "medium":
          return exports.M;
        case "q":
        case "quartile":
          return exports.Q;
        case "h":
        case "high":
          return exports.H;
        default:
          throw new Error("Unknown EC Level: " + string);
      }
    }
    __name(fromString, "fromString");
    exports.isValid = /* @__PURE__ */ __name(function isValid(level) {
      return level && typeof level.bit !== "undefined" && level.bit >= 0 && level.bit < 4;
    }, "isValid");
    exports.from = /* @__PURE__ */ __name(function from(value, defaultValue) {
      if (exports.isValid(value)) {
        return value;
      }
      try {
        return fromString(value);
      } catch (e) {
        return defaultValue;
      }
    }, "from");
  }
});

// node_modules/qrcode/lib/core/bit-buffer.js
var require_bit_buffer = __commonJS({
  "node_modules/qrcode/lib/core/bit-buffer.js"(exports, module) {
    init_modules_watch_stub();
    function BitBuffer() {
      this.buffer = [];
      this.length = 0;
    }
    __name(BitBuffer, "BitBuffer");
    BitBuffer.prototype = {
      get: /* @__PURE__ */ __name(function(index) {
        const bufIndex = Math.floor(index / 8);
        return (this.buffer[bufIndex] >>> 7 - index % 8 & 1) === 1;
      }, "get"),
      put: /* @__PURE__ */ __name(function(num, length) {
        for (let i = 0; i < length; i++) {
          this.putBit((num >>> length - i - 1 & 1) === 1);
        }
      }, "put"),
      getLengthInBits: /* @__PURE__ */ __name(function() {
        return this.length;
      }, "getLengthInBits"),
      putBit: /* @__PURE__ */ __name(function(bit) {
        const bufIndex = Math.floor(this.length / 8);
        if (this.buffer.length <= bufIndex) {
          this.buffer.push(0);
        }
        if (bit) {
          this.buffer[bufIndex] |= 128 >>> this.length % 8;
        }
        this.length++;
      }, "putBit")
    };
    module.exports = BitBuffer;
  }
});

// node_modules/qrcode/lib/core/bit-matrix.js
var require_bit_matrix = __commonJS({
  "node_modules/qrcode/lib/core/bit-matrix.js"(exports, module) {
    init_modules_watch_stub();
    function BitMatrix(size) {
      if (!size || size < 1) {
        throw new Error("BitMatrix size must be defined and greater than 0");
      }
      this.size = size;
      this.data = new Uint8Array(size * size);
      this.reservedBit = new Uint8Array(size * size);
    }
    __name(BitMatrix, "BitMatrix");
    BitMatrix.prototype.set = function(row, col, value, reserved) {
      const index = row * this.size + col;
      this.data[index] = value;
      if (reserved) this.reservedBit[index] = true;
    };
    BitMatrix.prototype.get = function(row, col) {
      return this.data[row * this.size + col];
    };
    BitMatrix.prototype.xor = function(row, col, value) {
      this.data[row * this.size + col] ^= value;
    };
    BitMatrix.prototype.isReserved = function(row, col) {
      return this.reservedBit[row * this.size + col];
    };
    module.exports = BitMatrix;
  }
});

// node_modules/qrcode/lib/core/alignment-pattern.js
var require_alignment_pattern = __commonJS({
  "node_modules/qrcode/lib/core/alignment-pattern.js"(exports) {
    init_modules_watch_stub();
    var getSymbolSize = require_utils().getSymbolSize;
    exports.getRowColCoords = /* @__PURE__ */ __name(function getRowColCoords(version) {
      if (version === 1) return [];
      const posCount = Math.floor(version / 7) + 2;
      const size = getSymbolSize(version);
      const intervals = size === 145 ? 26 : Math.ceil((size - 13) / (2 * posCount - 2)) * 2;
      const positions = [size - 7];
      for (let i = 1; i < posCount - 1; i++) {
        positions[i] = positions[i - 1] - intervals;
      }
      positions.push(6);
      return positions.reverse();
    }, "getRowColCoords");
    exports.getPositions = /* @__PURE__ */ __name(function getPositions(version) {
      const coords = [];
      const pos = exports.getRowColCoords(version);
      const posLength = pos.length;
      for (let i = 0; i < posLength; i++) {
        for (let j = 0; j < posLength; j++) {
          if (i === 0 && j === 0 || // top-left
          i === 0 && j === posLength - 1 || // bottom-left
          i === posLength - 1 && j === 0) {
            continue;
          }
          coords.push([pos[i], pos[j]]);
        }
      }
      return coords;
    }, "getPositions");
  }
});

// node_modules/qrcode/lib/core/finder-pattern.js
var require_finder_pattern = __commonJS({
  "node_modules/qrcode/lib/core/finder-pattern.js"(exports) {
    init_modules_watch_stub();
    var getSymbolSize = require_utils().getSymbolSize;
    var FINDER_PATTERN_SIZE = 7;
    exports.getPositions = /* @__PURE__ */ __name(function getPositions(version) {
      const size = getSymbolSize(version);
      return [
        // top-left
        [0, 0],
        // top-right
        [size - FINDER_PATTERN_SIZE, 0],
        // bottom-left
        [0, size - FINDER_PATTERN_SIZE]
      ];
    }, "getPositions");
  }
});

// node_modules/qrcode/lib/core/mask-pattern.js
var require_mask_pattern = __commonJS({
  "node_modules/qrcode/lib/core/mask-pattern.js"(exports) {
    init_modules_watch_stub();
    exports.Patterns = {
      PATTERN000: 0,
      PATTERN001: 1,
      PATTERN010: 2,
      PATTERN011: 3,
      PATTERN100: 4,
      PATTERN101: 5,
      PATTERN110: 6,
      PATTERN111: 7
    };
    var PenaltyScores = {
      N1: 3,
      N2: 3,
      N3: 40,
      N4: 10
    };
    exports.isValid = /* @__PURE__ */ __name(function isValid(mask) {
      return mask != null && mask !== "" && !isNaN(mask) && mask >= 0 && mask <= 7;
    }, "isValid");
    exports.from = /* @__PURE__ */ __name(function from(value) {
      return exports.isValid(value) ? parseInt(value, 10) : void 0;
    }, "from");
    exports.getPenaltyN1 = /* @__PURE__ */ __name(function getPenaltyN1(data) {
      const size = data.size;
      let points = 0;
      let sameCountCol = 0;
      let sameCountRow = 0;
      let lastCol = null;
      let lastRow = null;
      for (let row = 0; row < size; row++) {
        sameCountCol = sameCountRow = 0;
        lastCol = lastRow = null;
        for (let col = 0; col < size; col++) {
          let module2 = data.get(row, col);
          if (module2 === lastCol) {
            sameCountCol++;
          } else {
            if (sameCountCol >= 5) points += PenaltyScores.N1 + (sameCountCol - 5);
            lastCol = module2;
            sameCountCol = 1;
          }
          module2 = data.get(col, row);
          if (module2 === lastRow) {
            sameCountRow++;
          } else {
            if (sameCountRow >= 5) points += PenaltyScores.N1 + (sameCountRow - 5);
            lastRow = module2;
            sameCountRow = 1;
          }
        }
        if (sameCountCol >= 5) points += PenaltyScores.N1 + (sameCountCol - 5);
        if (sameCountRow >= 5) points += PenaltyScores.N1 + (sameCountRow - 5);
      }
      return points;
    }, "getPenaltyN1");
    exports.getPenaltyN2 = /* @__PURE__ */ __name(function getPenaltyN2(data) {
      const size = data.size;
      let points = 0;
      for (let row = 0; row < size - 1; row++) {
        for (let col = 0; col < size - 1; col++) {
          const last = data.get(row, col) + data.get(row, col + 1) + data.get(row + 1, col) + data.get(row + 1, col + 1);
          if (last === 4 || last === 0) points++;
        }
      }
      return points * PenaltyScores.N2;
    }, "getPenaltyN2");
    exports.getPenaltyN3 = /* @__PURE__ */ __name(function getPenaltyN3(data) {
      const size = data.size;
      let points = 0;
      let bitsCol = 0;
      let bitsRow = 0;
      for (let row = 0; row < size; row++) {
        bitsCol = bitsRow = 0;
        for (let col = 0; col < size; col++) {
          bitsCol = bitsCol << 1 & 2047 | data.get(row, col);
          if (col >= 10 && (bitsCol === 1488 || bitsCol === 93)) points++;
          bitsRow = bitsRow << 1 & 2047 | data.get(col, row);
          if (col >= 10 && (bitsRow === 1488 || bitsRow === 93)) points++;
        }
      }
      return points * PenaltyScores.N3;
    }, "getPenaltyN3");
    exports.getPenaltyN4 = /* @__PURE__ */ __name(function getPenaltyN4(data) {
      let darkCount = 0;
      const modulesCount = data.data.length;
      for (let i = 0; i < modulesCount; i++) darkCount += data.data[i];
      const k = Math.abs(Math.ceil(darkCount * 100 / modulesCount / 5) - 10);
      return k * PenaltyScores.N4;
    }, "getPenaltyN4");
    function getMaskAt(maskPattern, i, j) {
      switch (maskPattern) {
        case exports.Patterns.PATTERN000:
          return (i + j) % 2 === 0;
        case exports.Patterns.PATTERN001:
          return i % 2 === 0;
        case exports.Patterns.PATTERN010:
          return j % 3 === 0;
        case exports.Patterns.PATTERN011:
          return (i + j) % 3 === 0;
        case exports.Patterns.PATTERN100:
          return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0;
        case exports.Patterns.PATTERN101:
          return i * j % 2 + i * j % 3 === 0;
        case exports.Patterns.PATTERN110:
          return (i * j % 2 + i * j % 3) % 2 === 0;
        case exports.Patterns.PATTERN111:
          return (i * j % 3 + (i + j) % 2) % 2 === 0;
        default:
          throw new Error("bad maskPattern:" + maskPattern);
      }
    }
    __name(getMaskAt, "getMaskAt");
    exports.applyMask = /* @__PURE__ */ __name(function applyMask(pattern, data) {
      const size = data.size;
      for (let col = 0; col < size; col++) {
        for (let row = 0; row < size; row++) {
          if (data.isReserved(row, col)) continue;
          data.xor(row, col, getMaskAt(pattern, row, col));
        }
      }
    }, "applyMask");
    exports.getBestMask = /* @__PURE__ */ __name(function getBestMask(data, setupFormatFunc) {
      const numPatterns = Object.keys(exports.Patterns).length;
      let bestPattern = 0;
      let lowerPenalty = Infinity;
      for (let p = 0; p < numPatterns; p++) {
        setupFormatFunc(p);
        exports.applyMask(p, data);
        const penalty = exports.getPenaltyN1(data) + exports.getPenaltyN2(data) + exports.getPenaltyN3(data) + exports.getPenaltyN4(data);
        exports.applyMask(p, data);
        if (penalty < lowerPenalty) {
          lowerPenalty = penalty;
          bestPattern = p;
        }
      }
      return bestPattern;
    }, "getBestMask");
  }
});

// node_modules/qrcode/lib/core/error-correction-code.js
var require_error_correction_code = __commonJS({
  "node_modules/qrcode/lib/core/error-correction-code.js"(exports) {
    init_modules_watch_stub();
    var ECLevel = require_error_correction_level();
    var EC_BLOCKS_TABLE = [
      // L  M  Q  H
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      2,
      2,
      1,
      2,
      2,
      4,
      1,
      2,
      4,
      4,
      2,
      4,
      4,
      4,
      2,
      4,
      6,
      5,
      2,
      4,
      6,
      6,
      2,
      5,
      8,
      8,
      4,
      5,
      8,
      8,
      4,
      5,
      8,
      11,
      4,
      8,
      10,
      11,
      4,
      9,
      12,
      16,
      4,
      9,
      16,
      16,
      6,
      10,
      12,
      18,
      6,
      10,
      17,
      16,
      6,
      11,
      16,
      19,
      6,
      13,
      18,
      21,
      7,
      14,
      21,
      25,
      8,
      16,
      20,
      25,
      8,
      17,
      23,
      25,
      9,
      17,
      23,
      34,
      9,
      18,
      25,
      30,
      10,
      20,
      27,
      32,
      12,
      21,
      29,
      35,
      12,
      23,
      34,
      37,
      12,
      25,
      34,
      40,
      13,
      26,
      35,
      42,
      14,
      28,
      38,
      45,
      15,
      29,
      40,
      48,
      16,
      31,
      43,
      51,
      17,
      33,
      45,
      54,
      18,
      35,
      48,
      57,
      19,
      37,
      51,
      60,
      19,
      38,
      53,
      63,
      20,
      40,
      56,
      66,
      21,
      43,
      59,
      70,
      22,
      45,
      62,
      74,
      24,
      47,
      65,
      77,
      25,
      49,
      68,
      81
    ];
    var EC_CODEWORDS_TABLE = [
      // L  M  Q  H
      7,
      10,
      13,
      17,
      10,
      16,
      22,
      28,
      15,
      26,
      36,
      44,
      20,
      36,
      52,
      64,
      26,
      48,
      72,
      88,
      36,
      64,
      96,
      112,
      40,
      72,
      108,
      130,
      48,
      88,
      132,
      156,
      60,
      110,
      160,
      192,
      72,
      130,
      192,
      224,
      80,
      150,
      224,
      264,
      96,
      176,
      260,
      308,
      104,
      198,
      288,
      352,
      120,
      216,
      320,
      384,
      132,
      240,
      360,
      432,
      144,
      280,
      408,
      480,
      168,
      308,
      448,
      532,
      180,
      338,
      504,
      588,
      196,
      364,
      546,
      650,
      224,
      416,
      600,
      700,
      224,
      442,
      644,
      750,
      252,
      476,
      690,
      816,
      270,
      504,
      750,
      900,
      300,
      560,
      810,
      960,
      312,
      588,
      870,
      1050,
      336,
      644,
      952,
      1110,
      360,
      700,
      1020,
      1200,
      390,
      728,
      1050,
      1260,
      420,
      784,
      1140,
      1350,
      450,
      812,
      1200,
      1440,
      480,
      868,
      1290,
      1530,
      510,
      924,
      1350,
      1620,
      540,
      980,
      1440,
      1710,
      570,
      1036,
      1530,
      1800,
      570,
      1064,
      1590,
      1890,
      600,
      1120,
      1680,
      1980,
      630,
      1204,
      1770,
      2100,
      660,
      1260,
      1860,
      2220,
      720,
      1316,
      1950,
      2310,
      750,
      1372,
      2040,
      2430
    ];
    exports.getBlocksCount = /* @__PURE__ */ __name(function getBlocksCount(version, errorCorrectionLevel) {
      switch (errorCorrectionLevel) {
        case ECLevel.L:
          return EC_BLOCKS_TABLE[(version - 1) * 4 + 0];
        case ECLevel.M:
          return EC_BLOCKS_TABLE[(version - 1) * 4 + 1];
        case ECLevel.Q:
          return EC_BLOCKS_TABLE[(version - 1) * 4 + 2];
        case ECLevel.H:
          return EC_BLOCKS_TABLE[(version - 1) * 4 + 3];
        default:
          return void 0;
      }
    }, "getBlocksCount");
    exports.getTotalCodewordsCount = /* @__PURE__ */ __name(function getTotalCodewordsCount(version, errorCorrectionLevel) {
      switch (errorCorrectionLevel) {
        case ECLevel.L:
          return EC_CODEWORDS_TABLE[(version - 1) * 4 + 0];
        case ECLevel.M:
          return EC_CODEWORDS_TABLE[(version - 1) * 4 + 1];
        case ECLevel.Q:
          return EC_CODEWORDS_TABLE[(version - 1) * 4 + 2];
        case ECLevel.H:
          return EC_CODEWORDS_TABLE[(version - 1) * 4 + 3];
        default:
          return void 0;
      }
    }, "getTotalCodewordsCount");
  }
});

// node_modules/qrcode/lib/core/galois-field.js
var require_galois_field = __commonJS({
  "node_modules/qrcode/lib/core/galois-field.js"(exports) {
    init_modules_watch_stub();
    var EXP_TABLE = new Uint8Array(512);
    var LOG_TABLE = new Uint8Array(256);
    (/* @__PURE__ */ __name(function initTables() {
      let x = 1;
      for (let i = 0; i < 255; i++) {
        EXP_TABLE[i] = x;
        LOG_TABLE[x] = i;
        x <<= 1;
        if (x & 256) {
          x ^= 285;
        }
      }
      for (let i = 255; i < 512; i++) {
        EXP_TABLE[i] = EXP_TABLE[i - 255];
      }
    }, "initTables"))();
    exports.log = /* @__PURE__ */ __name(function log(n) {
      if (n < 1) throw new Error("log(" + n + ")");
      return LOG_TABLE[n];
    }, "log");
    exports.exp = /* @__PURE__ */ __name(function exp(n) {
      return EXP_TABLE[n];
    }, "exp");
    exports.mul = /* @__PURE__ */ __name(function mul(x, y) {
      if (x === 0 || y === 0) return 0;
      return EXP_TABLE[LOG_TABLE[x] + LOG_TABLE[y]];
    }, "mul");
  }
});

// node_modules/qrcode/lib/core/polynomial.js
var require_polynomial = __commonJS({
  "node_modules/qrcode/lib/core/polynomial.js"(exports) {
    init_modules_watch_stub();
    var GF = require_galois_field();
    exports.mul = /* @__PURE__ */ __name(function mul(p1, p2) {
      const coeff = new Uint8Array(p1.length + p2.length - 1);
      for (let i = 0; i < p1.length; i++) {
        for (let j = 0; j < p2.length; j++) {
          coeff[i + j] ^= GF.mul(p1[i], p2[j]);
        }
      }
      return coeff;
    }, "mul");
    exports.mod = /* @__PURE__ */ __name(function mod(divident, divisor) {
      let result = new Uint8Array(divident);
      while (result.length - divisor.length >= 0) {
        const coeff = result[0];
        for (let i = 0; i < divisor.length; i++) {
          result[i] ^= GF.mul(divisor[i], coeff);
        }
        let offset = 0;
        while (offset < result.length && result[offset] === 0) offset++;
        result = result.slice(offset);
      }
      return result;
    }, "mod");
    exports.generateECPolynomial = /* @__PURE__ */ __name(function generateECPolynomial(degree) {
      let poly = new Uint8Array([1]);
      for (let i = 0; i < degree; i++) {
        poly = exports.mul(poly, new Uint8Array([1, GF.exp(i)]));
      }
      return poly;
    }, "generateECPolynomial");
  }
});

// node_modules/qrcode/lib/core/reed-solomon-encoder.js
var require_reed_solomon_encoder = __commonJS({
  "node_modules/qrcode/lib/core/reed-solomon-encoder.js"(exports, module) {
    init_modules_watch_stub();
    var Polynomial = require_polynomial();
    function ReedSolomonEncoder(degree) {
      this.genPoly = void 0;
      this.degree = degree;
      if (this.degree) this.initialize(this.degree);
    }
    __name(ReedSolomonEncoder, "ReedSolomonEncoder");
    ReedSolomonEncoder.prototype.initialize = /* @__PURE__ */ __name(function initialize(degree) {
      this.degree = degree;
      this.genPoly = Polynomial.generateECPolynomial(this.degree);
    }, "initialize");
    ReedSolomonEncoder.prototype.encode = /* @__PURE__ */ __name(function encode(data) {
      if (!this.genPoly) {
        throw new Error("Encoder not initialized");
      }
      const paddedData = new Uint8Array(data.length + this.degree);
      paddedData.set(data);
      const remainder = Polynomial.mod(paddedData, this.genPoly);
      const start = this.degree - remainder.length;
      if (start > 0) {
        const buff = new Uint8Array(this.degree);
        buff.set(remainder, start);
        return buff;
      }
      return remainder;
    }, "encode");
    module.exports = ReedSolomonEncoder;
  }
});

// node_modules/qrcode/lib/core/version-check.js
var require_version_check = __commonJS({
  "node_modules/qrcode/lib/core/version-check.js"(exports) {
    init_modules_watch_stub();
    exports.isValid = /* @__PURE__ */ __name(function isValid(version) {
      return !isNaN(version) && version >= 1 && version <= 40;
    }, "isValid");
  }
});

// node_modules/qrcode/lib/core/regex.js
var require_regex = __commonJS({
  "node_modules/qrcode/lib/core/regex.js"(exports) {
    init_modules_watch_stub();
    var numeric = "[0-9]+";
    var alphanumeric = "[A-Z $%*+\\-./:]+";
    var kanji = "(?:[u3000-u303F]|[u3040-u309F]|[u30A0-u30FF]|[uFF00-uFFEF]|[u4E00-u9FAF]|[u2605-u2606]|[u2190-u2195]|u203B|[u2010u2015u2018u2019u2025u2026u201Cu201Du2225u2260]|[u0391-u0451]|[u00A7u00A8u00B1u00B4u00D7u00F7])+";
    kanji = kanji.replace(/u/g, "\\u");
    var byte = "(?:(?![A-Z0-9 $%*+\\-./:]|" + kanji + ")(?:.|[\r\n]))+";
    exports.KANJI = new RegExp(kanji, "g");
    exports.BYTE_KANJI = new RegExp("[^A-Z0-9 $%*+\\-./:]+", "g");
    exports.BYTE = new RegExp(byte, "g");
    exports.NUMERIC = new RegExp(numeric, "g");
    exports.ALPHANUMERIC = new RegExp(alphanumeric, "g");
    var TEST_KANJI = new RegExp("^" + kanji + "$");
    var TEST_NUMERIC = new RegExp("^" + numeric + "$");
    var TEST_ALPHANUMERIC = new RegExp("^[A-Z0-9 $%*+\\-./:]+$");
    exports.testKanji = /* @__PURE__ */ __name(function testKanji(str) {
      return TEST_KANJI.test(str);
    }, "testKanji");
    exports.testNumeric = /* @__PURE__ */ __name(function testNumeric(str) {
      return TEST_NUMERIC.test(str);
    }, "testNumeric");
    exports.testAlphanumeric = /* @__PURE__ */ __name(function testAlphanumeric(str) {
      return TEST_ALPHANUMERIC.test(str);
    }, "testAlphanumeric");
  }
});

// node_modules/qrcode/lib/core/mode.js
var require_mode = __commonJS({
  "node_modules/qrcode/lib/core/mode.js"(exports) {
    init_modules_watch_stub();
    var VersionCheck = require_version_check();
    var Regex = require_regex();
    exports.NUMERIC = {
      id: "Numeric",
      bit: 1 << 0,
      ccBits: [10, 12, 14]
    };
    exports.ALPHANUMERIC = {
      id: "Alphanumeric",
      bit: 1 << 1,
      ccBits: [9, 11, 13]
    };
    exports.BYTE = {
      id: "Byte",
      bit: 1 << 2,
      ccBits: [8, 16, 16]
    };
    exports.KANJI = {
      id: "Kanji",
      bit: 1 << 3,
      ccBits: [8, 10, 12]
    };
    exports.MIXED = {
      bit: -1
    };
    exports.getCharCountIndicator = /* @__PURE__ */ __name(function getCharCountIndicator(mode, version) {
      if (!mode.ccBits) throw new Error("Invalid mode: " + mode);
      if (!VersionCheck.isValid(version)) {
        throw new Error("Invalid version: " + version);
      }
      if (version >= 1 && version < 10) return mode.ccBits[0];
      else if (version < 27) return mode.ccBits[1];
      return mode.ccBits[2];
    }, "getCharCountIndicator");
    exports.getBestModeForData = /* @__PURE__ */ __name(function getBestModeForData(dataStr) {
      if (Regex.testNumeric(dataStr)) return exports.NUMERIC;
      else if (Regex.testAlphanumeric(dataStr)) return exports.ALPHANUMERIC;
      else if (Regex.testKanji(dataStr)) return exports.KANJI;
      else return exports.BYTE;
    }, "getBestModeForData");
    exports.toString = /* @__PURE__ */ __name(function toString(mode) {
      if (mode && mode.id) return mode.id;
      throw new Error("Invalid mode");
    }, "toString");
    exports.isValid = /* @__PURE__ */ __name(function isValid(mode) {
      return mode && mode.bit && mode.ccBits;
    }, "isValid");
    function fromString(string) {
      if (typeof string !== "string") {
        throw new Error("Param is not a string");
      }
      const lcStr = string.toLowerCase();
      switch (lcStr) {
        case "numeric":
          return exports.NUMERIC;
        case "alphanumeric":
          return exports.ALPHANUMERIC;
        case "kanji":
          return exports.KANJI;
        case "byte":
          return exports.BYTE;
        default:
          throw new Error("Unknown mode: " + string);
      }
    }
    __name(fromString, "fromString");
    exports.from = /* @__PURE__ */ __name(function from(value, defaultValue) {
      if (exports.isValid(value)) {
        return value;
      }
      try {
        return fromString(value);
      } catch (e) {
        return defaultValue;
      }
    }, "from");
  }
});

// node_modules/qrcode/lib/core/version.js
var require_version = __commonJS({
  "node_modules/qrcode/lib/core/version.js"(exports) {
    init_modules_watch_stub();
    var Utils = require_utils();
    var ECCode = require_error_correction_code();
    var ECLevel = require_error_correction_level();
    var Mode = require_mode();
    var VersionCheck = require_version_check();
    var G18 = 1 << 12 | 1 << 11 | 1 << 10 | 1 << 9 | 1 << 8 | 1 << 5 | 1 << 2 | 1 << 0;
    var G18_BCH = Utils.getBCHDigit(G18);
    function getBestVersionForDataLength(mode, length, errorCorrectionLevel) {
      for (let currentVersion = 1; currentVersion <= 40; currentVersion++) {
        if (length <= exports.getCapacity(currentVersion, errorCorrectionLevel, mode)) {
          return currentVersion;
        }
      }
      return void 0;
    }
    __name(getBestVersionForDataLength, "getBestVersionForDataLength");
    function getReservedBitsCount(mode, version) {
      return Mode.getCharCountIndicator(mode, version) + 4;
    }
    __name(getReservedBitsCount, "getReservedBitsCount");
    function getTotalBitsFromDataArray(segments, version) {
      let totalBits = 0;
      segments.forEach(function(data) {
        const reservedBits = getReservedBitsCount(data.mode, version);
        totalBits += reservedBits + data.getBitsLength();
      });
      return totalBits;
    }
    __name(getTotalBitsFromDataArray, "getTotalBitsFromDataArray");
    function getBestVersionForMixedData(segments, errorCorrectionLevel) {
      for (let currentVersion = 1; currentVersion <= 40; currentVersion++) {
        const length = getTotalBitsFromDataArray(segments, currentVersion);
        if (length <= exports.getCapacity(currentVersion, errorCorrectionLevel, Mode.MIXED)) {
          return currentVersion;
        }
      }
      return void 0;
    }
    __name(getBestVersionForMixedData, "getBestVersionForMixedData");
    exports.from = /* @__PURE__ */ __name(function from(value, defaultValue) {
      if (VersionCheck.isValid(value)) {
        return parseInt(value, 10);
      }
      return defaultValue;
    }, "from");
    exports.getCapacity = /* @__PURE__ */ __name(function getCapacity(version, errorCorrectionLevel, mode) {
      if (!VersionCheck.isValid(version)) {
        throw new Error("Invalid QR Code version");
      }
      if (typeof mode === "undefined") mode = Mode.BYTE;
      const totalCodewords = Utils.getSymbolTotalCodewords(version);
      const ecTotalCodewords = ECCode.getTotalCodewordsCount(version, errorCorrectionLevel);
      const dataTotalCodewordsBits = (totalCodewords - ecTotalCodewords) * 8;
      if (mode === Mode.MIXED) return dataTotalCodewordsBits;
      const usableBits = dataTotalCodewordsBits - getReservedBitsCount(mode, version);
      switch (mode) {
        case Mode.NUMERIC:
          return Math.floor(usableBits / 10 * 3);
        case Mode.ALPHANUMERIC:
          return Math.floor(usableBits / 11 * 2);
        case Mode.KANJI:
          return Math.floor(usableBits / 13);
        case Mode.BYTE:
        default:
          return Math.floor(usableBits / 8);
      }
    }, "getCapacity");
    exports.getBestVersionForData = /* @__PURE__ */ __name(function getBestVersionForData(data, errorCorrectionLevel) {
      let seg;
      const ecl = ECLevel.from(errorCorrectionLevel, ECLevel.M);
      if (Array.isArray(data)) {
        if (data.length > 1) {
          return getBestVersionForMixedData(data, ecl);
        }
        if (data.length === 0) {
          return 1;
        }
        seg = data[0];
      } else {
        seg = data;
      }
      return getBestVersionForDataLength(seg.mode, seg.getLength(), ecl);
    }, "getBestVersionForData");
    exports.getEncodedBits = /* @__PURE__ */ __name(function getEncodedBits(version) {
      if (!VersionCheck.isValid(version) || version < 7) {
        throw new Error("Invalid QR Code version");
      }
      let d = version << 12;
      while (Utils.getBCHDigit(d) - G18_BCH >= 0) {
        d ^= G18 << Utils.getBCHDigit(d) - G18_BCH;
      }
      return version << 12 | d;
    }, "getEncodedBits");
  }
});

// node_modules/qrcode/lib/core/format-info.js
var require_format_info = __commonJS({
  "node_modules/qrcode/lib/core/format-info.js"(exports) {
    init_modules_watch_stub();
    var Utils = require_utils();
    var G15 = 1 << 10 | 1 << 8 | 1 << 5 | 1 << 4 | 1 << 2 | 1 << 1 | 1 << 0;
    var G15_MASK = 1 << 14 | 1 << 12 | 1 << 10 | 1 << 4 | 1 << 1;
    var G15_BCH = Utils.getBCHDigit(G15);
    exports.getEncodedBits = /* @__PURE__ */ __name(function getEncodedBits(errorCorrectionLevel, mask) {
      const data = errorCorrectionLevel.bit << 3 | mask;
      let d = data << 10;
      while (Utils.getBCHDigit(d) - G15_BCH >= 0) {
        d ^= G15 << Utils.getBCHDigit(d) - G15_BCH;
      }
      return (data << 10 | d) ^ G15_MASK;
    }, "getEncodedBits");
  }
});

// node_modules/qrcode/lib/core/numeric-data.js
var require_numeric_data = __commonJS({
  "node_modules/qrcode/lib/core/numeric-data.js"(exports, module) {
    init_modules_watch_stub();
    var Mode = require_mode();
    function NumericData(data) {
      this.mode = Mode.NUMERIC;
      this.data = data.toString();
    }
    __name(NumericData, "NumericData");
    NumericData.getBitsLength = /* @__PURE__ */ __name(function getBitsLength(length) {
      return 10 * Math.floor(length / 3) + (length % 3 ? length % 3 * 3 + 1 : 0);
    }, "getBitsLength");
    NumericData.prototype.getLength = /* @__PURE__ */ __name(function getLength() {
      return this.data.length;
    }, "getLength");
    NumericData.prototype.getBitsLength = /* @__PURE__ */ __name(function getBitsLength() {
      return NumericData.getBitsLength(this.data.length);
    }, "getBitsLength");
    NumericData.prototype.write = /* @__PURE__ */ __name(function write(bitBuffer) {
      let i, group, value;
      for (i = 0; i + 3 <= this.data.length; i += 3) {
        group = this.data.substr(i, 3);
        value = parseInt(group, 10);
        bitBuffer.put(value, 10);
      }
      const remainingNum = this.data.length - i;
      if (remainingNum > 0) {
        group = this.data.substr(i);
        value = parseInt(group, 10);
        bitBuffer.put(value, remainingNum * 3 + 1);
      }
    }, "write");
    module.exports = NumericData;
  }
});

// node_modules/qrcode/lib/core/alphanumeric-data.js
var require_alphanumeric_data = __commonJS({
  "node_modules/qrcode/lib/core/alphanumeric-data.js"(exports, module) {
    init_modules_watch_stub();
    var Mode = require_mode();
    var ALPHA_NUM_CHARS = [
      "0",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L",
      "M",
      "N",
      "O",
      "P",
      "Q",
      "R",
      "S",
      "T",
      "U",
      "V",
      "W",
      "X",
      "Y",
      "Z",
      " ",
      "$",
      "%",
      "*",
      "+",
      "-",
      ".",
      "/",
      ":"
    ];
    function AlphanumericData(data) {
      this.mode = Mode.ALPHANUMERIC;
      this.data = data;
    }
    __name(AlphanumericData, "AlphanumericData");
    AlphanumericData.getBitsLength = /* @__PURE__ */ __name(function getBitsLength(length) {
      return 11 * Math.floor(length / 2) + 6 * (length % 2);
    }, "getBitsLength");
    AlphanumericData.prototype.getLength = /* @__PURE__ */ __name(function getLength() {
      return this.data.length;
    }, "getLength");
    AlphanumericData.prototype.getBitsLength = /* @__PURE__ */ __name(function getBitsLength() {
      return AlphanumericData.getBitsLength(this.data.length);
    }, "getBitsLength");
    AlphanumericData.prototype.write = /* @__PURE__ */ __name(function write(bitBuffer) {
      let i;
      for (i = 0; i + 2 <= this.data.length; i += 2) {
        let value = ALPHA_NUM_CHARS.indexOf(this.data[i]) * 45;
        value += ALPHA_NUM_CHARS.indexOf(this.data[i + 1]);
        bitBuffer.put(value, 11);
      }
      if (this.data.length % 2) {
        bitBuffer.put(ALPHA_NUM_CHARS.indexOf(this.data[i]), 6);
      }
    }, "write");
    module.exports = AlphanumericData;
  }
});

// node_modules/qrcode/lib/core/byte-data.js
var require_byte_data = __commonJS({
  "node_modules/qrcode/lib/core/byte-data.js"(exports, module) {
    init_modules_watch_stub();
    var Mode = require_mode();
    function ByteData(data) {
      this.mode = Mode.BYTE;
      if (typeof data === "string") {
        this.data = new TextEncoder().encode(data);
      } else {
        this.data = new Uint8Array(data);
      }
    }
    __name(ByteData, "ByteData");
    ByteData.getBitsLength = /* @__PURE__ */ __name(function getBitsLength(length) {
      return length * 8;
    }, "getBitsLength");
    ByteData.prototype.getLength = /* @__PURE__ */ __name(function getLength() {
      return this.data.length;
    }, "getLength");
    ByteData.prototype.getBitsLength = /* @__PURE__ */ __name(function getBitsLength() {
      return ByteData.getBitsLength(this.data.length);
    }, "getBitsLength");
    ByteData.prototype.write = function(bitBuffer) {
      for (let i = 0, l = this.data.length; i < l; i++) {
        bitBuffer.put(this.data[i], 8);
      }
    };
    module.exports = ByteData;
  }
});

// node_modules/qrcode/lib/core/kanji-data.js
var require_kanji_data = __commonJS({
  "node_modules/qrcode/lib/core/kanji-data.js"(exports, module) {
    init_modules_watch_stub();
    var Mode = require_mode();
    var Utils = require_utils();
    function KanjiData(data) {
      this.mode = Mode.KANJI;
      this.data = data;
    }
    __name(KanjiData, "KanjiData");
    KanjiData.getBitsLength = /* @__PURE__ */ __name(function getBitsLength(length) {
      return length * 13;
    }, "getBitsLength");
    KanjiData.prototype.getLength = /* @__PURE__ */ __name(function getLength() {
      return this.data.length;
    }, "getLength");
    KanjiData.prototype.getBitsLength = /* @__PURE__ */ __name(function getBitsLength() {
      return KanjiData.getBitsLength(this.data.length);
    }, "getBitsLength");
    KanjiData.prototype.write = function(bitBuffer) {
      let i;
      for (i = 0; i < this.data.length; i++) {
        let value = Utils.toSJIS(this.data[i]);
        if (value >= 33088 && value <= 40956) {
          value -= 33088;
        } else if (value >= 57408 && value <= 60351) {
          value -= 49472;
        } else {
          throw new Error(
            "Invalid SJIS character: " + this.data[i] + "\nMake sure your charset is UTF-8"
          );
        }
        value = (value >>> 8 & 255) * 192 + (value & 255);
        bitBuffer.put(value, 13);
      }
    };
    module.exports = KanjiData;
  }
});

// node_modules/dijkstrajs/dijkstra.js
var require_dijkstra = __commonJS({
  "node_modules/dijkstrajs/dijkstra.js"(exports, module) {
    "use strict";
    init_modules_watch_stub();
    var dijkstra = {
      single_source_shortest_paths: /* @__PURE__ */ __name(function(graph, s, d) {
        var predecessors = {};
        var costs = {};
        costs[s] = 0;
        var open = dijkstra.PriorityQueue.make();
        open.push(s, 0);
        var closest, u, v, cost_of_s_to_u, adjacent_nodes, cost_of_e, cost_of_s_to_u_plus_cost_of_e, cost_of_s_to_v, first_visit;
        while (!open.empty()) {
          closest = open.pop();
          u = closest.value;
          cost_of_s_to_u = closest.cost;
          adjacent_nodes = graph[u] || {};
          for (v in adjacent_nodes) {
            if (adjacent_nodes.hasOwnProperty(v)) {
              cost_of_e = adjacent_nodes[v];
              cost_of_s_to_u_plus_cost_of_e = cost_of_s_to_u + cost_of_e;
              cost_of_s_to_v = costs[v];
              first_visit = typeof costs[v] === "undefined";
              if (first_visit || cost_of_s_to_v > cost_of_s_to_u_plus_cost_of_e) {
                costs[v] = cost_of_s_to_u_plus_cost_of_e;
                open.push(v, cost_of_s_to_u_plus_cost_of_e);
                predecessors[v] = u;
              }
            }
          }
        }
        if (typeof d !== "undefined" && typeof costs[d] === "undefined") {
          var msg = ["Could not find a path from ", s, " to ", d, "."].join("");
          throw new Error(msg);
        }
        return predecessors;
      }, "single_source_shortest_paths"),
      extract_shortest_path_from_predecessor_list: /* @__PURE__ */ __name(function(predecessors, d) {
        var nodes = [];
        var u = d;
        var predecessor;
        while (u) {
          nodes.push(u);
          predecessor = predecessors[u];
          u = predecessors[u];
        }
        nodes.reverse();
        return nodes;
      }, "extract_shortest_path_from_predecessor_list"),
      find_path: /* @__PURE__ */ __name(function(graph, s, d) {
        var predecessors = dijkstra.single_source_shortest_paths(graph, s, d);
        return dijkstra.extract_shortest_path_from_predecessor_list(
          predecessors,
          d
        );
      }, "find_path"),
      /**
       * A very naive priority queue implementation.
       */
      PriorityQueue: {
        make: /* @__PURE__ */ __name(function(opts) {
          var T = dijkstra.PriorityQueue, t = {}, key;
          opts = opts || {};
          for (key in T) {
            if (T.hasOwnProperty(key)) {
              t[key] = T[key];
            }
          }
          t.queue = [];
          t.sorter = opts.sorter || T.default_sorter;
          return t;
        }, "make"),
        default_sorter: /* @__PURE__ */ __name(function(a, b) {
          return a.cost - b.cost;
        }, "default_sorter"),
        /**
         * Add a new item to the queue and ensure the highest priority element
         * is at the front of the queue.
         */
        push: /* @__PURE__ */ __name(function(value, cost) {
          var item = { value, cost };
          this.queue.push(item);
          this.queue.sort(this.sorter);
        }, "push"),
        /**
         * Return the highest priority element in the queue.
         */
        pop: /* @__PURE__ */ __name(function() {
          return this.queue.shift();
        }, "pop"),
        empty: /* @__PURE__ */ __name(function() {
          return this.queue.length === 0;
        }, "empty")
      }
    };
    if (typeof module !== "undefined") {
      module.exports = dijkstra;
    }
  }
});

// node_modules/qrcode/lib/core/segments.js
var require_segments = __commonJS({
  "node_modules/qrcode/lib/core/segments.js"(exports) {
    init_modules_watch_stub();
    var Mode = require_mode();
    var NumericData = require_numeric_data();
    var AlphanumericData = require_alphanumeric_data();
    var ByteData = require_byte_data();
    var KanjiData = require_kanji_data();
    var Regex = require_regex();
    var Utils = require_utils();
    var dijkstra = require_dijkstra();
    function getStringByteLength(str) {
      return unescape(encodeURIComponent(str)).length;
    }
    __name(getStringByteLength, "getStringByteLength");
    function getSegments(regex, mode, str) {
      const segments = [];
      let result;
      while ((result = regex.exec(str)) !== null) {
        segments.push({
          data: result[0],
          index: result.index,
          mode,
          length: result[0].length
        });
      }
      return segments;
    }
    __name(getSegments, "getSegments");
    function getSegmentsFromString(dataStr) {
      const numSegs = getSegments(Regex.NUMERIC, Mode.NUMERIC, dataStr);
      const alphaNumSegs = getSegments(Regex.ALPHANUMERIC, Mode.ALPHANUMERIC, dataStr);
      let byteSegs;
      let kanjiSegs;
      if (Utils.isKanjiModeEnabled()) {
        byteSegs = getSegments(Regex.BYTE, Mode.BYTE, dataStr);
        kanjiSegs = getSegments(Regex.KANJI, Mode.KANJI, dataStr);
      } else {
        byteSegs = getSegments(Regex.BYTE_KANJI, Mode.BYTE, dataStr);
        kanjiSegs = [];
      }
      const segs = numSegs.concat(alphaNumSegs, byteSegs, kanjiSegs);
      return segs.sort(function(s1, s2) {
        return s1.index - s2.index;
      }).map(function(obj) {
        return {
          data: obj.data,
          mode: obj.mode,
          length: obj.length
        };
      });
    }
    __name(getSegmentsFromString, "getSegmentsFromString");
    function getSegmentBitsLength(length, mode) {
      switch (mode) {
        case Mode.NUMERIC:
          return NumericData.getBitsLength(length);
        case Mode.ALPHANUMERIC:
          return AlphanumericData.getBitsLength(length);
        case Mode.KANJI:
          return KanjiData.getBitsLength(length);
        case Mode.BYTE:
          return ByteData.getBitsLength(length);
      }
    }
    __name(getSegmentBitsLength, "getSegmentBitsLength");
    function mergeSegments(segs) {
      return segs.reduce(function(acc, curr) {
        const prevSeg = acc.length - 1 >= 0 ? acc[acc.length - 1] : null;
        if (prevSeg && prevSeg.mode === curr.mode) {
          acc[acc.length - 1].data += curr.data;
          return acc;
        }
        acc.push(curr);
        return acc;
      }, []);
    }
    __name(mergeSegments, "mergeSegments");
    function buildNodes(segs) {
      const nodes = [];
      for (let i = 0; i < segs.length; i++) {
        const seg = segs[i];
        switch (seg.mode) {
          case Mode.NUMERIC:
            nodes.push([
              seg,
              { data: seg.data, mode: Mode.ALPHANUMERIC, length: seg.length },
              { data: seg.data, mode: Mode.BYTE, length: seg.length }
            ]);
            break;
          case Mode.ALPHANUMERIC:
            nodes.push([
              seg,
              { data: seg.data, mode: Mode.BYTE, length: seg.length }
            ]);
            break;
          case Mode.KANJI:
            nodes.push([
              seg,
              { data: seg.data, mode: Mode.BYTE, length: getStringByteLength(seg.data) }
            ]);
            break;
          case Mode.BYTE:
            nodes.push([
              { data: seg.data, mode: Mode.BYTE, length: getStringByteLength(seg.data) }
            ]);
        }
      }
      return nodes;
    }
    __name(buildNodes, "buildNodes");
    function buildGraph(nodes, version) {
      const table = {};
      const graph = { start: {} };
      let prevNodeIds = ["start"];
      for (let i = 0; i < nodes.length; i++) {
        const nodeGroup = nodes[i];
        const currentNodeIds = [];
        for (let j = 0; j < nodeGroup.length; j++) {
          const node = nodeGroup[j];
          const key = "" + i + j;
          currentNodeIds.push(key);
          table[key] = { node, lastCount: 0 };
          graph[key] = {};
          for (let n = 0; n < prevNodeIds.length; n++) {
            const prevNodeId = prevNodeIds[n];
            if (table[prevNodeId] && table[prevNodeId].node.mode === node.mode) {
              graph[prevNodeId][key] = getSegmentBitsLength(table[prevNodeId].lastCount + node.length, node.mode) - getSegmentBitsLength(table[prevNodeId].lastCount, node.mode);
              table[prevNodeId].lastCount += node.length;
            } else {
              if (table[prevNodeId]) table[prevNodeId].lastCount = node.length;
              graph[prevNodeId][key] = getSegmentBitsLength(node.length, node.mode) + 4 + Mode.getCharCountIndicator(node.mode, version);
            }
          }
        }
        prevNodeIds = currentNodeIds;
      }
      for (let n = 0; n < prevNodeIds.length; n++) {
        graph[prevNodeIds[n]].end = 0;
      }
      return { map: graph, table };
    }
    __name(buildGraph, "buildGraph");
    function buildSingleSegment(data, modesHint) {
      let mode;
      const bestMode = Mode.getBestModeForData(data);
      mode = Mode.from(modesHint, bestMode);
      if (mode !== Mode.BYTE && mode.bit < bestMode.bit) {
        throw new Error('"' + data + '" cannot be encoded with mode ' + Mode.toString(mode) + ".\n Suggested mode is: " + Mode.toString(bestMode));
      }
      if (mode === Mode.KANJI && !Utils.isKanjiModeEnabled()) {
        mode = Mode.BYTE;
      }
      switch (mode) {
        case Mode.NUMERIC:
          return new NumericData(data);
        case Mode.ALPHANUMERIC:
          return new AlphanumericData(data);
        case Mode.KANJI:
          return new KanjiData(data);
        case Mode.BYTE:
          return new ByteData(data);
      }
    }
    __name(buildSingleSegment, "buildSingleSegment");
    exports.fromArray = /* @__PURE__ */ __name(function fromArray(array) {
      return array.reduce(function(acc, seg) {
        if (typeof seg === "string") {
          acc.push(buildSingleSegment(seg, null));
        } else if (seg.data) {
          acc.push(buildSingleSegment(seg.data, seg.mode));
        }
        return acc;
      }, []);
    }, "fromArray");
    exports.fromString = /* @__PURE__ */ __name(function fromString(data, version) {
      const segs = getSegmentsFromString(data, Utils.isKanjiModeEnabled());
      const nodes = buildNodes(segs);
      const graph = buildGraph(nodes, version);
      const path = dijkstra.find_path(graph.map, "start", "end");
      const optimizedSegs = [];
      for (let i = 1; i < path.length - 1; i++) {
        optimizedSegs.push(graph.table[path[i]].node);
      }
      return exports.fromArray(mergeSegments(optimizedSegs));
    }, "fromString");
    exports.rawSplit = /* @__PURE__ */ __name(function rawSplit(data) {
      return exports.fromArray(
        getSegmentsFromString(data, Utils.isKanjiModeEnabled())
      );
    }, "rawSplit");
  }
});

// node_modules/qrcode/lib/core/qrcode.js
var require_qrcode = __commonJS({
  "node_modules/qrcode/lib/core/qrcode.js"(exports) {
    init_modules_watch_stub();
    var Utils = require_utils();
    var ECLevel = require_error_correction_level();
    var BitBuffer = require_bit_buffer();
    var BitMatrix = require_bit_matrix();
    var AlignmentPattern = require_alignment_pattern();
    var FinderPattern = require_finder_pattern();
    var MaskPattern = require_mask_pattern();
    var ECCode = require_error_correction_code();
    var ReedSolomonEncoder = require_reed_solomon_encoder();
    var Version = require_version();
    var FormatInfo = require_format_info();
    var Mode = require_mode();
    var Segments = require_segments();
    function setupFinderPattern(matrix, version) {
      const size = matrix.size;
      const pos = FinderPattern.getPositions(version);
      for (let i = 0; i < pos.length; i++) {
        const row = pos[i][0];
        const col = pos[i][1];
        for (let r = -1; r <= 7; r++) {
          if (row + r <= -1 || size <= row + r) continue;
          for (let c = -1; c <= 7; c++) {
            if (col + c <= -1 || size <= col + c) continue;
            if (r >= 0 && r <= 6 && (c === 0 || c === 6) || c >= 0 && c <= 6 && (r === 0 || r === 6) || r >= 2 && r <= 4 && c >= 2 && c <= 4) {
              matrix.set(row + r, col + c, true, true);
            } else {
              matrix.set(row + r, col + c, false, true);
            }
          }
        }
      }
    }
    __name(setupFinderPattern, "setupFinderPattern");
    function setupTimingPattern(matrix) {
      const size = matrix.size;
      for (let r = 8; r < size - 8; r++) {
        const value = r % 2 === 0;
        matrix.set(r, 6, value, true);
        matrix.set(6, r, value, true);
      }
    }
    __name(setupTimingPattern, "setupTimingPattern");
    function setupAlignmentPattern(matrix, version) {
      const pos = AlignmentPattern.getPositions(version);
      for (let i = 0; i < pos.length; i++) {
        const row = pos[i][0];
        const col = pos[i][1];
        for (let r = -2; r <= 2; r++) {
          for (let c = -2; c <= 2; c++) {
            if (r === -2 || r === 2 || c === -2 || c === 2 || r === 0 && c === 0) {
              matrix.set(row + r, col + c, true, true);
            } else {
              matrix.set(row + r, col + c, false, true);
            }
          }
        }
      }
    }
    __name(setupAlignmentPattern, "setupAlignmentPattern");
    function setupVersionInfo(matrix, version) {
      const size = matrix.size;
      const bits = Version.getEncodedBits(version);
      let row, col, mod;
      for (let i = 0; i < 18; i++) {
        row = Math.floor(i / 3);
        col = i % 3 + size - 8 - 3;
        mod = (bits >> i & 1) === 1;
        matrix.set(row, col, mod, true);
        matrix.set(col, row, mod, true);
      }
    }
    __name(setupVersionInfo, "setupVersionInfo");
    function setupFormatInfo(matrix, errorCorrectionLevel, maskPattern) {
      const size = matrix.size;
      const bits = FormatInfo.getEncodedBits(errorCorrectionLevel, maskPattern);
      let i, mod;
      for (i = 0; i < 15; i++) {
        mod = (bits >> i & 1) === 1;
        if (i < 6) {
          matrix.set(i, 8, mod, true);
        } else if (i < 8) {
          matrix.set(i + 1, 8, mod, true);
        } else {
          matrix.set(size - 15 + i, 8, mod, true);
        }
        if (i < 8) {
          matrix.set(8, size - i - 1, mod, true);
        } else if (i < 9) {
          matrix.set(8, 15 - i - 1 + 1, mod, true);
        } else {
          matrix.set(8, 15 - i - 1, mod, true);
        }
      }
      matrix.set(size - 8, 8, 1, true);
    }
    __name(setupFormatInfo, "setupFormatInfo");
    function setupData(matrix, data) {
      const size = matrix.size;
      let inc = -1;
      let row = size - 1;
      let bitIndex = 7;
      let byteIndex = 0;
      for (let col = size - 1; col > 0; col -= 2) {
        if (col === 6) col--;
        while (true) {
          for (let c = 0; c < 2; c++) {
            if (!matrix.isReserved(row, col - c)) {
              let dark = false;
              if (byteIndex < data.length) {
                dark = (data[byteIndex] >>> bitIndex & 1) === 1;
              }
              matrix.set(row, col - c, dark);
              bitIndex--;
              if (bitIndex === -1) {
                byteIndex++;
                bitIndex = 7;
              }
            }
          }
          row += inc;
          if (row < 0 || size <= row) {
            row -= inc;
            inc = -inc;
            break;
          }
        }
      }
    }
    __name(setupData, "setupData");
    function createData(version, errorCorrectionLevel, segments) {
      const buffer = new BitBuffer();
      segments.forEach(function(data) {
        buffer.put(data.mode.bit, 4);
        buffer.put(data.getLength(), Mode.getCharCountIndicator(data.mode, version));
        data.write(buffer);
      });
      const totalCodewords = Utils.getSymbolTotalCodewords(version);
      const ecTotalCodewords = ECCode.getTotalCodewordsCount(version, errorCorrectionLevel);
      const dataTotalCodewordsBits = (totalCodewords - ecTotalCodewords) * 8;
      if (buffer.getLengthInBits() + 4 <= dataTotalCodewordsBits) {
        buffer.put(0, 4);
      }
      while (buffer.getLengthInBits() % 8 !== 0) {
        buffer.putBit(0);
      }
      const remainingByte = (dataTotalCodewordsBits - buffer.getLengthInBits()) / 8;
      for (let i = 0; i < remainingByte; i++) {
        buffer.put(i % 2 ? 17 : 236, 8);
      }
      return createCodewords(buffer, version, errorCorrectionLevel);
    }
    __name(createData, "createData");
    function createCodewords(bitBuffer, version, errorCorrectionLevel) {
      const totalCodewords = Utils.getSymbolTotalCodewords(version);
      const ecTotalCodewords = ECCode.getTotalCodewordsCount(version, errorCorrectionLevel);
      const dataTotalCodewords = totalCodewords - ecTotalCodewords;
      const ecTotalBlocks = ECCode.getBlocksCount(version, errorCorrectionLevel);
      const blocksInGroup2 = totalCodewords % ecTotalBlocks;
      const blocksInGroup1 = ecTotalBlocks - blocksInGroup2;
      const totalCodewordsInGroup1 = Math.floor(totalCodewords / ecTotalBlocks);
      const dataCodewordsInGroup1 = Math.floor(dataTotalCodewords / ecTotalBlocks);
      const dataCodewordsInGroup2 = dataCodewordsInGroup1 + 1;
      const ecCount = totalCodewordsInGroup1 - dataCodewordsInGroup1;
      const rs = new ReedSolomonEncoder(ecCount);
      let offset = 0;
      const dcData = new Array(ecTotalBlocks);
      const ecData = new Array(ecTotalBlocks);
      let maxDataSize = 0;
      const buffer = new Uint8Array(bitBuffer.buffer);
      for (let b = 0; b < ecTotalBlocks; b++) {
        const dataSize = b < blocksInGroup1 ? dataCodewordsInGroup1 : dataCodewordsInGroup2;
        dcData[b] = buffer.slice(offset, offset + dataSize);
        ecData[b] = rs.encode(dcData[b]);
        offset += dataSize;
        maxDataSize = Math.max(maxDataSize, dataSize);
      }
      const data = new Uint8Array(totalCodewords);
      let index = 0;
      let i, r;
      for (i = 0; i < maxDataSize; i++) {
        for (r = 0; r < ecTotalBlocks; r++) {
          if (i < dcData[r].length) {
            data[index++] = dcData[r][i];
          }
        }
      }
      for (i = 0; i < ecCount; i++) {
        for (r = 0; r < ecTotalBlocks; r++) {
          data[index++] = ecData[r][i];
        }
      }
      return data;
    }
    __name(createCodewords, "createCodewords");
    function createSymbol(data, version, errorCorrectionLevel, maskPattern) {
      let segments;
      if (Array.isArray(data)) {
        segments = Segments.fromArray(data);
      } else if (typeof data === "string") {
        let estimatedVersion = version;
        if (!estimatedVersion) {
          const rawSegments = Segments.rawSplit(data);
          estimatedVersion = Version.getBestVersionForData(rawSegments, errorCorrectionLevel);
        }
        segments = Segments.fromString(data, estimatedVersion || 40);
      } else {
        throw new Error("Invalid data");
      }
      const bestVersion = Version.getBestVersionForData(segments, errorCorrectionLevel);
      if (!bestVersion) {
        throw new Error("The amount of data is too big to be stored in a QR Code");
      }
      if (!version) {
        version = bestVersion;
      } else if (version < bestVersion) {
        throw new Error(
          "\nThe chosen QR Code version cannot contain this amount of data.\nMinimum version required to store current data is: " + bestVersion + ".\n"
        );
      }
      const dataBits = createData(version, errorCorrectionLevel, segments);
      const moduleCount = Utils.getSymbolSize(version);
      const modules = new BitMatrix(moduleCount);
      setupFinderPattern(modules, version);
      setupTimingPattern(modules);
      setupAlignmentPattern(modules, version);
      setupFormatInfo(modules, errorCorrectionLevel, 0);
      if (version >= 7) {
        setupVersionInfo(modules, version);
      }
      setupData(modules, dataBits);
      if (isNaN(maskPattern)) {
        maskPattern = MaskPattern.getBestMask(
          modules,
          setupFormatInfo.bind(null, modules, errorCorrectionLevel)
        );
      }
      MaskPattern.applyMask(maskPattern, modules);
      setupFormatInfo(modules, errorCorrectionLevel, maskPattern);
      return {
        modules,
        version,
        errorCorrectionLevel,
        maskPattern,
        segments
      };
    }
    __name(createSymbol, "createSymbol");
    exports.create = /* @__PURE__ */ __name(function create(data, options) {
      if (typeof data === "undefined" || data === "") {
        throw new Error("No input text");
      }
      let errorCorrectionLevel = ECLevel.M;
      let version;
      let mask;
      if (typeof options !== "undefined") {
        errorCorrectionLevel = ECLevel.from(options.errorCorrectionLevel, ECLevel.M);
        version = Version.from(options.version);
        mask = MaskPattern.from(options.maskPattern);
        if (options.toSJISFunc) {
          Utils.setToSJISFunction(options.toSJISFunc);
        }
      }
      return createSymbol(data, version, errorCorrectionLevel, mask);
    }, "create");
  }
});

// node_modules/qrcode/lib/renderer/utils.js
var require_utils2 = __commonJS({
  "node_modules/qrcode/lib/renderer/utils.js"(exports) {
    init_modules_watch_stub();
    function hex2rgba(hex) {
      if (typeof hex === "number") {
        hex = hex.toString();
      }
      if (typeof hex !== "string") {
        throw new Error("Color should be defined as hex string");
      }
      let hexCode = hex.slice().replace("#", "").split("");
      if (hexCode.length < 3 || hexCode.length === 5 || hexCode.length > 8) {
        throw new Error("Invalid hex color: " + hex);
      }
      if (hexCode.length === 3 || hexCode.length === 4) {
        hexCode = Array.prototype.concat.apply([], hexCode.map(function(c) {
          return [c, c];
        }));
      }
      if (hexCode.length === 6) hexCode.push("F", "F");
      const hexValue = parseInt(hexCode.join(""), 16);
      return {
        r: hexValue >> 24 & 255,
        g: hexValue >> 16 & 255,
        b: hexValue >> 8 & 255,
        a: hexValue & 255,
        hex: "#" + hexCode.slice(0, 6).join("")
      };
    }
    __name(hex2rgba, "hex2rgba");
    exports.getOptions = /* @__PURE__ */ __name(function getOptions(options) {
      if (!options) options = {};
      if (!options.color) options.color = {};
      const margin = typeof options.margin === "undefined" || options.margin === null || options.margin < 0 ? 4 : options.margin;
      const width = options.width && options.width >= 21 ? options.width : void 0;
      const scale = options.scale || 4;
      return {
        width,
        scale: width ? 4 : scale,
        margin,
        color: {
          dark: hex2rgba(options.color.dark || "#000000ff"),
          light: hex2rgba(options.color.light || "#ffffffff")
        },
        type: options.type,
        rendererOpts: options.rendererOpts || {}
      };
    }, "getOptions");
    exports.getScale = /* @__PURE__ */ __name(function getScale(qrSize, opts) {
      return opts.width && opts.width >= qrSize + opts.margin * 2 ? opts.width / (qrSize + opts.margin * 2) : opts.scale;
    }, "getScale");
    exports.getImageWidth = /* @__PURE__ */ __name(function getImageWidth(qrSize, opts) {
      const scale = exports.getScale(qrSize, opts);
      return Math.floor((qrSize + opts.margin * 2) * scale);
    }, "getImageWidth");
    exports.qrToImageData = /* @__PURE__ */ __name(function qrToImageData(imgData, qr, opts) {
      const size = qr.modules.size;
      const data = qr.modules.data;
      const scale = exports.getScale(size, opts);
      const symbolSize = Math.floor((size + opts.margin * 2) * scale);
      const scaledMargin = opts.margin * scale;
      const palette = [opts.color.light, opts.color.dark];
      for (let i = 0; i < symbolSize; i++) {
        for (let j = 0; j < symbolSize; j++) {
          let posDst = (i * symbolSize + j) * 4;
          let pxColor = opts.color.light;
          if (i >= scaledMargin && j >= scaledMargin && i < symbolSize - scaledMargin && j < symbolSize - scaledMargin) {
            const iSrc = Math.floor((i - scaledMargin) / scale);
            const jSrc = Math.floor((j - scaledMargin) / scale);
            pxColor = palette[data[iSrc * size + jSrc] ? 1 : 0];
          }
          imgData[posDst++] = pxColor.r;
          imgData[posDst++] = pxColor.g;
          imgData[posDst++] = pxColor.b;
          imgData[posDst] = pxColor.a;
        }
      }
    }, "qrToImageData");
  }
});

// node_modules/qrcode/lib/renderer/canvas.js
var require_canvas = __commonJS({
  "node_modules/qrcode/lib/renderer/canvas.js"(exports) {
    init_modules_watch_stub();
    var Utils = require_utils2();
    function clearCanvas(ctx, canvas, size) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!canvas.style) canvas.style = {};
      canvas.height = size;
      canvas.width = size;
      canvas.style.height = size + "px";
      canvas.style.width = size + "px";
    }
    __name(clearCanvas, "clearCanvas");
    function getCanvasElement() {
      try {
        return document.createElement("canvas");
      } catch (e) {
        throw new Error("You need to specify a canvas element");
      }
    }
    __name(getCanvasElement, "getCanvasElement");
    exports.render = /* @__PURE__ */ __name(function render(qrData, canvas, options) {
      let opts = options;
      let canvasEl = canvas;
      if (typeof opts === "undefined" && (!canvas || !canvas.getContext)) {
        opts = canvas;
        canvas = void 0;
      }
      if (!canvas) {
        canvasEl = getCanvasElement();
      }
      opts = Utils.getOptions(opts);
      const size = Utils.getImageWidth(qrData.modules.size, opts);
      const ctx = canvasEl.getContext("2d");
      const image = ctx.createImageData(size, size);
      Utils.qrToImageData(image.data, qrData, opts);
      clearCanvas(ctx, canvasEl, size);
      ctx.putImageData(image, 0, 0);
      return canvasEl;
    }, "render");
    exports.renderToDataURL = /* @__PURE__ */ __name(function renderToDataURL(qrData, canvas, options) {
      let opts = options;
      if (typeof opts === "undefined" && (!canvas || !canvas.getContext)) {
        opts = canvas;
        canvas = void 0;
      }
      if (!opts) opts = {};
      const canvasEl = exports.render(qrData, canvas, opts);
      const type = opts.type || "image/png";
      const rendererOpts = opts.rendererOpts || {};
      return canvasEl.toDataURL(type, rendererOpts.quality);
    }, "renderToDataURL");
  }
});

// node_modules/qrcode/lib/renderer/svg-tag.js
var require_svg_tag = __commonJS({
  "node_modules/qrcode/lib/renderer/svg-tag.js"(exports) {
    init_modules_watch_stub();
    var Utils = require_utils2();
    function getColorAttrib(color, attrib) {
      const alpha = color.a / 255;
      const str = attrib + '="' + color.hex + '"';
      return alpha < 1 ? str + " " + attrib + '-opacity="' + alpha.toFixed(2).slice(1) + '"' : str;
    }
    __name(getColorAttrib, "getColorAttrib");
    function svgCmd(cmd, x, y) {
      let str = cmd + x;
      if (typeof y !== "undefined") str += " " + y;
      return str;
    }
    __name(svgCmd, "svgCmd");
    function qrToPath(data, size, margin) {
      let path = "";
      let moveBy = 0;
      let newRow = false;
      let lineLength = 0;
      for (let i = 0; i < data.length; i++) {
        const col = Math.floor(i % size);
        const row = Math.floor(i / size);
        if (!col && !newRow) newRow = true;
        if (data[i]) {
          lineLength++;
          if (!(i > 0 && col > 0 && data[i - 1])) {
            path += newRow ? svgCmd("M", col + margin, 0.5 + row + margin) : svgCmd("m", moveBy, 0);
            moveBy = 0;
            newRow = false;
          }
          if (!(col + 1 < size && data[i + 1])) {
            path += svgCmd("h", lineLength);
            lineLength = 0;
          }
        } else {
          moveBy++;
        }
      }
      return path;
    }
    __name(qrToPath, "qrToPath");
    exports.render = /* @__PURE__ */ __name(function render(qrData, options, cb) {
      const opts = Utils.getOptions(options);
      const size = qrData.modules.size;
      const data = qrData.modules.data;
      const qrcodesize = size + opts.margin * 2;
      const bg = !opts.color.light.a ? "" : "<path " + getColorAttrib(opts.color.light, "fill") + ' d="M0 0h' + qrcodesize + "v" + qrcodesize + 'H0z"/>';
      const path = "<path " + getColorAttrib(opts.color.dark, "stroke") + ' d="' + qrToPath(data, size, opts.margin) + '"/>';
      const viewBox = 'viewBox="0 0 ' + qrcodesize + " " + qrcodesize + '"';
      const width = !opts.width ? "" : 'width="' + opts.width + '" height="' + opts.width + '" ';
      const svgTag = '<svg xmlns="http://www.w3.org/2000/svg" ' + width + viewBox + ' shape-rendering="crispEdges">' + bg + path + "</svg>\n";
      if (typeof cb === "function") {
        cb(null, svgTag);
      }
      return svgTag;
    }, "render");
  }
});

// node_modules/qrcode/lib/browser.js
var require_browser = __commonJS({
  "node_modules/qrcode/lib/browser.js"(exports) {
    init_modules_watch_stub();
    var canPromise = require_can_promise();
    var QRCode2 = require_qrcode();
    var CanvasRenderer = require_canvas();
    var SvgRenderer = require_svg_tag();
    function renderCanvas(renderFunc, canvas, text, opts, cb) {
      const args = [].slice.call(arguments, 1);
      const argsNum = args.length;
      const isLastArgCb = typeof args[argsNum - 1] === "function";
      if (!isLastArgCb && !canPromise()) {
        throw new Error("Callback required as last argument");
      }
      if (isLastArgCb) {
        if (argsNum < 2) {
          throw new Error("Too few arguments provided");
        }
        if (argsNum === 2) {
          cb = text;
          text = canvas;
          canvas = opts = void 0;
        } else if (argsNum === 3) {
          if (canvas.getContext && typeof cb === "undefined") {
            cb = opts;
            opts = void 0;
          } else {
            cb = opts;
            opts = text;
            text = canvas;
            canvas = void 0;
          }
        }
      } else {
        if (argsNum < 1) {
          throw new Error("Too few arguments provided");
        }
        if (argsNum === 1) {
          text = canvas;
          canvas = opts = void 0;
        } else if (argsNum === 2 && !canvas.getContext) {
          opts = text;
          text = canvas;
          canvas = void 0;
        }
        return new Promise(function(resolve, reject) {
          try {
            const data = QRCode2.create(text, opts);
            resolve(renderFunc(data, canvas, opts));
          } catch (e) {
            reject(e);
          }
        });
      }
      try {
        const data = QRCode2.create(text, opts);
        cb(null, renderFunc(data, canvas, opts));
      } catch (e) {
        cb(e);
      }
    }
    __name(renderCanvas, "renderCanvas");
    exports.create = QRCode2.create;
    exports.toCanvas = renderCanvas.bind(null, CanvasRenderer.render);
    exports.toDataURL = renderCanvas.bind(null, CanvasRenderer.renderToDataURL);
    exports.toString = renderCanvas.bind(null, function(data, _, opts) {
      return SvgRenderer.render(data, opts);
    });
  }
});

// .wrangler/tmp/bundle-c2n5Pe/middleware-loader.entry.ts
init_modules_watch_stub();

// .wrangler/tmp/bundle-c2n5Pe/middleware-insertion-facade.js
init_modules_watch_stub();

// src/index.ts
init_modules_watch_stub();
var import_qrcode = __toESM(require_browser(), 1);
var EVENT_ORDER = [
  "lpm-open",
  "call",
  "email",
  "whatsapp",
  "telegram",
  "messenger",
  "official",
  "booking",
  "newsletter",
  "facebook",
  "instagram",
  "pinterest",
  "spotify",
  "tiktok",
  "youtube",
  "share",
  "rating",
  "save",
  "unsave",
  "map",
  "qr-print",
  "qr-scan",
  "qr-view",
  "qr-redeem",
  "redeem-confirmation-cashier",
  // cashier confirmed that a redeem event completed
  "redeem-confirmation-customer"
  // customer confirmed that a redeem event completed
];
var TZ_FALLBACK = "Europe/Berlin";
var TZ_BY_COUNTRY = {
  HU: "Europe/Budapest",
  DE: "Europe/Berlin",
  AT: "Europe/Vienna",
  CH: "Europe/Zurich",
  GB: "Europe/London",
  IE: "Europe/Dublin"
  // extend as needed
};
function dayKeyFor(dateUTC, tz, countryCode) {
  const pick = tz || countryCode && TZ_BY_COUNTRY[countryCode.toUpperCase()] || TZ_FALLBACK;
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: pick, year: "numeric", month: "2-digit", day: "2-digit" }).format(dateUTC);
  } catch {
    return dateUTC.toISOString().slice(0, 10);
  }
}
__name(dayKeyFor, "dayKeyFor");
async function kvIncr(kv, key) {
  const cur = parseInt(await kv.get(key) || "0", 10) || 0;
  await kv.put(key, String(cur + 1), { expirationTtl: 60 * 60 * 24 * 366 });
}
__name(kvIncr, "kvIncr");
var PRICE_ID_TO_PLAN = {
  "price_1TDfBIFf2RZOYEdOobudnFRW": { tier: "standard", maxPublishedLocations: 1 },
  // TESTING: real Stripe price id for €1
  "price_1TDfBtFf2RZOYEdOGIfPn6uu": { tier: "multi", maxPublishedLocations: 3 },
  // TESTING: real Stripe price id for €2
  "price_1TDfDfFf2RZOYEdOFicVRcQ8": { tier: "large", maxPublishedLocations: 10 },
  // TESTING: real Stripe price id for €319
  "price_1TDfFaFf2RZOYEdOXzIMBxbO": { tier: "network", maxPublishedLocations: 1e4 }
  // TESTING: real Stripe price id for €749
};
var PLAN_CODE_TO_PRICE_ID = {
  standard: "price_1TDfBIFf2RZOYEdOobudnFRW",
  // TESTING: real Stripe price id for €1
  multi: "price_1TDfBtFf2RZOYEdOGIfPn6uu",
  // TESTING: real Stripe price id for €2
  large: "price_1TDfDfFf2RZOYEdOFicVRcQ8",
  // TESTING: real Stripe price id for €319
  network: "price_1TDfFaFf2RZOYEdOXzIMBxbO"
  // TESTING: real Stripe price id for €749
};
function normalizePlanTier(v) {
  const s = String(v || "").trim().toLowerCase();
  if (s === "standard" || s === "multi" || s === "large" || s === "network") return s;
  return "unknown";
}
__name(normalizePlanTier, "normalizePlanTier");
function planDefinitionForCode(planCode) {
  const code = String(planCode || "").trim().toLowerCase();
  const priceId = String(PLAN_CODE_TO_PRICE_ID[code] || "").trim();
  if (!priceId) return null;
  const mapped = PRICE_ID_TO_PLAN[priceId];
  if (!mapped) return null;
  return {
    code,
    priceId,
    tier: normalizePlanTier(mapped.tier),
    maxPublishedLocations: Math.max(0, Number(mapped.maxPublishedLocations || 0) || 0)
  };
}
__name(planDefinitionForCode, "planDefinitionForCode");
async function fetchStripeCheckoutLineItemPriceId(sk, checkoutSessionId) {
  const url = `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(checkoutSessionId)}/line_items?limit=1`;
  const r = await fetch(url, { method: "GET", headers: { Authorization: `Bearer ${sk}` } });
  const txt = await r.text();
  let j = null;
  try {
    j = JSON.parse(txt);
  } catch {
    j = null;
  }
  if (!r.ok) throw new Error(`stripe_line_items_fetch_failed:${r.status}`);
  const item = j?.data && Array.isArray(j.data) && j.data.length ? j.data[0] : null;
  const priceId = String(item?.price?.id || item?.price || "").trim();
  if (!priceId) throw new Error("stripe_line_items_missing_price_id");
  return priceId;
}
__name(fetchStripeCheckoutLineItemPriceId, "fetchStripeCheckoutLineItemPriceId");
async function persistPlanRecord(env, sk, checkoutSessionId, paymentIntentId, expiresAtIso, provenance) {
  const priceId = await fetchStripeCheckoutLineItemPriceId(sk, checkoutSessionId);
  const mapped = PRICE_ID_TO_PLAN[priceId];
  const tier = mapped?.tier || "unknown";
  const maxPublishedLocations = mapped?.maxPublishedLocations ?? 0;
  const initiationType = String(provenance?.initiationType || "").trim();
  const campaignPreset = String(provenance?.campaignPreset || "").trim();
  const rec = {
    priceId,
    tier,
    maxPublishedLocations,
    purchasedAt: (/* @__PURE__ */ new Date()).toISOString(),
    expiresAt: expiresAtIso,
    initiationType,
    campaignPreset
  };
  await env.KV_STATUS.put(`plan:${paymentIntentId}`, JSON.stringify(rec));
  return rec;
}
__name(persistPlanRecord, "persistPlanRecord");
function parseStripeSigHeader(h) {
  const parts = String(h || "").split(",").map((s) => s.trim()).filter(Boolean);
  const out = { t: "", v1: [] };
  for (const p of parts) {
    const [k, v] = p.split("=").map((s) => s.trim());
    if (!k || !v) continue;
    if (k === "t") out.t = v;
    if (k === "v1") out.v1.push(v);
  }
  if (!out.t || !out.v1.length) return null;
  return out;
}
__name(parseStripeSigHeader, "parseStripeSigHeader");
function bytesToHex(b) {
  return Array.from(b).map((x) => x.toString(16).padStart(2, "0")).join("");
}
__name(bytesToHex, "bytesToHex");
async function hmacSha256Hex(secret, msg) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(msg));
  return bytesToHex(new Uint8Array(sig));
}
__name(hmacSha256Hex, "hmacSha256Hex");
async function verifyStripeSignature(rawBody, sigHeader, secret, toleranceSec = 300) {
  const parsed = parseStripeSigHeader(sigHeader);
  if (!parsed) return false;
  const ts = Number(parsed.t);
  if (!Number.isFinite(ts)) return false;
  const nowSec = Math.floor(Date.now() / 1e3);
  if (Math.abs(nowSec - ts) > toleranceSec) return false;
  const signedPayload = `${parsed.t}.${rawBody}`;
  const expected = await hmacSha256Hex(secret, signedPayload);
  return parsed.v1.some((v) => v.toLowerCase() === expected.toLowerCase());
}
__name(verifyStripeSignature, "verifyStripeSignature");
async function verifyStripeSignatureBytes(rawBody, sigHeader, secret, toleranceSec = 300) {
  const parsed = parseStripeSigHeader(sigHeader);
  if (!parsed) return false;
  const ts = Number(parsed.t);
  if (!Number.isFinite(ts)) return false;
  const nowSec = Math.floor(Date.now() / 1e3);
  if (Math.abs(nowSec - ts) > toleranceSec) return false;
  const enc = new TextEncoder();
  const prefix = enc.encode(`${parsed.t}.`);
  const signed = new Uint8Array(prefix.length + rawBody.length);
  signed.set(prefix, 0);
  signed.set(rawBody, prefix.length);
  const expected = await (async () => {
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, signed);
    return bytesToHex(new Uint8Array(sig));
  })();
  return parsed.v1.some((v) => v.toLowerCase() === expected.toLowerCase());
}
__name(verifyStripeSignatureBytes, "verifyStripeSignatureBytes");
function hexPrefix(buf, nBytes = 4) {
  const bytes = new Uint8Array(buf);
  const take = Math.min(bytes.length, nBytes);
  let out = "";
  for (let i = 0; i < take; i++) out += bytes[i].toString(16).padStart(2, "0");
  return out;
}
__name(hexPrefix, "hexPrefix");
var ULID_RE = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
function bytesToB64url(bytes) {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
__name(bytesToB64url, "bytesToB64url");
function cookieSerialize(name, value, attrs) {
  const parts = [`${name}=${value}`];
  for (const [k, v] of Object.entries(attrs)) {
    if (v === void 0) continue;
    if (v === true) parts.push(k);
    else parts.push(`${k}=${String(v)}`);
  }
  return parts.join("; ");
}
__name(cookieSerialize, "cookieSerialize");
function readCookie(header, name) {
  const h = String(header || "");
  const parts = h.split(";");
  for (const p of parts) {
    const [k, ...rest] = p.trim().split("=");
    if (!k) continue;
    if (k === name) return rest.join("=").trim();
  }
  return "";
}
__name(readCookie, "readCookie");
function readDeviceId(req) {
  const dev = readCookie(req.headers.get("Cookie") || "", "ng_dev");
  return String(dev || "").trim();
}
__name(readDeviceId, "readDeviceId");
function mintDeviceId() {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  const dev = bytesToB64url(bytes);
  const cookie = cookieSerialize("ng_dev", dev, {
    Path: "/",
    Secure: true,
    SameSite: "Lax",
    "Max-Age": 60 * 60 * 24 * 366
    // ~12 months
    // Not HttpOnly: client can read, but Worker is authoritative on binding.
  });
  return { dev, cookie };
}
__name(mintDeviceId, "mintDeviceId");
function devSessKey(dev, ulid) {
  return `devsess:${dev}:${ulid}`;
}
__name(devSessKey, "devSessKey");
function devIndexKey(dev) {
  return `devsess:${dev}:index`;
}
__name(devIndexKey, "devIndexKey");
function googleDraftIndexKey(dev, googlePlaceId) {
  return `google_draft:${dev}:${googlePlaceId}`;
}
__name(googleDraftIndexKey, "googleDraftIndexKey");
var ULID_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
function uniqueTrimmedStrings(values) {
  return Array.from(
    new Set(
      values.map((v) => String(v || "").trim()).filter(Boolean)
    )
  );
}
__name(uniqueTrimmedStrings, "uniqueTrimmedStrings");
function encodeUlidTimePart(ms) {
  let n = Math.max(0, Math.floor(ms));
  let out = "";
  for (let i = 0; i < 10; i++) {
    out = ULID_ALPHABET[n % 32] + out;
    n = Math.floor(n / 32);
  }
  return out;
}
__name(encodeUlidTimePart, "encodeUlidTimePart");
function encodeUlidRandomPart(len) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += ULID_ALPHABET[bytes[i] % 32];
  return out;
}
__name(encodeUlidRandomPart, "encodeUlidRandomPart");
function mintDraftUlid() {
  return `${encodeUlidTimePart(Date.now())}${encodeUlidRandomPart(16)}`;
}
__name(mintDraftUlid, "mintDraftUlid");
function mintDraftSessionId() {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return bytesToB64url(bytes);
}
__name(mintDraftSessionId, "mintDraftSessionId");
function isValidGooglePlaceId(v) {
  return /^[A-Za-z0-9._:-]{6,255}$/.test(String(v || "").trim());
}
__name(isValidGooglePlaceId, "isValidGooglePlaceId");
function round6(n) {
  return Number(n.toFixed(6));
}
__name(round6, "round6");
function normalizeDraftCoord(raw) {
  if (raw == null || raw === "") return void 0;
  let lat;
  let lng;
  if (typeof raw === "string") {
    const parts = raw.split(/[,\s;]+/).map((s) => s.trim()).filter(Boolean);
    if (parts.length < 2) throw new Error("invalid_coordinates");
    lat = Number(parts[0]);
    lng = Number(parts[1]);
  } else if (typeof raw === "object") {
    lat = Number(raw?.lat ?? raw?.latitude);
    lng = Number(raw?.lng ?? raw?.lon ?? raw?.longitude);
  } else {
    throw new Error("invalid_coordinates");
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error("invalid_coordinates");
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) throw new Error("invalid_coordinates");
  return { lat: round6(lat), lng: round6(lng) };
}
__name(normalizeDraftCoord, "normalizeDraftCoord");
function normalizeDraftPatch(raw, providerRef = "") {
  const src = raw && typeof raw === "object" ? raw : {};
  const out = {};
  for (const [k, v] of Object.entries(src)) {
    if (v !== void 0) out[k] = v;
  }
  const coord = normalizeDraftCoord(src.coord ?? src.coordinates);
  if (coord) out.coord = coord;
  delete out.coordinates;
  if (Object.prototype.hasOwnProperty.call(src, "context")) {
    const ctxVals = Array.isArray(src.context) ? src.context : String(src.context || "").split(";");
    out.context = uniqueTrimmedStrings(ctxVals).join(";");
  }
  if (Object.prototype.hasOwnProperty.call(src, "tags")) {
    const tagVals = Array.isArray(src.tags) ? src.tags : String(src.tags || "").split(";");
    out.tags = uniqueTrimmedStrings(tagVals);
  }
  if (providerRef && !String(out.googlePlaceId || "").trim()) {
    out.googlePlaceId = providerRef;
  }
  return out;
}
__name(normalizeDraftPatch, "normalizeDraftPatch");
function mergeDraftPatch(base, patch) {
  const out = base && typeof base === "object" ? { ...base } : {};
  for (const [k, v] of Object.entries(patch && typeof patch === "object" ? patch : {})) {
    if (v !== void 0) out[k] = v;
  }
  return out;
}
__name(mergeDraftPatch, "mergeDraftPatch");
function googlePlacesApiKey(env) {
  return String(env.GOOGLE_PLACES_API_KEY || "").trim();
}
__name(googlePlacesApiKey, "googlePlacesApiKey");
var GOOGLE_IMPORT_FIELD_MASK_VERSION = "google-full-v1";
var GOOGLE_IMPORT_CACHE_TTL_SECONDS = 60 * 60 * 24 * 14;
var GOOGLE_IMPORT_QUOTA_TTL_SECONDS = 60 * 60 * 24;
var GOOGLE_IMPORT_DEVICE_UNPAID_LIMIT = 3;
var GOOGLE_IMPORT_IP_DAILY_LIMIT = 10;
function googlePlaceCacheKey(googlePlaceId) {
  return `google_place_cache:${googlePlaceId}`;
}
__name(googlePlaceCacheKey, "googlePlaceCacheKey");
function googleImportDeviceQuotaKey(deviceId) {
  return `google_import_quota:device:${deviceId}`;
}
__name(googleImportDeviceQuotaKey, "googleImportDeviceQuotaKey");
function googleImportIpQuotaKey(ipHash) {
  return `google_import_quota:ip:${ipHash}`;
}
__name(googleImportIpQuotaKey, "googleImportIpQuotaKey");
function googleImportLedgerKey() {
  return `google_import_ledger:${Date.now()}:${mintDraftSessionId()}`;
}
__name(googleImportLedgerKey, "googleImportLedgerKey");
function googleImportQuotaPlaceIds(record) {
  const rows = Array.isArray(record?.placeIds) ? record.placeIds : [];
  return uniqueTrimmedStrings(rows).filter(isValidGooglePlaceId);
}
__name(googleImportQuotaPlaceIds, "googleImportQuotaPlaceIds");
async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(sha256Hex, "sha256Hex");
async function googleImportIpHash(req, env) {
  const ip = String(
    req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"
  ).trim();
  const salt = String(env.JWT_SECRET || "navigen-google-import").trim();
  return await sha256Hex(`${salt}:${ip || "unknown"}`);
}
__name(googleImportIpHash, "googleImportIpHash");
async function readGoogleImportQuotaIds(env, key) {
  const rec = await env.KV_STATUS.get(key, { type: "json" });
  return googleImportQuotaPlaceIds(rec);
}
__name(readGoogleImportQuotaIds, "readGoogleImportQuotaIds");
async function writeGoogleImportQuotaIds(env, key, placeIds) {
  await env.KV_STATUS.put(
    key,
    JSON.stringify({
      placeIds: uniqueTrimmedStrings(placeIds).filter(isValidGooglePlaceId),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    }),
    { expirationTtl: GOOGLE_IMPORT_QUOTA_TTL_SECONDS }
  );
}
__name(writeGoogleImportQuotaIds, "writeGoogleImportQuotaIds");
async function checkGoogleImportPolicy(req, env, deviceId, googlePlaceId, sameDeviceReopen) {
  const ipHash = await googleImportIpHash(req, env);
  if (sameDeviceReopen) {
    return { allowed: true, quotaCounted: false, ipHash, error: null };
  }
  const deviceKey = googleImportDeviceQuotaKey(deviceId);
  const ipKey = googleImportIpQuotaKey(ipHash);
  const [devicePlaceIds, ipPlaceIds] = await Promise.all([
    readGoogleImportQuotaIds(env, deviceKey),
    readGoogleImportQuotaIds(env, ipKey)
  ]);
  const deviceSeen = devicePlaceIds.includes(googlePlaceId);
  const ipSeen = ipPlaceIds.includes(googlePlaceId);
  return { allowed: true, quotaCounted: !deviceSeen || !ipSeen, ipHash, error: null };
}
__name(checkGoogleImportPolicy, "checkGoogleImportPolicy");
async function recordGoogleImportQuota(env, deviceId, ipHash, googlePlaceId) {
  const deviceKey = googleImportDeviceQuotaKey(deviceId);
  const ipKey = googleImportIpQuotaKey(ipHash);
  const [devicePlaceIds, ipPlaceIds] = await Promise.all([
    readGoogleImportQuotaIds(env, deviceKey),
    readGoogleImportQuotaIds(env, ipKey)
  ]);
  await Promise.all([
    writeGoogleImportQuotaIds(env, deviceKey, [...devicePlaceIds, googlePlaceId]),
    writeGoogleImportQuotaIds(env, ipKey, [...ipPlaceIds, googlePlaceId])
  ]);
}
__name(recordGoogleImportQuota, "recordGoogleImportQuota");
async function readGooglePlaceCache(env, googlePlaceId) {
  const cached = await env.KV_STATUS.get(googlePlaceCacheKey(googlePlaceId), { type: "json" });
  const draft = cached?.draft && typeof cached.draft === "object" ? cached.draft : null;
  return draft;
}
__name(readGooglePlaceCache, "readGooglePlaceCache");
async function writeGooglePlaceCache(env, googlePlaceId, draft) {
  if (!draft || typeof draft !== "object") return;
  await env.KV_STATUS.put(
    googlePlaceCacheKey(googlePlaceId),
    JSON.stringify({
      draft,
      fieldMaskVersion: GOOGLE_IMPORT_FIELD_MASK_VERSION,
      cachedAt: (/* @__PURE__ */ new Date()).toISOString()
    }),
    { expirationTtl: GOOGLE_IMPORT_CACHE_TTL_SECONDS }
  );
}
__name(writeGooglePlaceCache, "writeGooglePlaceCache");
async function resolveGoogleImportPayload(env, googlePlaceId) {
  const cachedDraft = await readGooglePlaceCache(env, googlePlaceId);
  if (cachedDraft) {
    return { hydrated: true, draft: cachedDraft, cacheHit: true, error: null };
  }
  const result = await hydrateDraftWithGoogleDetails(env, { googlePlaceId });
  if (result.hydrated) {
    await writeGooglePlaceCache(env, googlePlaceId, result.draft);
  }
  return {
    hydrated: result.hydrated,
    draft: result.draft,
    cacheHit: false,
    error: result.error
  };
}
__name(resolveGoogleImportPayload, "resolveGoogleImportPayload");
async function writeGoogleImportLedger(env, entry) {
  await env.KV_STATUS.put(
    googleImportLedgerKey(),
    JSON.stringify({
      ...entry,
      fieldMaskVersion: GOOGLE_IMPORT_FIELD_MASK_VERSION,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    }),
    { expirationTtl: 60 * 60 * 24 * 366 }
  );
}
__name(writeGoogleImportLedger, "writeGoogleImportLedger");
function ratingsFromGoogleProvider(effective) {
  const base = effective?.ratings && typeof effective.ratings === "object" ? { ...effective.ratings } : {};
  const google = effective?.google && typeof effective.google === "object" ? effective.google : {};
  const rating = Number(google?.rating ?? base?.google?.rating);
  const count = Number(google?.userRatingCount ?? google?.userRatingsTotal ?? base?.google?.count ?? 0);
  if (Number.isFinite(rating) && rating > 0) {
    base.google = {
      ...base.google && typeof base.google === "object" ? base.google : {},
      rating,
      count: Number.isFinite(count) && count > 0 ? count : 0,
      provider: "google",
      source: "places_api_new"
    };
  }
  return base;
}
__name(ratingsFromGoogleProvider, "ratingsFromGoogleProvider");
function googleAddressComponent(components, wantedType, field = "longText") {
  const rows = Array.isArray(components) ? components : [];
  const hit = rows.find((row) => Array.isArray(row?.types) && row.types.includes(wantedType));
  if (!hit) return "";
  const wantsShort = field === "shortText" || field === "short_name";
  return String(
    wantsShort ? hit.shortText || hit.short_name || hit.longText || hit.long_name || "" : hit.longText || hit.long_name || hit.shortText || hit.short_name || ""
  ).trim();
}
__name(googleAddressComponent, "googleAddressComponent");
function normalizeGoogleAddressToken(value) {
  return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}
__name(normalizeGoogleAddressToken, "normalizeGoogleAddressToken");
function googleStreetAddressFromComponents(components, formattedAddress) {
  const route = googleAddressComponent(components, "route");
  const streetNumber = googleAddressComponent(components, "street_number");
  const premise = googleAddressComponent(components, "premise");
  const subpremise = googleAddressComponent(components, "subpremise");
  const postalCode = googleAddressComponent(components, "postal_code");
  const countryLong = googleAddressComponent(components, "country");
  const countryShort = googleAddressComponent(components, "country", "shortText");
  if (route && streetNumber) {
    const formattedLower = String(formattedAddress || "").toLowerCase();
    const routeIndex = formattedLower.indexOf(route.toLowerCase());
    const numberIndex = formattedLower.indexOf(streetNumber.toLowerCase());
    const streetBase = routeIndex >= 0 && numberIndex >= 0 && routeIndex < numberIndex ? `${route} ${streetNumber}` : `${streetNumber} ${route}`;
    return [streetBase, subpremise].map((part) => String(part || "").trim()).filter(Boolean).join(", ");
  }
  const componentStreet = [streetNumber, route].map((part) => String(part || "").trim()).filter(Boolean).join(" ");
  if (componentStreet) return componentStreet;
  if (premise) return [premise, subpremise].map((part) => String(part || "").trim()).filter(Boolean).join(", ");
  if (subpremise) return subpremise;
  const cityTokens = [
    googleAddressComponent(components, "locality"),
    googleAddressComponent(components, "postal_town"),
    googleAddressComponent(components, "administrative_area_level_2"),
    googleAddressComponent(components, "administrative_area_level_1")
  ].map(normalizeGoogleAddressToken).filter(Boolean);
  const nonStreetTokens = [
    ...cityTokens,
    normalizeGoogleAddressToken(postalCode),
    normalizeGoogleAddressToken(countryLong),
    normalizeGoogleAddressToken(countryShort)
  ].filter(Boolean);
  const addressParts = String(formattedAddress || "").split(",").map((part) => String(part || "").trim()).filter(Boolean).filter((part) => {
    const normalizedPart = normalizeGoogleAddressToken(part);
    if (!normalizedPart) return false;
    return !nonStreetTokens.some((token) => normalizedPart === token || normalizedPart.includes(token));
  });
  return String(addressParts[0] || "").trim();
}
__name(googleStreetAddressFromComponents, "googleStreetAddressFromComponents");
function mapGooglePlaceDetailsToDraft(googlePlaceId, place) {
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  const resolvedGooglePlaceId = String(place?.id || googlePlaceId || "").trim();
  const out = {
    googlePlaceId: resolvedGooglePlaceId,
    googleHydrationStatus: "hydrated",
    googleHydratedAt: nowIso,
    updatedAt: nowIso
  };
  const name = String(place?.displayName?.text || "").trim();
  if (name) {
    out.locationName = { en: name };
    out.listedName = name;
  }
  const formattedAddress = String(place?.formattedAddress || "").trim();
  const structuredStreetAddress = googleStreetAddressFromComponents(place?.addressComponents, formattedAddress);
  const city = String(
    googleAddressComponent(place?.addressComponents, "locality") || googleAddressComponent(place?.addressComponents, "postal_town") || googleAddressComponent(place?.addressComponents, "administrative_area_level_2") || googleAddressComponent(place?.addressComponents, "administrative_area_level_1") || ""
  ).trim();
  const countryCode = googleAddressComponent(place?.addressComponents, "country", "shortText").toUpperCase();
  const phone = String(place?.internationalPhoneNumber || place?.nationalPhoneNumber || "").trim();
  const contactInformation = {};
  if (structuredStreetAddress) contactInformation.address = structuredStreetAddress;
  if (city) contactInformation.city = city;
  if (countryCode) contactInformation.countryCode = countryCode;
  if (phone) contactInformation.phone = phone;
  if (Object.keys(contactInformation).length) out.contactInformation = contactInformation;
  const links = {};
  const website = String(place?.websiteUri || "").trim();
  const mapsUrl = String(place?.googleMapsUri || "").trim();
  if (website) links.official = website;
  if (mapsUrl) links.googleMaps = mapsUrl;
  if (Object.keys(links).length) out.links = links;
  const lat = Number(place?.location?.latitude);
  const lng = Number(place?.location?.longitude);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    out.coord = { lat: round6(lat), lng: round6(lng) };
  }
  const googleMeta = { placeId: resolvedGooglePlaceId, provider: "places_api_new" };
  if (Number.isFinite(Number(place?.rating))) googleMeta.rating = Number(place.rating);
  if (Number.isFinite(Number(place?.userRatingCount))) {
    googleMeta.userRatingCount = Number(place.userRatingCount);
    googleMeta.userRatingsTotal = Number(place.userRatingCount);
  }
  if (mapsUrl) googleMeta.url = mapsUrl;
  if (website) googleMeta.websiteUri = website;
  if (formattedAddress) googleMeta.formattedAddress = formattedAddress;
  if (String(place?.businessStatus || "").trim()) googleMeta.businessStatus = String(place.businessStatus).trim();
  if (Array.isArray(place?.types)) googleMeta.types = uniqueTrimmedStrings(place.types);
  out.google = googleMeta;
  return out;
}
__name(mapGooglePlaceDetailsToDraft, "mapGooglePlaceDetailsToDraft");
function isDraftFieldEmpty(value) {
  if (value == null) return true;
  if (typeof value === "string") return !value.trim();
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}
__name(isDraftFieldEmpty, "isDraftFieldEmpty");
function mergeMissingDraftFields(base, imported) {
  const out = base && typeof base === "object" ? { ...base } : {};
  for (const [key, value] of Object.entries(imported && typeof imported === "object" ? imported : {})) {
    const current = out[key];
    if (isDraftFieldEmpty(current)) {
      out[key] = value;
      continue;
    }
    if (current && typeof current === "object" && !Array.isArray(current) && value && typeof value === "object" && !Array.isArray(value)) {
      out[key] = mergeMissingDraftFields(current, value);
    }
  }
  return out;
}
__name(mergeMissingDraftFields, "mergeMissingDraftFields");
function mergeGoogleImportIntoDraft(base, imported) {
  const out = mergeMissingDraftFields(base, imported);
  out.googlePlaceId = String(out.googlePlaceId || imported?.googlePlaceId || "").trim();
  out.googleHydrationStatus = String(imported?.googleHydrationStatus || out.googleHydrationStatus || "").trim();
  out.googleHydratedAt = String(imported?.googleHydratedAt || out.googleHydratedAt || "").trim();
  out.updatedAt = String(imported?.updatedAt || (/* @__PURE__ */ new Date()).toISOString()).trim();
  return out;
}
__name(mergeGoogleImportIntoDraft, "mergeGoogleImportIntoDraft");
async function hydrateDraftWithGoogleDetails(env, draft) {
  const googlePlaceId = String(draft?.googlePlaceId || "").trim();
  if (!googlePlaceId) return { hydrated: false, draft, error: { code: "google_place_id_missing" } };
  if (!isValidGooglePlaceId(googlePlaceId)) return { hydrated: false, draft, error: { code: "invalid_google_place_id" } };
  const key = googlePlacesApiKey(env);
  if (!key) return { hydrated: false, draft, error: { code: "google_api_key_missing" } };
  const fieldMask = [
    "id",
    "displayName",
    "formattedAddress",
    "addressComponents",
    "location",
    "websiteUri",
    "internationalPhoneNumber",
    "nationalPhoneNumber",
    "rating",
    "userRatingCount",
    "businessStatus",
    "types",
    "googleMapsUri"
  ].join(",");
  const u = new URL(`https://places.googleapis.com/v1/places/${encodeURIComponent(googlePlaceId)}`);
  try {
    const r = await fetch(u.toString(), {
      method: "GET",
      headers: {
        accept: "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": fieldMask
      }
    });
    const responseText = await r.text();
    let j = null;
    try {
      j = responseText ? JSON.parse(responseText) : null;
    } catch {
      j = null;
    }
    if (!r.ok) {
      const googleStatus = String(j?.error?.status || j?.status || "").trim();
      const googleMessage = String(j?.error?.message || j?.error_message || j?.message || "").trim();
      return {
        hydrated: false,
        draft,
        error: {
          code: "google_details_http_error",
          status: r.status,
          googleStatus: googleStatus || void 0,
          googleMessage: googleMessage ? googleMessage.slice(0, 700) : void 0
        }
      };
    }
    if (!j || typeof j !== "object" || !String(j?.id || "").trim()) {
      return { hydrated: false, draft, error: { code: "google_details_failed", status: "MISSING_PLACE" } };
    }
    const imported = mapGooglePlaceDetailsToDraft(googlePlaceId, j);
    const nextDraft = mergeGoogleImportIntoDraft(draft, imported);
    return { hydrated: true, draft: nextDraft, error: null };
  } catch {
    return { hydrated: false, draft, error: { code: "google_details_unreachable" } };
  }
}
__name(hydrateDraftWithGoogleDetails, "hydrateDraftWithGoogleDetails");
async function assertPaidDraftHydrationEntitlement(req, env, target) {
  const auth = await requireOwnerSession(req, env);
  if (auth instanceof Response) return auth;
  if (String(auth.ulid || "").trim() !== target.ulid) {
    return new Response("Denied", {
      status: 403,
      headers: { "cache-control": "no-store", "Referrer-Policy": "no-referrer" }
    });
  }
  const ownership = await env.KV_STATUS.get(`ownership:${target.ulid}`, { type: "json" });
  const exclusiveUntilIso = String(ownership?.exclusiveUntil || "").trim();
  const exclusiveUntil = exclusiveUntilIso ? new Date(exclusiveUntilIso) : null;
  if (!exclusiveUntil || Number.isNaN(exclusiveUntil.getTime()) || exclusiveUntil.getTime() <= Date.now()) {
    return json(
      { error: { code: "ownership_inactive", message: "active ownership required" } },
      403,
      { "cache-control": "no-store" }
    );
  }
  const paymentIntentId = String(ownership?.lastEventId || "").trim();
  if (!paymentIntentId) {
    return json(
      { error: { code: "plan_missing", message: "ownership has no plan anchor" } },
      403,
      { "cache-control": "no-store" }
    );
  }
  const plan = await env.KV_STATUS.get(`plan:${paymentIntentId}`, { type: "json" });
  const planExpIso = String(plan?.expiresAt || "").trim();
  const planExp = planExpIso ? new Date(planExpIso) : null;
  if (!plan || !planExp || Number.isNaN(planExp.getTime()) || planExp.getTime() <= Date.now()) {
    return json(
      { error: { code: "plan_inactive", message: "active plan required" } },
      403,
      { "cache-control": "no-store" }
    );
  }
  if (planExp.toISOString() !== exclusiveUntil.toISOString()) {
    return json(
      { error: { code: "plan_invariant_failed", message: "plan/ownership expiry mismatch" } },
      403,
      { "cache-control": "no-store" }
    );
  }
  return null;
}
__name(assertPaidDraftHydrationEntitlement, "assertPaidDraftHydrationEntitlement");
function catalogFetchOrigins(req) {
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  const push = /* @__PURE__ */ __name((raw) => {
    try {
      const origin = new URL(String(raw || "").trim()).origin;
      if (!/^https?:\/\//i.test(origin) || seen.has(origin)) return;
      seen.add(origin);
      out.push(origin);
    } catch {
    }
  }, "push");
  push(req.headers.get("Origin") || "");
  push(new URL(req.url).origin);
  push("https://navigen.io");
  push("https://www.navigen.io");
  return out;
}
__name(catalogFetchOrigins, "catalogFetchOrigins");
async function fetchStaticJson(req, path) {
  for (const origin of catalogFetchOrigins(req)) {
    try {
      const u = new URL(path, origin).toString();
      const r = await fetch(u, {
        method: "GET",
        headers: { accept: "application/json" },
        cache: "no-store"
      });
      if (!r.ok) continue;
      const ctype = String(r.headers.get("content-type") || "").toLowerCase();
      const text = await r.text();
      if (!ctype.includes("application/json")) continue;
      return JSON.parse(text);
    } catch {
    }
  }
  throw new Error(`catalog_fetch_failed:${path}`);
}
__name(fetchStaticJson, "fetchStaticJson");
async function loadStructureCatalog(req) {
  const j = await fetchStaticJson(req, "/data/structure.json");
  return Array.isArray(j) ? j : [];
}
__name(loadStructureCatalog, "loadStructureCatalog");
async function loadContextCatalog(req) {
  const j = await fetchStaticJson(req, "/api/data/contexts");
  return Array.isArray(j) ? j : [];
}
__name(loadContextCatalog, "loadContextCatalog");
function allowedSubgroupsByGroup(structureRows) {
  const out = /* @__PURE__ */ new Map();
  for (const row of Array.isArray(structureRows) ? structureRows : []) {
    const groupKey = String(row?.groupKey || "").trim();
    if (!groupKey) continue;
    const set = out.get(groupKey) || /* @__PURE__ */ new Set();
    const subs = Array.isArray(row?.subgroups) ? row.subgroups : [];
    for (const sg of subs) {
      const key = String(sg?.key || "").trim();
      if (key) set.add(key);
    }
    out.set(groupKey, set);
  }
  return out;
}
__name(allowedSubgroupsByGroup, "allowedSubgroupsByGroup");
function allowedContextKeys(contextRows) {
  const out = /* @__PURE__ */ new Set();
  for (const row of Array.isArray(contextRows) ? contextRows : []) {
    const key = String(row?.key || "").trim();
    if (key) out.add(key);
  }
  return out;
}
__name(allowedContextKeys, "allowedContextKeys");
async function validateClassificationSelection(req, profile) {
  const groupKey = String(profile?.groupKey || "").trim();
  const subgroupKey = String(profile?.subgroupKey || "").trim();
  const contextVals = splitContextMemberships(profile?.context);
  if (!groupKey && !subgroupKey && !contextVals.length) return null;
  if (!groupKey || !subgroupKey || !contextVals.length) return "classification_required";
  const [structureRows, contextRows] = await Promise.all([
    loadStructureCatalog(req),
    loadContextCatalog(req)
  ]);
  const subgroups = allowedSubgroupsByGroup(structureRows);
  const groupSubs = subgroups.get(groupKey);
  if (!groupSubs) return "invalid_groupKey";
  if (!groupSubs.has(subgroupKey)) return "invalid_subgroupKey";
  const contexts = allowedContextKeys(contextRows);
  for (const ctx of contextVals) {
    if (!contexts.has(ctx)) return "invalid_context";
  }
  return null;
}
__name(validateClassificationSelection, "validateClassificationSelection");
async function safeValidateClassificationSelection(req, profile, opts = {}) {
  try {
    return await validateClassificationSelection(req, profile);
  } catch (e) {
    const msg = String(e?.message || "").trim();
    if (msg.startsWith("catalog_fetch_failed:")) {
      return opts.failClosedOnCatalogError ? "catalog_unavailable" : null;
    }
    throw e;
  }
}
__name(safeValidateClassificationSelection, "safeValidateClassificationSelection");
var RATING_WINDOW_MS = 30 * 60 * 1e3;
function ratingSummaryKey(locationID) {
  return `rating_summary:${locationID}`;
}
__name(ratingSummaryKey, "ratingSummaryKey");
function ratingVoteKey(locationID, deviceKey) {
  return `rating_vote:${locationID}:${deviceKey}`;
}
__name(ratingVoteKey, "ratingVoteKey");
function readRatingDeviceKey(req) {
  const explicit = String(req.headers.get("X-NG-Device") || "").trim();
  if (explicit) return explicit;
  const cookieDev = readDeviceId(req);
  if (cookieDev) return cookieDev;
  const ip = String(req.headers.get("CF-Connecting-IP") || "").trim();
  const ua = String(req.headers.get("User-Agent") || "").trim().slice(0, 120);
  return encodeURIComponent(`${ip}|${ua}`.trim());
}
__name(readRatingDeviceKey, "readRatingDeviceKey");
async function kvAdd(kv, key, delta, ttlSec = 60 * 60 * 24 * 366) {
  const cur = parseInt(await kv.get(key) || "0", 10) || 0;
  const next = Math.max(0, cur + (Number.isFinite(delta) ? delta : 0));
  if (next <= 0) {
    try {
      await kv.delete(key);
    } catch {
    }
    return 0;
  }
  await kv.put(key, String(next), { expirationTtl: ttlSec });
  return next;
}
__name(kvAdd, "kvAdd");
async function readRatingSummary(env, locationID) {
  const cached = await env.KV_STATUS.get(ratingSummaryKey(locationID), { type: "json" });
  const cachedCount = Number(cached?.count);
  const cachedSum = Number(cached?.sum);
  if (Number.isFinite(cachedCount) && cachedCount >= 0 && Number.isFinite(cachedSum) && cachedSum >= 0) {
    return {
      count: cachedCount,
      sum: cachedSum,
      avg: cachedCount > 0 ? cachedSum / cachedCount : 0
    };
  }
  let count = 0;
  let sum = 0;
  let cursor = void 0;
  do {
    const page = await env.KV_STATS.list({ prefix: `stats:${locationID}:`, cursor });
    for (const key of page.keys) {
      const name = String(key.name || "");
      const parts = name.split(":");
      if (parts.length !== 4) continue;
      const bucket = String(parts[3] || "").trim();
      if (bucket !== "rating" && bucket !== "rating-score") continue;
      const value = parseInt(await env.KV_STATS.get(name) || "0", 10) || 0;
      if (bucket === "rating") count += value;
      else sum += value;
    }
    cursor = page.cursor || void 0;
  } while (cursor);
  try {
    await env.KV_STATUS.put(
      ratingSummaryKey(locationID),
      JSON.stringify({ count, sum, updatedAt: (/* @__PURE__ */ new Date()).toISOString() })
    );
  } catch {
  }
  return {
    count,
    sum,
    avg: count > 0 ? sum / count : 0
  };
}
__name(readRatingSummary, "readRatingSummary");
async function requireOwnerSession(req, env) {
  const sid = readCookie(req.headers.get("Cookie") || "", "op_sess");
  if (!sid) {
    return new Response("Denied", {
      status: 401,
      headers: { "cache-control": "no-store", "Referrer-Policy": "no-referrer" }
    });
  }
  const sessKey = `opsess:${sid}`;
  const sess = await env.KV_STATUS.get(sessKey, { type: "json" });
  if (!sess || !sess.ulid) {
    return new Response("Denied", {
      status: 401,
      headers: { "cache-control": "no-store", "Referrer-Policy": "no-referrer" }
    });
  }
  const exp = new Date(String(sess.expiresAt || ""));
  if (Number.isNaN(exp.getTime()) || exp.getTime() <= Date.now()) {
    return new Response("Denied", {
      status: 401,
      headers: { "cache-control": "no-store", "Referrer-Policy": "no-referrer" }
    });
  }
  return { ulid: String(sess.ulid).trim() };
}
__name(requireOwnerSession, "requireOwnerSession");
async function promoteCampaignDraftAndBuildRedirectHint(req, sess, ulid, env, logTag) {
  try {
    const md = sess?.metadata && typeof sess.metadata === "object" ? sess.metadata : {};
    const ownershipSource = String(md?.ownershipSource || "").trim();
    const campaignKey = String(md?.campaignKey || "").trim();
    if (ownershipSource !== "campaign" || !campaignKey) return "";
    const draftKey = `campaigns:draft:${ulid}`;
    const draft = await env.KV_STATUS.get(draftKey, { type: "json" });
    if (!draft || String(draft?.campaignKey || "").trim() !== campaignKey) return "";
    const currentPlan = await currentPlanForUlid(env, ulid);
    const promoted = await promoteCampaignDraftToActiveRows({
      req,
      env,
      ownerUlid: ulid,
      draft,
      locationSlug: String(md?.locationID || "").trim(),
      campaignKey,
      stripeSessionId: String(sess?.id || "").trim(),
      paidPlan: currentPlan,
      logTag
    });
    if (!promoted.ok) return "";
    await env.KV_STATUS.delete(draftKey);
    const end = String(promoted.endDate || "").trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(end)) {
      return `ce=1&ced=${encodeURIComponent(end)}&cak=${encodeURIComponent(campaignKey)}`;
    }
    return `ce=1&cak=${encodeURIComponent(campaignKey)}`;
  } catch (e) {
    console.error(`${logTag}: promote_failed`, {
      ulid,
      err: String(e?.message || e || "")
    });
    return "";
  }
}
__name(promoteCampaignDraftAndBuildRedirectHint, "promoteCampaignDraftAndBuildRedirectHint");
async function handleOwnerStripeExchange(req, env) {
  const u = new URL(req.url);
  const sid = String(u.searchParams.get("sid") || "").trim();
  const nextRaw = String(u.searchParams.get("next") || "").trim();
  const noStoreHeaders = { "cache-control": "no-store", "Referrer-Policy": "no-referrer" };
  if (!sid) return new Response("Denied", { status: 400, headers: noStoreHeaders });
  const isSafeNext = /* @__PURE__ */ __name((p) => p.startsWith("/") && !p.startsWith("//") && !p.includes("://") && !p.includes("\\"), "isSafeNext");
  const next = nextRaw && isSafeNext(nextRaw) ? nextRaw : "";
  let redirectHint = "";
  const sk = String(env.STRIPE_SECRET_KEY || "").trim();
  if (!sk) return new Response("Misconfigured", { status: 500, headers: noStoreHeaders });
  const stripeUrl = `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sid)}`;
  const r = await fetch(stripeUrl, {
    method: "GET",
    headers: { "Authorization": `Bearer ${sk}` }
  });
  const txt = await r.text();
  let sess = null;
  try {
    sess = JSON.parse(txt);
  } catch {
    sess = null;
  }
  if (!r.ok || !sess) return new Response("Denied", { status: 403, headers: noStoreHeaders });
  const paymentStatus = String(sess?.payment_status || "").toLowerCase();
  const status = String(sess?.status || "").toLowerCase();
  if (paymentStatus !== "paid" || status !== "complete") {
    return new Response("Denied", { status: 403, headers: noStoreHeaders });
  }
  const meta = sess?.metadata || {};
  redirectHint = "";
  const target = await resolveTargetIdentity(env, {
    locationID: meta?.locationID,
    draftULID: meta?.draftULID,
    draftSessionId: meta?.draftSessionId
  }, { validateDraft: true });
  if (!target) return new Response("Denied", { status: 403, headers: noStoreHeaders });
  const ulid = target.ulid;
  const locationID = target.locationID;
  const ownKey = `ownership:${ulid}`;
  const now = Date.now();
  const prev = await env.KV_STATUS.get(ownKey, { type: "json" });
  const prevExIso = String(prev?.exclusiveUntil || "").trim();
  const prevEx = prevExIso ? new Date(prevExIso) : null;
  const baseMs = prevEx && !Number.isNaN(prevEx.getTime()) && prevEx.getTime() > now ? prevEx.getTime() : now;
  const EXCLUSIVE_MS = 30 * 24 * 60 * 60 * 1e3;
  const exclusiveUntil = new Date(baseMs + EXCLUSIVE_MS);
  await env.KV_STATUS.put(ownKey, JSON.stringify({
    uid: ulid,
    state: "owned",
    exclusiveUntil: exclusiveUntil.toISOString(),
    source: String(meta?.ownershipSource || "campaign").trim() || "campaign",
    lastEventId: String(sess?.payment_intent || "").trim(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  }));
  try {
    const paymentIntentId = String(sess?.payment_intent || "").trim();
    if (paymentIntentId) {
      await persistPlanRecord(env, sk, String(sess?.id || "").trim(), paymentIntentId, exclusiveUntil.toISOString(), {
        initiationType: meta?.initiationType,
        campaignPreset: meta?.campaignPreset
      });
    }
  } catch (e) {
    console.error("owner_stripe_exchange: plan_persist_failed", { ulid, err: String(e?.message || e || "") });
  }
  const sidBytes = new Uint8Array(18);
  crypto.getRandomValues(sidBytes);
  const sessionId = bytesToB64url(sidBytes);
  const createdAt = /* @__PURE__ */ new Date();
  const expiresAt = exclusiveUntil;
  const sessKey = `opsess:${sessionId}`;
  const sessVal = {
    ver: 1,
    ulid,
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString()
  };
  const maxAge = Math.max(0, Math.floor((expiresAt.getTime() - createdAt.getTime()) / 1e3));
  try {
    await env.KV_STATUS.put(sessKey, JSON.stringify(sessVal), { expirationTtl: Math.max(60, maxAge) });
  } catch {
    return new Response("Denied", { status: 500, headers: noStoreHeaders });
  }
  let devSetCookie = "";
  try {
    let dev = readDeviceId(req);
    if (!dev) {
      const minted = mintDeviceId();
      dev = minted.dev;
      devSetCookie = minted.cookie;
    }
    if (dev) {
      const mapKey = devSessKey(dev, ulid);
      await env.KV_STATUS.put(mapKey, sessionId, { expirationTtl: Math.max(60, maxAge) });
      const idxKey = devIndexKey(dev);
      const rawIdx = await env.KV_STATUS.get(idxKey, "text");
      let arr = [];
      try {
        arr = rawIdx ? JSON.parse(rawIdx) : [];
      } catch {
        arr = [];
      }
      if (!Array.isArray(arr)) arr = [];
      if (!arr.includes(ulid)) arr.unshift(ulid);
      arr = arr.slice(0, 24);
      await env.KV_STATUS.put(idxKey, JSON.stringify(arr), { expirationTtl: 60 * 60 * 24 * 366 });
    }
  } catch {
  }
  redirectHint = await promoteCampaignDraftAndBuildRedirectHint(req, sess, ulid, env, "owner_stripe_exchange");
  const cookie = cookieSerialize("op_sess", sessionId, {
    Path: "/",
    HttpOnly: true,
    Secure: true,
    SameSite: "Lax",
    "Max-Age": maxAge
  });
  const headers = new Headers({ ...noStoreHeaders });
  headers.append("Set-Cookie", cookie);
  if (devSetCookie) headers.append("Set-Cookie", devSetCookie);
  headers.set("Location", (() => {
    const base = next || `/dash/${encodeURIComponent(ulid)}`;
    if (!redirectHint) return base;
    const u2 = new URL(base, "https://navigen.io");
    if (!u2.searchParams.get("ce")) {
      const parts = redirectHint.split("&");
      parts.forEach((kv) => {
        const [k, v] = kv.split("=");
        if (k && v && !u2.searchParams.get(k)) u2.searchParams.set(k, decodeURIComponent(v));
        else if (k && !u2.searchParams.get(k)) u2.searchParams.set(k, "1");
      });
    }
    return u2.pathname + u2.search + u2.hash;
  })());
  console.info("owner_exchange_success", { ulid, stripeSessionId: sess?.id, sessionId });
  return new Response(null, { status: 302, headers });
}
__name(handleOwnerStripeExchange, "handleOwnerStripeExchange");
async function handleStripeWebhook(req, env) {
  const sig = req.headers.get("Stripe-Signature") || "";
  if (!sig) {
    const u = new URL(req.url);
    console.warn("stripe_webhook: missing_signature_header", { host: u.host, path: u.pathname });
    return new Response("Missing Stripe-Signature header", { status: 400 });
  }
  const rawBuf = await req.arrayBuffer();
  const rawBytes = new Uint8Array(rawBuf);
  const rawText = new TextDecoder().decode(rawBytes);
  let secretRaw = String(env.STRIPE_WEBHOOK_SECRET || "").trim();
  if (secretRaw.startsWith('"') && secretRaw.endsWith('"') || secretRaw.startsWith("'") && secretRaw.endsWith("'") || secretRaw.startsWith("`") && secretRaw.endsWith("`")) {
    secretRaw = secretRaw.slice(1, -1).trim();
  }
  const enc = new TextEncoder();
  const secretFpBuf = await crypto.subtle.digest("SHA-256", enc.encode(secretRaw));
  const secretFp = hexPrefix(secretFpBuf, 6);
  if (secretRaw.length < 20 || !secretRaw.startsWith("whsec_")) {
    console.error("stripe_webhook: secret_invalid", { secretLen: secretRaw.length, secretFp });
    return new Response("Stripe webhook secret invalid/misconfigured", { status: 500 });
  }
  const secrets = secretRaw.split(/[\s,]+/g).map((s) => s.trim()).filter(Boolean);
  const secretFps = [];
  for (const s of secrets) {
    const b = await crypto.subtle.digest("SHA-256", enc.encode(s));
    secretFps.push(hexPrefix(b, 6));
  }
  if (!secrets.length) {
    const u = new URL(req.url);
    console.error("stripe_webhook: secret_not_configured", { host: u.host, path: u.pathname });
    return new Response("Stripe webhook secret not configured", { status: 500 });
  }
  let ok = false;
  let verifyMode = null;
  let bytesOk = false;
  let textOk = false;
  for (const s of secrets) {
    bytesOk = await verifyStripeSignatureBytes(rawBytes, sig, s);
    if (bytesOk) {
      ok = true;
      verifyMode = "bytes";
      break;
    }
    textOk = await verifyStripeSignature(rawText, sig, s);
    if (textOk) {
      ok = true;
      verifyMode = "text";
      break;
    }
  }
  if (!ok) {
    const u = new URL(req.url);
    let ts = null;
    try {
      const parsed = parseStripeSigHeader(sig);
      ts = parsed ? Number(parsed.t) : null;
      if (ts !== null && !Number.isFinite(ts)) ts = null;
    } catch {
      ts = null;
    }
    const nowSec = Math.floor(Date.now() / 1e3);
    const parsedForLog = parseStripeSigHeader(sig);
    console.warn("stripe_webhook: sig_invalid", {
      host: u.host,
      path: u.pathname,
      skewSec: ts === null ? null : nowSec - ts,
      contentEncoding: req.headers.get("content-encoding") || null,
      contentType: req.headers.get("content-type") || null,
      bodyLen: rawBytes.length,
      // Header parse diagnostics
      sigParsed: !!parsedForLog,
      v1Count: parsedForLog?.v1?.length || 0,
      stripeAccount: req.headers.get("Stripe-Account") || "",
      // Secret diagnostics
      secretsCount: secrets.length,
      secretFp,
      // keep legacy combined fingerprint
      secretFps,
      // per-candidate fingerprints (safe)
      bytesOk,
      textOk
    });
    return new Response("Invalid Stripe signature", {
      status: 400,
      headers: {
        // Safe diagnostics: helps prove which secret is deployed and whether header parse looks sane.
        "x-ng-secretfp": secretFp,
        "x-ng-secretfps": secretFps.join(","),
        // per-candidate fingerprints
        "x-ng-secrets": String(secrets.length),
        "x-ng-worker": "navigen-api",
        "x-ng-sigparsed": String(!!parsedForLog),
        "x-ng-v1count": String(parsedForLog?.v1?.length || 0),
        "x-ng-verify": verifyMode || "",
        "x-ng-skewsec": String(ts === null ? "" : nowSec - ts),
        "x-ng-encoding": req.headers.get("content-encoding") || "",
        "x-ng-bodylen": String(rawBytes.length)
      }
    });
  }
  const rawBody = new TextDecoder().decode(rawBytes);
  let evt = null;
  try {
    evt = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }
  const type = String(evt?.type || "").trim();
  if (type !== "checkout.session.completed") return new Response("Ignored", { status: 200 });
  const session = evt?.data?.object || {};
  const paymentIntentId = String(session?.payment_intent || "").trim();
  if (!paymentIntentId) return new Response("Missing payment_intent", { status: 400 });
  const meta = session?.metadata && typeof session.metadata === "object" ? session.metadata : {};
  const ownershipSource = String(meta.ownershipSource || "").trim();
  const initiationType = String(meta.initiationType || "").trim();
  if (!ownershipSource || !initiationType) {
    return new Response("Ignored (no ownership metadata)", { status: 200 });
  }
  const target = await resolveTargetIdentity(env, {
    locationID: meta?.locationID,
    draftULID: meta?.draftULID,
    draftSessionId: meta?.draftSessionId
  }, { validateDraft: true });
  if (!target || !/^[0-9A-HJKMNP-TV-Z]{26}$/i.test(target.ulid)) {
    return new Response("target identity did not resolve to a canonical ULID", { status: 400 });
  }
  const ulid = target.ulid;
  const locationID = target.locationID;
  const idemKey = `stripe_processed:${paymentIntentId}`;
  const seen = await env.KV_STATUS.get(idemKey);
  if (seen) return new Response("OK", { status: 200 });
  const ownKey = `ownership:${ulid}`;
  const current = await env.KV_STATUS.get(ownKey, { type: "json" });
  const now = /* @__PURE__ */ new Date();
  const curUntil = current?.exclusiveUntil ? new Date(String(current.exclusiveUntil)) : null;
  const base = curUntil && !Number.isNaN(curUntil.getTime()) && curUntil > now ? curUntil : now;
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1e3;
  const newUntil = new Date(base.getTime() + THIRTY_DAYS_MS);
  const rec = {
    uid: ulid,
    state: "owned",
    exclusiveUntil: newUntil.toISOString(),
    source: ownershipSource,
    lastEventId: paymentIntentId,
    updatedAt: now.toISOString()
  };
  await env.KV_STATUS.put(ownKey, JSON.stringify(rec));
  try {
    const sk = String(env.STRIPE_SECRET_KEY || "").trim();
    const checkoutSessionId = String(session?.id || "").trim();
    if (sk && checkoutSessionId) {
      await persistPlanRecord(env, sk, checkoutSessionId, paymentIntentId, rec.exclusiveUntil, {
        initiationType,
        campaignPreset: meta?.campaignPreset
      });
    }
  } catch (e) {
    console.error("stripe_webhook: plan_persist_failed", { ulid, err: String(e?.message || e || "") });
  }
  await env.KV_STATUS.put(idemKey, JSON.stringify({
    paymentIntentId,
    ulid,
    ownershipSource,
    processedAt: now.toISOString()
  }));
  return new Response("OK", { status: 200, headers: { "x-ng-verify": verifyMode || "" } });
}
__name(handleStripeWebhook, "handleStripeWebhook");
async function createCampaignCheckoutSession(env, req, body, noStore) {
  const sk = String(env.STRIPE_SECRET_KEY || "").trim();
  if (!sk) return json({ error: { code: "misconfigured", message: "STRIPE_SECRET_KEY not set" } }, 500, noStore);
  const locationID = String(body?.locationID || "").trim();
  const draftULID = String(body?.draftULID || "").trim();
  const draftSessionId = String(body?.draftSessionId || "").trim();
  const campaignKey = String(body?.campaignKey || "").trim();
  const initiationType = String(body?.initiationType || "").trim();
  const ownershipSource = String(body?.ownershipSource || "").trim();
  const navigenVersion = String(body?.navigenVersion || "").trim() || "phase5";
  const planCode = String(body?.planCode || "").trim().toLowerCase();
  const okInitiation = initiationType === "owner" || initiationType === "public";
  const requestedPlan = planDefinitionForCode(planCode);
  const hasLocationRoute = !!locationID;
  const hasDraftRoute = !!draftULID || !!draftSessionId;
  if (!hasLocationRoute && !hasDraftRoute || hasLocationRoute && hasDraftRoute || !campaignKey || !okInitiation || ownershipSource !== "campaign" || !requestedPlan) {
    return json(
      { error: { code: "invalid_request", message: "exactly one target identity route (locationID OR draftULID + draftSessionId), campaignKey, valid planCode, initiationType in {'owner','public'}, ownershipSource='campaign' required" } },
      400,
      noStore
    );
  }
  if (campaignKey === "campaign-30d") {
    return json(
      { error: { code: "invalid_request", message: "campaignKey must be the draft campaignKey (not 'campaign-30d')" } },
      400,
      noStore
    );
  }
  if (locationID && /^[0-9A-HJKMNP-TV-Z]{26}$/i.test(locationID)) {
    return json({ error: { code: "invalid_request", message: "locationID must be a slug, not a ULID" } }, 400, noStore);
  }
  const target = await resolveTargetIdentity(env, { locationID, draftULID, draftSessionId }, { validateDraft: hasDraftRoute }).catch(() => null);
  if (!target) {
    return json({ error: { code: "not_found", message: hasLocationRoute ? "unknown locationID" : "unknown private shell target" } }, 404, noStore);
  }
  const ulid = target.ulid;
  const draftKey = `campaigns:draft:${ulid}`;
  const draft = await env.KV_STATUS.get(draftKey, { type: "json" });
  if (!draft || String(draft?.campaignKey || "").trim() !== campaignKey) {
    return json({ error: { code: "invalid_state", message: "draft not found for the requested campaignKey" } }, 409, noStore);
  }
  const scope = normCampaignScope(draft?.campaignScope);
  const eligibleLocations = await eligibleLocationsForRequest(req, env, ulid);
  const eligibleByUlid = new Map(eligibleLocations.map((x) => [x.ulid, x]));
  const eligibleUlids = eligibleLocations.map((x) => x.ulid);
  if (scope !== "single" && requestedPlan.maxPublishedLocations <= 1) {
    return json(buildPlanUpgradeErrorBody(requestedPlan, scope, 2), 409, noStore);
  }
  let includedUlids = [ulid];
  if (scope === "selected") {
    includedUlids = Array.from(new Set((Array.isArray(draft?.selectedLocationULIDs) ? draft.selectedLocationULIDs : []).map((x) => String(x || "").trim()).filter(Boolean)));
    includedUlids = includedUlids.filter((id) => eligibleByUlid.has(id));
    if (!includedUlids.length) {
      return json({ error: { code: "invalid_state", message: "selected scope has no eligible locations" } }, 409, noStore);
    }
  } else if (scope === "all") {
    includedUlids = eligibleUlids.length ? eligibleUlids : [ulid];
  }
  if (requestedPlan.maxPublishedLocations > 0 && includedUlids.length > requestedPlan.maxPublishedLocations) {
    return json(buildPlanUpgradeErrorBody(requestedPlan, scope, includedUlids.length), 409, noStore);
  }
  const campaignPreset = normCampaignPreset(body?.campaignPreset || draft?.campaignPreset || "promotion");
  const siteOrigin = req.headers.get("Origin") || "https://navigen.io";
  const successUrlObj = new URL("/", siteOrigin);
  successUrlObj.searchParams.set("flow", "campaign");
  if (target.route === "existing-location") {
    successUrlObj.searchParams.set("locationID", target.locationID);
  } else {
    successUrlObj.searchParams.set("draftULID", target.draftULID);
    successUrlObj.searchParams.set("draftSessionId", target.draftSessionId);
  }
  successUrlObj.searchParams.set("sid", "{CHECKOUT_SESSION_ID}");
  const successUrl = successUrlObj.toString().replace("%7BCHECKOUT_SESSION_ID%7D", "{CHECKOUT_SESSION_ID}");
  const cancelUrl = new URL("/", siteOrigin);
  cancelUrl.searchParams.set("flow", "campaign");
  if (target.route === "existing-location") {
    cancelUrl.searchParams.set("locationID", target.locationID);
  } else {
    cancelUrl.searchParams.set("draftULID", target.draftULID);
    cancelUrl.searchParams.set("draftSessionId", target.draftSessionId);
  }
  cancelUrl.searchParams.set("canceled", "1");
  const form = new URLSearchParams();
  form.set("mode", "payment");
  form.set("customer_creation", "if_required");
  form.set("billing_address_collection", "auto");
  form.set("success_url", successUrl);
  form.set("cancel_url", cancelUrl.toString());
  form.set("line_items[0][quantity]", "1");
  form.set("line_items[0][price]", requestedPlan.priceId);
  if (target.route === "existing-location") {
    form.set("metadata[locationID]", target.locationID);
    form.set("payment_intent_data[metadata][locationID]", target.locationID);
  } else {
    form.set("metadata[draftULID]", target.draftULID);
    form.set("metadata[draftSessionId]", target.draftSessionId);
    form.set("payment_intent_data[metadata][draftULID]", target.draftULID);
    form.set("payment_intent_data[metadata][draftSessionId]", target.draftSessionId);
  }
  form.set("metadata[campaignKey]", campaignKey);
  form.set("metadata[initiationType]", initiationType);
  form.set("metadata[ownershipSource]", ownershipSource);
  form.set("metadata[campaignPreset]", campaignPreset);
  form.set("metadata[navigenVersion]", navigenVersion);
  form.set("payment_intent_data[metadata][campaignKey]", campaignKey);
  form.set("payment_intent_data[metadata][initiationType]", initiationType);
  form.set("payment_intent_data[metadata][ownershipSource]", ownershipSource);
  form.set("payment_intent_data[metadata][campaignPreset]", campaignPreset);
  form.set("payment_intent_data[metadata][navigenVersion]", navigenVersion);
  const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${sk}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: form.toString()
  });
  const txt = await r.text();
  let out = null;
  try {
    out = JSON.parse(txt);
  } catch {
    out = null;
  }
  if (!r.ok || !out?.id) {
    return json({ error: { code: "stripe_error", message: String(out?.error?.message || "Stripe create session failed") } }, 502, noStore);
  }
  return json({ sessionId: out.id, url: String(out.url || "") }, 200, noStore);
}
__name(createCampaignCheckoutSession, "createCampaignCheckoutSession");
async function getItemById(ulid, env) {
  const id = String(ulid || "").trim();
  if (!id) return null;
  try {
    const src = new URL("/data/profiles.json", "https://navigen.io").toString();
    const resp = await fetch(src, {
      cf: { cacheTtl: 60, cacheEverything: true },
      headers: { "Accept": "application/json" }
    });
    if (!resp.ok) return null;
    const data = await resp.json().catch(() => ({ locations: [] }));
    const arr = Array.isArray(data?.locations) ? data.locations : data?.locations && typeof data.locations === "object" ? Object.values(data.locations) : [];
    if (!Array.isArray(arr)) return null;
    let hit = arr.find((r) => String(r?.ID || r?.id || "").trim() === id);
    if (hit) return hit;
    if (env.KV_ALIASES) {
      let aliasSlug = "";
      let cursor = void 0;
      do {
        const page = await env.KV_ALIASES.list({ prefix: "alias:", cursor });
        for (const k of page.keys) {
          const name = k.name;
          const raw = await env.KV_ALIASES.get(name, "text");
          if (!raw) continue;
          let val = raw.trim();
          if (val.startsWith("{")) {
            try {
              const j = JSON.parse(val);
              val = String(j?.locationID || "").trim();
            } catch {
              val = "";
            }
          }
          if (val && val === id) {
            aliasSlug = name.replace(/^alias:/, "");
            break;
          }
        }
        if (aliasSlug) break;
        cursor = page.cursor || void 0;
      } while (cursor);
      if (aliasSlug) {
        hit = arr.find((r) => String(r?.locationID || "").trim() === aliasSlug);
        if (hit) return hit;
      }
    }
    return null;
  } catch {
    return null;
  }
}
__name(getItemById, "getItemById");
function pickName(name) {
  if (!name) return "";
  if (typeof name === "string") return name;
  if (typeof name === "object") {
    return String(name.en || name.hu || Object.values(name)[0] || "").trim();
  }
  return "";
}
__name(pickName, "pickName");
var DO_ULID_RE = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
function doJson(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}
__name(doJson, "doJson");
function doError(reason, status = 400, extra = {}) {
  return doJson({ ok: false, reason, ...extra }, status);
}
__name(doError, "doError");
async function doReadJson(req) {
  try {
    return await req.json();
  } catch {
    return null;
  }
}
__name(doReadJson, "doReadJson");
function doNowIso() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
__name(doNowIso, "doNowIso");
function doNormalizeSlug(slug) {
  return String(slug || "").trim().toLowerCase();
}
__name(doNormalizeSlug, "doNormalizeSlug");
function doNormalizeToken(value) {
  return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\p{L}\p{N}\s-]+/gu, " ").replace(/\s+/g, " ").trim().slice(0, 32);
}
__name(doNormalizeToken, "doNormalizeToken");
function doNormalizeTokens(values) {
  const out = values.map(doNormalizeToken).filter(Boolean).sort();
  return Array.from(new Set(out)).slice(0, 64);
}
__name(doNormalizeTokens, "doNormalizeTokens");
var PlanAllocDO = class {
  static {
    __name(this, "PlanAllocDO");
  }
  state;
  env;
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }
  async readState() {
    const hit = await this.state.storage.get("state");
    return hit || { heldUlids: [], committedUlids: [], updatedAt: doNowIso() };
  }
  async writeState(next) {
    next.updatedAt = doNowIso();
    await this.state.storage.put("state", next);
  }
  async fetch(req) {
    const method = req.method.toUpperCase();
    const body = method === "GET" ? null : await doReadJson(req);
    const op = String(body?.op || new URL(req.url).searchParams.get("op") || "snapshot").trim().toLowerCase();
    if (op === "snapshot") {
      const state2 = await this.readState();
      return doJson({
        ok: true,
        heldUlids: state2.heldUlids,
        committedUlids: state2.committedUlids,
        heldCount: state2.heldUlids.length,
        allocatedCount: state2.committedUlids.length
      });
    }
    const ulid = String(body?.ulid || "").trim();
    const max = Math.max(0, Number(body?.max || 0) || 0);
    if (!DO_ULID_RE.test(ulid)) return doError("invalid_ulid", 400);
    const state = await this.readState();
    const held = new Set(state.heldUlids);
    const committed = new Set(state.committedUlids);
    if (op === "reserve") {
      if (!Number.isFinite(max) || max <= 0) return doError("invalid_max", 400, { max });
      if (committed.has(ulid)) {
        return doJson({
          ok: true,
          alreadyAllocated: true,
          allocatedCount: committed.size,
          max,
          reservationState: "committed"
        });
      }
      if (held.has(ulid)) {
        return doJson({
          ok: true,
          alreadyAllocated: false,
          allocatedCount: committed.size,
          max,
          reservationState: "held"
        });
      }
      const used = committed.size + held.size;
      if (used >= max) {
        return doJson({
          ok: false,
          reason: "capacity_exceeded",
          allocatedCount: committed.size,
          heldCount: held.size,
          max
        }, 409);
      }
      held.add(ulid);
      await this.writeState({
        heldUlids: Array.from(held),
        committedUlids: Array.from(committed),
        updatedAt: doNowIso()
      });
      return doJson({
        ok: true,
        alreadyAllocated: false,
        allocatedCount: committed.size,
        heldCount: held.size,
        max,
        reservationState: "held"
      });
    }
    if (op === "commit") {
      if (committed.has(ulid)) {
        return doJson({
          ok: true,
          alreadyAllocated: true,
          allocatedCount: committed.size,
          reservationState: "committed"
        });
      }
      if (!held.has(ulid)) {
        return doError("missing_hold", 409);
      }
      held.delete(ulid);
      committed.add(ulid);
      await this.writeState({
        heldUlids: Array.from(held),
        committedUlids: Array.from(committed),
        updatedAt: doNowIso()
      });
      return doJson({
        ok: true,
        alreadyAllocated: false,
        allocatedCount: committed.size,
        reservationState: "committed"
      });
    }
    if (op === "release") {
      const existed = held.delete(ulid);
      await this.writeState({
        heldUlids: Array.from(held),
        committedUlids: Array.from(committed),
        updatedAt: doNowIso()
      });
      return doJson({
        ok: true,
        released: existed,
        allocatedCount: committed.size,
        heldCount: held.size
      });
    }
    return doError("unsupported_op", 400, { op });
  }
};
var SearchShardDO = class {
  static {
    __name(this, "SearchShardDO");
  }
  state;
  env;
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }
  async readState() {
    const hit = await this.state.storage.get("state");
    return hit || {
      slugToUlid: {},
      slugByUlid: {},
      tokensByUlid: {},
      tokenToUlids: {},
      metaByUlid: {},
      hashByUlid: {},
      updatedAt: doNowIso()
    };
  }
  async writeState(next) {
    next.updatedAt = doNowIso();
    await this.state.storage.put("state", next);
  }
  removeExisting(state, ulid) {
    const prevSlug = String(state.slugByUlid[ulid] || "").trim();
    if (prevSlug) delete state.slugToUlid[prevSlug];
    delete state.slugByUlid[ulid];
    const prevTokens = Array.isArray(state.tokensByUlid[ulid]) ? state.tokensByUlid[ulid] : [];
    for (const tok of prevTokens) {
      const current = Array.isArray(state.tokenToUlids[tok]) ? state.tokenToUlids[tok] : [];
      const next = current.filter((v) => v !== ulid);
      if (next.length) state.tokenToUlids[tok] = next;
      else delete state.tokenToUlids[tok];
    }
    delete state.tokensByUlid[ulid];
    delete state.metaByUlid[ulid];
    delete state.hashByUlid[ulid];
  }
  async fetch(req) {
    const method = req.method.toUpperCase();
    const body = method === "GET" ? null : await doReadJson(req);
    const url = new URL(req.url);
    const op = String(body?.op || url.searchParams.get("op") || "snapshot").trim().toLowerCase();
    if (op === "snapshot") {
      const state2 = await this.readState();
      return doJson({
        ok: true,
        slugs: Object.keys(state2.slugToUlid).length,
        tokens: Object.keys(state2.tokenToUlids).length,
        ulids: Object.keys(state2.slugByUlid).length
      });
    }
    if (op === "lookup_slug") {
      const slug = doNormalizeSlug(body?.slug || url.searchParams.get("slug") || "");
      if (!slug) return doError("invalid_slug", 400);
      const state2 = await this.readState();
      return doJson({ ok: true, ulid: String(state2.slugToUlid[slug] || "") });
    }
    if (op === "search") {
      const rawTokens = Array.isArray(body?.tokens) ? body.tokens : String(url.searchParams.get("tokens") || "").split(",");
      const tokens = doNormalizeTokens(rawTokens);
      const state2 = await this.readState();
      if (!tokens.length) return doJson({ ok: true, ulids: [] });
      let result = null;
      for (const tok of tokens) {
        const hits = Array.isArray(state2.tokenToUlids[tok]) ? state2.tokenToUlids[tok] : [];
        result = result === null ? [...hits] : result.filter((v) => hits.includes(v));
        if (!result.length) break;
      }
      return doJson({ ok: true, ulids: result || [] });
    }
    const ulid = String(body?.ulid || "").trim();
    if (!DO_ULID_RE.test(ulid)) return doError("invalid_ulid", 400);
    const state = await this.readState();
    if (op === "delete") {
      this.removeExisting(state, ulid);
      await this.writeState(state);
      return doJson({ ok: true, deleted: true });
    }
    if (op === "upsert") {
      const slug = doNormalizeSlug(body?.slug);
      if (!slug) return doError("invalid_slug", 400);
      const tokens = doNormalizeTokens(Array.isArray(body?.tokens) ? body.tokens : []);
      const indexedFieldsHash = String(body?.indexedFieldsHash || "").trim();
      const prevHash = String(state.hashByUlid[ulid] || "").trim();
      const prevSlug = String(state.slugByUlid[ulid] || "").trim();
      if (indexedFieldsHash && prevHash && indexedFieldsHash === prevHash && prevSlug === slug) {
        return doJson({ ok: true, noChange: true });
      }
      this.removeExisting(state, ulid);
      state.slugToUlid[slug] = ulid;
      state.slugByUlid[ulid] = slug;
      state.tokensByUlid[ulid] = tokens;
      state.hashByUlid[ulid] = indexedFieldsHash;
      const meta = body?.meta && typeof body.meta === "object" ? body.meta : {};
      state.metaByUlid[ulid] = {
        city: String(meta?.city || "").trim(),
        postalCode: String(meta?.postalCode || "").trim(),
        name: String(meta?.name || "").trim()
      };
      for (const tok of tokens) {
        const current = Array.isArray(state.tokenToUlids[tok]) ? state.tokenToUlids[tok] : [];
        if (!current.includes(ulid)) current.push(ulid);
        state.tokenToUlids[tok] = current;
      }
      await this.writeState(state);
      return doJson({ ok: true, upserted: true, tokenCount: tokens.length });
    }
    return doError("unsupported_op", 400, { op });
  }
};
var ContextShardDO = class {
  static {
    __name(this, "ContextShardDO");
  }
  state;
  env;
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }
  async readState() {
    const hit = await this.state.storage.get("state");
    return hit || { ulids: [], updatedAt: doNowIso() };
  }
  async writeState(next) {
    next.updatedAt = doNowIso();
    await this.state.storage.put("state", next);
  }
  async fetch(req) {
    const method = req.method.toUpperCase();
    const body = method === "GET" ? null : await doReadJson(req);
    const op = String(body?.op || new URL(req.url).searchParams.get("op") || "snapshot").trim().toLowerCase();
    if (op === "snapshot" || op === "list") {
      const state2 = await this.readState();
      return doJson({ ok: true, ulids: state2.ulids, count: state2.ulids.length });
    }
    const ulid = String(body?.ulid || "").trim();
    if (!DO_ULID_RE.test(ulid)) return doError("invalid_ulid", 400);
    const state = await this.readState();
    const set = new Set(state.ulids);
    if (op === "upsert") {
      set.add(ulid);
      await this.writeState({ ulids: Array.from(set), updatedAt: doNowIso() });
      return doJson({ ok: true, upserted: true, count: set.size });
    }
    if (op === "delete") {
      const existed = set.delete(ulid);
      await this.writeState({ ulids: Array.from(set), updatedAt: doNowIso() });
      return doJson({ ok: true, deleted: existed, count: set.size });
    }
    return doError("unsupported_op", 400, { op });
  }
};
var src_default = {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const pathname = url.pathname;
    const normPath = pathname.replace(/\/{2,}/g, "/").replace(/(.+)\/$/, "$1");
    if (req.method === "OPTIONS") {
      const origin = req.headers.get("Origin") || "";
      const reqHdrs = req.headers.get("Access-Control-Request-Headers") || "";
      const allow = /* @__PURE__ */ new Set(["https://navigen.io", "https://navigen-go.pages.dev"]);
      const allowOrigin = allow.has(origin) ? origin : "https://navigen.io";
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": allowOrigin,
          "Access-Control-Allow-Credentials": "true",
          // REQUIRED for credentials
          "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
          "Access-Control-Allow-Headers": reqHdrs || "content-type, authorization, cache-control, pragma",
          "Access-Control-Max-Age": "600",
          "Vary": "Origin"
        }
      });
    }
    try {
      if (normPath === "/api/_admin/p8/preseed" && req.method === "POST") {
        if (!isAdminPreseedAuthorized(req, env)) {
          return json(
            { error: { code: "forbidden", message: "admin authorization required" } },
            403,
            { "cache-control": "no-store" }
          );
        }
        const body = await req.json().catch(() => ({}));
        const targetSlug = String(body?.locationID || "").trim();
        const doAll = !!body?.all;
        const force = !!body?.force;
        const purgeContexts = Array.isArray(body?.purgeContexts) ? body.purgeContexts.map((v) => String(v || "").trim()).filter(Boolean) : [];
        if (!targetSlug && !doAll) {
          return json(
            { error: { code: "invalid_request", message: "set { all:true } or provide locationID" } },
            400,
            { "cache-control": "no-store" }
          );
        }
        let profiles;
        try {
          profiles = await fetchLegacyProfilesJson(req);
        } catch (e) {
          return json(
            { error: { code: "upstream", message: String(e?.message || "profiles.json not reachable") } },
            502,
            { "cache-control": "no-store" }
          );
        }
        const rows = legacyLocationsArray(profiles);
        const picked = targetSlug ? rows.filter((r) => legacyLocationSlug(r) === targetSlug) : rows;
        if (!picked.length) {
          return json(
            { error: { code: "not_found", message: "no matching legacy locations" } },
            404,
            { "cache-control": "no-store" }
          );
        }
        const out = [];
        let created = 0;
        let skipped = 0;
        let failed = 0;
        for (const rec of picked) {
          try {
            const result = await preseedLegacyLocationRecord(env, rec, { force });
            out.push(result);
            if (result.created || result.overwritten) created++;
            else if (result.skipped) skipped++;
            else failed++;
          } catch (e) {
            failed++;
            out.push({
              ok: false,
              slug: legacyLocationSlug(rec),
              ulid: "",
              reason: String(e?.message || "preseed_failed")
            });
          }
        }
        return json(
          {
            ok: true,
            mode: targetSlug ? "single" : "all",
            total: picked.length,
            created,
            skipped,
            failed,
            items: out
          },
          200,
          { "cache-control": "no-store" }
        );
      }
      if (normPath === "/api/_admin/p8/preseed-check" && req.method === "GET") {
        if (!isAdminPreseedAuthorized(req, env)) {
          return json(
            { error: { code: "forbidden", message: "admin authorization required" } },
            403,
            { "cache-control": "no-store" }
          );
        }
        const slug = String(url.searchParams.get("locationID") || "").trim();
        if (!slug) {
          return json(
            { error: { code: "invalid_request", message: "locationID required" } },
            400,
            { "cache-control": "no-store" }
          );
        }
        const ulid = await resolveUid(slug, env);
        const hasBase = ulid ? !!await env.KV_STATUS.get(`profile_base:${ulid}`, "text") : false;
        return json(
          {
            ok: true,
            locationID: slug,
            ulid: ulid || "",
            hasAlias: !!ulid,
            hasProfileBase: hasBase
          },
          200,
          { "cache-control": "no-store" }
        );
      }
      if (normPath === "/api/_admin/p8/backfill-do" && req.method === "POST") {
        if (!isAdminPreseedAuthorized(req, env)) {
          return json(
            { error: { code: "forbidden", message: "admin authorization required" } },
            403,
            { "cache-control": "no-store" }
          );
        }
        const body = await req.json().catch(() => ({}));
        const targetSlug = String(body?.locationID || "").trim();
        const doAll = !!body?.all;
        const force = !!body?.force;
        const purgeContexts = Array.isArray(body?.purgeContexts) ? body.purgeContexts.map((v) => String(v || "").trim()).filter(Boolean) : [];
        if (!targetSlug && !doAll) {
          return json(
            { error: { code: "invalid_request", message: "set { all:true } or provide locationID" } },
            400,
            { "cache-control": "no-store" }
          );
        }
        const targets = [];
        if (targetSlug) {
          const ulid = await resolveUid(targetSlug, env);
          if (!ulid) {
            return json(
              { error: { code: "not_found", message: "unknown locationID" } },
              404,
              { "cache-control": "no-store" }
            );
          }
          targets.push({ ulid, slug: targetSlug });
        } else {
          let cursor = void 0;
          do {
            const page = await env.KV_STATUS.list({ prefix: "profile_base:", cursor });
            for (const key of page.keys) {
              const name = String(key.name || "");
              const ulid = name.replace(/^profile_base:/, "").trim();
              if (!ULID_RE.test(ulid)) continue;
              const rec = await readPublishedEffectiveProfileByUlid(ulid, env);
              if (!rec) continue;
              targets.push({ ulid, slug: rec.locationID });
            }
            cursor = page.cursor || void 0;
          } while (cursor);
        }
        const out = [];
        let indexed = 0;
        let hidden = 0;
        let failed = 0;
        for (const t of targets) {
          try {
            const result = await backfillPublishedLocationDoState(env, t.ulid, { purgeContexts });
            out.push(result);
            if (result.ok && result.indexed) indexed++;
            else if (result.ok && result.visibilityState === "hidden") hidden++;
            else failed++;
          } catch (e) {
            failed++;
            out.push({
              ok: false,
              ulid: t.ulid,
              slug: t.slug,
              reason: String(e?.message || "do_backfill_failed")
            });
          }
        }
        return json(
          {
            ok: true,
            mode: targetSlug ? "single" : "all",
            total: targets.length,
            indexed,
            hidden,
            failed,
            items: out
          },
          200,
          { "cache-control": "no-store" }
        );
      }
      if (normPath === "/api/_diag/stripe-secret" && req.method === "GET") {
        const secretRaw = (env.STRIPE_WEBHOOK_SECRET || "").trim();
        const enc = new TextEncoder();
        const fpBuf = await crypto.subtle.digest("SHA-256", enc.encode(secretRaw));
        const fp = hexPrefix(fpBuf, 6);
        return new Response(JSON.stringify({
          hasSecret: !!secretRaw,
          secretLen: secretRaw.length,
          secretFp: fp
        }), { status: 200, headers: { "content-type": "application/json", "x-ng-worker": "navigen-api" } });
      }
      if (normPath === "/api/owner/location-options" && req.method === "GET") {
        const url2 = new URL(req.url);
        const q = String(url2.searchParams.get("q") || "").trim();
        const limitRaw = Number(url2.searchParams.get("limit") || 5);
        const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(Math.trunc(limitRaw), 5)) : 5;
        if (ownerSelectorNormalizeText(q).replace(/\s+/g, "").length < 3) {
          return json({ items: [], q, limit, threshold: 3 }, 200, { "cache-control": "no-store" });
        }
        const items = await listPublishedLocationSelectorItems(env, { query: q, limit }).catch(() => []);
        return json({ items, q, limit }, 200, { "cache-control": "no-store" });
      }
      if (normPath === "/api/owner/sessions" && req.method === "GET") {
        const dev = readDeviceId(req);
        if (!dev) {
          return json({ items: [], rows: [], reason: "no_device_id" }, 200, { "cache-control": "no-store" });
        }
        const idxKey = devIndexKey(dev);
        const rawIdx = await env.KV_STATUS.get(idxKey, "text");
        let ulids = [];
        try {
          ulids = rawIdx ? JSON.parse(rawIdx) : [];
        } catch {
          ulids = [];
        }
        if (!Array.isArray(ulids)) ulids = [];
        const out = [];
        for (const u of ulids) {
          const ulid = String(u || "").trim();
          if (!ULID_RE.test(ulid)) continue;
          const sid = await env.KV_STATUS.get(devSessKey(dev, ulid), "text");
          if (sid) out.push(ulid);
        }
        const rows = (await Promise.all(
          out.map(async (ulid) => {
            const rec = await readPublishedEffectiveProfileByUlid(ulid, env);
            if (!rec) return null;
            return await buildOwnerLocationSelectorItem(env, rec);
          })
        )).filter(Boolean);
        return json({ items: out, rows }, 200, { "cache-control": "no-store" });
      }
      if (normPath === "/api/owner/sessions/remove" && req.method === "POST") {
        const dev = readDeviceId(req);
        if (!dev) {
          return json({ error: { code: "no_device_id", message: "ng_dev missing" } }, 401, { "cache-control": "no-store" });
        }
        const body = await req.json().catch(() => ({}));
        const ulid = String(body?.ulid || "").trim();
        if (!ULID_RE.test(ulid)) {
          return json({ error: { code: "invalid_request", message: "ulid required" } }, 400, { "cache-control": "no-store" });
        }
        try {
          await env.KV_STATUS.delete(devSessKey(dev, ulid));
        } catch {
        }
        try {
          const idxKey = devIndexKey(dev);
          const rawIdx = await env.KV_STATUS.get(idxKey, "text");
          let arr = [];
          try {
            arr = rawIdx ? JSON.parse(rawIdx) : [];
          } catch {
            arr = [];
          }
          if (!Array.isArray(arr)) arr = [];
          arr = arr.filter((x) => String(x || "").trim() !== ulid);
          await env.KV_STATUS.put(idxKey, JSON.stringify(arr), { expirationTtl: 60 * 60 * 24 * 366 });
        } catch {
        }
        return json({ ok: true, ulid }, 200, { "cache-control": "no-store" });
      }
      if (normPath === "/api/owner/campaigns" && req.method === "GET") {
        const sess = await requireOwnerSession(req, env);
        if (sess instanceof Response) return sess;
        const ulid = String(sess.ulid || "").trim();
        const draftKey = `campaigns:draft:${ulid}`;
        const histKey = campaignsByUlidKey(ulid);
        let draft = null;
        let history = [];
        try {
          const rawDraft = await env.KV_STATUS.get(draftKey, { type: "json" });
          if (rawDraft && typeof rawDraft === "object") draft = rawDraft;
        } catch {
        }
        try {
          const rawHist = await env.KV_STATUS.get(histKey, { type: "json" });
          history = Array.isArray(rawHist) ? rawHist : [];
        } catch {
          history = [];
        }
        const inherited = await materializeInheritedAllScopeForCurrentUlid(req, env, ulid).catch(() => ({
          addedRows: 0,
          addedGroups: 0,
          blockedRows: 0,
          blockedGroups: 0,
          blockedPlanTier: "",
          blockedMaxPublishedLocations: 0
        }));
        if (inherited.addedRows > 0) {
          try {
            const refreshed = await env.KV_STATUS.get(histKey, { type: "json" });
            history = Array.isArray(refreshed) ? refreshed : history;
          } catch {
          }
        }
        const eligibleLocations = await eligibleLocationsForRequest(req, env, ulid);
        const currentPlan = await currentPlanForUlid(env, ulid);
        const currentGroupPlan = await currentGroupPlanForUlid(env, ulid);
        const effectivePlanTier = normalizePlanTier(currentPlan?.tier || currentGroupPlan?.tier);
        const effectivePlanCapacity = Math.max(
          0,
          Number(currentPlan?.maxPublishedLocations || currentGroupPlan?.maxPublishedLocations || 0) || 0
        );
        const multiLocationEnabled = effectivePlanCapacity > 1;
        const nowMs = Date.now();
        const active = history.filter((r) => {
          const st = effectiveCampaignStatus(r);
          if (st !== "active") return false;
          const sMs = parseYmdUtcMs(String(r?.startDate || ""));
          const eMs = parseYmdUtcMs(String(r?.endDate || ""));
          if (!Number.isFinite(sMs) || !Number.isFinite(eMs)) return false;
          return nowMs >= sMs && nowMs <= eMs + 24 * 60 * 60 * 1e3 - 1;
        });
        return json(
          {
            ulid,
            draft,
            active,
            history,
            plan: {
              tier: String(effectivePlanTier || "").trim() || "unknown",
              maxPublishedLocations: effectivePlanCapacity,
              multiLocationEnabled
            },
            eligibleLocations,
            inheritedNotice: inherited.addedRows > 0 || inherited.blockedRows > 0 ? {
              addedRows: inherited.addedRows,
              addedGroups: inherited.addedGroups,
              blockedRows: inherited.blockedRows,
              blockedGroups: inherited.blockedGroups,
              blockedPlanTier: inherited.blockedPlanTier,
              blockedMaxPublishedLocations: inherited.blockedMaxPublishedLocations
            } : null
          },
          200,
          { "cache-control": "no-store" }
        );
      }
      if (normPath === "/api/owner/campaigns/group" && req.method === "GET") {
        const sess = await requireOwnerSession(req, env);
        if (sess instanceof Response) return sess;
        const ulid = String(sess.ulid || "").trim();
        const campaignGroupKey = String(url.searchParams.get("campaignGroupKey") || "").trim();
        if (!campaignGroupKey) {
          return json({ error: { code: "invalid_request", message: "campaignGroupKey required" } }, 400, { "cache-control": "no-store" });
        }
        const eligible = await eligibleLocationsForRequest(req, env, ulid);
        const items = [];
        for (const loc of eligible) {
          const histRaw = await env.KV_STATUS.get(campaignsByUlidKey(loc.ulid), { type: "json" });
          const rows = Array.isArray(histRaw) ? histRaw : [];
          const row = [...rows].reverse().find(
            (r) => String(r?.campaignGroupKey || "").trim() === campaignGroupKey
          );
          if (row) {
            items.push({
              ulid: loc.ulid,
              slug: loc.slug,
              locationName: loc.locationName,
              included: true,
              status: String(row?.statusOverride || row?.status || "").trim().toLowerCase() || "active",
              campaignKey: String(row?.campaignKey || "").trim(),
              inheritedAt: String(row?.inheritedAt || "").trim() || ""
            });
          } else {
            items.push({
              ulid: loc.ulid,
              slug: loc.slug,
              locationName: loc.locationName,
              included: false,
              status: "excluded",
              campaignKey: "",
              inheritedAt: ""
            });
          }
        }
        return json(
          { campaignGroupKey, items },
          200,
          { "cache-control": "no-store" }
        );
      }
      if (normPath === "/api/owner/campaigns/draft" && req.method === "POST") {
        const sess = await requireOwnerSession(req, env);
        if (sess instanceof Response) return sess;
        const ulid = String(sess.ulid || "").trim();
        const body = await req.json().catch(() => ({}));
        const campaignKey = String(body?.campaignKey || "").trim();
        const startDate = String(body?.startDate || "").trim();
        const endDate = String(body?.endDate || "").trim();
        const scope = normCampaignScope(body?.campaignScope);
        const campaignPreset = normCampaignPreset(body?.campaignPreset);
        const requestedPlan = planDefinitionForCode(body?.planCode) || await currentPlanForUlid(env, ulid);
        if (!campaignKey) {
          return json({ error: { code: "invalid_request", message: "campaignKey required" } }, 400, { "cache-control": "no-store" });
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
          return json({ error: { code: "invalid_request", message: "startDate/endDate must be YYYY-MM-DD" } }, 400, { "cache-control": "no-store" });
        }
        const eligibleLocations = await eligibleLocationsForRequest(req, env, ulid);
        const eligibleByUlid = new Map(eligibleLocations.map((x) => [x.ulid, x]));
        const eligibleUlids = eligibleLocations.map((x) => x.ulid);
        if (scope !== "single" && Number(requestedPlan?.maxPublishedLocations || 0) <= 1) {
          return json(buildPlanUpgradeErrorBody(requestedPlan, scope, 2), 409, { "cache-control": "no-store" });
        }
        const selectedLocationULIDs = Array.isArray(body?.selectedLocationULIDs) ? Array.from(new Set(body.selectedLocationULIDs.map((x) => String(x || "").trim()).filter(Boolean))) : [];
        if (scope === "selected") {
          if (!selectedLocationULIDs.length) {
            return json({ error: { code: "invalid_request", message: "selected scope requires at least one location" } }, 400, { "cache-control": "no-store" });
          }
          for (const id of selectedLocationULIDs) {
            if (!eligibleByUlid.has(id)) {
              return json({ error: { code: "denied", message: "selected location is not eligible on this device" } }, 403, { "cache-control": "no-store" });
            }
          }
        }
        const requestedLocations = scope === "selected" ? selectedLocationULIDs.length : scope === "all" ? eligibleUlids.length || 1 : 1;
        if (Number(requestedPlan?.maxPublishedLocations || 0) > 0 && requestedLocations > Number(requestedPlan?.maxPublishedLocations || 0)) {
          return json(buildPlanUpgradeErrorBody(requestedPlan, scope, requestedLocations), 409, { "cache-control": "no-store" });
        }
        const draft = {
          ...body,
          locationID: ulid,
          campaignKey,
          campaignGroupKey: scope === "single" ? "" : String(body?.campaignGroupKey || deriveCampaignGroupKey(String(body?.locationSlug || ulid), campaignKey)).trim(),
          campaignScope: scope,
          campaignPreset,
          planCode: String(body?.planCode || "").trim().toLowerCase(),
          selectedLocationULIDs,
          startDate,
          endDate,
          status: "Draft",
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        const draftKey = `campaigns:draft:${ulid}`;
        await env.KV_STATUS.put(draftKey, JSON.stringify(draft));
        return json({ ok: true, ulid, draftKey: `campaigns:draft:<ULID>` }, 200, { "cache-control": "no-store" });
      }
      if (normPath === "/api/campaigns/checkout" && req.method === "POST") {
        const noStore = { "cache-control": "no-store", "Referrer-Policy": "no-referrer" };
        const body = await req.json().catch(() => ({}));
        const locationSlug = String(body?.locationID || "").trim();
        const draftULID = String(body?.draftULID || "").trim();
        const draftSessionId = String(body?.draftSessionId || "").trim();
        const draftIn = body?.draft && typeof body.draft === "object" ? body.draft : {};
        const target = await resolveTargetIdentity(
          env,
          { locationID: locationSlug, draftULID, draftSessionId },
          { validateDraft: !!draftULID || !!draftSessionId }
        ).catch(() => null);
        if (!target) {
          return json(
            { error: { code: "invalid_request", message: "valid locationID or draftULID + draftSessionId required" } },
            400,
            noStore
          );
        }
        const campaignKey = String(draftIn?.campaignKey || "").trim();
        const startDate = String(draftIn?.startDate || "").trim();
        const endDate = String(draftIn?.endDate || "").trim();
        if (!campaignKey) return json({ error: { code: "invalid_request", message: "draft.campaignKey required" } }, 400, noStore);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
          return json({ error: { code: "invalid_request", message: "draft.startDate/endDate must be YYYY-MM-DD" } }, 400, noStore);
        }
        const draft = {
          ...draftIn,
          locationID: target.ulid,
          campaignKey,
          startDate,
          endDate,
          status: "Draft",
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        await env.KV_STATUS.put(`campaigns:draft:${target.ulid}`, JSON.stringify(draft));
        const stripeReq = {
          campaignKey,
          initiationType: "public",
          ownershipSource: "campaign",
          navigenVersion: "phase5",
          planCode: body?.planCode
        };
        if (target.route === "existing-location") {
          stripeReq.locationID = locationSlug;
        } else {
          stripeReq.draftULID = target.draftULID;
          stripeReq.draftSessionId = target.draftSessionId;
        }
        return await createCampaignCheckoutSession(env, req, stripeReq, noStore);
      }
      if (normPath === "/api/owner/campaigns/checkout" && req.method === "POST") {
        const noStore = { "cache-control": "no-store", "Referrer-Policy": "no-referrer" };
        const sess = await requireOwnerSession(req, env);
        if (sess instanceof Response) return sess;
        const ulid = String(sess.ulid || "").trim();
        const body = await req.json().catch(() => ({}));
        const locationSlug = String(body?.locationID || "").trim();
        if (!locationSlug) {
          return json({ error: { code: "invalid_request", message: "locationID (slug) required" } }, 400, noStore);
        }
        if (/^[0-9A-HJKMNP-TV-Z]{26}$/i.test(locationSlug)) {
          return json({ error: { code: "invalid_request", message: "locationID must be a slug, not a ULID" } }, 400, noStore);
        }
        const resolved = await resolveUid(locationSlug, env).catch(() => null);
        if (!resolved || String(resolved).trim() !== ulid) {
          return new Response("Denied", { status: 401, headers: noStore });
        }
        const draftKey = `campaigns:draft:${ulid}`;
        const draft = await env.KV_STATUS.get(draftKey, { type: "json" });
        const campaignKey = String(draft?.campaignKey || "").trim();
        if (!campaignKey) {
          return json({ error: { code: "invalid_request", message: "no draft campaign found for this location" } }, 400, noStore);
        }
        const stripeReq = {
          locationID: locationSlug,
          campaignKey,
          initiationType: "owner",
          ownershipSource: "campaign",
          navigenVersion: "phase5",
          planCode: body?.planCode
        };
        return await createCampaignCheckoutSession(env, req, stripeReq, { "cache-control": "no-store" });
      }
      if (normPath === "/api/owner/campaigns/promote" && req.method === "POST") {
        const noStore = { "cache-control": "no-store", "Referrer-Policy": "no-referrer" };
        const sess = await requireOwnerSession(req, env);
        if (sess instanceof Response) return sess;
        const ulid = String(sess.ulid || "").trim();
        const body = await req.json().catch(() => ({}));
        const cs = String(body?.sessionId || "").trim();
        if (!/^cs_(live|test)_/i.test(cs)) {
          return json({ error: { code: "invalid_request", message: "sessionId (cs_...) required" } }, 400, noStore);
        }
        const sk = String(env.STRIPE_SECRET_KEY || "").trim();
        if (!sk) return json({ error: { code: "misconfigured", message: "STRIPE_SECRET_KEY not set" } }, 500, noStore);
        const stripeUrl = `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(cs)}?expand[]=payment_intent`;
        const r = await fetch(stripeUrl, { headers: { "Authorization": `Bearer ${sk}` } });
        const txt = await r.text();
        let out = null;
        try {
          out = JSON.parse(txt);
        } catch {
          out = null;
        }
        if (!r.ok || !out) {
          return json({ error: { code: "stripe_error", message: String(out?.error?.message || "Stripe session fetch failed") } }, 502, noStore);
        }
        const status = String(out?.status || "").toLowerCase();
        const payStatus = String(out?.payment_status || "").toLowerCase();
        if (status !== "complete" || payStatus !== "paid") {
          return json({ error: { code: "not_paid", message: "checkout not complete/paid" } }, 409, noStore);
        }
        const pi = out?.payment_intent;
        const meta = pi && pi.metadata ? pi.metadata : out.metadata || {};
        const locationSlug = String(meta?.locationID || "").trim();
        const campaignKey = String(meta?.campaignKey || "").trim();
        if (!locationSlug || !campaignKey) {
          return json({ error: { code: "invalid_state", message: "missing metadata.locationID/campaignKey" } }, 500, noStore);
        }
        const resolved = await resolveUid(locationSlug, env).catch(() => null);
        if (!resolved || String(resolved).trim() !== ulid) {
          return new Response("Denied", { status: 401, headers: noStore });
        }
        const draftKey = `campaigns:draft:${ulid}`;
        const draft = await env.KV_STATUS.get(draftKey, { type: "json" });
        if (!draft) {
          return json({ error: { code: "not_found", message: "draft not found" } }, 404, noStore);
        }
        if (String(draft?.campaignKey || "").trim() !== campaignKey) {
          return json({ error: { code: "invalid_state", message: "draft campaignKey mismatch" } }, 409, noStore);
        }
        const paidPriceId = await fetchStripeCheckoutLineItemPriceId(sk, cs).catch(() => "");
        const paidPlan = paidPriceId ? PRICE_ID_TO_PLAN[paidPriceId] : null;
        if (!paidPlan) {
          return json({ error: { code: "invalid_state", message: "paid checkout session has no recognized Plan tier" } }, 409, noStore);
        }
        const promoted = await promoteCampaignDraftToActiveRows({
          req,
          env,
          ownerUlid: ulid,
          draft,
          locationSlug,
          campaignKey,
          stripeSessionId: cs,
          paidPlan,
          logTag: "owner_campaigns_promote"
        });
        if ("body" in promoted) {
          return json(promoted.body, promoted.status, noStore);
        }
        await env.KV_STATUS.delete(draftKey);
        return json({
          ok: true,
          ulid,
          campaignKey,
          campaignGroupKey: promoted.campaignGroupKey,
          includedCount: promoted.includedTargets.length
        }, 200, { "cache-control": "no-store" });
      }
      if (normPath === "/api/owner/campaigns/suspend" && req.method === "POST") {
        const noStore = { "cache-control": "no-store", "Referrer-Policy": "no-referrer" };
        const sess = await requireOwnerSession(req, env);
        if (sess instanceof Response) return sess;
        const ulid = String(sess.ulid || "").trim();
        const body = await req.json().catch(() => ({}));
        const campaignKey = String(body?.campaignKey || "").trim();
        const campaignGroupKey = String(body?.campaignGroupKey || "").trim();
        const action = String(body?.action || "suspend").trim().toLowerCase();
        if (!campaignKey && !campaignGroupKey) {
          return json({ error: { code: "invalid_request", message: "campaignKey or campaignGroupKey required" } }, 400, noStore);
        }
        if (action !== "suspend" && action !== "resume") {
          return json({ error: { code: "invalid_request", message: "action must be suspend|resume" } }, 400, noStore);
        }
        const applyToRows = /* @__PURE__ */ __name(async (targetUlid) => {
          const histKey = campaignsByUlidKey(targetUlid);
          const hist = await env.KV_STATUS.get(histKey, { type: "json" });
          const arr = Array.isArray(hist) ? hist : [];
          let changed2 = false;
          const next = arr.map((row) => {
            const sameKey = campaignKey && String(row?.campaignKey || "").trim() === campaignKey;
            const sameGroup = campaignGroupKey && String(row?.campaignGroupKey || "").trim() === campaignGroupKey;
            if (!sameKey && !sameGroup) return row;
            changed2 = true;
            const out = { ...row };
            if (action === "suspend") {
              out.statusOverride = "Suspended";
              out.suspendedAt = (/* @__PURE__ */ new Date()).toISOString();
            } else {
              out.statusOverride = "";
              delete out.suspendedAt;
            }
            return out;
          });
          if (changed2) {
            await env.KV_STATUS.put(histKey, JSON.stringify(next));
          }
          return changed2;
        }, "applyToRows");
        if (campaignGroupKey) {
          const eligible = await eligibleLocationsForRequest(req, env, ulid);
          let affected = 0;
          for (const loc of eligible) {
            if (await applyToRows(loc.ulid)) affected += 1;
          }
          return json({ ok: true, ulid, campaignGroupKey, action, affected }, 200, noStore);
        }
        const changed = await applyToRows(ulid);
        if (!changed) {
          return json({ error: { code: "not_found", message: "campaign not found for this location" } }, 404, noStore);
        }
        return json({ ok: true, ulid, campaignKey, action }, 200, noStore);
      }
      if (normPath === "/api/owner/campaigns/suspend-selected" && req.method === "POST") {
        const noStore = { "cache-control": "no-store", "Referrer-Policy": "no-referrer" };
        const sess = await requireOwnerSession(req, env);
        if (sess instanceof Response) return sess;
        const currentUlid = String(sess.ulid || "").trim();
        const body = await req.json().catch(() => ({}));
        const campaignGroupKey = String(body?.campaignGroupKey || "").trim();
        const action = String(body?.action || "").trim().toLowerCase();
        const rawUlids = Array.isArray(body?.ulids) ? body.ulids : [];
        if (!campaignGroupKey) {
          return json({ error: { code: "invalid_request", message: "campaignGroupKey required" } }, 400, noStore);
        }
        if (action !== "suspend" && action !== "resume") {
          return json({ error: { code: "invalid_request", message: "action must be suspend|resume" } }, 400, noStore);
        }
        const eligible = await eligibleLocationsForRequest(req, env, currentUlid);
        const eligibleSet = new Set(eligible.map((x) => String(x.ulid || "").trim()));
        const targetUlids = Array.from(new Set(rawUlids.map((x) => String(x || "").trim()).filter(Boolean))).filter((id) => eligibleSet.has(id));
        if (!targetUlids.length) {
          return json({ error: { code: "invalid_request", message: "no eligible selected locations" } }, 400, noStore);
        }
        let affected = 0;
        for (const targetUlid of targetUlids) {
          const histKey = campaignsByUlidKey(targetUlid);
          const histRaw = await env.KV_STATUS.get(histKey, { type: "json" });
          const arr = Array.isArray(histRaw) ? histRaw : [];
          let changed = false;
          const next = arr.map((row) => {
            if (String(row?.campaignGroupKey || "").trim() !== campaignGroupKey) return row;
            changed = true;
            const out = { ...row };
            if (action === "suspend") {
              out.statusOverride = "Suspended";
              out.suspendedAt = (/* @__PURE__ */ new Date()).toISOString();
            } else {
              out.statusOverride = "";
              delete out.suspendedAt;
            }
            return out;
          });
          if (changed) {
            await env.KV_STATUS.put(histKey, JSON.stringify(next));
            affected += 1;
          }
        }
        return json(
          { ok: true, campaignGroupKey, action, affected, ulids: targetUlids },
          200,
          noStore
        );
      }
      if (normPath === "/api/_diag/opsess" && req.method === "GET") {
        const cookieHdr = req.headers.get("Cookie") || "";
        const sid = readCookie(cookieHdr, "op_sess");
        const sessKey = sid ? `opsess:${sid}` : "";
        const sess = sid ? await env.KV_STATUS.get(sessKey, { type: "json" }) : null;
        return json(
          {
            hasCookieHeader: !!cookieHdr,
            cookieHeaderLen: cookieHdr.length,
            hasOpSessCookie: !!sid,
            opSessLen: sid ? String(sid).length : 0,
            kvHit: !!sess,
            kvKey: sessKey ? `opsess:<redacted>` : "",
            ulid: sess && typeof sess === "object" ? String(sess.ulid || "") : ""
          },
          200,
          { "cache-control": "no-store", "x-ng-worker": "navigen-api" }
        );
      }
      if (normPath === "/owner/stripe-exchange" && req.method === "GET") {
        return await handleOwnerStripeExchange(req, env);
      }
      if (normPath === "/owner/restore" && req.method === "GET") {
        const u = new URL(req.url);
        const pi = String(u.searchParams.get("pi") || "").trim();
        const nextRaw = String(u.searchParams.get("next") || "").trim();
        const noStoreHeaders = { "cache-control": "no-store", "Referrer-Policy": "no-referrer" };
        if (!pi || !/^pi_/i.test(pi)) return new Response("Denied", { status: 400, headers: noStoreHeaders });
        const isSafeNext = /* @__PURE__ */ __name((p) => p.startsWith("/") && !p.startsWith("//") && !p.includes("://") && !p.includes("\\"), "isSafeNext");
        const next = nextRaw && isSafeNext(nextRaw) ? nextRaw : "";
        const jsonMode = u.searchParams.get("json") === "1" || /\bapplication\/json\b/i.test(String(req.headers.get("Accept") || ""));
        let redirectHint = "";
        const sk = String(env.STRIPE_SECRET_KEY || "").trim();
        if (!sk) return new Response("Misconfigured", { status: 500, headers: noStoreHeaders });
        const listUrl = `https://api.stripe.com/v1/checkout/sessions?payment_intent=${encodeURIComponent(pi)}&limit=1`;
        const rr = await fetch(listUrl, { method: "GET", headers: { "Authorization": `Bearer ${sk}` } });
        const txt = await rr.text();
        let out = null;
        try {
          out = JSON.parse(txt);
        } catch {
          out = null;
        }
        const sess = out?.data && Array.isArray(out.data) && out.data.length ? out.data[0] : null;
        if (!rr.ok || !sess) return new Response("Denied", { status: 403, headers: noStoreHeaders });
        const paymentStatus = String(sess?.payment_status || "").toLowerCase();
        const status = String(sess?.status || "").toLowerCase();
        if (paymentStatus !== "paid" || status !== "complete") {
          return new Response("Denied", { status: 403, headers: noStoreHeaders });
        }
        const meta = sess?.metadata || {};
        const target = await resolveTargetIdentity(env, {
          locationID: meta?.locationID,
          draftULID: meta?.draftULID,
          draftSessionId: meta?.draftSessionId
        }, { validateDraft: true });
        if (!target) return new Response("Denied", { status: 403, headers: noStoreHeaders });
        const ulid = target.ulid;
        const locationID = target.locationID;
        const ownKey = `ownership:${ulid}`;
        const ownership = await env.KV_STATUS.get(ownKey, { type: "json" });
        const exclusiveUntilIso = String(ownership?.exclusiveUntil || "").trim();
        const exclusiveUntil = exclusiveUntilIso ? new Date(exclusiveUntilIso) : null;
        if (!exclusiveUntil || Number.isNaN(exclusiveUntil.getTime()) || exclusiveUntil.getTime() <= Date.now()) {
          return new Response("Denied", { status: 403, headers: noStoreHeaders });
        }
        try {
          await persistPlanRecord(env, sk, String(sess?.id || "").trim(), pi, exclusiveUntil.toISOString(), {
            initiationType: meta?.initiationType,
            campaignPreset: meta?.campaignPreset
          });
        } catch (e) {
          console.error("owner_restore: plan_persist_failed", { ulid, err: String(e?.message || e || "") });
        }
        const sidBytes = new Uint8Array(18);
        crypto.getRandomValues(sidBytes);
        const sessionId = bytesToB64url(sidBytes);
        const createdAt = /* @__PURE__ */ new Date();
        const expiresAt = exclusiveUntil;
        const maxAge = Math.max(0, Math.floor((expiresAt.getTime() - createdAt.getTime()) / 1e3));
        const sessKey = `opsess:${sessionId}`;
        const sessVal = { ver: 1, ulid, createdAt: createdAt.toISOString(), expiresAt: expiresAt.toISOString() };
        await env.KV_STATUS.put(sessKey, JSON.stringify(sessVal), { expirationTtl: Math.max(60, maxAge) });
        let devSetCookie = "";
        try {
          let dev = readDeviceId(req);
          if (!dev) {
            const minted = mintDeviceId();
            dev = minted.dev;
            devSetCookie = minted.cookie;
          }
          if (dev) {
            await env.KV_STATUS.put(devSessKey(dev, ulid), sessionId, { expirationTtl: Math.max(60, maxAge) });
            const idxKey = devIndexKey(dev);
            const rawIdx = await env.KV_STATUS.get(idxKey, "text");
            let arr = [];
            try {
              arr = rawIdx ? JSON.parse(rawIdx) : [];
            } catch {
              arr = [];
            }
            if (!Array.isArray(arr)) arr = [];
            if (!arr.includes(ulid)) arr.unshift(ulid);
            arr = arr.slice(0, 24);
            await env.KV_STATUS.put(idxKey, JSON.stringify(arr), { expirationTtl: 60 * 60 * 24 * 366 });
          }
        } catch {
        }
        redirectHint = await promoteCampaignDraftAndBuildRedirectHint(req, sess, ulid, env, "owner_restore");
        const cookie = cookieSerialize("op_sess", sessionId, {
          Path: "/",
          HttpOnly: true,
          Secure: true,
          SameSite: "Lax",
          "Max-Age": maxAge
        });
        const redirectTarget = (() => {
          const base = next || `/dash/${encodeURIComponent(ulid)}`;
          if (!redirectHint) return base;
          const u2 = new URL(base, "https://navigen.io");
          if (!u2.searchParams.get("ce")) {
            const parts = redirectHint.split("&");
            parts.forEach((kv) => {
              const [k, v] = kv.split("=");
              if (k && v && !u2.searchParams.get(k)) u2.searchParams.set(k, decodeURIComponent(v));
              else if (k && !u2.searchParams.get(k)) u2.searchParams.set(k, "1");
            });
          }
          return u2.pathname + u2.search + u2.hash;
        })();
        const headers = new Headers({ ...noStoreHeaders });
        headers.append("Set-Cookie", cookie);
        if (devSetCookie) headers.append("Set-Cookie", devSetCookie);
        console.info("owner_restore_success", { ulid, locationID, pi, sessionId });
        if (jsonMode) {
          headers.set("Content-Type", "application/json; charset=utf-8");
          return new Response(JSON.stringify({
            ok: true,
            ulid,
            locationID,
            redirectTo: redirectTarget
          }), { status: 200, headers });
        }
        headers.set("Location", redirectTarget);
        return new Response(null, { status: 302, headers });
      }
      if (normPath === "/owner/clear-session" && req.method === "GET") {
        const u = new URL(req.url);
        const nextRaw = String(u.searchParams.get("next") || "").trim();
        const isSafeNext = /* @__PURE__ */ __name((p) => p.startsWith("/") && !p.startsWith("//") && !p.includes("://") && !p.includes("\\"), "isSafeNext");
        const next = nextRaw && isSafeNext(nextRaw) ? nextRaw : "/";
        const noStoreHeaders = { "cache-control": "no-store", "Referrer-Policy": "no-referrer" };
        const cookie = cookieSerialize("op_sess", "", {
          Path: "/",
          HttpOnly: true,
          Secure: true,
          SameSite: "Lax",
          "Max-Age": 0
        });
        return new Response(null, {
          status: 302,
          headers: {
            "Set-Cookie": cookie,
            "Location": next,
            ...noStoreHeaders
          }
        });
      }
      if (normPath === "/owner/switch" && req.method === "GET") {
        const u = new URL(req.url);
        const ulid = String(u.searchParams.get("ulid") || "").trim();
        const nextRaw = String(u.searchParams.get("next") || "").trim();
        const noStoreHeaders = { "cache-control": "no-store", "Referrer-Policy": "no-referrer" };
        if (!ULID_RE.test(ulid)) return new Response("Denied", { status: 400, headers: noStoreHeaders });
        const isSafeNext = /* @__PURE__ */ __name((p) => p.startsWith("/") && !p.startsWith("//") && !p.includes("://") && !p.includes("\\"), "isSafeNext");
        const next = nextRaw && isSafeNext(nextRaw) ? nextRaw : `/dash/${encodeURIComponent(ulid)}`;
        const dev = readDeviceId(req);
        if (!dev) return new Response("Denied", { status: 401, headers: noStoreHeaders });
        const sid = await env.KV_STATUS.get(devSessKey(dev, ulid), "text");
        if (!sid) return new Response("Denied", { status: 403, headers: noStoreHeaders });
        const sessKey = `opsess:${sid}`;
        const sess = await env.KV_STATUS.get(sessKey, { type: "json" });
        if (!sess || !sess.ulid) return new Response("Denied", { status: 403, headers: noStoreHeaders });
        const exp = new Date(String(sess.expiresAt || ""));
        if (Number.isNaN(exp.getTime()) || exp.getTime() <= Date.now()) {
          return new Response("Denied", { status: 401, headers: noStoreHeaders });
        }
        const maxAge = Math.max(0, Math.floor((exp.getTime() - Date.now()) / 1e3));
        const cookie = cookieSerialize("op_sess", sid, {
          Path: "/",
          HttpOnly: true,
          Secure: true,
          SameSite: "Lax",
          "Max-Age": maxAge
        });
        return new Response(null, {
          status: 302,
          headers: {
            "Set-Cookie": cookie,
            "Location": next,
            ...noStoreHeaders
          }
        });
      }
      if (normPath === "/api/location/google-import/autocomplete" && req.method === "POST") {
        return await handleGoogleImportAutocomplete(req, env);
      }
      if (normPath === "/api/location/draft" && req.method === "POST") {
        return await handleLocationDraft(req, env);
      }
      if (normPath === "/api/location/draft" && req.method === "DELETE") {
        return await handleLocationDraftDelete(req, env);
      }
      if (normPath === "/api/location/hydrate" && req.method === "POST") {
        return await handleLocationHydrate(req, env);
      }
      if (normPath === "/api/location/publish" && req.method === "POST") {
        return await handleLocationPublish(req, env);
      }
      if (normPath === "/api/stripe/webhook" && req.method === "POST") {
        return await handleStripeWebhook(req, env);
      }
      if (pathname === "/api/qr" && req.method === "GET") {
        return await handleQr(req, env);
      }
      if (pathname === "/api/campaign-summary" && req.method === "GET") {
        const u = new URL(req.url);
        const locationRaw = (u.searchParams.get("locationID") || "").trim();
        const campaignKeyRaw = (u.searchParams.get("campaignKey") || "").trim();
        if (!locationRaw || !campaignKeyRaw) {
          return json(
            { error: { code: "invalid_request", message: "locationID and campaignKey required" } },
            400,
            { "cache-control": "no-store" }
          );
        }
        const locULID = await resolveUid(locationRaw, env) || locationRaw;
        if (!locULID) {
          return json(
            { error: { code: "invalid_request", message: "unknown location" } },
            400,
            { "cache-control": "no-store" }
          );
        }
        const plan = await readPlanEntitlementForUlid(env, locULID);
        if (!plan.planEntitled) {
          return json(
            { error: { code: "plan_required", message: "Active Plan required to Run a Campaign with Promo QR." } },
            403,
            { "cache-control": "no-store" }
          );
        }
        const rawRows = await env.KV_STATUS.get(campaignsByUlidKey(locULID), { type: "json" });
        const rows = Array.isArray(rawRows) ? rawRows : [];
        const nowMs = Date.now();
        const row = rows.find((r) => {
          if (!r) return false;
          if (String(r?.locationID || "").trim() !== locULID) return false;
          if (String(r?.campaignKey || "").trim() !== campaignKeyRaw) return false;
          const st = String(r?.statusOverride || r?.status || "").trim().toLowerCase();
          if (st !== "active") return false;
          const sMs = parseYmdUtcMs(String(r?.startDate || ""));
          const eMs = parseYmdUtcMs(String(r?.endDate || ""));
          if (!Number.isFinite(sMs) || !Number.isFinite(eMs)) return false;
          if (nowMs < sMs) return false;
          if (nowMs > eMs + 24 * 60 * 60 * 1e3 - 1) return false;
          return true;
        });
        if (!row) {
          return json(
            { error: { code: "forbidden", message: "campaign not active" } },
            403,
            { "cache-control": "no-store" }
          );
        }
        const item = await getItemById(locULID, env).catch(() => null);
        const locationName = pickName(item?.locationName) || "";
        const dvRaw = row?.campaignDiscountValue != null ? row.campaignDiscountValue : null;
        const discountValue = typeof dvRaw === "number" ? dvRaw : typeof dvRaw === "string" && dvRaw.trim() && Number.isFinite(Number(dvRaw)) ? Number(dvRaw) : null;
        return json(
          {
            locationID: locationRaw,
            locationULID: locULID,
            locationName,
            campaignKey: String(row?.campaignKey || "").trim(),
            campaignName: String(row?.campaignName || "").trim(),
            offerType: String(row?.offerType || "").trim(),
            productName: String(row?.productName || "").trim(),
            startDate: String(row?.startDate || "").trim(),
            endDate: String(row?.endDate || "").trim(),
            eligibilityType: String(row?.eligibilityType || "").trim(),
            eligibilityNotes: String(row?.eligibilityNotes || "").trim(),
            discountKind: String(row?.discountKind || "").trim(),
            discountValue
          },
          200,
          { "cache-control": "no-store" }
        );
      }
      if (pathname === "/api/promo-qr" && req.method === "GET") {
        const u = new URL(req.url);
        const locationRaw = (u.searchParams.get("locationID") || "").trim();
        const campaignKeyRaw = (u.searchParams.get("campaignKey") || "").trim();
        if (!locationRaw) {
          return json(
            { error: { code: "invalid_request", message: "locationID required" } },
            400
          );
        }
        const locULID = await resolveUid(locationRaw, env) || locationRaw;
        if (!locULID) {
          return json(
            { error: { code: "invalid_request", message: "unknown location" } },
            400
          );
        }
        const plan = await readPlanEntitlementForUlid(env, locULID);
        if (!plan.planEntitled) {
          return json(
            { error: { code: "plan_required", message: "Active Plan required to Run a Campaign with Promo QR." } },
            403,
            { "cache-control": "no-store" }
          );
        }
        const siteOrigin = req.headers.get("Origin") || "https://navigen.io";
        const requestedKey = String(campaignKeyRaw || "").trim();
        const rawRows = await env.KV_STATUS.get(campaignsByUlidKey(locULID), { type: "json" });
        const rows = Array.isArray(rawRows) ? rawRows : [];
        const nowMs = Date.now();
        const isActiveRow = /* @__PURE__ */ __name((r) => {
          if (!r) return false;
          if (String(r?.locationID || "").trim() !== locULID) return false;
          const st = String(r?.statusOverride || r?.status || "").trim().toLowerCase();
          if (st !== "active") return false;
          const sMs = parseYmdUtcMs(String(r?.startDate || ""));
          const eMs = parseYmdUtcMs(String(r?.endDate || ""));
          if (!Number.isFinite(sMs) || !Number.isFinite(eMs)) return false;
          if (nowMs < sMs) return false;
          if (nowMs > eMs + 24 * 60 * 60 * 1e3 - 1) return false;
          return true;
        }, "isActiveRow");
        const actives = rows.filter(isActiveRow);
        if (!actives.length) {
          return json({ error: { code: "forbidden", message: "campaign required" } }, 403);
        }
        if (requestedKey) {
          const hit = actives.find((r) => String(r?.campaignKey || "").trim() === requestedKey);
          if (!hit) {
            return json({ error: { code: "forbidden", message: "campaign not active" } }, 403);
          }
          var activeRow = hit;
        } else {
          if (actives.length !== 1) {
            const items = actives.map((r) => {
              const dvRaw2 = r?.campaignDiscountValue != null ? r.campaignDiscountValue : null;
              const discountValue2 = typeof dvRaw2 === "number" ? dvRaw2 : typeof dvRaw2 === "string" && dvRaw2.trim() && Number.isFinite(Number(dvRaw2)) ? Number(dvRaw2) : null;
              return {
                campaignKey: String(r?.campaignKey || "").trim(),
                campaignName: String(r?.campaignName || "").trim(),
                productName: String(r?.productName || "").trim(),
                startDate: String(r?.startDate || "").trim(),
                endDate: String(r?.endDate || "").trim(),
                eligibilityType: String(r?.eligibilityType || "").trim(),
                eligibilityNotes: String(r?.eligibilityNotes || "").trim(),
                discountKind: String(r?.discountKind || "").trim(),
                discountValue: discountValue2
              };
            });
            return json({ error: { code: "multiple_active", message: "multiple active campaigns" }, items }, 409, { "cache-control": "no-store" });
          }
          var activeRow = actives[0];
        }
        if (!activeRow) {
          return json(
            { error: { code: "forbidden", message: "campaign required" } },
            403
          );
        }
        if (normCampaignPreset(activeRow?.campaignPreset) === "visibility") {
          return json(
            { error: { code: "campaign_preset_visibility", message: "Promotion is turned off for this campaign." } },
            403,
            { "cache-control": "no-store" }
          );
        }
        const chosenKey = String(activeRow.campaignKey || "").trim();
        if (!chosenKey) {
          return json(
            { error: { code: "forbidden", message: "campaign required" } },
            403
          );
        }
        const token = await createRedeemToken(env.KV_STATS, locULID, chosenKey);
        await logQrArmed(env.KV_STATS, env, locULID, req, chosenKey);
        const qrBase = "https://navigen-api.4naama.workers.dev";
        const qrUrlObj = new URL(`/out/qr-redeem/${encodeURIComponent(locationRaw)}`, qrBase);
        qrUrlObj.searchParams.set("camp", chosenKey);
        qrUrlObj.searchParams.set("rt", token);
        const dvRaw = activeRow.campaignDiscountValue != null ? activeRow.campaignDiscountValue : null;
        const discountValue = typeof dvRaw === "number" ? dvRaw : typeof dvRaw === "string" && dvRaw.trim() && Number.isFinite(Number(dvRaw)) ? Number(dvRaw) : null;
        return json({
          qrUrl: qrUrlObj.toString(),
          campaignName: String(activeRow.campaignName || "").trim(),
          offerType: String(activeRow.offerType || "").trim(),
          productName: String(activeRow.productName || "").trim(),
          startDate: String(activeRow.startDate || "").trim(),
          endDate: String(activeRow.endDate || "").trim(),
          eligibilityType: String(activeRow.eligibilityType || "").trim(),
          eligibilityNotes: String(activeRow.eligibilityNotes || "").trim(),
          discountKind: String(activeRow.discountKind || "").trim(),
          discountValue
        }, 200);
      }
      if (pathname === "/api/admin/purge-legacy" && req.method === "POST") {
        const auth = req.headers.get("Authorization") || "";
        if (!auth.startsWith("Bearer ")) {
          return json({ error: { code: "unauthorized", message: "Bearer token required" } }, 401);
        }
        const token = auth.slice(7).trim();
        const expected = String(env.JWT_SECRET || "").trim();
        if (!expected) {
          return json({ error: { code: "misconfigured", message: "JWT_SECRET not set in runtime env" } }, 500, { "cache-control": "no-store" });
        }
        if (!token || token.trim() !== expected) {
          return json({ error: { code: "forbidden", message: "Bad token" } }, 403, { "cache-control": "no-store" });
        }
        const body = await req.json().catch(() => ({}));
        const mode = (body?.mode || "merge").toString();
        let cursor = void 0;
        let migrated = 0, removed = 0;
        do {
          const page = await env.KV_STATS.list({ prefix: "stats:", cursor });
          for (const k of page.keys) {
            const name = k.name;
            const parts = name.split(":");
            if (parts.length !== 4) continue;
            const ev = parts[3];
            if (!ev.includes("_")) continue;
            if (mode === "merge") {
              const n = parseInt(await env.KV_STATS.get(name) || "0", 10) || 0;
              if (!n) {
                await env.KV_STATS.delete(name);
                removed++;
                continue;
              }
              const hyphen = ev.replaceAll("_", "-");
              const target = `stats:${parts[1]}:${parts[2]}:${hyphen}`;
              const cur = parseInt(await env.KV_STATS.get(target) || "0", 10) || 0;
              await env.KV_STATS.put(target, String(cur + n), { expirationTtl: 60 * 60 * 24 * 366 });
              migrated++;
            }
            await env.KV_STATS.delete(name);
            removed++;
          }
          cursor = page.cursor || void 0;
        } while (cursor);
        return json({ ok: true, mode, migrated, removed }, 200);
      }
      if (pathname === "/api/admin/backfill-slug-stats" && req.method === "POST") {
        const auth = req.headers.get("Authorization") || "";
        if (!auth.startsWith("Bearer ")) {
          return json({ error: { code: "unauthorized", message: "Bearer token required" } }, 401);
        }
        const token = auth.slice(7).trim();
        const expected = String(env.JWT_SECRET || "").trim();
        if (!expected) {
          return json({ error: { code: "misconfigured", message: "JWT_SECRET not set in runtime env" } }, 500, { "cache-control": "no-store" });
        }
        if (!token || token.trim() !== expected) {
          return json({ error: { code: "forbidden", message: "Bad token" } }, 403, { "cache-control": "no-store" });
        }
        let cursor = void 0;
        let moved = 0, removed = 0, skipped = 0;
        do {
          const page = await env.KV_STATS.list({ prefix: "stats:", cursor });
          for (const k of page.keys) {
            const parts = k.name.split(":");
            if (parts.length !== 4) continue;
            const id = parts[1];
            const day = parts[2];
            const ev = parts[3];
            if (/^[0-9A-HJKMNP-TV-Z]{26}$/.test(id)) {
              skipped++;
              continue;
            }
            const mapped = await env.KV_ALIASES.get(aliasKey(id), "json");
            const ulid = (typeof mapped === "string" ? mapped : mapped?.locationID) || "";
            if (!ulid || !/^[0-9A-HJKMNP-TV-Z]{26}$/.test(ulid)) {
              skipped++;
              continue;
            }
            const srcVal = parseInt(await env.KV_STATS.get(k.name) || "0", 10) || 0;
            if (!srcVal) {
              await env.KV_STATS.delete(k.name);
              removed++;
              continue;
            }
            const dstKey = `stats:${ulid}:${day}:${ev.replaceAll("_", "-")}`;
            const cur = parseInt(await env.KV_STATS.get(dstKey) || "0", 10) || 0;
            await env.KV_STATS.put(dstKey, String(cur + srcVal), { expirationTtl: 60 * 60 * 24 * 366 });
            await env.KV_STATS.delete(k.name);
            moved++;
          }
          cursor = page.cursor || void 0;
        } while (cursor);
        return json({ ok: true, moved, removed, skipped }, 200);
      }
      if (pathname === "/api/admin/seed-alias-ulids" && req.method === "POST") {
        const auth = req.headers.get("Authorization") || "";
        if (!auth.startsWith("Bearer ")) {
          return json({ error: { code: "unauthorized", message: "Bearer token required" } }, 401);
        }
        const token = auth.slice(7).trim();
        const expected = String(env.JWT_SECRET || "").trim();
        if (!expected) {
          return json({ error: { code: "misconfigured", message: "JWT_SECRET not set in runtime env" } }, 500, { "cache-control": "no-store" });
        }
        if (!token || token.trim() !== expected) {
          return json({ error: { code: "forbidden", message: "Bad token" } }, 403, { "cache-control": "no-store" });
        }
        const base = req.headers.get("Origin") || "https://navigen.io";
        const src = new URL("/data/profiles.json", base).toString();
        const resp = await fetch(src, { cf: { cacheTtl: 60, cacheEverything: true }, headers: { "Accept": "application/json" } });
        if (!resp.ok) return json({ error: { code: "upstream", message: "profiles.json not reachable" } }, 502);
        const data = await resp.json();
        const list = Array.isArray(data?.locations) ? data.locations : data?.locations && typeof data.locations === "object" ? Object.values(data.locations) : [];
        const aliases = list.map((x) => String(x?.locationID || "").trim()).filter((id) => id && !/^[0-9A-HJKMNP-TV-Z]{26}$/.test(id));
        const B32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
        const toBase32 = /* @__PURE__ */ __name((bytes) => {
          let bits = 0, val = 0, out = "";
          for (const b of bytes) {
            val = val << 8 | b;
            bits += 8;
            while (bits >= 5) {
              bits -= 5;
              out += B32[val >>> bits & 31];
              val &= (1 << bits) - 1;
            }
          }
          if (bits > 0) out += B32[val << 5 - bits & 31];
          return out;
        }, "toBase32");
        const deterministicUlid = /* @__PURE__ */ __name(async (alias) => {
          const t = new Uint8Array(8);
          new DataView(t.buffer).setBigUint64(0, 1735689600000n);
          const time48 = t.slice(2);
          const enc = new TextEncoder().encode(alias);
          const hashBuf = await crypto.subtle.digest("SHA-256", enc);
          const h = new Uint8Array(hashBuf).slice(0, 10);
          const bytes = new Uint8Array(16);
          bytes.set(time48, 0);
          bytes.set(h, 6);
          let b32 = toBase32(bytes);
          if (b32.length < 26) b32 = b32.padEnd(26, "0");
          if (b32.length > 26) b32 = b32.slice(0, 26);
          return b32;
        }, "deterministicUlid");
        let wrote = 0, skipped = 0;
        for (const alias of aliases) {
          try {
            const ulid = await deterministicUlid(alias);
            await env.KV_ALIASES.put(`alias:${alias}`, JSON.stringify({ locationID: ulid }));
            wrote++;
          } catch {
            skipped++;
          }
        }
        return json({ ok: true, wrote, skipped, total: aliases.length }, 200);
      }
      if (pathname === "/api/admin/ownership" && req.method === "GET") {
        const auth = req.headers.get("Authorization") || "";
        if (!auth.startsWith("Bearer ")) {
          return json({ error: { code: "unauthorized", message: "Bearer token required" } }, 401, { "cache-control": "no-store" });
        }
        const token = auth.slice(7).trim();
        const expected = String(env.JWT_SECRET || "").trim();
        if (!expected) {
          return json({ error: { code: "misconfigured", message: "JWT_SECRET not set in runtime env" } }, 500, { "cache-control": "no-store" });
        }
        if (!token || token !== expected) {
          return json({ error: { code: "forbidden", message: "Bad token" } }, 403, { "cache-control": "no-store" });
        }
        const u = new URL(req.url);
        const idRaw = String(u.searchParams.get("locationID") || "").trim();
        if (!idRaw) {
          return json({ error: { code: "invalid_request", message: "locationID required" } }, 400, { "cache-control": "no-store" });
        }
        const ulid = ULID_RE.test(idRaw) ? idRaw : await resolveUid(idRaw, env) || "";
        if (!ulid) {
          return json({ error: { code: "invalid_request", message: "unknown locationID" } }, 404, { "cache-control": "no-store" });
        }
        const ownKey = `ownership:${ulid}`;
        const rec = await env.KV_STATUS.get(ownKey, { type: "json" });
        const exclusiveUntilIso = String(rec?.exclusiveUntil || "").trim();
        const exclusiveUntil = exclusiveUntilIso ? new Date(exclusiveUntilIso) : null;
        const ownedNow = !!exclusiveUntil && !Number.isNaN(exclusiveUntil.getTime()) && exclusiveUntil.getTime() > Date.now();
        return json({
          ulid,
          key: ownKey,
          ownedNow,
          exclusiveUntil: exclusiveUntilIso || "",
          source: String(rec?.source || "").trim(),
          lastEventId: String(rec?.lastEventId || "").trim(),
          updatedAt: String(rec?.updatedAt || "").trim(),
          state: String(rec?.state || "").trim(),
          uid: String(rec?.uid || "").trim(),
          raw: rec || null
        }, 200, { "cache-control": "no-store" });
      }
      if (pathname === "/api/admin/seed-campaigns" && req.method === "POST") {
        const auth = req.headers.get("Authorization") || "";
        if (!auth.startsWith("Bearer ")) {
          return json({ error: { code: "unauthorized", message: "Bearer token required" } }, 401);
        }
        const token = auth.slice(7).trim();
        const expected = String(env.JWT_SECRET || "").trim();
        if (!expected) {
          return json({ error: { code: "misconfigured", message: "JWT_SECRET not set in runtime env" } }, 500, { "cache-control": "no-store" });
        }
        if (!token || token.trim() !== expected) {
          return json({ error: { code: "forbidden", message: "Bad token" } }, 403, { "cache-control": "no-store" });
        }
        const body = await req.json().catch(() => null);
        const rowsRaw = Array.isArray(body) ? body : Array.isArray(body?.rows) ? body.rows : Array.isArray(body?.campaigns) ? body.campaigns : [];
        if (!Array.isArray(rowsRaw) || !rowsRaw.length) {
          return json({ error: { code: "invalid_request", message: "rows[] required" } }, 400);
        }
        const byUlid = /* @__PURE__ */ new Map();
        let total = 0, wrote = 0, skipped = 0, unresolved = 0;
        for (const r of rowsRaw) {
          total++;
          try {
            const locIn = String(r?.locationID || "").trim();
            if (!locIn) {
              skipped++;
              continue;
            }
            const locResolved = ULID_RE.test(locIn) ? locIn : await resolveUid(locIn, env) || "";
            if (!locResolved || !ULID_RE.test(locResolved)) {
              unresolved++;
              continue;
            }
            const ulid = locResolved;
            const normYmd = /* @__PURE__ */ __name((v) => {
              const s = String(v || "").trim();
              if (!s) return "";
              if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
              const d = new Date(s);
              if (Number.isNaN(d.getTime())) return "";
              d.setHours(d.getHours() + 12);
              return d.toISOString().slice(0, 10);
            }, "normYmd");
            const startDate = normYmd(r?.startDate);
            const endDate = normYmd(r?.endDate);
            if (!startDate || !endDate) {
              skipped++;
              continue;
            }
            const row = {
              locationID: ulid,
              // canonical ULID (existing contract)
              locationULID: ulid,
              locationSlug: locIn,
              // original input (slug) from campaigns.json
              campaignKey: String(r?.campaignKey || "").trim(),
              campaignName: typeof r?.campaignName === "string" ? r.campaignName : void 0,
              sectorKey: typeof r?.sectorKey === "string" ? r.sectorKey : void 0,
              brandKey: typeof r?.brandKey === "string" ? r.brandKey : void 0,
              context: typeof r?.context === "string" ? r.context : void 0,
              startDate,
              endDate,
              status: String(r?.status || "").trim() || "Draft",
              statusOverride: r?.statusOverride != null ? String(r.statusOverride).trim() : void 0,
              campaignType: r?.campaignType != null ? String(r.campaignType).trim() : void 0,
              targetChannels: r?.targetChannels,
              offerType: r?.offerType != null ? String(r.offerType).trim() : void 0,
              productName: r?.productName != null ? String(r.productName).trim() : void 0,
              discountKind: r?.discountKind != null ? String(r.discountKind).trim() : void 0,
              campaignDiscountValue: r?.campaignDiscountValue != null ? r.campaignDiscountValue : void 0,
              eligibilityType: r?.eligibilityType != null ? String(r.eligibilityType).trim() : void 0,
              eligibilityNotes: r?.eligibilityNotes != null ? String(r.eligibilityNotes).trim() : void 0,
              utmSource: r?.utmSource != null ? String(r.utmSource).trim() : void 0,
              utmMedium: r?.utmMedium != null ? String(r.utmMedium).trim() : void 0,
              utmCampaign: r?.utmCampaign != null ? String(r.utmCampaign).trim() : void 0,
              notes: r?.notes != null ? String(r.notes).trim() : void 0
            };
            if (!row.campaignKey) {
              skipped++;
              continue;
            }
            const arr = byUlid.get(ulid) || [];
            arr.push(row);
            byUlid.set(ulid, arr);
          } catch {
            skipped++;
          }
        }
        for (const [ulid, arr] of byUlid.entries()) {
          try {
            await env.KV_STATUS.put(campaignsByUlidKey(ulid), JSON.stringify(arr));
            wrote++;
          } catch {
          }
        }
        return json({ ok: true, total, wrote, skipped, unresolved }, 200);
      }
      if (url.pathname === "/api/stats" && req.method === "GET") {
        let auth = null;
        const locRaw = (url.searchParams.get("locationID") || "").trim();
        const locResolved = await resolveUid(locRaw, env) || locRaw;
        const loc = String(locResolved || "").trim();
        let isExample = false;
        try {
          const base = req.headers.get("Origin") || "https://navigen.io";
          const src = new URL("/data/profiles.json", base).toString();
          const resp = await fetch(src, { cf: { cacheTtl: 60, cacheEverything: true }, headers: { "Accept": "application/json" } });
          if (resp.ok) {
            const data = await resp.json().catch(() => null);
            const locs = Array.isArray(data?.locations) ? data.locations : data?.locations && typeof data.locations === "object" ? Object.values(data.locations) : [];
            const rec = locs.find((r) => String(r?.locationID || "").trim() === locRaw || String(r?.ID || r?.id || "").trim() === locRaw || String(r?.ID || r?.id || "").trim() === loc);
            const v = rec?.exampleLocation ?? rec?.isExample ?? rec?.example ?? rec?.exampleDash ?? rec?.flags?.example;
            isExample = v === true || v === 1 || String(v || "").toLowerCase() === "true" || String(v || "").toLowerCase() === "yes";
          }
        } catch {
          isExample = false;
        }
        if (!isExample) {
          const a = await requireOwnerSession(req, env);
          if (a instanceof Response) return a;
          auth = a;
        }
        if (auth instanceof Response) return auth;
        if (!loc || !/^[0-9A-HJKMNP-TV-Z]{26}$/i.test(loc)) {
          return json({ error: { code: "invalid_request", message: "locationID, from, to required (YYYY-MM-DD)" } }, 400);
        }
        if (auth && loc !== auth.ulid) {
          return new Response("Denied", {
            status: 403,
            headers: { "cache-control": "no-store", "Referrer-Policy": "no-referrer" }
          });
        }
        if (!isExample) {
          const plan = await readPlanEntitlementForUlid(env, loc);
          if (!plan.planEntitled) {
            return new Response("Plan required", {
              status: 403,
              headers: { "cache-control": "no-store", "Referrer-Policy": "no-referrer" }
            });
          }
        }
        const from = (url.searchParams.get("from") || "").trim();
        const to = (url.searchParams.get("to") || "").trim();
        const tz = (url.searchParams.get("tz") || "").trim() || void 0;
        if (!loc || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
          return json({ error: { code: "invalid_request", message: "locationID, from, to required (YYYY-MM-DD)" } }, 400);
        }
        const prefix = `stats:${loc}:`;
        const days = {};
        let cursor = void 0;
        let ratedSum = 0;
        let ratingScoreSum = 0;
        const allowed = new Set(EVENT_ORDER);
        do {
          const page = await env.KV_STATS.list({ prefix, cursor });
          for (const k of page.keys) {
            const name = k.name;
            const parts = name.split(":");
            if (parts.length !== 4) continue;
            const day = parts[2];
            if (day < from || day > to) continue;
            const rawEv = parts[3].replaceAll("_", "-");
            if (rawEv === "rating-score") {
              const sv = parseInt(await env.KV_STATS.get(name) || "0", 10) || 0;
              ratingScoreSum += sv;
              continue;
            }
            if (!allowed.has(rawEv)) continue;
            const ev = rawEv;
            const n = parseInt(await env.KV_STATS.get(name) || "0", 10) || 0;
            if (!days[day]) days[day] = {};
            days[day][ev] = (days[day][ev] || 0) + n;
            if (ev === "rating") ratedSum += n;
          }
          cursor = page.cursor || void 0;
        } while (cursor);
        const ratingAvg = ratedSum > 0 ? ratingScoreSum / ratedSum : 0;
        const siteOrigin = req.headers.get("Origin") || "https://navigen.io";
        const qrInfo = [];
        const campaignsAgg = {};
        const allCampaigns = await env.KV_STATUS.get(campaignsByUlidKey(loc), { type: "json" });
        const allCampaignRows = Array.isArray(allCampaigns) ? allCampaigns : [];
        const qrPrefix = `qrlog:${loc}:`;
        let qrCursor = void 0;
        do {
          const page = await env.KV_STATS.list({ prefix: qrPrefix, cursor: qrCursor });
          for (const k of page.keys) {
            const name = k.name;
            const parts = name.split(":");
            if (parts.length !== 4) continue;
            const dayKey = parts[2];
            if (dayKey < from || dayKey > to) continue;
            const raw = await env.KV_STATS.get(name, "text");
            if (!raw) continue;
            let entry = null;
            try {
              entry = JSON.parse(raw);
            } catch {
              entry = null;
            }
            if (!entry || entry.locationID !== loc) continue;
            const scanId = parts[3];
            qrInfo.push({
              time: entry.time,
              source: entry.source || "",
              // Location: use physical scanner country code (CF country), not the location ULID
              location: entry.city ? `${entry.city}, ${entry.country || ""}`.trim().replace(/,\s*$/, "") : entry.country || "",
              // Device/Browser: keep UA here; frontend will bucketize into Device + Browser
              device: entry.ua || "",
              browser: entry.ua || "",
              lang: entry.lang || "",
              scanId,
              visitor: entry.visitor || "",
              campaign: entry.campaignKey || "",
              signal: entry.signal || "scan"
            });
            const cKey = entry.campaignKey || "";
            const bucketKey = cKey || "_no_campaign";
            if (!campaignsAgg[bucketKey]) {
              campaignsAgg[bucketKey] = {
                campaignKey: cKey,
                scans: 0,
                redemptions: 0,
                invalids: 0,
                armed: 0,
                // promo QR shown counter
                uniqueVisitors: /* @__PURE__ */ new Set(),
                repeatVisitors: /* @__PURE__ */ new Set(),
                uniqueRedeemers: /* @__PURE__ */ new Set(),
                repeatRedeemers: /* @__PURE__ */ new Set(),
                langs: /* @__PURE__ */ new Set(),
                countries: /* @__PURE__ */ new Set()
              };
            }
            const agg = campaignsAgg[bucketKey];
            if (entry.signal === "scan") {
              agg.scans += 1;
            }
            if (entry.signal === "redeem") {
              agg.redemptions += 1;
            }
            if (entry.signal === "invalid") {
              agg.invalids += 1;
            }
            if (entry.signal === "armed") {
              agg.armed += 1;
            }
            const visitorKey = entry.visitor && entry.visitor.trim() ? entry.visitor.trim() : `${entry.ua || ""}|${entry.country || ""}`;
            if (visitorKey) {
              if (agg.uniqueVisitors.has(visitorKey)) {
                agg.repeatVisitors.add(visitorKey);
              } else {
                agg.uniqueVisitors.add(visitorKey);
              }
              if (entry.signal === "redeem") {
                if (agg.uniqueRedeemers.has(visitorKey)) {
                  agg.repeatRedeemers.add(visitorKey);
                } else {
                  agg.uniqueRedeemers.add(visitorKey);
                }
              }
            }
            if (entry.lang) {
              const primaryLang = String(entry.lang).split(",")[0].trim();
              if (primaryLang) agg.langs.add(primaryLang);
            }
            if (entry.country) {
              agg.countries.add(entry.country);
            }
          }
          qrCursor = page.cursor || void 0;
        } while (qrCursor);
        qrInfo.sort((a, b) => {
          const ta = String(a.time || "");
          const tb = String(b.time || "");
          if (ta < tb) return 1;
          if (ta > tb) return -1;
          return 0;
        });
        const campaignAggValues = Object.values(campaignsAgg);
        let totalArmed = 0;
        let totalRedeems = 0;
        let totalInvalid = 0;
        for (const agg of campaignAggValues) {
          if ((agg.campaignKey || "").trim() === "") continue;
          totalArmed += agg.armed;
          totalRedeems += agg.redemptions;
          totalInvalid += agg.invalids;
        }
        const campaigns = campaignAggValues.filter((agg) => (agg.campaignKey || "").trim() !== "").map((agg) => {
          const key = agg.campaignKey;
          const meta = allCampaignRows.find((c) => String(c.locationID || "").trim() === loc && String(c.campaignKey || "").trim() === key) || null;
          const uniqueCount = agg.uniqueVisitors.size;
          const repeatCount = agg.repeatVisitors.size;
          const uniqueRedeemerCount = agg.uniqueRedeemers.size;
          const repeatRedeemerCount = agg.repeatRedeemers.size;
          const campaignStart = meta ? String(meta.startDate || "").trim() : "";
          const campaignEnd = meta ? String(meta.endDate || "").trim() : "";
          const periodLabel = campaignStart && campaignEnd ? `${campaignStart} \u2192 ${campaignEnd}` : `${from} \u2192 ${to}`;
          return {
            // Campaign ID + Name + Brand for dashboard
            campaign: key || "",
            campaignName: meta ? String(meta.campaignName || "").trim() : "",
            brand: meta ? String(meta.brandKey || "").trim() : "",
            target: meta ? String(meta.context || "").trim() : "",
            period: periodLabel,
            armed: agg.armed,
            // Promo QR shown (ARMED)
            scans: agg.scans,
            redemptions: agg.redemptions,
            invalids: agg.invalids,
            uniqueVisitors: uniqueCount,
            repeatVisitors: repeatCount,
            uniqueRedeemers: uniqueRedeemerCount,
            repeatRedeemers: repeatRedeemerCount,
            locations: agg.countries.size
          };
        });
        try {
          const hasPromoActivity = totalArmed > 0 || totalRedeems > 0 || totalInvalid > 0;
          if (hasPromoActivity) {
            let cashierConfs = 0;
            let customerConfs = 0;
            for (const dayKey of Object.keys(days)) {
              const bucket = days[dayKey] || {};
              const cashierVal = Number(bucket["redeem-confirmation-cashier"] ?? bucket["redeem_confirmation_cashier"] ?? 0);
              const customerVal = Number(bucket["redeem-confirmation-customer"] ?? bucket["redeem_confirmation_customer"] ?? 0);
              if (cashierVal) cashierConfs += cashierVal;
              if (customerVal) customerConfs += customerVal;
            }
            const totalRedeemAttempts = totalRedeems + totalInvalid;
            const complianceRatio = totalArmed > 0 ? totalRedeems / totalArmed : null;
            const invalidRatio = totalRedeemAttempts > 0 ? totalInvalid / totalRedeemAttempts : 0;
            const cashierCoverage = totalRedeems > 0 ? cashierConfs / totalRedeems : null;
            const customerCoverage = totalArmed > 0 ? customerConfs / totalArmed : null;
            const flags = [];
            if (complianceRatio !== null && complianceRatio < 0.7) {
              flags.push("low-scan-discipline");
            }
            if (invalidRatio > 0.1 && totalInvalid >= 3) {
              flags.push("high-invalid-attempts");
            }
            if (cashierCoverage !== null && cashierCoverage < 0.8) {
              flags.push("low-cashier-coverage");
            }
            if (customerCoverage !== null && totalArmed >= 10 && customerCoverage < 0.5) {
              flags.push("low-customer-confirmation");
            }
            if (!flags.length) {
              flags.push("qa-ok");
            }
            ctx.waitUntil(writeQaFlags(env, loc, flags));
          }
        } catch {
        }
        return json(
          {
            locationID: loc,
            locationName: await nameForLocation(loc, siteOrigin),
            from,
            to,
            tz: tz || TZ_FALLBACK,
            order: EVENT_ORDER,
            days,
            rated_sum: ratedSum,
            rating_avg: ratingAvg,
            qrInfo,
            campaigns
          },
          200
        );
      }
      if (url.pathname === "/api/stats/entity" && req.method === "GET") {
        const auth = await requireOwnerSession(req, env);
        if (auth instanceof Response) return auth;
        const ent = (url.searchParams.get("entityID") || "").trim();
        const from = (url.searchParams.get("from") || "").trim();
        const to = (url.searchParams.get("to") || "").trim();
        const tz = (url.searchParams.get("tz") || "").trim() || void 0;
        if (!ent || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
          return json({ error: { code: "invalid_request", message: "entityID, from, to required (YYYY-MM-DD)" } }, 400);
        }
        const raw = await env.KV_STATUS.get(`entity:${ent}:locations`);
        const locs = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(locs) || !locs.includes(auth.ulid)) {
          return new Response("Denied", {
            status: 403,
            headers: { "cache-control": "no-store", "Referrer-Policy": "no-referrer" }
          });
        }
        const days = {};
        for (const loc of locs) {
          const prefix = `stats:${loc}:`;
          let cursor = void 0;
          do {
            const page = await env.KV_STATS.list({ prefix, cursor });
            for (const k of page.keys) {
              const parts = k.name.split(":");
              if (parts.length !== 4) continue;
              const day = parts[2];
              const ev = parts[3].replaceAll("_", "-");
              if (day < from || day > to) continue;
              const n = parseInt(await env.KV_STATS.get(k.name) || "0", 10) || 0;
              if (!days[day]) days[day] = {};
              days[day][ev] = (days[day][ev] || 0) + n;
            }
            cursor = page.cursor || void 0;
          } while (cursor);
        }
        return json({ entityID: ent, entityName: await nameForEntity(ent), from, to, tz: tz || TZ_FALLBACK, order: EVENT_ORDER, days }, 200);
      }
      if (pathname === "/api/track" && req.method === "POST") {
        return await handleTrack(req, env);
      }
      if (pathname === "/api/status" && req.method === "GET") {
        return await handleStatus(req, env);
      }
      if (pathname === "/api/redeem-status" && req.method === "GET") {
        const u = new URL(req.url);
        const token = (u.searchParams.get("token") || "").trim() || (u.searchParams.get("rt") || "").trim();
        if (!token) {
          return json(
            { error: { code: "invalid_request", message: "token required" } },
            400
          );
        }
        const key = `redeem:${token}`;
        const raw = await env.KV_STATS.get(key, "text");
        let status = "invalid";
        if (raw) {
          try {
            const rec = JSON.parse(raw);
            if (rec && rec.status === "fresh") status = "pending";
            else if (rec && rec.status === "redeemed") status = "redeemed";
            else status = "invalid";
          } catch {
            status = "invalid";
          }
        }
        return json({ token, status }, 200);
      }
      if (pathname.startsWith("/out/qr-redeem/") && req.method === "GET") {
        const parts = pathname.split("/").filter(Boolean);
        const idRaw = parts[2] || "";
        const loc = await resolveUid(idRaw, env);
        if (!loc) {
          return json({ error: { code: "invalid_request", message: "bad id" } }, 400);
        }
        const u = new URL(req.url);
        const token = (u.searchParams.get("rt") || "").trim() || (u.searchParams.get("token") || "").trim();
        const camp = (u.searchParams.get("camp") || "").trim();
        const landing = new URL("/", "https://navigen.io");
        landing.searchParams.set("lp", idRaw);
        landing.searchParams.set("redeem", "pending");
        if (camp) landing.searchParams.set("camp", camp);
        if (token) landing.searchParams.set("rt", token);
        return new Response(null, {
          status: 302,
          headers: {
            "Location": landing.toString(),
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            "CDN-Cache-Control": "no-store",
            "Pragma": "no-cache",
            "Expires": "0",
            "Referrer-Policy": "no-referrer",
            "X-NG-Redeem-Contract": "pending-v2",
            "X-NG-Redeem-Build": "2026-03-11-api-pending-v4",
            "Access-Control-Allow-Origin": "https://navigen.io",
            "Access-Control-Allow-Credentials": "true",
            "Vary": "Origin"
          }
        });
      }
      if (pathname.startsWith("/out/") && req.method === "GET") {
        const parts = pathname.split("/").filter(Boolean);
        const ev = (parts[1] || "").toLowerCase().replaceAll("_", "-");
        const idRaw = parts[2] || "";
        const to = new URL(req.url).searchParams.get("to") || "";
        const allowed = new Set(EVENT_ORDER);
        if (!allowed.has(ev)) {
          return json({ error: { code: "invalid_request", message: "unsupported event" } }, 400);
        }
        const loc = await resolveUid(idRaw, env);
        if (!loc) {
          return json({ error: { code: "invalid_request", message: "bad id" } }, 400);
        }
        if (!/^https:\/\/[^ ]+/i.test(to)) {
          return json({ error: { code: "invalid_request", message: "https to= required" } }, 400);
        }
        const method = req.method || "GET";
        const sfm = req.headers.get("Sec-Fetch-Mode") || "";
        const ua = req.headers.get("User-Agent") || "";
        const isHumanNav = method === "GET" && (!sfm || /navigate|same-origin/i.test(sfm)) && !/(bot|crawler|spider|facebookexternalhit|twitterbot|slackbot)/i.test(ua);
        if (isHumanNav) {
          try {
            const now = /* @__PURE__ */ new Date();
            const country = req.cf?.country || "";
            const day = dayKeyFor(now, void 0, country);
            await kvIncr(env.KV_STATS, `stats:${loc}:${day}:${ev}`);
          } catch {
          }
        }
        return new Response(null, {
          status: 302,
          headers: {
            "Location": to,
            "Cache-Control": "no-store",
            "Access-Control-Allow-Origin": "https://navigen.io",
            "Access-Control-Allow-Credentials": "true",
            "Vary": "Origin"
          }
        });
      }
      if (pathname.startsWith("/hit/") && req.method === "POST") {
        const parts = pathname.split("/").filter(Boolean);
        const ev = (parts[1] || "").toLowerCase().replaceAll("_", "-");
        const idRaw = parts[2] || "";
        const allowed = new Set(EVENT_ORDER);
        if (!allowed.has(ev)) {
          return json({ error: { code: "invalid_request", message: "unsupported event" } }, 400);
        }
        const loc = await resolveUid(idRaw, env);
        if (!loc) {
          return json({ error: { code: "invalid_request", message: "bad id" } }, 400);
        }
        const now = /* @__PURE__ */ new Date();
        const country = req.cf?.country || "";
        const day = dayKeyFor(now, void 0, country);
        if (ev === "rating") {
          const url2 = new URL(req.url);
          const scoreRaw = (url2.searchParams.get("score") || "").trim();
          const score = parseInt(scoreRaw, 10);
          if (!Number.isFinite(score) || score < 1 || score > 5) {
            return json(
              { error: { code: "invalid_request", message: "score must be 1-5" } },
              400,
              { "cache-control": "no-store", "Referrer-Policy": "no-referrer" }
            );
          }
          const deviceKey = readRatingDeviceKey(req);
          if (!deviceKey) {
            return json(
              { error: { code: "invalid_request", message: "rating device missing" } },
              400,
              { "cache-control": "no-store", "Referrer-Policy": "no-referrer" }
            );
          }
          const voteKey = ratingVoteKey(loc, deviceKey);
          const prev = await env.KV_STATUS.get(voteKey, { type: "json" });
          const prevScore = Number(prev?.score);
          const prevDay = String(prev?.day || "").trim();
          const prevVotedAtMs = Date.parse(String(prev?.votedAt || ""));
          const isLocked = Number.isFinite(prevScore) && prevScore >= 1 && prevScore <= 5 && Number.isFinite(prevVotedAtMs) && now.getTime() - prevVotedAtMs < RATING_WINDOW_MS;
          const summary = await readRatingSummary(env, loc);
          let nextCount = summary.count;
          let nextSum = summary.sum;
          let applied = "new";
          if (isLocked) {
            const delta = score - prevScore;
            if (delta !== 0) {
              if (prevDay && prevDay !== day) {
                await kvAdd(env.KV_STATS, `stats:${loc}:${prevDay}:rating`, -1);
                await kvAdd(env.KV_STATS, `stats:${loc}:${prevDay}:rating-score`, -prevScore);
                await kvAdd(env.KV_STATS, `stats:${loc}:${day}:rating`, 1);
                await kvAdd(env.KV_STATS, `stats:${loc}:${day}:rating-score`, score);
              } else {
                await kvAdd(env.KV_STATS, `stats:${loc}:${day}:rating-score`, delta);
              }
              nextSum = Math.max(0, nextSum + delta);
              applied = "updated";
            } else {
              applied = "noop";
            }
          } else {
            await kvIncr(env.KV_STATS, `stats:${loc}:${day}:${ev}`);
            await kvAdd(env.KV_STATS, `stats:${loc}:${day}:rating-score`, score);
            nextCount += 1;
            nextSum += score;
            applied = "new";
          }
          await env.KV_STATUS.put(
            ratingSummaryKey(loc),
            JSON.stringify({
              count: nextCount,
              sum: nextSum,
              updatedAt: now.toISOString()
            })
          );
          const lockedUntil = new Date(now.getTime() + RATING_WINDOW_MS).toISOString();
          await env.KV_STATUS.put(
            voteKey,
            JSON.stringify({
              score,
              day,
              votedAt: now.toISOString()
            }),
            { expirationTtl: 60 * 60 * 24 * 31 }
          );
          return json(
            {
              ok: true,
              locationID: loc,
              applied,
              ratingAvg: nextCount > 0 ? nextSum / nextCount : 0,
              ratedSum: nextCount,
              userScore: score,
              ratingLockedUntil: lockedUntil,
              ratingCooldownMinutes: 30
            },
            200,
            { "cache-control": "no-store", "Referrer-Policy": "no-referrer" }
          );
        }
        await kvIncr(env.KV_STATS, `stats:${loc}:${day}:${ev}`);
        if (ev === "qr-scan") {
          await logQrScan(env.KV_STATS, env, loc, req);
        }
        if (ev === "qr-redeem") {
          const u = new URL(req.url);
          const token = (req.headers.get("X-NG-QR-Token") || "").trim() || (u.searchParams.get("rt") || "").trim() || (u.searchParams.get("token") || "").trim();
          const wantsJson = (u.searchParams.get("json") || "").trim() === "1";
          const finish = /* @__PURE__ */ __name(async (outcome, campaignKey = "") => {
            if (outcome === "ok") {
              await logQrRedeem(env.KV_STATS, env, loc, req, campaignKey);
            } else {
              await logQrRedeemInvalid(env.KV_STATS, env, loc, req, campaignKey);
            }
            if (wantsJson) {
              return json(
                { ok: outcome === "ok", outcome, campaignKey },
                200,
                { "cache-control": "no-store", "Referrer-Policy": "no-referrer" }
              );
            }
            return new Response(null, {
              status: 204,
              headers: {
                "Access-Control-Allow-Origin": "https://navigen.io",
                "Access-Control-Allow-Credentials": "true",
                "Vary": "Origin"
              }
            });
          }, "finish");
          if (!token) {
            return await finish("invalid");
          }
          const recRaw = await env.KV_STATS.get(`redeem:${token}`, "text");
          let tokenCampaignKey = "";
          let tokenLocationID = "";
          let tokenStatus = "";
          try {
            const rec = recRaw ? JSON.parse(recRaw) : null;
            tokenCampaignKey = String(rec?.campaignKey || "").trim();
            tokenLocationID = String(rec?.locationID || "").trim();
            tokenStatus = String(rec?.status || "").trim();
          } catch {
            tokenCampaignKey = "";
            tokenLocationID = "";
            tokenStatus = "";
          }
          if (!tokenCampaignKey || !tokenLocationID || tokenLocationID !== loc) {
            return await finish("invalid", tokenCampaignKey);
          }
          const rawRows = await env.KV_STATUS.get(campaignsByUlidKey(loc), { type: "json" });
          const rows = Array.isArray(rawRows) ? rawRows : [];
          const nowMs = Date.now();
          const tokenCampaignIsActive = rows.some((r) => {
            if (!r || String(r.locationID || "").trim() !== loc) return false;
            const st = String(r?.statusOverride || r?.status || "").trim().toLowerCase();
            if (st !== "active") return false;
            const sMs = parseYmdUtcMs(String(r?.startDate || ""));
            const eMs = parseYmdUtcMs(String(r?.endDate || ""));
            if (!Number.isFinite(sMs) || !Number.isFinite(eMs)) return false;
            if (nowMs < sMs) return false;
            if (nowMs > eMs + 24 * 60 * 60 * 1e3 - 1) return false;
            return String(r?.campaignKey || "").trim() === tokenCampaignKey;
          });
          if (!tokenCampaignIsActive) {
            return await finish("inactive", tokenCampaignKey);
          }
          if (tokenStatus === "redeemed") {
            return await finish("used", tokenCampaignKey);
          }
          const result = await consumeRedeemToken(env.KV_STATS, token, loc, tokenCampaignKey);
          if (result === "ok") {
            return await finish("ok", tokenCampaignKey);
          }
          if (result === "used") {
            return await finish("used", tokenCampaignKey);
          }
          return await finish("invalid", tokenCampaignKey);
        }
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "https://navigen.io",
            "Access-Control-Allow-Credentials": "true",
            "Vary": "Origin"
          }
        });
      }
      if (normPath === "/api/stripe/create-checkout-session" && req.method === "POST") {
        const noStore = { "cache-control": "no-store" };
        const body = await req.json().catch(() => null);
        return await createCampaignCheckoutSession(env, req, body, noStore);
      }
      if (pathname === "/api/campaigns/active" && req.method === "GET") {
        const u = new URL(req.url);
        const ctx2 = String(u.searchParams.get("context") || "").trim().toLowerCase();
        const todayISO = (() => {
          const now = /* @__PURE__ */ new Date();
          return new Date(now.getTime() - now.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
        })();
        const isActiveRow = /* @__PURE__ */ __name((r) => {
          const st = String(r?.statusOverride || r?.status || "").trim().toLowerCase();
          if (st !== "active") return false;
          const sd = String(r?.startDate || "").trim();
          const ed = String(r?.endDate || "").trim();
          if (!/^\d{4}-\d{2}-\d{2}$/.test(sd) || !/^\d{4}-\d{2}-\d{2}$/.test(ed)) return false;
          return todayISO >= sd && todayISO <= ed;
        }, "isActiveRow");
        const matchesContext = /* @__PURE__ */ __name((r) => {
          if (!ctx2) return true;
          const raw = String(r?.context || "").trim().toLowerCase();
          if (!raw) return true;
          const arr = raw.split(";").map((s) => s.trim()).filter(Boolean);
          return arr.includes(ctx2);
        }, "matchesContext");
        const out = [];
        let cursor = void 0;
        for (let guard = 0; guard < 25; guard++) {
          const page = await env.KV_STATUS.list({ prefix: "campaigns:byUlid:", cursor });
          for (const k of page.keys || []) {
            const raw = await env.KV_STATUS.get(k.name, "text");
            if (!raw) continue;
            let rows = [];
            try {
              rows = JSON.parse(raw);
            } catch {
              rows = [];
            }
            if (!Array.isArray(rows)) continue;
            const actives = rows.filter((r) => isActiveRow(r) && matchesContext(r));
            for (const r of actives) {
              const locationULID = String(r?.locationULID || r?.locationID || "").trim();
              const locationSlug = String(r?.locationSlug || "").trim();
              const locationName = await nameForLocation(locationSlug, env) || "";
              const dvRaw = r?.campaignDiscountValue != null ? r.campaignDiscountValue : null;
              const discountValue = typeof dvRaw === "number" ? dvRaw : typeof dvRaw === "string" && dvRaw.trim() && Number.isFinite(Number(dvRaw)) ? Number(dvRaw) : null;
              out.push({
                campaignKey: String(r?.campaignKey || "").trim(),
                campaignName: String(r?.campaignName || "").trim(),
                locationID: locationSlug || locationULID,
                locationULID,
                locationSlug,
                locationName,
                context: String(r?.context || "").trim(),
                offerType: String(r?.offerType || "").trim(),
                productName: String(r?.productName || r?.offerType || "").trim(),
                eligibilityType: String(r?.eligibilityType || "").trim(),
                eligibilityNotes: String(r?.eligibilityNotes || "").trim(),
                discountKind: String(r?.discountKind || "").trim(),
                discountValue,
                startDate: String(r?.startDate || "").trim(),
                endDate: String(r?.endDate || "").trim(),
                status: String(r?.statusOverride || r?.status || "").trim()
              });
            }
          }
          cursor = page.cursor;
          if (!page.list_complete) break;
          if (!cursor) break;
        }
        return json({ items: out }, 200, { "cache-control": "no-store" });
      }
      if (normPath === "/api/data/list" && req.method === "GET") {
        const contextKey = String(url.searchParams.get("context") || "").trim().toLowerCase();
        const limitRaw = Number(url.searchParams.get("limit") || "99");
        const limit = Math.max(1, Math.min(250, Number.isFinite(limitRaw) ? Math.floor(limitRaw) : 99));
        const cursorStr = String(url.searchParams.get("cursor") || "").trim();
        const start = /^[0-9]+$/.test(cursorStr) ? Math.max(0, parseInt(cursorStr, 10)) : 0;
        if (!contextKey) {
          return json(
            { items: [], nextCursor: null, totalApprox: 0 },
            200,
            { "x-navigen-route": "/api/data/list", "Cache-Control": "no-store" }
          );
        }
        try {
          const contextUlids = await listContextShardUlids(env, contextKey);
          const ranked = [];
          for (let idx = 0; idx < contextUlids.length; idx++) {
            const ulid = contextUlids[idx];
            const rec = await readPublishedEffectiveProfileByUlid(ulid, env);
            if (!rec) continue;
            const vis = await computeVisibilityState(env, ulid);
            if (vis.visibilityState === "hidden") continue;
            const rank = vis.visibilityState === "promoted" ? 2 : vis.visibilityState === "visible" ? 1 : 0;
            ranked.push({
              payload: buildPublicListPayload(rec),
              rank,
              idx
            });
          }
          ranked.sort((a, b) => {
            if (b.rank !== a.rank) return b.rank - a.rank;
            return a.idx - b.idx;
          });
          const totalApprox = ranked.length;
          const items = ranked.slice(start, start + limit).map((x) => x.payload);
          const nextCursor = start + limit < totalApprox ? String(start + limit) : null;
          return json(
            { items, nextCursor, totalApprox },
            200,
            {
              "x-navigen-route": "/api/data/list",
              "x-ng-list-order": "promoted-visible-hidden-excluded",
              "Cache-Control": "no-store"
            }
          );
        } catch (e) {
          return json(
            {
              error: {
                code: "list_failed",
                message: String(e?.message || "context list failed")
              }
            },
            500,
            {
              "x-navigen-route": "/api/data/list",
              "Cache-Control": "no-store"
            }
          );
        }
      }
      if (normPath === "/api/data/profile" && req.method === "GET") {
        const raw = (url.searchParams.get("id") || "").trim();
        if (!raw) {
          return json(
            { error: { code: "invalid_request", message: "id required" } },
            400,
            { "x-navigen-route": "/api/data/profile" }
          );
        }
        const rec = await readPublishedEffectiveProfileByAnyId(raw, env);
        if (!rec) {
          return json(
            { error: { code: "not_found", message: "profile not found" } },
            404,
            { "x-navigen-route": "/api/data/profile" }
          );
        }
        return json(
          buildPublicProfilePayload(rec),
          200,
          { "x-navigen-route": "/api/data/profile", "Cache-Control": "no-store" }
        );
      }
      if (normPath === "/api/data/item" && req.method === "GET") {
        const idParam = (url.searchParams.get("id") || "").trim();
        if (!idParam) {
          return json(
            { error: { code: "invalid_request", message: "id required" } },
            400,
            { "x-navigen-route": "/api/data/item" }
          );
        }
        const rec = await readPublishedEffectiveProfileByAnyId(idParam, env);
        if (!rec) {
          return json(
            { error: { code: "not_found", message: "item not found" } },
            404,
            { "x-navigen-route": "/api/data/item" }
          );
        }
        return json(
          buildPublicItemPayload(rec),
          200,
          { "x-navigen-route": "/api/data/item", "Cache-Control": "no-store" }
        );
      }
      if (normPath === "/api/data/contact" && req.method === "GET") {
        const idParam = (url.searchParams.get("id") || url.searchParams.get("locationID") || "").trim();
        if (!idParam) {
          return json(
            { error: { code: "invalid_request", message: "id required" } },
            400,
            { "x-navigen-route": "/api/data/contact" }
          );
        }
        const rec = await readPublishedEffectiveProfileByAnyId(idParam, env);
        if (!rec) {
          return json(
            { error: { code: "not_found", message: "contact not found" } },
            404,
            { "x-navigen-route": "/api/data/contact" }
          );
        }
        return json(
          buildPublicContactPayload(rec),
          200,
          { "x-navigen-route": "/api/data/contact", "Cache-Control": "no-store" }
        );
      }
      return json(
        { error: { code: "not_found", message: "No such route", path: new URL(req.url).pathname } },
        404,
        { "x-navigen-route": new URL(req.url).pathname }
      );
    } catch (err) {
      return json({ error: { code: "server_error", message: err?.message || "Unexpected" } }, 500);
    }
  }
};
async function nameForLocation(id, env) {
  try {
    const mapped = await resolveUid(id, env) || String(id || "").trim();
    const ulid = ULID_RE.test(mapped) ? mapped : "";
    if (!ulid) return void 0;
    const base = await env.KV_STATUS.get(`profile_base:${ulid}`, { type: "json" });
    if (!base || typeof base !== "object") return void 0;
    const override = await env.KV_STATUS.get(`override:${ulid}`, { type: "json" }) || {};
    const effective = deepMergeProfile(base, override);
    const ln = effective?.locationName || effective?.name || effective?.listedName;
    const name = typeof ln === "string" ? ln.trim() : String(ln?.en || ln?.hu || Object.values(ln || {})[0] || "").trim();
    return name || void 0;
  } catch {
    return void 0;
  }
}
__name(nameForLocation, "nameForLocation");
async function nameForEntity(_id) {
  return void 0;
}
__name(nameForEntity, "nameForEntity");
async function readPublishedEffectiveProfileByAnyId(idOrAlias, env) {
  const raw = String(idOrAlias || "").trim();
  if (!raw) return null;
  const mapped = await resolveUid(raw, env) || raw;
  const ulid = ULID_RE.test(mapped) ? mapped : "";
  if (!ulid) return null;
  const base = await env.KV_STATUS.get(`profile_base:${ulid}`, { type: "json" });
  if (!base || typeof base !== "object") return null;
  const override = await env.KV_STATUS.get(`override:${ulid}`, { type: "json" }) || {};
  const effective = deepMergeProfile(base, override);
  const locationID = String(effective?.locationID || base?.locationID || "").trim();
  if (!locationID) return null;
  return { ulid, locationID, effective };
}
__name(readPublishedEffectiveProfileByAnyId, "readPublishedEffectiveProfileByAnyId");
function buildPublicProfilePayload(rec) {
  const effective = rec?.effective && typeof rec.effective === "object" ? rec.effective : {};
  return {
    ...effective,
    id: rec.ulid,
    ID: rec.ulid,
    locationUID: rec.ulid,
    locationID: rec.locationID,
    contexts: splitContextMemberships(effective?.context),
    ratings: ratingsFromGoogleProvider(effective)
  };
}
__name(buildPublicProfilePayload, "buildPublicProfilePayload");
function buildPublicItemPayload(rec) {
  const effective = rec?.effective && typeof rec.effective === "object" ? rec.effective : {};
  return {
    id: rec.ulid,
    ID: rec.ulid,
    locationUID: rec.ulid,
    locationID: rec.locationID,
    contexts: splitContextMemberships(effective?.context),
    locationName: effective.locationName || effective.name,
    media: effective.media || {},
    coord: effective.coord || effective["Coordinate Compound"] || "",
    links: effective.links || {},
    contactInformation: effective.contactInformation || effective.contact || {},
    descriptions: effective.descriptions || {},
    tags: Array.isArray(effective.tags) ? effective.tags : [],
    ratings: ratingsFromGoogleProvider(effective),
    pricing: effective.pricing || {},
    groupKey: effective.groupKey || "",
    subgroupKey: effective.subgroupKey || ""
  };
}
__name(buildPublicItemPayload, "buildPublicItemPayload");
function buildPublicContactPayload(rec) {
  const effective = rec?.effective && typeof rec.effective === "object" ? rec.effective : {};
  return {
    id: rec.ulid,
    ID: rec.ulid,
    locationUID: rec.ulid,
    locationID: rec.locationID,
    contexts: splitContextMemberships(effective?.context),
    locationName: effective.locationName || effective.name,
    contactInformation: effective.contactInformation || effective.contact || {},
    links: effective.links || {}
  };
}
__name(buildPublicContactPayload, "buildPublicContactPayload");
async function readPublishedEffectiveProfileByUlid(ulid, env) {
  const id = String(ulid || "").trim();
  if (!ULID_RE.test(id)) return null;
  const base = await env.KV_STATUS.get(`profile_base:${id}`, { type: "json" });
  if (!base || typeof base !== "object") return null;
  const override = await env.KV_STATUS.get(`override:${id}`, { type: "json" }) || {};
  const effective = deepMergeProfile(base, override);
  const locationID = String(effective?.locationID || base?.locationID || "").trim();
  if (!locationID) return null;
  return { ulid: id, locationID, effective };
}
__name(readPublishedEffectiveProfileByUlid, "readPublishedEffectiveProfileByUlid");
function buildPublicListPayload(rec) {
  const effective = rec?.effective && typeof rec.effective === "object" ? rec.effective : {};
  const media = effective?.media && typeof effective.media === "object" ? effective.media : {};
  const images = Array.isArray(media.images) ? media.images : [];
  return {
    ...effective,
    id: rec.ulid,
    ID: rec.ulid,
    locationUID: rec.ulid,
    locationID: rec.locationID,
    alias: rec.locationID,
    contexts: splitContextMemberships(effective?.context),
    coord: effective?.coord || effective?.["Coordinate Compound"] || "",
    media: {
      ...media,
      cover: String(media?.cover || "").trim(),
      images: images.map((v) => typeof v === "string" ? v : v?.src).filter(Boolean)
    },
    contactInformation: effective?.contactInformation || effective?.contact || {},
    links: effective?.links || {},
    descriptions: effective?.descriptions || {},
    tags: Array.isArray(effective?.tags) ? effective.tags : [],
    ratings: ratingsFromGoogleProvider(effective),
    pricing: effective?.pricing || {}
  };
}
__name(buildPublicListPayload, "buildPublicListPayload");
async function listContextShardUlids(env, contextKey) {
  const key = String(contextKey || "").trim();
  if (!key) return [];
  const j = await contextShardCall(env, key, { ver: 1, op: "list" });
  const arr = Array.isArray(j?.ulids) ? j.ulids : [];
  return arr.map((v) => String(v || "").trim()).filter((v) => ULID_RE.test(v));
}
__name(listContextShardUlids, "listContextShardUlids");
function ownerSelectorNormalizeText(value) {
  return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[-_.\/]/g, " ").replace(/\s+/g, " ").trim();
}
__name(ownerSelectorNormalizeText, "ownerSelectorNormalizeText");
function ownerSelectorTokens(value) {
  return ownerSelectorNormalizeText(value).split(/\s+/).filter(Boolean);
}
__name(ownerSelectorTokens, "ownerSelectorTokens");
function ownerSelectorDisplayName(profile) {
  const raw = profile?.locationName ?? profile?.listedName ?? profile?.name ?? "";
  if (typeof raw === "string") return String(raw || "").trim();
  if (raw && typeof raw === "object") {
    return String(raw.en || Object.values(raw)[0] || "").trim();
  }
  return "";
}
__name(ownerSelectorDisplayName, "ownerSelectorDisplayName");
function ownerSelectorAddressLine(profile) {
  const c = profile?.contactInformation && typeof profile.contactInformation === "object" ? profile.contactInformation : profile?.contact && typeof profile.contact === "object" ? profile.contact : {};
  return [c.address, c.city].map((v) => String(v || "").trim()).filter(Boolean).join(", ");
}
__name(ownerSelectorAddressLine, "ownerSelectorAddressLine");
function ownerSelectorSearchHay(profile, slug) {
  const c = profile?.contactInformation && typeof profile.contactInformation === "object" ? profile.contactInformation : profile?.contact && typeof profile.contact === "object" ? profile.contact : {};
  const tags = Array.isArray(profile?.tags) ? profile.tags.map((k) => String(k || "").replace(/^tag\./, "")).join(" ") : "";
  const person = String(c.contactPerson || "").trim();
  const contact = [c.phone, c.email, c.whatsapp, c.telegram, c.messenger].map((v) => String(v || "").trim()).filter(Boolean).join(" ");
  const addressSearch = [c.address, c.city, c.adminArea, c.postalCode, c.countryCode].map((v) => String(v || "").trim()).filter(Boolean).join(" ");
  const names = (() => {
    const ln = profile?.locationName;
    if (typeof ln === "string") return ln;
    if (ln && typeof ln === "object") return Object.values(ln).map((v) => String(v || "").trim()).filter(Boolean).join(" ");
    return "";
  })();
  return ownerSelectorNormalizeText([names, slug, addressSearch, tags, person, contact].filter(Boolean).join(" "));
}
__name(ownerSelectorSearchHay, "ownerSelectorSearchHay");
function ownerSelectorScore(profile, slug, query) {
  const qNorm = ownerSelectorNormalizeText(query);
  const tokens = ownerSelectorTokens(query);
  if (!tokens.length) return 0;
  const nameNorm = ownerSelectorNormalizeText(ownerSelectorDisplayName(profile));
  const slugNorm = ownerSelectorNormalizeText(slug);
  const hay = ownerSelectorSearchHay(profile, slug);
  if (!tokens.every((tok) => hay.includes(tok))) return 0;
  let score = 0;
  if (slugNorm === qNorm) score += 520;
  if (nameNorm === qNorm) score += 480;
  if (slugNorm.startsWith(qNorm)) score += 260;
  if (nameNorm.startsWith(qNorm)) score += 220;
  if (hay.includes(qNorm)) score += 40;
  for (const tok of tokens) {
    if (nameNorm.includes(tok)) score += 32;
    if (slugNorm.includes(tok)) score += 28;
    if (hay.includes(tok)) score += 8;
  }
  return score;
}
__name(ownerSelectorScore, "ownerSelectorScore");
async function buildOwnerLocationSelectorItem(env, rec) {
  const vis = await computeVisibilityState(env, rec.ulid);
  const camp = await campaignEntitlementForUlid(env, rec.ulid);
  return {
    ...buildPublicListPayload(rec),
    sybAddressLine: ownerSelectorAddressLine(rec.effective),
    sybStatus: {
      planEntitled: vis.planEntitled,
      activePaidPlan: vis.activePaidPlan,
      publicRecordMode: vis.publicRecordMode,
      externallyIndexable: vis.externallyIndexable,
      ownedNow: vis.ownedNow,
      visibilityState: vis.visibilityState,
      courtesyUntil: "",
      campaignEntitled: vis.planEntitled && camp.entitled,
      promoQrCampaignActive: vis.planEntitled && camp.entitled,
      campaignEndsAt: vis.planEntitled && camp.entitled ? camp.endDate : "",
      activeCampaignKey: vis.planEntitled && camp.entitled ? camp.campaignKey : ""
    }
  };
}
__name(buildOwnerLocationSelectorItem, "buildOwnerLocationSelectorItem");
async function listPublishedLocationSelectorItems(env, opts = {}) {
  const query = String(opts?.query || "").trim();
  const limitRaw = Number(opts?.limit || 5);
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(Math.trunc(limitRaw), 10)) : 5;
  if (ownerSelectorNormalizeText(query).replace(/\s+/g, "").length < 3) return [];
  const candidates = [];
  let cursor = void 0;
  do {
    const page = await env.KV_STATUS.list({ prefix: "profile_base:", cursor });
    const pageHits = await Promise.all(
      page.keys.map(async (key) => {
        const name = String(key.name || "");
        const ulid = name.replace(/^profile_base:/, "").trim();
        if (!ULID_RE.test(ulid)) return null;
        const base = await env.KV_STATUS.get(name, { type: "json" });
        if (!base || typeof base !== "object") return null;
        const slug = String(base?.locationID || "").trim();
        if (!slug) return null;
        const score = ownerSelectorScore(base, slug, query);
        if (score <= 0) return null;
        return {
          ulid,
          locationID: slug,
          score,
          displayName: ownerSelectorDisplayName(base) || slug
        };
      })
    );
    pageHits.forEach((hit) => {
      if (hit) candidates.push(hit);
    });
    cursor = page.cursor || void 0;
  } while (cursor);
  if (!candidates.length) return [];
  candidates.sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score;
    return a.displayName.localeCompare(b.displayName, void 0, { sensitivity: "base" });
  });
  const top = candidates.slice(0, limit);
  const items = await Promise.all(
    top.map(async (row) => {
      const rec = await readPublishedEffectiveProfileByUlid(row.ulid, env);
      if (!rec) return null;
      return await buildOwnerLocationSelectorItem(env, rec);
    })
  );
  return items.filter(Boolean);
}
__name(listPublishedLocationSelectorItems, "listPublishedLocationSelectorItems");
async function handleLocationDraft(req, env) {
  const noStore = { "cache-control": "no-store" };
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return json(
      { error: { code: "invalid_request", message: "valid JSON body required" } },
      400,
      noStore
    );
  }
  const locationID = String(body?.locationID || "").trim();
  const draftULID = String(body?.draftULID || "").trim();
  const googlePlaceId = String(body?.googlePlaceId || body?.place_id || "").trim();
  let draftSessionId = String(body?.draftSessionId || "").trim();
  const rawDraft = body?.draft && typeof body.draft === "object" ? body.draft : {};
  if (locationID && draftULID) {
    return json(
      { error: { code: "invalid_request", message: "locationID and draftULID cannot be combined" } },
      400,
      noStore
    );
  }
  if (googlePlaceId && !isValidGooglePlaceId(googlePlaceId)) {
    return json(
      { error: { code: "invalid_request", message: "invalid googlePlaceId" } },
      400,
      noStore
    );
  }
  let normalizedPatch;
  try {
    normalizedPatch = normalizeDraftPatch(rawDraft, googlePlaceId);
  } catch (e) {
    const msg = String(e?.message || "");
    if (msg === "invalid_coordinates") {
      return json(
        { error: { code: "invalid_request", message: "invalid coordinates" } },
        400,
        noStore
      );
    }
    return json(
      { error: { code: "invalid_request", message: msg || "invalid draft payload" } },
      400,
      noStore
    );
  }
  if (locationID) {
    const ulid = await resolveUid(locationID, env);
    if (!ulid) {
      return json(
        { error: { code: "not_found", message: "unknown locationID" } },
        404,
        noStore
      );
    }
    if (!draftSessionId) draftSessionId = mintDraftSessionId();
    const key2 = `override_draft:${ulid}:${draftSessionId}`;
    const prev = await env.KV_STATUS.get(key2, { type: "json" });
    const nextDraft2 = mergeDraftPatch(prev, normalizedPatch);
    const classificationError2 = null;
    if (classificationError2) {
      return json(
        { error: { code: "invalid_request", message: classificationError2 } },
        400,
        noStore
      );
    }
    nextDraft2.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    await env.KV_STATUS.put(key2, JSON.stringify(nextDraft2));
    return json(
      { ok: true, locationID, draftSessionId },
      200,
      noStore
    );
  }
  if (draftULID) {
    if (!ULID_RE.test(draftULID) || !draftSessionId) {
      return json(
        { error: { code: "invalid_request", message: "draftULID and draftSessionId required" } },
        400,
        noStore
      );
    }
    const key2 = `override_draft:${draftULID}:${draftSessionId}`;
    const prev = await env.KV_STATUS.get(key2, { type: "json" });
    if (!prev) {
      return json(
        { error: { code: "not_found", message: "draft not found" } },
        404,
        noStore
      );
    }
    const nextDraft2 = mergeDraftPatch(prev, normalizedPatch);
    const classificationError2 = null;
    if (classificationError2) {
      return json(
        { error: { code: "invalid_request", message: classificationError2 } },
        400,
        noStore
      );
    }
    nextDraft2.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    await env.KV_STATUS.put(key2, JSON.stringify(nextDraft2));
    return json(
      { ok: true, draftULID, draftSessionId },
      200,
      noStore
    );
  }
  let deviceId = readDeviceId(req);
  let deviceSetCookie = "";
  if (googlePlaceId && !deviceId) {
    const minted = mintDeviceId();
    deviceId = minted.dev;
    deviceSetCookie = minted.cookie;
  }
  const googleIndexKey = googlePlaceId && deviceId ? googleDraftIndexKey(deviceId, googlePlaceId) : "";
  const draftResponseHeaders = deviceSetCookie ? { ...noStore, "Set-Cookie": deviceSetCookie } : noStore;
  if (googleIndexKey) {
    const indexed = await env.KV_STATUS.get(googleIndexKey, { type: "json" });
    const indexedDraftULID = String(indexed?.draftULID || "").trim();
    const indexedDraftSessionId = String(indexed?.draftSessionId || "").trim();
    if (ULID_RE.test(indexedDraftULID) && indexedDraftSessionId) {
      const existingKey = `override_draft:${indexedDraftULID}:${indexedDraftSessionId}`;
      const prev = await env.KV_STATUS.get(existingKey, { type: "json" });
      if (prev && typeof prev === "object") {
        const nextDraft2 = mergeDraftPatch(prev, normalizedPatch);
        const classificationError2 = null;
        if (classificationError2) {
          return json(
            { error: { code: "invalid_request", message: classificationError2 } },
            400,
            noStore
          );
        }
        nextDraft2.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
        await env.KV_STATUS.put(existingKey, JSON.stringify(nextDraft2));
        return json(
          { ok: true, draftULID: indexedDraftULID, draftSessionId: indexedDraftSessionId, reopened: true },
          200,
          draftResponseHeaders
        );
      }
    }
  }
  const newDraftULID = mintDraftUlid();
  const newDraftSessionId = mintDraftSessionId();
  const key = `override_draft:${newDraftULID}:${newDraftSessionId}`;
  const nextDraft = mergeDraftPatch({}, normalizedPatch);
  const classificationError = null;
  if (classificationError) {
    return json(
      { error: { code: "invalid_request", message: classificationError } },
      400,
      noStore
    );
  }
  nextDraft.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  await env.KV_STATUS.put(key, JSON.stringify(nextDraft));
  if (googleIndexKey) {
    await env.KV_STATUS.put(
      googleIndexKey,
      JSON.stringify({
        draftULID: newDraftULID,
        draftSessionId: newDraftSessionId,
        googlePlaceId,
        updatedAt: nextDraft.updatedAt
      }),
      { expirationTtl: 60 * 60 * 24 * 30 }
    );
  }
  return json(
    { ok: true, draftULID: newDraftULID, draftSessionId: newDraftSessionId },
    200,
    draftResponseHeaders
  );
}
__name(handleLocationDraft, "handleLocationDraft");
async function handleLocationDraftDelete(req, env) {
  const noStore = { "cache-control": "no-store" };
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return json(
      { error: { code: "invalid_request", message: "valid JSON body required" } },
      400,
      noStore
    );
  }
  const draftULID = String(body?.draftULID || "").trim();
  const draftSessionId = String(body?.draftSessionId || "").trim();
  const googlePlaceId = String(body?.googlePlaceId || body?.place_id || "").trim();
  if (!ULID_RE.test(draftULID) || !draftSessionId) {
    return json(
      { error: { code: "invalid_request", message: "draftULID and draftSessionId required" } },
      400,
      noStore
    );
  }
  await env.KV_STATUS.delete(`override_draft:${draftULID}:${draftSessionId}`);
  const deviceId = readDeviceId(req);
  if (deviceId && googlePlaceId && isValidGooglePlaceId(googlePlaceId)) {
    const indexKey = googleDraftIndexKey(deviceId, googlePlaceId);
    const indexed = await env.KV_STATUS.get(indexKey, { type: "json" });
    const indexedDraftULID = String(indexed?.draftULID || "").trim();
    const indexedDraftSessionId = String(indexed?.draftSessionId || "").trim();
    if (indexedDraftULID === draftULID && indexedDraftSessionId === draftSessionId) {
      await env.KV_STATUS.delete(indexKey);
    }
  }
  return json(
    { ok: true, draftULID, draftSessionId },
    200,
    noStore
  );
}
__name(handleLocationDraftDelete, "handleLocationDraftDelete");
async function handleGoogleImportAutocomplete(req, env) {
  const noStore = { "cache-control": "no-store" };
  const apiKey = googlePlacesApiKey(env);
  if (!apiKey) {
    return json(
      { error: { code: "google_places_key_missing", message: "Google Places server key is not configured." } },
      503,
      noStore
    );
  }
  const body = await req.json().catch(() => null);
  const input = String(body?.input || "").trim();
  const languageCode = String(body?.languageCode || "en").trim().slice(0, 12) || "en";
  if (input.length < 3) {
    return json(
      { ok: true, predictions: [] },
      200,
      noStore
    );
  }
  if (input.length > 160) {
    return json(
      { error: { code: "invalid_request", message: "Search input is too long." } },
      400,
      noStore
    );
  }
  const googleRes = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": [
        "suggestions.placePrediction.placeId",
        "suggestions.placePrediction.text.text",
        "suggestions.placePrediction.structuredFormat.mainText.text",
        "suggestions.placePrediction.structuredFormat.secondaryText.text"
      ].join(",")
    },
    body: JSON.stringify({
      input,
      languageCode,
      includeQueryPredictions: false
    })
  });
  const googlePayload = await googleRes.json().catch(() => null);
  if (!googleRes.ok) {
    const message = String(
      googlePayload?.error?.message || googlePayload?.error || "Google autocomplete request failed."
    ).trim();
    return json(
      {
        error: {
          code: "google_autocomplete_failed",
          message,
          status: googleRes.status
        }
      },
      502,
      noStore
    );
  }
  const suggestions = Array.isArray(googlePayload?.suggestions) ? googlePayload.suggestions : [];
  const predictions = suggestions.map((row) => {
    const prediction = row?.placePrediction || {};
    const placeId = String(prediction?.placeId || "").trim();
    const mainText = String(prediction?.structuredFormat?.mainText?.text || "").trim();
    const secondaryText = String(prediction?.structuredFormat?.secondaryText?.text || "").trim();
    const text = String(prediction?.text?.text || [mainText, secondaryText].filter(Boolean).join(", ")).trim();
    return {
      placeId,
      mainText: mainText || text,
      secondaryText,
      text
    };
  }).filter((row) => isValidGooglePlaceId(row.placeId));
  return json(
    {
      ok: true,
      predictions
    },
    200,
    noStore
  );
}
__name(handleGoogleImportAutocomplete, "handleGoogleImportAutocomplete");
async function handleUpfrontGoogleImportHydrate(req, env, body, googlePlaceId) {
  const noStore = { "cache-control": "no-store" };
  if (!isValidGooglePlaceId(googlePlaceId)) {
    return json(
      { error: { code: "invalid_request", message: "invalid googlePlaceId" } },
      400,
      noStore
    );
  }
  const rawDraft = body?.draft && typeof body.draft === "object" ? body.draft : {};
  let normalizedPatch;
  try {
    normalizedPatch = normalizeDraftPatch(rawDraft, googlePlaceId);
  } catch (e) {
    const msg = String(e?.message || "");
    return json(
      { error: { code: "invalid_request", message: msg === "invalid_coordinates" ? "invalid coordinates" : msg || "invalid draft payload" } },
      400,
      noStore
    );
  }
  let deviceId = readDeviceId(req);
  let deviceSetCookie = "";
  if (!deviceId) {
    const minted = mintDeviceId();
    deviceId = minted.dev;
    deviceSetCookie = minted.cookie;
  }
  const responseHeaders = deviceSetCookie ? { ...noStore, "Set-Cookie": deviceSetCookie } : noStore;
  const requestedDraftULID = String(body?.draftULID || "").trim();
  const requestedDraftSessionId = String(body?.draftSessionId || "").trim();
  const googleIndexKey = googleDraftIndexKey(deviceId, googlePlaceId);
  let draftULID = "";
  let draftSessionId = "";
  let existingDraft = null;
  let reopened = false;
  if (ULID_RE.test(requestedDraftULID) && requestedDraftSessionId) {
    const requestedKey = `override_draft:${requestedDraftULID}:${requestedDraftSessionId}`;
    const requestedDraft = await env.KV_STATUS.get(requestedKey, { type: "json" });
    if (requestedDraft && typeof requestedDraft === "object") {
      draftULID = requestedDraftULID;
      draftSessionId = requestedDraftSessionId;
      existingDraft = requestedDraft;
      reopened = true;
    }
  }
  if (!draftULID) {
    const indexed = await env.KV_STATUS.get(googleIndexKey, { type: "json" });
    const indexedDraftULID = String(indexed?.draftULID || "").trim();
    const indexedDraftSessionId = String(indexed?.draftSessionId || "").trim();
    if (ULID_RE.test(indexedDraftULID) && indexedDraftSessionId) {
      const indexedKey = `override_draft:${indexedDraftULID}:${indexedDraftSessionId}`;
      const indexedDraft = await env.KV_STATUS.get(indexedKey, { type: "json" });
      if (indexedDraft && typeof indexedDraft === "object") {
        draftULID = indexedDraftULID;
        draftSessionId = indexedDraftSessionId;
        existingDraft = indexedDraft;
        reopened = true;
      }
    }
  }
  const sameDeviceReopen = reopened && String(existingDraft?.googlePlaceId || "").trim() === googlePlaceId;
  const importPolicy = await checkGoogleImportPolicy(req, env, deviceId, googlePlaceId, sameDeviceReopen);
  if (!importPolicy.allowed) {
    await writeGoogleImportLedger(env, {
      placeId: googlePlaceId,
      deviceId,
      ipHash: importPolicy.ipHash,
      draftULID: "",
      mode: "upfront_google_import_blocked",
      cacheHit: false,
      quotaCounted: false,
      estimatedCostCents: 0
    });
    return json(
      {
        ok: false,
        hydrated: false,
        needsCheckout: true,
        error: importPolicy.error,
        draft: null,
        draftULID: "",
        draftSessionId: ""
      },
      429,
      responseHeaders
    );
  }
  const provider = await resolveGoogleImportPayload(env, googlePlaceId);
  if (!provider.hydrated) {
    return json(
      {
        ok: false,
        hydrated: false,
        error: provider.error || { code: "google_import_failed", message: "Google import failed" },
        draftULID: reopened ? draftULID : "",
        draftSessionId: reopened ? draftSessionId : ""
      },
      502,
      responseHeaders
    );
  }
  if (!draftULID) {
    draftULID = mintDraftUlid();
    draftSessionId = mintDraftSessionId();
  }
  const baseDraft = mergeDraftPatch(existingDraft || {}, normalizedPatch);
  const nextDraft = mergeGoogleImportIntoDraft(baseDraft, provider.draft);
  nextDraft.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  const draftKey = `override_draft:${draftULID}:${draftSessionId}`;
  await env.KV_STATUS.put(draftKey, JSON.stringify(nextDraft));
  await env.KV_STATUS.put(
    googleIndexKey,
    JSON.stringify({
      draftULID,
      draftSessionId,
      googlePlaceId,
      updatedAt: nextDraft.updatedAt
    }),
    { expirationTtl: 60 * 60 * 24 * 30 }
  );
  if (importPolicy.quotaCounted) {
    await recordGoogleImportQuota(env, deviceId, importPolicy.ipHash, googlePlaceId);
  }
  await writeGoogleImportLedger(env, {
    placeId: googlePlaceId,
    deviceId,
    ipHash: importPolicy.ipHash,
    draftULID,
    mode: "upfront_google_import",
    cacheHit: provider.cacheHit,
    quotaCounted: importPolicy.quotaCounted,
    estimatedCostCents: provider.cacheHit ? 0 : 2
  });
  return json(
    {
      ok: true,
      hydrated: true,
      reopened,
      cacheHit: provider.cacheHit,
      quotaCounted: importPolicy.quotaCounted,
      draft: {
        ...nextDraft,
        draftULID,
        draftSessionId
      },
      draftULID,
      draftSessionId,
      hydratedAt: String(nextDraft?.googleHydratedAt || "").trim(),
      importPolicy: {
        deviceLimit: GOOGLE_IMPORT_DEVICE_UNPAID_LIMIT,
        ipDailyLimit: GOOGLE_IMPORT_IP_DAILY_LIMIT
      }
    },
    200,
    responseHeaders
  );
}
__name(handleUpfrontGoogleImportHydrate, "handleUpfrontGoogleImportHydrate");
async function handleLocationHydrate(req, env) {
  const noStore = { "cache-control": "no-store" };
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return json(
      { error: { code: "invalid_request", message: "valid JSON body required" } },
      400,
      noStore
    );
  }
  const googlePlaceId = String(body?.googlePlaceId || body?.place_id || "").trim();
  if (googlePlaceId) {
    return await handleUpfrontGoogleImportHydrate(req, env, body, googlePlaceId);
  }
  const draftULID = String(body?.draftULID || "").trim();
  const draftSessionId = String(body?.draftSessionId || "").trim();
  const target = await resolveTargetIdentity(env, { draftULID, draftSessionId }, { validateDraft: true });
  if (!target) {
    return json(
      { error: { code: "not_found", message: "draft not found" } },
      404,
      noStore
    );
  }
  const entitlementError = await assertPaidDraftHydrationEntitlement(req, env, target);
  if (entitlementError) return entitlementError;
  const draftKey = `override_draft:${target.ulid}:${draftSessionId}`;
  const draft = await env.KV_STATUS.get(draftKey, { type: "json" });
  if (!draft) {
    return json(
      { error: { code: "not_found", message: "draft not found" } },
      404,
      noStore
    );
  }
  const result = await hydrateDraftWithGoogleDetails(env, draft);
  if (result.hydrated) {
    await env.KV_STATUS.put(draftKey, JSON.stringify(result.draft));
  }
  return json(
    {
      ok: true,
      hydrated: result.hydrated,
      error: result.error,
      draft: {
        ...result.draft && typeof result.draft === "object" ? result.draft : {},
        draftULID: target.ulid,
        draftSessionId
      },
      hydratedAt: result.hydrated ? String(result.draft?.googleHydratedAt || "").trim() : ""
    },
    200,
    noStore
  );
}
__name(handleLocationHydrate, "handleLocationHydrate");
function deepMergeProfile(base, patch) {
  if (patch === void 0) return base;
  if (Array.isArray(base) || Array.isArray(patch)) return patch;
  if (base && typeof base === "object" && patch && typeof patch === "object") {
    const out = { ...base };
    for (const [k, v] of Object.entries(patch)) {
      out[k] = deepMergeProfile(out[k], v);
    }
    return out;
  }
  return patch;
}
__name(deepMergeProfile, "deepMergeProfile");
function pickCanonicalName(raw) {
  if (!raw) return "";
  if (typeof raw === "string") return raw.trim();
  if (typeof raw === "object") {
    return String(raw.en || raw.hu || Object.values(raw)[0] || "").trim();
  }
  return "";
}
__name(pickCanonicalName, "pickCanonicalName");
function extractCoord(profile) {
  const c = profile?.coord;
  if (!c || typeof c !== "object") return null;
  const lat = Number(c?.lat);
  const lng = Number(c?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}
__name(extractCoord, "extractCoord");
function slugifyNamePart(name) {
  return String(name || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
}
__name(slugifyNamePart, "slugifyNamePart");
function geoSuffixFromCoord(coord) {
  const lat = Math.round(Math.abs(coord.lat) * 1e6);
  const lng = Math.round(Math.abs(coord.lng) * 1e6);
  const composite = `${lat}${lng}`;
  return composite.slice(-4).padStart(4, "0");
}
__name(geoSuffixFromCoord, "geoSuffixFromCoord");
async function findAvailableSlug(env, baseSlug, currentUlid = "") {
  let candidate = baseSlug;
  for (let i = 0; i < 1e3; i++) {
    const mapped = await env.KV_ALIASES.get(aliasKey(candidate), "json");
    const hit = String(typeof mapped === "string" ? mapped : mapped?.locationID || "").trim();
    if (!hit || currentUlid && hit === currentUlid) return candidate;
    candidate = `${baseSlug}-${i + 2}`;
  }
  throw new Error("slug_collision_exhausted");
}
__name(findAvailableSlug, "findAvailableSlug");
async function loadLegacyProfileBySlug(req, locationID) {
  const slug = String(locationID || "").trim();
  if (!slug) return null;
  const origin = req.headers.get("Origin") || "https://navigen.io";
  const u = new URL("/api/data/profile", origin);
  u.searchParams.set("id", slug);
  const r = await fetch(u.toString(), {
    method: "GET",
    headers: { accept: "application/json" },
    cache: "no-store"
  });
  if (!r.ok) return null;
  return await r.json().catch(() => null);
}
__name(loadLegacyProfileBySlug, "loadLegacyProfileBySlug");
async function readEffectivePublishedProfile(req, env, ulid, locationID) {
  let base = await env.KV_STATUS.get(`profile_base:${ulid}`, { type: "json" });
  const override = await env.KV_STATUS.get(`override:${ulid}`, { type: "json" }) || {};
  if (!base && locationID) {
    base = await loadLegacyProfileBySlug(req, locationID);
  }
  const effective = deepMergeProfile(base || {}, override || {});
  return { base: base || {}, override: override || {}, effective };
}
__name(readEffectivePublishedProfile, "readEffectivePublishedProfile");
function collectPublishImages(profile) {
  const media = profile?.media && typeof profile.media === "object" ? profile.media : {};
  const out = [];
  const cover = String(media.cover || "").trim();
  if (cover) out.push(cover);
  if (Array.isArray(media.images)) {
    for (const img of media.images) {
      const s = String(img || "").trim();
      if (s) out.push(s);
    }
  }
  return Array.from(new Set(out));
}
__name(collectPublishImages, "collectPublishImages");
function extractDescriptionText(profile) {
  const d = profile?.descriptions;
  if (typeof d === "string") return d.trim();
  if (d && typeof d === "object") return String(d.en || d.hu || Object.values(d)[0] || "").trim();
  return String(profile?.description || "").trim();
}
__name(extractDescriptionText, "extractDescriptionText");
function isHttpUrl(v) {
  try {
    const u = new URL(String(v || "").trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
__name(isHttpUrl, "isHttpUrl");
function hasWebsiteOrSocialLink(profile) {
  const links = profile?.links && typeof profile.links === "object" ? profile.links : {};
  for (const v of Object.values(links)) {
    if (isHttpUrl(v)) return true;
  }
  const ci = profile?.contactInformation && typeof profile.contactInformation === "object" ? profile.contactInformation : {};
  if (isHttpUrl(ci?.website)) return true;
  return false;
}
__name(hasWebsiteOrSocialLink, "hasWebsiteOrSocialLink");
function validatePublishCandidate(profile) {
  const name = pickCanonicalName(profile?.locationName ?? profile?.listedName);
  if (!name) return "missing_name";
  const coord = extractCoord(profile);
  if (!coord) return "missing_coordinates";
  if (collectPublishImages(profile).length < 3) return "images_min_3";
  if (extractDescriptionText(profile).length < 200) return "description_min_200";
  if (!hasWebsiteOrSocialLink(profile)) return "website_or_social_required";
  const groupKey = String(profile?.groupKey || "").trim();
  const subgroupKey = String(profile?.subgroupKey || "").trim();
  const context = String(profile?.context || "").trim();
  if (!groupKey || !subgroupKey || !context) return "classification_required";
  return null;
}
__name(validatePublishCandidate, "validatePublishCandidate");
async function planAllocCall(env, pi, op, payload) {
  const ns = env.PLAN_ALLOC || env.PLANALLOC || env.PLAN_ALLOC_DO || env.DO_PLAN_ALLOC;
  if (!ns || typeof ns.idFromName !== "function") {
    throw new Error("planalloc_binding_missing");
  }
  const id = ns.idFromName(`planalloc:${pi}`);
  const stub = ns.get(id);
  const r = await stub.fetch("https://do.internal/planalloc", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      ver: 1,
      op,
      pi,
      ts: doNowIso(),
      ...payload
    })
  });
  const txt = await r.text();
  let j = null;
  try {
    j = JSON.parse(txt);
  } catch {
  }
  if (!r.ok && !j) throw new Error(`planalloc_${op}_failed:${r.status}`);
  return j || { ok: r.ok };
}
__name(planAllocCall, "planAllocCall");
function splitContextMemberships(raw) {
  const vals = Array.isArray(raw) ? raw : String(raw || "").split(";");
  return uniqueTrimmedStrings(vals);
}
__name(splitContextMemberships, "splitContextMemberships");
function publishedCountryCode(profile) {
  const cc = String(
    profile?.contactInformation?.countryCode || profile?.contact?.countryCode || ""
  ).trim().toUpperCase();
  return /^[A-Z]{2}$/.test(cc) ? cc : "XX";
}
__name(publishedCountryCode, "publishedCountryCode");
function searchBucketForSlug(slug) {
  const s = doNormalizeSlug(slug);
  const ch = s.slice(0, 1);
  return /^[a-z0-9]$/.test(ch) ? ch : "_";
}
__name(searchBucketForSlug, "searchBucketForSlug");
function extractIndexNameValues(profile) {
  const out = [];
  const ln = profile?.locationName;
  if (typeof ln === "string") out.push(ln);
  else if (ln && typeof ln === "object") {
    for (const v of Object.values(ln)) {
      const s = String(v || "").trim();
      if (s) out.push(s);
    }
  }
  const listed = String(profile?.listedName || "").trim();
  if (listed) out.push(listed);
  return uniqueTrimmedStrings(out);
}
__name(extractIndexNameValues, "extractIndexNameValues");
function extractIndexAddressValues(profile) {
  const ci = profile?.contactInformation && typeof profile.contactInformation === "object" ? profile.contactInformation : profile?.contact && typeof profile.contact === "object" ? profile.contact : {};
  return uniqueTrimmedStrings([
    ci?.address,
    profile?.listedAddress,
    ci?.postalCode,
    profile?.postalCode,
    ci?.city,
    profile?.city,
    ci?.adminArea,
    profile?.adminArea
  ]);
}
__name(extractIndexAddressValues, "extractIndexAddressValues");
function extractIndexTagValues(profile) {
  const rawTags = Array.isArray(profile?.tags) ? profile.tags : String(profile?.tags || "").split(";");
  return uniqueTrimmedStrings(rawTags);
}
__name(extractIndexTagValues, "extractIndexTagValues");
async function computeIndexedFieldsHash(bundle) {
  const enc = new TextEncoder();
  const dig = await crypto.subtle.digest("SHA-256", enc.encode(JSON.stringify(bundle)));
  return `sha256:${bytesToHex(new Uint8Array(dig))}`;
}
__name(computeIndexedFieldsHash, "computeIndexedFieldsHash");
async function searchShardCall(env, countryCode, bucket, payload) {
  const ns = env.SEARCH_SHARD || env.SEARCH || env.SEARCH_DO || env.DO_SEARCH_SHARD;
  if (!ns || typeof ns.idFromName !== "function") {
    throw new Error("searchshard_binding_missing");
  }
  const id = ns.idFromName(`search:${countryCode}:${bucket}`);
  const stub = ns.get(id);
  const r = await stub.fetch("https://do.internal/search", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  const txt = await r.text();
  try {
    return JSON.parse(txt);
  } catch {
    return { ok: r.ok, raw: txt };
  }
}
__name(searchShardCall, "searchShardCall");
async function contextShardCall(env, contextKey, payload) {
  const ns = env.CONTEXT_SHARD || env.CONTEXT || env.CONTEXT_DO || env.DO_CTX_SHARD;
  if (!ns || typeof ns.idFromName !== "function") {
    throw new Error("contextshard_binding_missing");
  }
  const id = ns.idFromName(`ctx:${contextKey}`);
  const stub = ns.get(id);
  const r = await stub.fetch("https://do.internal/context", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  const txt = await r.text();
  try {
    return JSON.parse(txt);
  } catch {
    return { ok: r.ok, raw: txt };
  }
}
__name(contextShardCall, "contextShardCall");
async function syncPublishedDoIndex(env, args) {
  const ulid = String(args.ulid || "").trim();
  const slug = String(args.slug || "").trim();
  if (!DO_ULID_RE.test(ulid) || !slug) throw new Error("invalid_index_target");
  const prevContexts = splitContextMemberships(args.prevProfile?.context);
  const nextContexts = splitContextMemberships(args.nextProfile?.context);
  const allContexts = uniqueTrimmedStrings([...prevContexts, ...nextContexts]);
  const countryCode = publishedCountryCode(args.nextProfile);
  const bucket = searchBucketForSlug(slug);
  const ts = doNowIso();
  if (args.visibilityState === "hidden") {
    await searchShardCall(env, countryCode, bucket, {
      ver: 1,
      op: "delete",
      ulid,
      slug,
      countryCode,
      contexts: allContexts,
      ts
    });
    for (const ctx of allContexts) {
      await contextShardCall(env, ctx, {
        ver: 1,
        op: "delete",
        ulid,
        ts
      });
    }
    return;
  }
  const tokens = doNormalizeTokens([
    ...extractIndexNameValues(args.nextProfile),
    ...extractIndexAddressValues(args.nextProfile),
    ...extractIndexTagValues(args.nextProfile),
    slug
  ]);
  const indexedFieldsHash = await computeIndexedFieldsHash({
    slug,
    countryCode,
    contexts: nextContexts,
    tokens
  });
  await searchShardCall(env, countryCode, bucket, {
    ver: 1,
    op: "upsert",
    ulid,
    slug,
    countryCode,
    contexts: nextContexts,
    tokens,
    indexedFieldsHash,
    meta: {
      city: String(
        args.nextProfile?.contactInformation?.city || args.nextProfile?.contact?.city || args.nextProfile?.city || ""
      ).trim(),
      postalCode: String(
        args.nextProfile?.contactInformation?.postalCode || args.nextProfile?.contact?.postalCode || args.nextProfile?.postalCode || ""
      ).trim(),
      name: pickCanonicalName(args.nextProfile?.locationName ?? args.nextProfile?.listedName)
    },
    ts
  });
  const staleContexts = prevContexts.filter((ctx) => !nextContexts.includes(ctx));
  for (const ctx of staleContexts) {
    await contextShardCall(env, ctx, {
      ver: 1,
      op: "delete",
      ulid,
      ts
    });
  }
  for (const ctx of nextContexts) {
    await contextShardCall(env, ctx, {
      ver: 1,
      op: "upsert",
      ulid,
      ts
    });
  }
}
__name(syncPublishedDoIndex, "syncPublishedDoIndex");
async function handleLocationPublish(req, env) {
  const noStore = { "cache-control": "no-store" };
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return json(
      { error: { code: "invalid_request", message: "valid JSON body required" } },
      400,
      noStore
    );
  }
  const locationID = String(body?.locationID || "").trim();
  const draftULID = String(body?.draftULID || "").trim();
  const sourceDraftActorKey = String(body?.sourceDraftActorKey || body?.draftSessionId || "").trim();
  if (!sourceDraftActorKey) {
    return json(
      { error: { code: "invalid_request", message: "draftSessionId required" } },
      400,
      noStore
    );
  }
  const target = locationID ? await resolveTargetIdentity(env, { locationID }, {}) : await resolveTargetIdentity(env, { draftULID, draftSessionId: sourceDraftActorKey }, { validateDraft: true });
  if (!target) {
    return json(
      { error: { code: "not_found", message: "publish target not found" } },
      404,
      noStore
    );
  }
  const auth = await requireOwnerSession(req, env);
  if (auth instanceof Response) return auth;
  if (String(auth.ulid || "").trim() !== target.ulid) {
    return new Response("Denied", {
      status: 403,
      headers: { "cache-control": "no-store", "Referrer-Policy": "no-referrer" }
    });
  }
  const ownKey = `ownership:${target.ulid}`;
  const ownership = await env.KV_STATUS.get(ownKey, { type: "json" });
  const exclusiveUntilIso = String(ownership?.exclusiveUntil || "").trim();
  const exclusiveUntil = exclusiveUntilIso ? new Date(exclusiveUntilIso) : null;
  if (!exclusiveUntil || Number.isNaN(exclusiveUntil.getTime()) || exclusiveUntil.getTime() <= Date.now()) {
    return json(
      { error: { code: "ownership_inactive", message: "active ownership required" } },
      403,
      noStore
    );
  }
  const paymentIntentId = String(ownership?.lastEventId || "").trim();
  if (!paymentIntentId) {
    return json(
      { error: { code: "plan_missing", message: "ownership has no plan anchor" } },
      403,
      noStore
    );
  }
  const plan = await env.KV_STATUS.get(`plan:${paymentIntentId}`, { type: "json" });
  const planExpIso = String(plan?.expiresAt || "").trim();
  const planExp = planExpIso ? new Date(planExpIso) : null;
  if (!plan || !planExp || Number.isNaN(planExp.getTime()) || planExp.getTime() <= Date.now()) {
    return json(
      { error: { code: "plan_inactive", message: "active plan required" } },
      403,
      noStore
    );
  }
  if (planExp.toISOString() !== exclusiveUntil.toISOString()) {
    return json(
      { error: { code: "plan_invariant_failed", message: "plan/ownership expiry mismatch" } },
      403,
      noStore
    );
  }
  const draftKey = `override_draft:${target.ulid}:${sourceDraftActorKey}`;
  let draft = await env.KV_STATUS.get(draftKey, { type: "json" });
  if (!draft) {
    return json(
      { error: { code: "not_found", message: "draft not found" } },
      404,
      noStore
    );
  }
  if (String(draft?.googlePlaceId || "").trim()) {
    const hydration = await hydrateDraftWithGoogleDetails(env, draft);
    if (hydration.hydrated) {
      draft = hydration.draft;
      await env.KV_STATUS.put(draftKey, JSON.stringify(draft));
    }
  }
  const current = await readEffectivePublishedProfile(req, env, target.ulid, target.locationID);
  const candidate = target.route === "existing-location" ? deepMergeProfile(current.effective || {}, draft) : deepMergeProfile({}, draft);
  if (target.route === "existing-location" && target.locationID) {
    candidate.locationID = target.locationID;
  }
  const classificationError = await safeValidateClassificationSelection(req, candidate, { failClosedOnCatalogError: true });
  if (classificationError) {
    return json(
      { error: { code: "validation_failed", message: classificationError } },
      403,
      noStore
    );
  }
  const validationError = validatePublishCandidate(candidate);
  if (validationError) {
    return json(
      { error: { code: "validation_failed", message: validationError } },
      403,
      noStore
    );
  }
  let slug = "";
  let aliasWritten = false;
  let capacityHeld = false;
  let kvCommitted = false;
  try {
    const reserve = await planAllocCall(env, paymentIntentId, "reserve", {
      ulid: target.ulid,
      max: Math.max(0, Number(plan?.maxPublishedLocations || 0) || 0)
    });
    if (!reserve?.ok) {
      return json(
        { error: { code: "capacity_exceeded", message: "publish capacity exceeded" } },
        403,
        noStore
      );
    }
    capacityHeld = String(reserve?.reservationState || "").toLowerCase() === "held";
    let baseWrite = null;
    let overrideWrite = null;
    if (target.route === "existing-location") {
      slug = String(target.locationID || current.base?.locationID || current.effective?.locationID || "").trim();
      if (!slug) throw new Error("missing_existing_slug");
      if (!current.base || !Object.keys(current.base).length) {
        baseWrite = deepMergeProfile({}, current.effective || {});
        baseWrite.locationID = slug;
      }
      overrideWrite = deepMergeProfile(current.override || {}, draft);
      if (overrideWrite && typeof overrideWrite === "object") {
        delete overrideWrite.locationID;
      }
    } else {
      const name = pickCanonicalName(candidate?.locationName ?? candidate?.listedName);
      const coord = extractCoord(candidate);
      if (!name || !coord) throw new Error("invalid_brand_new_identity");
      const baseSlug = `${slugifyNamePart(name)}-${geoSuffixFromCoord(coord)}`.replace(/^-+|-+$/g, "").slice(0, 64);
      slug = await findAvailableSlug(env, baseSlug, target.ulid);
      baseWrite = deepMergeProfile({}, candidate);
      baseWrite.locationID = slug;
      overrideWrite = {};
    }
    if (target.route === "brand-new-private-shell") {
      await env.KV_ALIASES.put(aliasKey(slug), JSON.stringify({ locationID: target.ulid }));
      aliasWritten = true;
    }
    if (baseWrite) {
      await env.KV_STATUS.put(`profile_base:${target.ulid}`, JSON.stringify(baseWrite));
    }
    await env.KV_STATUS.put(`override:${target.ulid}`, JSON.stringify(overrideWrite || {}));
    await env.KV_STATUS.put(
      `override_log:${target.ulid}:${Date.now()}`,
      JSON.stringify({
        ts: doNowIso(),
        ulid: target.ulid,
        locationID: slug,
        paymentIntentId,
        initiationType: String(plan?.initiationType || "").trim(),
        route: target.route,
        draftSessionId: sourceDraftActorKey
      })
    );
    kvCommitted = true;
    if (capacityHeld) {
      try {
        const commit = await planAllocCall(env, paymentIntentId, "commit", { ulid: target.ulid });
        if (commit?.ok) {
          try {
            await env.KV_STATUS.put(
              `plan_alloc:${paymentIntentId}`,
              JSON.stringify({
                lastCommittedUlid: target.ulid,
                updatedAt: doNowIso()
              })
            );
          } catch {
          }
        } else {
          console.error("planalloc_commit_failed", { ulid: target.ulid, paymentIntentId, commit });
        }
      } catch (e) {
        console.error("planalloc_commit_failed", {
          ulid: target.ulid,
          paymentIntentId,
          err: String(e?.message || e || "")
        });
      }
    }
    const effectiveAfterCommit = target.route === "existing-location" ? deepMergeProfile(baseWrite || current.base || current.effective || {}, overrideWrite || {}) : deepMergeProfile(baseWrite || {}, overrideWrite || {});
    effectiveAfterCommit.locationID = slug;
    const visibility = await computeVisibilityState(env, target.ulid);
    try {
      await syncPublishedDoIndex(env, {
        ulid: target.ulid,
        slug,
        prevProfile: current.effective || {},
        nextProfile: effectiveAfterCommit,
        visibilityState: visibility.visibilityState
      });
    } catch (e) {
      console.error("publish_index_sync_failed", {
        ulid: target.ulid,
        slug,
        err: String(e?.message || e || "")
      });
    }
    return json(
      { ok: true, locationID: slug },
      200,
      noStore
    );
  } catch (e) {
    if (!kvCommitted && capacityHeld) {
      try {
        await planAllocCall(env, paymentIntentId, "release", { ulid: target.ulid });
      } catch {
      }
    }
    if (!kvCommitted && aliasWritten && slug) {
      try {
        await env.KV_ALIASES.delete(aliasKey(slug));
      } catch {
      }
    }
    if (kvCommitted) {
      console.error("publish_postcommit_error", {
        ulid: target.ulid,
        slug,
        err: String(e?.message || e || "")
      });
      return json(
        { ok: true, locationID: slug },
        200,
        noStore
      );
    }
    return json(
      { error: { code: "publish_failed", message: String(e?.message || "publish failed") } },
      500,
      noStore
    );
  }
}
__name(handleLocationPublish, "handleLocationPublish");
async function handleQr(req, env) {
  const url = new URL(req.url);
  const raw = (url.searchParams.get("locationID") || "").trim();
  if (!raw) {
    return json(
      { error: { code: "invalid_request", message: "locationID required" } },
      400
    );
  }
  const fmt = (url.searchParams.get("fmt") || "svg").toLowerCase();
  const size = clamp(parseInt(url.searchParams.get("size") || "512", 10), 128, 1024);
  const mapped = await resolveUid(raw, env) || raw;
  const ulid = ULID_RE.test(mapped) ? mapped : "";
  if (!ulid) {
    return json(
      { error: { code: "not_found", message: "location not found" } },
      404
    );
  }
  const base = await env.KV_STATUS.get(`profile_base:${ulid}`, { type: "json" });
  if (!base || typeof base !== "object") {
    return json(
      { error: { code: "not_found", message: "published profile not found" } },
      404
    );
  }
  const override = await env.KV_STATUS.get(`override:${ulid}`, { type: "json" }) || {};
  const effective = deepMergeProfile(base, override);
  const canonicalSlug = String(effective?.locationID || base?.locationID || raw).trim();
  let targetUrl = String(effective?.qrUrl || "").trim();
  if (!targetUrl) {
    const dest = new URL("/", "https://navigen.io");
    dest.searchParams.set("lp", canonicalSlug);
    targetUrl = dest.toString();
  }
  const scanUrl = new URL(`/out/qr-scan/${encodeURIComponent(canonicalSlug)}`, "https://navigen.io");
  scanUrl.searchParams.set("to", targetUrl);
  const dataUrl = scanUrl.toString();
  if (fmt === "svg") {
    const svg = await import_qrcode.default.toString(dataUrl, { type: "svg", width: size, margin: 0 });
    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=86400",
        "Access-Control-Allow-Origin": "https://navigen.io",
        "Access-Control-Allow-Credentials": "true",
        "Vary": "Origin"
      }
    });
  } else {
    const bytes = await import_qrcode.default.toBuffer(dataUrl, { type: "png", width: size, margin: 0 });
    return new Response(bytes, {
      headers: {
        "content-type": "image/png",
        "cache-control": "public, max-age=86400",
        "access-control-allow-origin": "*"
      }
    });
  }
}
__name(handleQr, "handleQr");
async function handleTrack(req, env) {
  let payload = {};
  try {
    payload = await req.json();
  } catch {
    return json({ error: { code: "invalid_request", message: "JSON body required" } }, 400);
  }
  const locRaw = typeof payload.locationID === "string" && payload.locationID.trim() ? payload.locationID.trim() : "";
  const loc = await resolveUid(locRaw, env);
  if (!loc) {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin": "https://navigen.io",
        // or your allowOrigin variable
        "access-control-allow-credentials": "true",
        "vary": "Origin"
      }
    });
  }
  const event = (payload.event || "").toString().toLowerCase().replaceAll("_", "-").trim();
  let action = (payload.action || "").toString().toLowerCase().replaceAll("_", "-").trim();
  if (action.startsWith("nav.")) action = "map";
  if (action === "route") action = "map";
  if (action.startsWith("social.")) action = action.slice(7) || "other";
  if (action === "share-contact" || action === "share_contact") action = "share";
  if (action.startsWith("share")) action = "share";
  if (!loc || !event) {
    return json({ error: { code: "invalid_request", message: "locationID and event required" } }, 400);
  }
  const allowed = new Set(EVENT_ORDER);
  if (!allowed.has(event)) {
    return json({ error: { code: "invalid_request", message: "unsupported event" } }, 400);
  }
  const now = /* @__PURE__ */ new Date();
  const country = req.cf?.country || "";
  const tz = (payload?.tz || "").trim() || void 0;
  const evKey = event;
  if (EVENT_ORDER.includes(evKey)) {
    const day = dayKeyFor(now, tz, country);
    const key = `stats:${loc}:${day}:${evKey}`;
    await kvIncr(env.KV_STATS, key);
    if (evKey === "rating") {
      const scoreRaw = (payload?.score ?? payload?.rating ?? payload?.value ?? "").toString().trim();
      const score = parseInt(scoreRaw, 10);
      if (Number.isFinite(score) && score >= 1 && score <= 5) {
        const scoreKey = `stats:${loc}:${day}:rating-score`;
        const cur = parseInt(await env.KV_STATS.get(scoreKey) || "0", 10) || 0;
        await env.KV_STATS.put(scoreKey, String(cur + score), {
          expirationTtl: 60 * 60 * 24 * 366
          // keep stats ~1 year like kvIncr()
        });
      }
    }
  }
  const bucket = event;
  await increment(env.KV_STATS, keyForStat(loc, bucket));
  const origin = req.headers.get("Origin") || "";
  const allowOrigin = origin || "*";
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "https://navigen.io",
      // same as above (or allowOrigin variable)
      "access-control-allow-credentials": "true",
      "vary": "Origin"
    }
  });
}
__name(handleTrack, "handleTrack");
async function handleStatus(req, env) {
  const url = new URL(req.url);
  const idParam = url.searchParams.get("locationID") || "";
  const idRaw = String(idParam || "").trim();
  const locID = ULID_RE.test(idRaw) ? idRaw : await resolveUid(idRaw, env) || "";
  if (!locID) return json({ error: { code: "invalid_request", message: "locationID required" } }, 400);
  const raw = await env.KV_STATUS.get(statusKey(locID), "json");
  const status = raw?.status || "free";
  const tier = raw?.tier || "free";
  const plan = await readPlanEntitlementForUlid(env, locID);
  const vis = await computeVisibilityState(env, locID);
  const camp = await campaignEntitlementForUlid(env, locID);
  const promoQrCampaignActive = plan.planEntitled && camp.entitled;
  const managedPresence = plan.planEntitled && !promoQrCampaignActive;
  const rawCampaignRows = await env.KV_STATUS.get(campaignsByUlidKey(locID), { type: "json" });
  const campaignRows = Array.isArray(rawCampaignRows) ? rawCampaignRows : [];
  const nowMs = Date.now();
  const activeCampaignKeys = plan.planEntitled ? campaignRows.filter((row) => {
    if (!row || String(row?.locationID || "").trim() !== locID) return false;
    const st = String(row?.statusOverride || row?.status || "").trim().toLowerCase();
    if (st !== "active") return false;
    const startMs = parseYmdUtcMs(String(row?.startDate || ""));
    const endMs = parseYmdUtcMs(String(row?.endDate || ""));
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return false;
    if (nowMs < startMs) return false;
    if (nowMs > endMs + 24 * 60 * 60 * 1e3 - 1) return false;
    return true;
  }).map((row) => String(row?.campaignKey || "").trim()).filter(Boolean).filter((value, index, arr) => arr.indexOf(value) === index) : [];
  const ratingSummary = await readRatingSummary(env, locID);
  const ratingDeviceKey = readRatingDeviceKey(req);
  const rawRatingVote = ratingDeviceKey ? await env.KV_STATUS.get(ratingVoteKey(locID, ratingDeviceKey), { type: "json" }) : null;
  const userScoreRaw = Number(rawRatingVote?.score);
  const ratingLockedUntil = (() => {
    const votedAtMs = Date.parse(String(rawRatingVote?.votedAt || ""));
    if (!Number.isFinite(votedAtMs)) return "";
    const untilMs = votedAtMs + RATING_WINDOW_MS;
    return untilMs > Date.now() ? new Date(untilMs).toISOString() : "";
  })();
  return json(
    {
      locationID: locID,
      status,
      tier,
      // Active Plan entitlement spine
      planEntitled: plan.planEntitled,
      activePaidPlan: plan.activePaidPlan,
      publicRecordMode: plan.publicRecordMode,
      externallyIndexable: plan.externallyIndexable,
      lpmNotSuppressed: plan.lpmNotSuppressed,
      managedPresence,
      promoQrCampaignActive,
      planTier: plan.tier,
      planPriceId: plan.priceId,
      planExpiresAt: plan.planExpiresAt,
      paymentIntentId: plan.paymentIntentId,
      // Legacy compatibility fields; do not use these for new business logic.
      ownedNow: vis.ownedNow,
      visibilityState: vis.visibilityState,
      exclusiveUntil: vis.exclusiveUntil,
      courtesyUntil: "",
      // Campaign with Promo QR spine
      campaignEntitled: promoQrCampaignActive,
      campaignEndsAt: promoQrCampaignActive ? camp.endDate : "",
      activeCampaignKey: promoQrCampaignActive ? camp.campaignKey : "",
      activeCampaignKeys: promoQrCampaignActive ? activeCampaignKeys : [],
      // Rating spine (authoritative, cross-device read model for the LPM)
      ratingAvg: ratingSummary.avg,
      ratedSum: ratingSummary.count,
      userScore: Number.isFinite(userScoreRaw) && userScoreRaw >= 1 && userScoreRaw <= 5 ? userScoreRaw : 0,
      ratingLockedUntil,
      ratingCooldownMinutes: 30
    },
    200,
    { "cache-control": "no-store" }
  );
}
__name(handleStatus, "handleStatus");
function json(body, status = 200, headers = {}) {
  const allowOrigin = "https://navigen.io";
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": allowOrigin,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "content-type, authorization, x-ng-device",
      "Vary": "Origin",
      ...headers
    }
  });
}
__name(json, "json");
function clamp(n, min, max) {
  if (isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}
__name(clamp, "clamp");
function todayKey() {
  const now = /* @__PURE__ */ new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}
__name(todayKey, "todayKey");
function keyForStat(locationID, bucket) {
  return `stats:${locationID}:${todayKey()}:${bucket}`;
}
__name(keyForStat, "keyForStat");
function statusKey(locationID) {
  return `status:${locationID}`;
}
__name(statusKey, "statusKey");
function aliasKey(legacy) {
  return `alias:${legacy}`;
}
__name(aliasKey, "aliasKey");
async function resolveUid(idOrAlias, env) {
  if (!idOrAlias) return null;
  if (/^[0-9A-HJKMNP-TV-Z]{26}$/i.test(idOrAlias)) return idOrAlias;
  const key = aliasKey(idOrAlias);
  const raw = await env.KV_ALIASES.get(key, "text");
  if (!raw) return null;
  const txt = String(raw || "").trim();
  if (!txt) return null;
  if (/^[0-9A-HJKMNP-TV-Z]{26}$/i.test(txt)) return txt;
  try {
    const parsed = JSON.parse(txt);
    return (typeof parsed === "string" ? parsed : parsed?.locationID) || null;
  } catch {
    return null;
  }
}
__name(resolveUid, "resolveUid");
async function writeQaFlags(env, locationID, flags) {
  try {
    const key = statusKey(locationID);
    const raw = await env.KV_STATUS.get(key, "json");
    const base = raw && typeof raw === "object" ? raw : {};
    const next = {
      ...base,
      qaFlags: Array.isArray(flags) ? flags : [],
      qaUpdatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await env.KV_STATUS.put(key, JSON.stringify(next));
  } catch {
  }
}
__name(writeQaFlags, "writeQaFlags");
function campaignsByUlidKey(ulid) {
  return `campaigns:byUlid:${ulid}`;
}
__name(campaignsByUlidKey, "campaignsByUlidKey");
function campaignGroupKeyKey(campaignGroupKey) {
  return `campaign_group:${campaignGroupKey}`;
}
__name(campaignGroupKeyKey, "campaignGroupKeyKey");
function normCampaignScope(v) {
  const s = String(v || "").trim().toLowerCase();
  if (s === "selected") return "selected";
  if (s === "all") return "all";
  return "single";
}
__name(normCampaignScope, "normCampaignScope");
function normCampaignPreset(v) {
  const s = String(v || "").trim().toLowerCase();
  return s === "visibility" ? "visibility" : "promotion";
}
__name(normCampaignPreset, "normCampaignPreset");
function deriveCampaignGroupKey(seedSlug, campaignKey) {
  const seed = String(seedSlug || "").trim() || "location";
  const key = String(campaignKey || "").trim() || "campaign";
  return `${seed}::${key}`;
}
__name(deriveCampaignGroupKey, "deriveCampaignGroupKey");
async function eligibleLocationsForRequest(req, env, activeUlid = "") {
  const dev = readDeviceId(req);
  if (!dev) return [];
  const idxKey = devIndexKey(dev);
  const rawIdx = await env.KV_STATUS.get(idxKey, "text");
  let arr = [];
  try {
    arr = rawIdx ? JSON.parse(rawIdx) : [];
  } catch {
    arr = [];
  }
  if (!Array.isArray(arr)) arr = [];
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  const ordered = [
    ...arr.map((v) => String(v || "").trim()).filter(Boolean),
    String(activeUlid || "").trim()
  ].filter(Boolean);
  for (const ulid of ordered) {
    if (!ulid || seen.has(ulid)) continue;
    seen.add(ulid);
    const sid = await env.KV_STATUS.get(devSessKey(dev, ulid), "text");
    if (!sid) continue;
    const sess = await env.KV_STATUS.get(`opsess:${sid}`, { type: "json" });
    if (!sess || String(sess?.ulid || "").trim() !== ulid) continue;
    let slug = ulid;
    let locationName = ulid;
    try {
      const item = await getItemById(ulid, env).catch(() => null);
      slug = String(item?.locationID || ulid).trim() || ulid;
      const ln = item?.locationName;
      const nm = ln && typeof ln === "object" ? String(ln.en || Object.values(ln)[0] || "").trim() : String(ln || "").trim();
      if (nm) locationName = nm;
      else if (slug) locationName = slug;
    } catch {
    }
    out.push({ ulid, slug, locationName });
  }
  return out;
}
__name(eligibleLocationsForRequest, "eligibleLocationsForRequest");
async function currentPlanForUlid(env, ulid, nowMs = Date.now()) {
  try {
    const own = await env.KV_STATUS.get(`ownership:${ulid}`, { type: "json" });
    const ownershipExpIso = String(own?.exclusiveUntil || "").trim();
    const ownershipExp = ownershipExpIso ? new Date(ownershipExpIso) : null;
    if (!ownershipExp || Number.isNaN(ownershipExp.getTime()) || ownershipExp.getTime() <= nowMs) return null;
    const paymentIntentId = String(own?.lastEventId || "").trim();
    if (!paymentIntentId) {
      return {
        priceId: "",
        tier: "unknown",
        maxPublishedLocations: 0,
        purchasedAt: "",
        expiresAt: ownershipExp.toISOString(),
        initiationType: String(own?.source || "").trim(),
        campaignPreset: ""
      };
    }
    const plan = await env.KV_STATUS.get(`plan:${paymentIntentId}`, { type: "json" });
    if (!plan || typeof plan !== "object") {
      return {
        priceId: "",
        tier: "unknown",
        maxPublishedLocations: 0,
        purchasedAt: "",
        expiresAt: ownershipExp.toISOString(),
        initiationType: String(own?.source || "").trim(),
        campaignPreset: ""
      };
    }
    const planExpIso = String(plan?.expiresAt || ownershipExp.toISOString()).trim();
    const planExp = planExpIso ? new Date(planExpIso) : null;
    if (!planExp || Number.isNaN(planExp.getTime()) || planExp.getTime() <= nowMs) return null;
    return {
      priceId: String(plan?.priceId || "").trim(),
      tier: normalizePlanTier(plan?.tier),
      maxPublishedLocations: Math.max(0, Number(plan?.maxPublishedLocations || 0) || 0),
      purchasedAt: String(plan?.purchasedAt || "").trim(),
      expiresAt: planExp.toISOString(),
      initiationType: String(plan?.initiationType || own?.source || "").trim(),
      campaignPreset: String(plan?.campaignPreset || "").trim()
    };
  } catch {
    return null;
  }
}
__name(currentPlanForUlid, "currentPlanForUlid");
async function readPlanEntitlementForUlid(env, ulid, nowMs = Date.now()) {
  const empty = /* @__PURE__ */ __name((reason) => ({
    planEntitled: false,
    activePaidPlan: false,
    publicRecordMode: true,
    externallyIndexable: false,
    lpmNotSuppressed: true,
    ownedNow: false,
    visibilityState: "visible",
    exclusiveUntil: "",
    courtesyUntil: "",
    paymentIntentId: "",
    priceId: "",
    tier: "unknown",
    maxPublishedLocations: 0,
    planExpiresAt: "",
    reason
  }), "empty");
  const id = String(ulid || "").trim();
  if (!ULID_RE.test(id)) return empty("invalid_ulid");
  const ownership = await env.KV_STATUS.get(`ownership:${id}`, { type: "json" });
  const exclusiveUntilIso = String(ownership?.exclusiveUntil || "").trim();
  const exclusiveUntil = exclusiveUntilIso ? new Date(exclusiveUntilIso) : null;
  if (!exclusiveUntil || Number.isNaN(exclusiveUntil.getTime())) {
    return empty("no_active_plan");
  }
  const activePaidPlan = exclusiveUntil.getTime() > nowMs;
  const paymentIntentId = String(ownership?.lastEventId || "").trim();
  const statusRaw = await env.KV_STATUS.get(statusKey(id), { type: "json" });
  const suppressedState = String(statusRaw?.status || statusRaw?.state || "").trim().toLowerCase();
  const lpmNotSuppressed = statusRaw?.suppressed !== true && statusRaw?.isSuppressed !== true && suppressedState !== "suppressed";
  const plan = activePaidPlan ? await currentPlanForUlid(env, id, nowMs) : null;
  const planExpiresAt = String(plan?.expiresAt || exclusiveUntil.toISOString()).trim();
  return {
    planEntitled: activePaidPlan,
    activePaidPlan,
    publicRecordMode: !activePaidPlan,
    externallyIndexable: activePaidPlan && lpmNotSuppressed,
    lpmNotSuppressed,
    ownedNow: activePaidPlan,
    visibilityState: activePaidPlan ? "promoted" : "visible",
    exclusiveUntil: exclusiveUntil.toISOString(),
    courtesyUntil: "",
    paymentIntentId,
    priceId: String(plan?.priceId || "").trim(),
    tier: normalizePlanTier(plan?.tier),
    maxPublishedLocations: Math.max(0, Number(plan?.maxPublishedLocations || 0) || 0),
    planExpiresAt,
    reason: activePaidPlan ? "active_plan" : "public_record_mode"
  };
}
__name(readPlanEntitlementForUlid, "readPlanEntitlementForUlid");
async function currentGroupPlanForUlid(env, ulid) {
  try {
    const hist = await env.KV_STATUS.get(campaignsByUlidKey(ulid), { type: "json" });
    const rows = Array.isArray(hist) ? hist : [];
    const nowMs = Date.now();
    for (const row of [...rows].reverse()) {
      const groupKey = String(row?.campaignGroupKey || "").trim();
      if (!groupKey) continue;
      const st = effectiveCampaignStatus(row);
      if (st !== "active" && st !== "suspended") continue;
      const endMs = parseYmdUtcMs(String(row?.endDate || ""));
      if (Number.isFinite(endMs) && nowMs > endMs + 24 * 60 * 60 * 1e3 - 1) continue;
      const parent = await env.KV_STATUS.get(campaignGroupKeyKey(groupKey), { type: "json" });
      const tier = normalizePlanTier(parent?.planTier || row?.planTier);
      const maxPublishedLocations = Math.max(
        0,
        Number(parent?.maxPublishedLocations || row?.maxPublishedLocations || 0) || 0
      );
      if (tier !== "unknown" || maxPublishedLocations > 0) {
        return { tier, maxPublishedLocations };
      }
    }
  } catch {
  }
  return null;
}
__name(currentGroupPlanForUlid, "currentGroupPlanForUlid");
function buildPlanUpgradeErrorBody(plan, scope, requestedLocations) {
  const currentTier = normalizePlanTier(plan?.tier);
  const currentCapacity = Math.max(0, Number(plan?.maxPublishedLocations || 0) || 0);
  const message = currentCapacity > 0 ? `This selection needs ${requestedLocations} locations, but the current Plan allows ${currentCapacity}.` : "This selection is not available for the current Plan.";
  return {
    error: {
      code: "plan_upgrade_required",
      message
    },
    upgrade: {
      currentTier,
      currentCapacity,
      requestedLocations,
      scope
    }
  };
}
__name(buildPlanUpgradeErrorBody, "buildPlanUpgradeErrorBody");
async function describeLocationForMaterialization(env, ulid, fallbackSlug = "") {
  let slug = String(fallbackSlug || ulid).trim() || ulid;
  let locationName = slug || ulid;
  try {
    const item = await getItemById(ulid, env).catch(() => null);
    const resolvedSlug = String(item?.locationID || "").trim();
    const resolvedName = pickName(item?.locationName);
    if (resolvedSlug) slug = resolvedSlug;
    if (resolvedName) locationName = resolvedName;
    else if (slug) locationName = slug;
  } catch {
  }
  return { ulid, slug, locationName };
}
__name(describeLocationForMaterialization, "describeLocationForMaterialization");
async function promoteCampaignDraftToActiveRows(params) {
  const { req, env, ownerUlid, draft, locationSlug, campaignKey, stripeSessionId, paidPlan, logTag } = params;
  const scope = normCampaignScope(draft?.campaignScope);
  const campaignPreset = normCampaignPreset(draft?.campaignPreset);
  const eligibleLocations = await eligibleLocationsForRequest(req, env, ownerUlid);
  const eligibleByUlid = new Map(eligibleLocations.map((x) => [x.ulid, x]));
  if (scope !== "single" && Number(paidPlan?.maxPublishedLocations || 0) <= 1) {
    return { ok: false, status: 409, body: buildPlanUpgradeErrorBody(paidPlan, scope, 2) };
  }
  let includedTargets = [];
  if (scope === "selected") {
    const storedSelectedUlids = Array.from(
      new Set(
        (Array.isArray(draft?.selectedLocationULIDs) ? draft.selectedLocationULIDs : []).map((x) => String(x || "").trim()).filter(Boolean)
      )
    );
    if (!storedSelectedUlids.length) {
      return {
        ok: false,
        status: 409,
        body: { error: { code: "invalid_state", message: "selected scope has no stored locations" } }
      };
    }
    for (const targetUlid of storedSelectedUlids) {
      const eligibleLoc = eligibleByUlid.get(targetUlid);
      if (eligibleLoc) {
        includedTargets.push({ ...eligibleLoc });
        continue;
      }
      if (!ULID_RE.test(targetUlid)) {
        return {
          ok: false,
          status: 409,
          body: { error: { code: "invalid_state", message: "selected scope contains an invalid location id" } }
        };
      }
      console.warn(`${logTag}: selected_target_rehydrated_from_draft`, {
        ownerUlid,
        targetUlid,
        campaignKey
      });
      includedTargets.push(await describeLocationForMaterialization(env, targetUlid));
    }
  } else if (scope === "all") {
    if (eligibleLocations.length) includedTargets = eligibleLocations.map((loc) => ({ ...loc }));
    else includedTargets = [await describeLocationForMaterialization(env, ownerUlid, locationSlug)];
  } else {
    const currentLoc = eligibleByUlid.get(ownerUlid) ? { ...eligibleByUlid.get(ownerUlid) } : await describeLocationForMaterialization(env, ownerUlid, locationSlug);
    includedTargets = [currentLoc];
  }
  const seenTargets = /* @__PURE__ */ new Set();
  includedTargets = includedTargets.filter((loc) => {
    const id = String(loc?.ulid || "").trim();
    if (!id || seenTargets.has(id)) return false;
    seenTargets.add(id);
    return true;
  });
  if (!includedTargets.length) {
    return {
      ok: false,
      status: 409,
      body: { error: { code: "invalid_state", message: "campaign materialization resolved zero locations" } }
    };
  }
  if (Number(paidPlan?.maxPublishedLocations || 0) > 0 && includedTargets.length > Number(paidPlan?.maxPublishedLocations || 0)) {
    return { ok: false, status: 409, body: buildPlanUpgradeErrorBody(paidPlan, scope, includedTargets.length) };
  }
  const campaignGroupKey = scope === "single" ? "" : String(draft?.campaignGroupKey || deriveCampaignGroupKey(locationSlug, campaignKey)).trim();
  if (campaignGroupKey) {
    const parent = {
      campaignGroupKey,
      campaignKey,
      campaignScope: scope,
      campaignPreset,
      seedLocationULID: ownerUlid,
      seedLocationSlug: locationSlug,
      startDate: String(draft?.startDate || "").trim(),
      endDate: String(draft?.endDate || "").trim(),
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      stripeSessionId,
      planTier: normalizePlanTier(paidPlan?.tier),
      maxPublishedLocations: Math.max(0, Number(paidPlan?.maxPublishedLocations || 0) || 0)
    };
    await env.KV_STATUS.put(campaignGroupKeyKey(campaignGroupKey), JSON.stringify(parent));
  }
  for (const target of includedTargets) {
    await writeCampaignChildRow({
      env,
      targetUlid: target.ulid,
      targetSlug: target.slug,
      draft: { ...draft, campaignPreset },
      campaignGroupKey,
      stripeSessionId,
      inherited: false
    });
  }
  return {
    ok: true,
    campaignGroupKey,
    includedTargets,
    endDate: String(draft?.endDate || "").trim()
  };
}
__name(promoteCampaignDraftToActiveRows, "promoteCampaignDraftToActiveRows");
async function writeCampaignChildRow(params) {
  const { env, targetUlid, targetSlug, draft, campaignGroupKey, stripeSessionId, inherited } = params;
  const histKey = campaignsByUlidKey(targetUlid);
  const hist = await env.KV_STATUS.get(histKey, { type: "json" });
  const arr = Array.isArray(hist) ? hist : [];
  const row = {
    ...draft,
    locationID: targetUlid,
    locationULID: targetUlid,
    locationSlug: targetSlug,
    campaignGroupKey,
    campaignScope: normCampaignScope(draft?.campaignScope),
    status: "Active",
    promotedAt: (/* @__PURE__ */ new Date()).toISOString(),
    stripeSessionId
  };
  if (inherited) row.inheritedAt = (/* @__PURE__ */ new Date()).toISOString();
  const next = arr.filter((x) => {
    const sameKey = String(x?.campaignKey || "").trim() === String(row?.campaignKey || "").trim();
    const sameGroup = String(x?.campaignGroupKey || "").trim() === String(row?.campaignGroupKey || "").trim();
    return !(sameKey && sameGroup);
  });
  next.push(row);
  await env.KV_STATUS.put(histKey, JSON.stringify(next));
}
__name(writeCampaignChildRow, "writeCampaignChildRow");
async function materializeInheritedAllScopeForCurrentUlid(req, env, currentUlid) {
  const eligible = await eligibleLocationsForRequest(req, env, currentUlid);
  const eligibleByUlid = new Map(eligible.map((x) => [x.ulid, x]));
  const currentLoc = eligibleByUlid.get(currentUlid);
  if (!currentLoc) return { addedRows: 0, addedGroups: 0, blockedRows: 0, blockedGroups: 0, blockedPlanTier: "", blockedMaxPublishedLocations: 0 };
  const currentHistKey = campaignsByUlidKey(currentUlid);
  const currentHistRaw = await env.KV_STATUS.get(currentHistKey, { type: "json" });
  const currentRows = Array.isArray(currentHistRaw) ? currentHistRaw : [];
  const existing = new Set(
    currentRows.map((r) => `${String(r?.campaignGroupKey || "").trim()}::${String(r?.campaignKey || "").trim()}`).filter(Boolean)
  );
  const countIncludedForGroup = /* @__PURE__ */ __name(async (groupKey, campaignKey) => {
    let count = 0;
    for (const checkLoc of eligible) {
      const histRaw = await env.KV_STATUS.get(campaignsByUlidKey(checkLoc.ulid), { type: "json" });
      const rows = Array.isArray(histRaw) ? histRaw : [];
      const hit = rows.some(
        (r) => String(r?.campaignGroupKey || "").trim() === groupKey && String(r?.campaignKey || "").trim() === campaignKey && effectiveCampaignStatus(r) !== "finished"
      );
      if (hit) count += 1;
    }
    return count;
  }, "countIncludedForGroup");
  let addedRows = 0;
  let blockedRows = 0;
  const touchedGroups = /* @__PURE__ */ new Set();
  const blockedGroups = /* @__PURE__ */ new Set();
  let blockedPlanTier = "";
  let blockedMaxPublishedLocations = 0;
  const nowMs = Date.now();
  for (const loc of eligible) {
    const histRaw = await env.KV_STATUS.get(campaignsByUlidKey(loc.ulid), { type: "json" });
    const rows = Array.isArray(histRaw) ? histRaw : [];
    for (const row of rows) {
      const groupKey = String(row?.campaignGroupKey || "").trim();
      const campaignKey = String(row?.campaignKey || "").trim();
      if (!groupKey || !campaignKey) continue;
      if (normCampaignScope(row?.campaignScope) !== "all") continue;
      const st = effectiveCampaignStatus(row);
      if (st !== "active" && st !== "suspended") continue;
      const endMs = parseYmdUtcMs(String(row?.endDate || ""));
      if (Number.isFinite(endMs) && nowMs > endMs + 24 * 60 * 60 * 1e3 - 1) continue;
      const sig = `${groupKey}::${campaignKey}`;
      if (existing.has(sig)) continue;
      const parent = await env.KV_STATUS.get(campaignGroupKeyKey(groupKey), { type: "json" });
      const maxAllowed = Math.max(
        0,
        Number(parent?.maxPublishedLocations || row?.maxPublishedLocations || 0) || 0
      );
      if (maxAllowed > 0) {
        const includedCount = await countIncludedForGroup(groupKey, campaignKey);
        if (includedCount >= maxAllowed) {
          blockedRows += 1;
          blockedGroups.add(groupKey);
          if (!blockedPlanTier) blockedPlanTier = normalizePlanTier(parent?.planTier || row?.planTier);
          if (!blockedMaxPublishedLocations) blockedMaxPublishedLocations = maxAllowed;
          continue;
        }
      }
      await writeCampaignChildRow({
        env,
        targetUlid: currentUlid,
        targetSlug: currentLoc.slug,
        draft: row,
        campaignGroupKey: groupKey,
        stripeSessionId: String(row?.stripeSessionId || "").trim(),
        inherited: true
      });
      existing.add(sig);
      addedRows += 1;
      touchedGroups.add(groupKey);
    }
  }
  return { addedRows, addedGroups: touchedGroups.size, blockedRows, blockedGroups: blockedGroups.size, blockedPlanTier, blockedMaxPublishedLocations };
}
__name(materializeInheritedAllScopeForCurrentUlid, "materializeInheritedAllScopeForCurrentUlid");
function parseYmdUtcMs(s) {
  const v = String(s || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return NaN;
  const t = Date.parse(`${v}T00:00:00Z`);
  return Number.isFinite(t) ? t : NaN;
}
__name(parseYmdUtcMs, "parseYmdUtcMs");
function normStatus(v) {
  return String(v || "").trim().toLowerCase();
}
__name(normStatus, "normStatus");
function effectiveCampaignStatus(row) {
  const ov = normStatus(row.statusOverride);
  if (ov) return ov;
  return normStatus(row.status);
}
__name(effectiveCampaignStatus, "effectiveCampaignStatus");
async function campaignEntitlementForUlid(env, ulid, nowMs = Date.now()) {
  const plan = await readPlanEntitlementForUlid(env, ulid, nowMs);
  if (!plan.planEntitled) return { entitled: false, campaignKey: "", endDate: "" };
  try {
    const fast = await env.KV_STATUS.get(`campaigns:activeIndex:${ulid}`, { type: "json" });
    if (fast && typeof fast === "object") {
      const entitled = fast.entitled === true;
      const campaignKey2 = String(fast.campaignKey || "").trim();
      const endDate2 = String(fast.endDate || "").trim();
      if (entitled && campaignKey2 && /^\d{4}-\d{2}-\d{2}$/.test(endDate2)) {
        const endMs = parseYmdUtcMs(endDate2);
        if (Number.isFinite(endMs) && endMs >= nowMs) {
          return { entitled: true, campaignKey: campaignKey2, endDate: endDate2 };
        }
      }
    }
  } catch {
  }
  const raw = await env.KV_STATUS.get(campaignsByUlidKey(ulid), { type: "json" });
  const rows = Array.isArray(raw) ? raw : [];
  if (!rows.length) return { entitled: false, campaignKey: "", endDate: "" };
  const active = [];
  for (const row of rows) {
    if (!row || String(row.locationID || "").trim() !== ulid) continue;
    const st = effectiveCampaignStatus(row);
    if (st !== "active") continue;
    const startMs = parseYmdUtcMs(String(row.startDate || ""));
    const endMs = parseYmdUtcMs(String(row.endDate || ""));
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) continue;
    if (nowMs < startMs) continue;
    if (nowMs > endMs + 24 * 60 * 60 * 1e3 - 1) continue;
    active.push({ row, startMs, endMs });
  }
  if (!active.length) return { entitled: false, campaignKey: "", endDate: "" };
  active.sort((a, b) => {
    if (a.endMs !== b.endMs) return a.endMs - b.endMs;
    return b.startMs - a.startMs;
  });
  const winner = active[0].row;
  const campaignKey = String(winner.campaignKey || "").trim();
  const endDate = String(winner.endDate || "").trim();
  return { entitled: true, campaignKey, endDate };
}
__name(campaignEntitlementForUlid, "campaignEntitlementForUlid");
async function computeVisibilityState(env, ulid, nowMs = Date.now()) {
  const entitlement = await readPlanEntitlementForUlid(env, ulid, nowMs);
  return {
    visibilityState: entitlement.visibilityState,
    ownedNow: entitlement.ownedNow,
    exclusiveUntil: entitlement.exclusiveUntil,
    courtesyUntil: "",
    planEntitled: entitlement.planEntitled,
    activePaidPlan: entitlement.activePaidPlan,
    publicRecordMode: entitlement.publicRecordMode,
    externallyIndexable: entitlement.externallyIndexable,
    lpmNotSuppressed: entitlement.lpmNotSuppressed
  };
}
__name(computeVisibilityState, "computeVisibilityState");
async function readPrivateShellDraft(env, draftULID, draftSessionId) {
  const key = `override_draft:${draftULID}:${draftSessionId}`;
  const hitJson = await env.KV_STATUS.get(key, { type: "json" });
  if (hitJson) return hitJson;
  const hitText = await env.KV_STATUS.get(key, "text");
  if (!hitText) return null;
  try {
    return JSON.parse(hitText);
  } catch {
    return { raw: hitText };
  }
}
__name(readPrivateShellDraft, "readPrivateShellDraft");
async function resolveTargetIdentity(env, input, opts = {}) {
  const locationID = String(input?.locationID || "").trim();
  const draftULID = String(input?.draftULID || "").trim();
  const draftSessionId = String(input?.draftSessionId || "").trim();
  const hasLocation = !!locationID;
  const hasDraft = !!draftULID || !!draftSessionId;
  if (hasLocation && hasDraft || !hasLocation && !hasDraft) return null;
  if (hasLocation) {
    const ulid = await resolveUid(locationID, env);
    if (!ulid) return null;
    return {
      route: "existing-location",
      ulid,
      locationID,
      draftULID: "",
      draftSessionId: ""
    };
  }
  if (!ULID_RE.test(draftULID) || !draftSessionId) return null;
  if (opts.validateDraft) {
    const draft = await readPrivateShellDraft(env, draftULID, draftSessionId);
    if (!draft) return null;
  }
  return {
    route: "brand-new-private-shell",
    ulid: draftULID,
    locationID: "",
    draftULID,
    draftSessionId
  };
}
__name(resolveTargetIdentity, "resolveTargetIdentity");
async function fetchLegacyProfilesJson(req) {
  const origin = req.headers.get("Origin") || "https://navigen.io";
  const src = new URL("/data/profiles.json", origin).toString();
  const resp = await fetch(src, {
    cf: { cacheTtl: 60, cacheEverything: true },
    headers: { Accept: "application/json" }
  });
  if (!resp.ok) throw new Error("profiles_json_not_reachable");
  return await resp.json();
}
__name(fetchLegacyProfilesJson, "fetchLegacyProfilesJson");
function legacyLocationsArray(data) {
  return Array.isArray(data?.locations) ? data.locations : data?.locations && typeof data.locations === "object" ? Object.values(data.locations) : [];
}
__name(legacyLocationsArray, "legacyLocationsArray");
function legacyLocationSlug(rec) {
  return String(rec?.locationID || "").trim();
}
__name(legacyLocationSlug, "legacyLocationSlug");
function legacyLocationEmbeddedUlid(rec) {
  const raw = String(rec?.ID || rec?.id || "").trim();
  return ULID_RE.test(raw) ? raw : "";
}
__name(legacyLocationEmbeddedUlid, "legacyLocationEmbeddedUlid");
async function resolveLegacyLocationUlid(rec, env) {
  const slug = legacyLocationSlug(rec);
  const embedded = legacyLocationEmbeddedUlid(rec);
  if (embedded) return embedded;
  if (slug) {
    const mapped = await resolveUid(slug, env);
    if (mapped) return mapped;
  }
  return "";
}
__name(resolveLegacyLocationUlid, "resolveLegacyLocationUlid");
function buildLegacyProfileBase(rec, ulid) {
  const out = rec && typeof rec === "object" ? JSON.parse(JSON.stringify(rec)) : {};
  const slug = legacyLocationSlug(rec);
  if (slug) out.locationID = slug;
  out.locationUID = ulid;
  return out;
}
__name(buildLegacyProfileBase, "buildLegacyProfileBase");
async function preseedLegacyLocationRecord(env, rec, opts = {}) {
  const slug = legacyLocationSlug(rec);
  const ulid = await resolveLegacyLocationUlid(rec, env);
  if (!slug) return { ok: false, slug: "", ulid: "", reason: "missing_slug" };
  if (!ulid) return { ok: false, slug, ulid: "", reason: "missing_ulid" };
  const baseKey = `profile_base:${ulid}`;
  const existing = await env.KV_STATUS.get(baseKey, "text");
  const force = !!opts.force;
  await env.KV_ALIASES.put(aliasKey(slug), JSON.stringify({ locationID: ulid }));
  if (existing && !force) {
    return { ok: true, slug, ulid, skipped: true };
  }
  const base = buildLegacyProfileBase(rec, ulid);
  await env.KV_STATUS.put(baseKey, JSON.stringify(base));
  if (existing && force) {
    return { ok: true, slug, ulid, overwritten: true };
  }
  return { ok: true, slug, ulid, created: true };
}
__name(preseedLegacyLocationRecord, "preseedLegacyLocationRecord");
async function backfillPublishedLocationDoState(env, ulid, opts = {}) {
  const id = String(ulid || "").trim();
  if (!ULID_RE.test(id)) {
    return { ok: false, ulid: id, slug: "", reason: "invalid_ulid" };
  }
  const rec = await readPublishedEffectiveProfileByUlid(id, env);
  if (!rec) {
    return { ok: false, ulid: id, slug: "", reason: "missing_profile_base" };
  }
  const vis = await computeVisibilityState(env, id);
  const purgeContexts = uniqueTrimmedStrings(Array.isArray(opts.purgeContexts) ? opts.purgeContexts : []);
  await syncPublishedDoIndex(env, {
    ulid: id,
    slug: rec.locationID,
    prevProfile: purgeContexts.length ? { context: purgeContexts.join(";") } : {},
    nextProfile: rec.effective,
    visibilityState: vis.visibilityState
  });
  return {
    ok: true,
    ulid: id,
    slug: rec.locationID,
    visibilityState: vis.visibilityState,
    indexed: vis.visibilityState !== "hidden"
  };
}
__name(backfillPublishedLocationDoState, "backfillPublishedLocationDoState");
function isAdminPreseedAuthorized(req, env) {
  const auth = String(req.headers.get("Authorization") || "").trim();
  const secret = String(env.JWT_SECRET || "").trim();
  if (!secret) return false;
  return auth === `Bearer ${secret}`;
}
__name(isAdminPreseedAuthorized, "isAdminPreseedAuthorized");
async function increment(kv, key) {
  const current = parseInt(await kv.get(key) || "0", 10) || 0;
  await kv.put(key, String(current + 1));
}
__name(increment, "increment");
async function logQrScan(kv, env, loc, req) {
  try {
    const now = /* @__PURE__ */ new Date();
    const day = dayKeyFor(now, void 0, req.cf?.country || "");
    const timeISO = now.toISOString();
    const ua = req.headers.get("User-Agent") || "";
    const lang = req.headers.get("Accept-Language") || "";
    const country = (req.cf?.country || "").toString();
    const city = (req.cf?.city || "").toString();
    const source = "qr-scan";
    const signal = "scan";
    const visitor = `${ua}|${country}`;
    const campaignKey = "";
    const bytes = new Uint8Array(6);
    crypto.getRandomValues(bytes);
    const scanId = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
    const entry = {
      time: timeISO,
      locationID: loc,
      day,
      ua,
      lang,
      country,
      city,
      source,
      signal,
      visitor,
      campaignKey
    };
    const key = `qrlog:${loc}:${day}:${scanId}`;
    const ttlSeconds = 56 * 24 * 60 * 60;
    await kv.put(key, JSON.stringify(entry), { expirationTtl: ttlSeconds });
  } catch {
  }
}
__name(logQrScan, "logQrScan");
async function logQrArmed(kv, _env, loc, req, campaignKey) {
  try {
    const now = /* @__PURE__ */ new Date();
    const day = dayKeyFor(now, void 0, req.cf?.country || "");
    const timeISO = now.toISOString();
    const ua = req.headers.get("User-Agent") || "";
    const lang = req.headers.get("Accept-Language") || "";
    const country = (req.cf?.country || "").toString();
    const city = (req.cf?.city || "").toString();
    const source = "qr-redeem";
    const signal = "armed";
    const visitor = `${ua}|${country}`;
    const keyBytes = new Uint8Array(6);
    crypto.getRandomValues(keyBytes);
    const scanId = Array.from(keyBytes).map((b) => b.toString(16).padStart(2, "0")).join("");
    const entry = {
      time: timeISO,
      locationID: loc,
      day,
      ua,
      lang,
      country,
      city,
      source,
      signal,
      visitor,
      campaignKey
    };
    const key = `qrlog:${loc}:${day}:${scanId}`;
    const ttlSeconds = 56 * 24 * 60 * 60;
    await kv.put(key, JSON.stringify(entry), { expirationTtl: ttlSeconds });
  } catch {
  }
}
__name(logQrArmed, "logQrArmed");
async function logQrRedeem(kv, env, loc, req, campaignKey = "") {
  try {
    const now = /* @__PURE__ */ new Date();
    const day = dayKeyFor(now, void 0, req.cf?.country || "");
    const timeISO = now.toISOString();
    const ua = req.headers.get("X-NG-UA") || req.headers.get("User-Agent") || "";
    const lang = req.headers.get("X-NG-Lang") || req.headers.get("Accept-Language") || "";
    const country = (req.cf?.country || "").toString();
    const city = (req.cf?.city || "").toString();
    const source = "qr-redeem";
    const signal = "redeem";
    const visitor = `${ua}|${country}`;
    const ck = String(campaignKey || "").trim();
    const bytes = new Uint8Array(6);
    crypto.getRandomValues(bytes);
    const scanId = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
    const entry = {
      time: timeISO,
      locationID: loc,
      day,
      ua,
      lang,
      country,
      city,
      source,
      signal,
      visitor,
      campaignKey: ck
    };
    const key = `qrlog:${loc}:${day}:${scanId}`;
    const ttlSeconds = 56 * 24 * 60 * 60;
    await kv.put(key, JSON.stringify(entry), { expirationTtl: ttlSeconds });
  } catch {
  }
}
__name(logQrRedeem, "logQrRedeem");
async function logQrRedeemInvalid(kv, env, loc, req, campaignKey = "") {
  try {
    const now = /* @__PURE__ */ new Date();
    const day = dayKeyFor(now, void 0, req.cf?.country || "");
    const timeISO = now.toISOString();
    const ua = req.headers.get("X-NG-UA") || req.headers.get("User-Agent") || "";
    const lang = req.headers.get("X-NG-Lang") || req.headers.get("Accept-Language") || "";
    const country = (req.cf?.country || "").toString();
    const city = (req.cf?.city || "").toString();
    const source = "qr-redeem";
    const signal = "invalid";
    const visitor = `${ua}|${country}`;
    const ck = String(campaignKey || "").trim();
    const bytes = new Uint8Array(6);
    crypto.getRandomValues(bytes);
    const scanId = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
    const entry = {
      time: timeISO,
      locationID: loc,
      day,
      ua,
      lang,
      country,
      city,
      source,
      signal,
      visitor,
      campaignKey: ck
    };
    const key = `qrlog:${loc}:${day}:${scanId}`;
    const ttlSeconds = 56 * 24 * 60 * 60;
    await kv.put(key, JSON.stringify(entry), { expirationTtl: ttlSeconds });
  } catch {
  }
}
__name(logQrRedeemInvalid, "logQrRedeemInvalid");
async function createRedeemToken(kv, locationID, campaignKey) {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const token = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  const record = {
    locationID,
    campaignKey,
    status: "fresh",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  const key = `redeem:${token}`;
  const ttlSeconds = 56 * 24 * 60 * 60;
  await kv.put(key, JSON.stringify(record), { expirationTtl: ttlSeconds });
  return token;
}
__name(createRedeemToken, "createRedeemToken");
async function consumeRedeemToken(kv, token, locationID, campaignKey) {
  if (!token) return "invalid";
  const key = `redeem:${token}`;
  const raw = await kv.get(key, "text");
  if (!raw) return "invalid";
  let rec;
  try {
    rec = JSON.parse(raw);
  } catch {
    return "invalid";
  }
  if (rec.locationID !== locationID || rec.campaignKey !== campaignKey) {
    return "invalid";
  }
  if (rec.status === "redeemed") {
    return "used";
  }
  if (rec.status !== "fresh") {
    return "invalid";
  }
  rec.status = "redeemed";
  await kv.put(key, JSON.stringify(rec));
  return "ok";
}
__name(consumeRedeemToken, "consumeRedeemToken");

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
init_modules_watch_stub();
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
init_modules_watch_stub();
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-c2n5Pe/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/common.ts
init_modules_watch_stub();
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-c2n5Pe/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  ContextShardDO,
  PlanAllocDO,
  SearchShardDO,
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
