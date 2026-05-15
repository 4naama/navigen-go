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

// .wrangler/tmp/bundle-L2zxPy/middleware-loader.entry.ts
init_modules_watch_stub();

// .wrangler/tmp/bundle-L2zxPy/middleware-insertion-facade.js
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
var PLAN_SELECTION_TTL_SECONDS = 60 * 60;
var PRICE_ID_TO_PLAN = {
  "price_1TDfBIFf2RZOYEdOobudnFRW": {
    tier: "standard",
    grossAmount: 1,
    // TESTING until launch; launch amount is documented as 79 EUR.
    currency: "EUR",
    maxPublishedLocations: 1,
    maxConcurrentPromoQrCampaignsPerLocation: 3,
    activeDurationDays: 30,
    allowedPlanModes: ["managed_presence", "campaign_with_promo_qr"]
  },
  "price_1TDfBtFf2RZOYEdOGIfPn6uu": {
    tier: "multi",
    grossAmount: 2,
    // TESTING until launch; launch amount is documented as 179 EUR.
    currency: "EUR",
    maxPublishedLocations: 3,
    maxConcurrentPromoQrCampaignsPerLocation: 5,
    activeDurationDays: 30,
    allowedPlanModes: ["managed_presence", "campaign_with_promo_qr"]
  },
  "price_1TDfDfFf2RZOYEdOFicVRcQ8": {
    tier: "large",
    grossAmount: 349,
    currency: "EUR",
    maxPublishedLocations: 10,
    maxConcurrentPromoQrCampaignsPerLocation: 10,
    activeDurationDays: 30,
    allowedPlanModes: ["managed_presence", "campaign_with_promo_qr"]
  },
  "price_1TDfFaFf2RZOYEdOXzIMBxbO": {
    tier: "network",
    grossAmount: 749,
    currency: "EUR",
    maxPublishedLocations: 1e4,
    maxConcurrentPromoQrCampaignsPerLocation: 20,
    activeDurationDays: 30,
    allowedPlanModes: ["managed_presence", "campaign_with_promo_qr"]
  }
};
var PLAN_CODE_TO_PRICE_ID = {
  standard: "price_1TDfBIFf2RZOYEdOobudnFRW",
  // TESTING: real Stripe price id for €1
  multi: "price_1TDfBtFf2RZOYEdOGIfPn6uu",
  // TESTING: real Stripe price id for €2
  large: "price_1TDfDfFf2RZOYEdOFicVRcQ8",
  // Stripe Dashboard price id for Large
  network: "price_1TDfFaFf2RZOYEdOXzIMBxbO"
  // Stripe Dashboard price id for Network
};
function normalizePlanTier(v) {
  const s = String(v || "").trim().toLowerCase();
  if (s === "standard" || s === "multi" || s === "large" || s === "network") return s;
  return "unknown";
}
__name(normalizePlanTier, "normalizePlanTier");
function normalizePlanMode(v, legacyPreset) {
  const s = String(v || "").trim().toLowerCase();
  if (s === "managed_presence") return "managed_presence";
  if (s === "campaign_with_promo_qr") return "campaign_with_promo_qr";
  const legacy = String(legacyPreset || "").trim().toLowerCase();
  if (legacy === "visibility") return "managed_presence";
  if (legacy === "promotion") return "campaign_with_promo_qr";
  return "campaign_with_promo_qr";
}
__name(normalizePlanMode, "normalizePlanMode");
function normalizeInitiationType(v) {
  const s = String(v || "").trim().toLowerCase();
  if (s === "partner_assisted" || s === "agent") return "partner_assisted";
  if (s === "platform") return "platform";
  if (s === "public" || s === "owner" || !s) return "owner";
  return s;
}
__name(normalizeInitiationType, "normalizeInitiationType");
function planDefinitionForPriceId(priceId) {
  const id = String(priceId || "").trim();
  const mapped = PRICE_ID_TO_PLAN[id];
  if (!id || !mapped || normalizePlanTier(mapped.tier) === "unknown") return null;
  return {
    priceId: id,
    tier: normalizePlanTier(mapped.tier),
    grossAmount: Math.max(0, Number(mapped.grossAmount || 0) || 0),
    currency: String(mapped.currency || "EUR").trim().toUpperCase() || "EUR",
    maxPublishedLocations: Math.max(0, Number(mapped.maxPublishedLocations || 0) || 0),
    maxConcurrentPromoQrCampaignsPerLocation: Math.max(0, Number(mapped.maxConcurrentPromoQrCampaignsPerLocation || 0) || 0),
    activeDurationDays: Math.max(1, Number(mapped.activeDurationDays || 30) || 30),
    allowedPlanModes: Array.isArray(mapped.allowedPlanModes) && mapped.allowedPlanModes.length ? mapped.allowedPlanModes : ["managed_presence", "campaign_with_promo_qr"]
  };
}
__name(planDefinitionForPriceId, "planDefinitionForPriceId");
function planDefinitionForCode(planCode) {
  const code = String(planCode || "").trim().toLowerCase();
  const priceId = String(PLAN_CODE_TO_PRICE_ID[code] || "").trim();
  if (!priceId) return null;
  const mapped = planDefinitionForPriceId(priceId);
  if (!mapped) return null;
  return { code, ...mapped };
}
__name(planDefinitionForCode, "planDefinitionForCode");
function planSelectionKey(selectionId) {
  return `plan_selection:${selectionId}`;
}
__name(planSelectionKey, "planSelectionKey");
function planAllocKey(paymentIntentId) {
  return `plan_alloc:${paymentIntentId}`;
}
__name(planAllocKey, "planAllocKey");
function planPurchaseLedgerKey(paymentIntentId) {
  return `ledger:PlanPurchase:${paymentIntentId}`;
}
__name(planPurchaseLedgerKey, "planPurchaseLedgerKey");
function stripeProcessedKey(paymentIntentId) {
  return `stripe_processed:${paymentIntentId}`;
}
__name(stripeProcessedKey, "stripeProcessedKey");
function stripeCheckoutSessionPurchasedAtMs(session) {
  const createdSeconds = Number(session?.created || 0);
  if (Number.isFinite(createdSeconds) && createdSeconds > 0) {
    return Math.floor(createdSeconds * 1e3);
  }
  return Date.now();
}
__name(stripeCheckoutSessionPurchasedAtMs, "stripeCheckoutSessionPurchasedAtMs");
function parseIsoMsSafe(value) {
  const ms = Date.parse(String(value || "").trim());
  return Number.isFinite(ms) ? ms : NaN;
}
__name(parseIsoMsSafe, "parseIsoMsSafe");
function mintPlanSelectionId() {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return `ps_${bytesToB64url(bytes)}`;
}
__name(mintPlanSelectionId, "mintPlanSelectionId");
function planRecordFromDefinition(def, purchasedAt, expiresAt, initiationType, planMode) {
  return {
    priceId: def.priceId,
    tier: normalizePlanTier(def.tier),
    grossAmount: Math.max(0, Number(def.grossAmount || 0) || 0),
    currency: String(def.currency || "EUR").trim().toUpperCase() || "EUR",
    maxPublishedLocations: Math.max(0, Number(def.maxPublishedLocations || 0) || 0),
    maxConcurrentPromoQrCampaignsPerLocation: Math.max(0, Number(def.maxConcurrentPromoQrCampaignsPerLocation || 0) || 0),
    activeDurationDays: Math.max(1, Number(def.activeDurationDays || 30) || 30),
    purchasedAt,
    expiresAt,
    initiationType: normalizeInitiationType(initiationType),
    planMode
  };
}
__name(planRecordFromDefinition, "planRecordFromDefinition");
function normalizePersistedPlanRecord(plan, ownershipExpiresAtIso = "") {
  if (!plan || typeof plan !== "object") return null;
  const priceId = String(plan?.priceId || "").trim();
  const def = planDefinitionForPriceId(priceId);
  if (!def) return null;
  const planMode = normalizePlanMode(plan?.planMode, plan?.campaignPreset);
  const expiresAt = String(plan?.expiresAt || ownershipExpiresAtIso || "").trim();
  const purchasedAt = String(plan?.purchasedAt || "").trim();
  if (!expiresAt) return null;
  return planRecordFromDefinition(
    def,
    purchasedAt,
    expiresAt,
    normalizeInitiationType(plan?.initiationType),
    planMode
  );
}
__name(normalizePersistedPlanRecord, "normalizePersistedPlanRecord");
async function fetchStripeCheckoutSession(sk, checkoutSessionId) {
  const url = `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(checkoutSessionId)}`;
  const r = await fetch(url, { method: "GET", headers: { Authorization: `Bearer ${sk}` } });
  const txt = await r.text();
  let sess = null;
  try {
    sess = JSON.parse(txt);
  } catch {
    sess = null;
  }
  if (!r.ok || !sess) throw new Error(`stripe_checkout_session_fetch_failed:${r.status}`);
  return sess;
}
__name(fetchStripeCheckoutSession, "fetchStripeCheckoutSession");
async function fetchStripeCheckoutSessionByPaymentIntent(sk, paymentIntentId) {
  const listUrl = `https://api.stripe.com/v1/checkout/sessions?payment_intent=${encodeURIComponent(paymentIntentId)}&limit=1`;
  const r = await fetch(listUrl, { method: "GET", headers: { Authorization: `Bearer ${sk}` } });
  const txt = await r.text();
  let out = null;
  try {
    out = JSON.parse(txt);
  } catch {
    out = null;
  }
  const sess = out?.data && Array.isArray(out.data) && out.data.length ? out.data[0] : null;
  if (!r.ok || !sess) throw new Error(`stripe_checkout_session_lookup_failed:${r.status}`);
  return sess;
}
__name(fetchStripeCheckoutSessionByPaymentIntent, "fetchStripeCheckoutSessionByPaymentIntent");
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
async function readExistingPlanReconciliation(env, paymentIntentId, checkoutSessionId, nowMs = Date.now()) {
  const planRaw = await env.KV_STATUS.get(`plan:${paymentIntentId}`, { type: "json" });
  const plan = normalizePersistedPlanRecord(planRaw);
  if (!plan) return null;
  const planExp = new Date(plan.expiresAt);
  if (Number.isNaN(planExp.getTime()) || planExp.getTime() <= nowMs) return null;
  const allocRaw = await env.KV_STATUS.get(planAllocKey(paymentIntentId), { type: "json" });
  const allocUlids = uniqueTrimmedStrings(Array.isArray(allocRaw?.ulids) ? allocRaw.ulids : Array.isArray(allocRaw?.coveredUlids) ? allocRaw.coveredUlids : []).filter((id) => ULID_RE.test(id));
  if (!allocUlids.length) return null;
  const activeUlids = [];
  for (const ulid of allocUlids) {
    const own = await env.KV_STATUS.get(`ownership:${ulid}`, { type: "json" });
    const ownExpIso = String(own?.exclusiveUntil || "").trim();
    const ownExp = ownExpIso ? new Date(ownExpIso) : null;
    if (String(own?.lastEventId || "").trim() === paymentIntentId && ownExp && !Number.isNaN(ownExp.getTime()) && ownExp.getTime() > nowMs && ownExp.getTime() === planExp.getTime()) {
      activeUlids.push(ulid);
    }
  }
  if (!activeUlids.length) return null;
  const allocation = {
    ver: 1,
    paymentIntentId,
    checkoutSessionId,
    planSelectionId: String(allocRaw?.planSelectionId || "").trim(),
    ulids: activeUlids,
    priceId: plan.priceId,
    tier: plan.tier,
    planMode: plan.planMode,
    initiationType: plan.initiationType,
    purchasedAt: plan.purchasedAt,
    expiresAt: plan.expiresAt,
    route: String(allocRaw?.route || "").trim(),
    campaignKey: String(allocRaw?.campaignKey || "").trim(),
    navigenVersion: String(allocRaw?.navigenVersion || "").trim(),
    partnerId: String(allocRaw?.partnerId || "").trim(),
    partnerLeadId: String(allocRaw?.partnerLeadId || "").trim(),
    partnerHandoffId: String(allocRaw?.partnerHandoffId || "").trim(),
    commissionPolicyVersion: String(allocRaw?.commissionPolicyVersion || "").trim()
  };
  return {
    paymentIntentId,
    checkoutSessionId,
    planSelectionId: allocation.planSelectionId,
    primaryUlid: activeUlids[0],
    locationID: String(allocRaw?.locationID || "").trim(),
    coveredUlids: activeUlids,
    plan,
    allocation,
    alreadyProcessed: true
  };
}
__name(readExistingPlanReconciliation, "readExistingPlanReconciliation");
async function resolveCoveredTargetsForPaidSession(env, session, meta, nowMs, alreadyProcessed) {
  const planSelectionId = String(meta?.planSelectionId || "").trim();
  let selection = null;
  if (planSelectionId) {
    selection = await env.KV_STATUS.get(planSelectionKey(planSelectionId), { type: "json" });
    if (!selection || typeof selection !== "object") throw new Error("plan_selection_missing");
    const expIso = String(selection?.expiresAt || "").trim();
    const exp = expIso ? new Date(expIso) : null;
    if (!alreadyProcessed && (!exp || Number.isNaN(exp.getTime()) || exp.getTime() <= nowMs)) {
      throw new Error("plan_selection_expired");
    }
  }
  const planMode = normalizePlanMode(selection?.planMode || meta?.planMode, meta?.campaignPreset);
  const initiationType = normalizeInitiationType(selection?.initiationType || meta?.initiationType);
  const campaignKey = String(selection?.campaignKey || meta?.campaignKey || "").trim();
  const navigenVersion = String(selection?.navigenVersion || meta?.navigenVersion || "").trim();
  const partnerId = String(selection?.partnerId || meta?.partnerId || "").trim();
  const partnerLeadId = String(selection?.partnerLeadId || meta?.partnerLeadId || "").trim();
  const partnerHandoffId = String(selection?.partnerHandoffId || meta?.partnerHandoffId || "").trim();
  const commissionPolicyVersion = String(selection?.commissionPolicyVersion || meta?.commissionPolicyVersion || "").trim();
  if (selection) {
    let coveredUlids = uniqueTrimmedStrings(Array.isArray(selection?.coveredUlids) ? selection.coveredUlids : Array.isArray(selection?.coveredULIDs) ? selection.coveredULIDs : []).filter((id) => ULID_RE.test(id));
    if (!coveredUlids.length) {
      const locationIDs2 = uniqueTrimmedStrings(Array.isArray(selection?.locationIDs) ? selection.locationIDs : []);
      for (const slug of locationIDs2) {
        if (ULID_RE.test(slug)) throw new Error("plan_selection_location_id_must_be_slug");
        const resolved = await resolveUid(slug, env).catch(() => null);
        if (resolved && ULID_RE.test(resolved)) coveredUlids.push(resolved);
      }
    }
    if (!coveredUlids.length) {
      const draftULID = String(selection?.draftULID || "").trim();
      const draftSessionId = String(selection?.draftSessionId || "").trim();
      if (ULID_RE.test(draftULID) && draftSessionId) {
        const draft = await readPrivateShellDraft(env, draftULID, draftSessionId).catch(() => null);
        if (!draft) throw new Error("plan_selection_draft_missing");
        coveredUlids = [draftULID];
      }
    }
    coveredUlids = uniqueTrimmedStrings(coveredUlids).filter((id) => ULID_RE.test(id));
    if (!coveredUlids.length) throw new Error("plan_selection_no_covered_ulids");
    const locationIDs = uniqueTrimmedStrings(Array.isArray(selection?.locationIDs) ? selection.locationIDs : []);
    return {
      planSelectionId,
      selection,
      coveredUlids,
      primaryUlid: coveredUlids[0],
      locationID: locationIDs[0] || String(meta?.locationID || "").trim(),
      route: String(selection?.route || "plan_selection").trim() || "plan_selection",
      planMode,
      initiationType,
      campaignKey,
      navigenVersion,
      partnerId,
      partnerLeadId,
      partnerHandoffId,
      commissionPolicyVersion
    };
  }
  const hasLegacyTarget = !!String(meta?.locationID || meta?.draftULID || meta?.draftSessionId || "").trim();
  if (!hasLegacyTarget) throw new Error("ignored_no_plan_metadata");
  const target = await resolveTargetIdentity(env, {
    locationID: meta?.locationID,
    draftULID: meta?.draftULID,
    draftSessionId: meta?.draftSessionId
  }, { validateDraft: true });
  if (!target || !ULID_RE.test(target.ulid)) throw new Error("legacy_target_unresolved");
  return {
    planSelectionId: "",
    selection: null,
    coveredUlids: [target.ulid],
    primaryUlid: target.ulid,
    locationID: target.locationID,
    route: target.route,
    planMode,
    initiationType,
    campaignKey,
    navigenVersion,
    partnerId,
    partnerLeadId,
    partnerHandoffId,
    commissionPolicyVersion
  };
}
__name(resolveCoveredTargetsForPaidSession, "resolveCoveredTargetsForPaidSession");
async function reconcilePaidCheckoutSessionPlan(env, sk, session, opts = {}) {
  const checkoutSessionId = String(session?.id || "").trim();
  if (!checkoutSessionId) throw new Error("checkout_session_id_missing");
  const paymentStatus = String(session?.payment_status || "").toLowerCase();
  const status = String(session?.status || "").toLowerCase();
  if (paymentStatus !== "paid" || status !== "complete") throw new Error("checkout_session_not_paid_complete");
  const paymentIntentId = String(session?.payment_intent || "").trim();
  if (!paymentIntentId || !/^pi_/i.test(paymentIntentId)) throw new Error("payment_intent_missing");
  const processedAt = /* @__PURE__ */ new Date();
  const nowMs = processedAt.getTime();
  const purchaseMs = stripeCheckoutSessionPurchasedAtMs(session);
  const purchasedAtDate = new Date(purchaseMs);
  const idemKey = stripeProcessedKey(paymentIntentId);
  const alreadyProcessedMarker = await env.KV_STATUS.get(idemKey, "text");
  const existing = alreadyProcessedMarker ? await readExistingPlanReconciliation(env, paymentIntentId, checkoutSessionId, nowMs).catch(() => null) : null;
  if (existing) return existing;
  const meta = session?.metadata && typeof session.metadata === "object" ? session.metadata : {};
  const target = await resolveCoveredTargetsForPaidSession(env, session, meta, nowMs, !!alreadyProcessedMarker);
  const priceId = await fetchStripeCheckoutLineItemPriceId(sk, checkoutSessionId);
  const def = planDefinitionForPriceId(priceId);
  if (!def) throw new Error("plan_price_unknown");
  if (!def.allowedPlanModes.includes(target.planMode)) throw new Error("plan_mode_not_allowed_for_price");
  if (def.maxPublishedLocations <= 0) throw new Error("plan_capacity_zero");
  if (target.coveredUlids.length > def.maxPublishedLocations) throw new Error("plan_capacity_exceeded");
  let alreadyAppliedExpMs = 0;
  const previousOwnershipRows = [];
  for (const ulid of target.coveredUlids) {
    const own = await env.KV_STATUS.get(`ownership:${ulid}`, { type: "json" });
    previousOwnershipRows.push(own || null);
    const ownExpIso = String(own?.exclusiveUntil || "").trim();
    const ownExp = ownExpIso ? new Date(ownExpIso) : null;
    if (String(own?.lastEventId || "").trim() === paymentIntentId && ownExp && !Number.isNaN(ownExp.getTime()) && ownExp.getTime() > nowMs) {
      alreadyAppliedExpMs = Math.max(alreadyAppliedExpMs, ownExp.getTime());
    }
  }
  let expiresAt;
  if (alreadyAppliedExpMs > 0) {
    expiresAt = new Date(alreadyAppliedExpMs);
  } else {
    let baseMs = purchaseMs;
    const stackingToleranceMs = 5 * 60 * 1e3;
    for (const own of previousOwnershipRows) {
      const prevExMs = parseIsoMsSafe(own?.exclusiveUntil);
      const prevUpdatedAtMs = parseIsoMsSafe(own?.updatedAt || own?.createdAt);
      const prevLastEventId = String(own?.lastEventId || "").trim();
      const canStackFromPreviousCoverage = prevLastEventId !== paymentIntentId && Number.isFinite(prevUpdatedAtMs) && prevUpdatedAtMs <= purchaseMs + stackingToleranceMs;
      if (canStackFromPreviousCoverage && Number.isFinite(prevExMs) && prevExMs > baseMs) {
        baseMs = prevExMs;
      }
    }
    expiresAt = new Date(baseMs + def.activeDurationDays * 24 * 60 * 60 * 1e3);
  }
  if (expiresAt.getTime() <= nowMs) {
    throw new Error("plan_coverage_already_expired");
  }
  const purchasedAt = purchasedAtDate.toISOString();
  const processedAtIso = processedAt.toISOString();
  const plan = planRecordFromDefinition(def, purchasedAt, expiresAt.toISOString(), target.initiationType, target.planMode);
  const allocation = {
    ver: 1,
    paymentIntentId,
    checkoutSessionId,
    planSelectionId: target.planSelectionId,
    ulids: target.coveredUlids,
    priceId: plan.priceId,
    tier: plan.tier,
    planMode: plan.planMode,
    initiationType: plan.initiationType,
    purchasedAt: plan.purchasedAt,
    expiresAt: plan.expiresAt,
    route: target.route,
    campaignKey: target.planMode === "campaign_with_promo_qr" ? target.campaignKey : "",
    navigenVersion: target.navigenVersion,
    partnerId: target.partnerId,
    partnerLeadId: target.partnerLeadId,
    partnerHandoffId: target.partnerHandoffId,
    commissionPolicyVersion: target.commissionPolicyVersion
  };
  await env.KV_STATUS.put(`plan:${paymentIntentId}`, JSON.stringify(plan));
  await env.KV_STATUS.put(planAllocKey(paymentIntentId), JSON.stringify(allocation));
  await env.KV_STATUS.put(planPurchaseLedgerKey(paymentIntentId), JSON.stringify({
    ver: 1,
    type: "PlanPurchase",
    paymentIntentId,
    checkoutSessionId,
    planSelectionId: target.planSelectionId,
    createdAt: purchasedAt,
    amount: plan.grossAmount,
    currency: plan.currency,
    tier: plan.tier,
    planMode: plan.planMode,
    ulids: target.coveredUlids,
    initiationType: plan.initiationType,
    navigenVersion: target.navigenVersion,
    partnerId: target.partnerId,
    partnerLeadId: target.partnerLeadId,
    partnerHandoffId: target.partnerHandoffId,
    commissionPolicyVersion: target.commissionPolicyVersion,
    source: opts.logTag || "plan_reconcile"
  }));
  for (const ulid of target.coveredUlids) {
    await env.KV_STATUS.put(`ownership:${ulid}`, JSON.stringify({
      uid: ulid,
      state: "owned",
      exclusiveUntil: plan.expiresAt,
      source: "plan",
      lastEventId: paymentIntentId,
      updatedAt: purchasedAt
    }));
  }
  await env.KV_STATUS.put(idemKey, JSON.stringify({
    paymentIntentId,
    checkoutSessionId,
    planSelectionId: target.planSelectionId,
    ulids: target.coveredUlids,
    planMode: plan.planMode,
    processedAt: processedAtIso
  }));
  return {
    paymentIntentId,
    checkoutSessionId,
    planSelectionId: target.planSelectionId,
    primaryUlid: target.primaryUlid,
    locationID: target.locationID,
    coveredUlids: target.coveredUlids,
    plan,
    allocation,
    alreadyProcessed: false
  };
}
__name(reconcilePaidCheckoutSessionPlan, "reconcilePaidCheckoutSessionPlan");
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
var PARTNER_SESSION_TTL_SECONDS = 60 * 60 * 24 * 90;
function envFlagTrue(value) {
  const s = String(value || "").trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "on";
}
__name(envFlagTrue, "envFlagTrue");
function standardMultiProductionPlanPricesRestored() {
  const standard = planDefinitionForCode("standard");
  const multi = planDefinitionForCode("multi");
  return Number(standard?.grossAmount || 0) >= 79 && Number(multi?.grossAmount || 0) >= 179;
}
__name(standardMultiProductionPlanPricesRestored, "standardMultiProductionPlanPricesRestored");
function partnerLaunchState(env) {
  const partnerEnabled = envFlagTrue(env.PARTNER_ENABLED);
  const publicLaunchRequested = envFlagTrue(env.PARTNER_PUBLIC_LAUNCH_ENABLED);
  const productionPlanPricesRestored = standardMultiProductionPlanPricesRestored();
  return {
    partnerEnabled,
    publicLaunchRequested,
    productionPlanPricesRestored,
    publicLaunchAllowed: partnerEnabled && publicLaunchRequested && productionPlanPricesRestored
  };
}
__name(partnerLaunchState, "partnerLaunchState");
function partnerRoutesEnabled(env) {
  return envFlagTrue(env.PARTNER_ENABLED);
}
__name(partnerRoutesEnabled, "partnerRoutesEnabled");
function partnerPublicLaunchAllowed(env) {
  const launch = partnerLaunchState(env);
  return !!launch.publicLaunchAllowed;
}
__name(partnerPublicLaunchAllowed, "partnerPublicLaunchAllowed");
function partnerNoStoreHeaders() {
  return {
    "cache-control": "no-store",
    "Referrer-Policy": "no-referrer"
  };
}
__name(partnerNoStoreHeaders, "partnerNoStoreHeaders");
function partnerDisabledResponse(env) {
  return json(
    {
      error: {
        code: "partner_disabled",
        message: "Partner routes are disabled."
      },
      launch: partnerLaunchState(env)
    },
    404,
    partnerNoStoreHeaders()
  );
}
__name(partnerDisabledResponse, "partnerDisabledResponse");
function partnerProfileKey(partnerId) {
  return `partner:${partnerId}`;
}
__name(partnerProfileKey, "partnerProfileKey");
function partnerSessionKey(sessionId) {
  return `partnersess:${sessionId}`;
}
__name(partnerSessionKey, "partnerSessionKey");
function partnerSessionsByPartnerKey(partnerId) {
  return `partner_sessions_by_partner:${partnerId}`;
}
__name(partnerSessionsByPartnerKey, "partnerSessionsByPartnerKey");
function mintPartnerId() {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return `prt_${bytesToB64url(bytes)}`;
}
__name(mintPartnerId, "mintPartnerId");
function mintPartnerSessionId() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return `psess_${bytesToB64url(bytes)}`;
}
__name(mintPartnerSessionId, "mintPartnerSessionId");
function readPartnerSessionId(req) {
  return readCookie(req.headers.get("Cookie") || "", "partner_sess");
}
__name(readPartnerSessionId, "readPartnerSessionId");
function partnerSessionCookie(sessionId, maxAgeSeconds = PARTNER_SESSION_TTL_SECONDS) {
  return cookieSerialize("partner_sess", sessionId, {
    Path: "/",
    Secure: true,
    HttpOnly: true,
    SameSite: "Lax",
    "Max-Age": Math.max(0, Math.trunc(maxAgeSeconds))
  });
}
__name(partnerSessionCookie, "partnerSessionCookie");
function expirePartnerSessionCookie() {
  return cookieSerialize("partner_sess", "", {
    Path: "/",
    Secure: true,
    HttpOnly: true,
    SameSite: "Lax",
    "Max-Age": 0
  });
}
__name(expirePartnerSessionCookie, "expirePartnerSessionCookie");
function defaultPartnerProfile(partnerId, nowIso) {
  return {
    ver: 1,
    partnerId,
    status: "applicant",
    stripeConnectedAccountId: "",
    connectStatus: "not_started",
    leadCapacity: 5,
    freeLeadQuota: 5,
    openLeadCount: 0,
    commissionPolicyVersion: "partner-v1",
    createdAt: nowIso,
    updatedAt: nowIso
  };
}
__name(defaultPartnerProfile, "defaultPartnerProfile");
function publicPartnerProfile(profile) {
  return {
    partnerId: profile.partnerId,
    status: profile.status,
    connectStatus: profile.connectStatus,
    leadCapacity: profile.leadCapacity,
    freeLeadQuota: profile.freeLeadQuota,
    openLeadCount: profile.openLeadCount,
    commissionPolicyVersion: profile.commissionPolicyVersion,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt
  };
}
__name(publicPartnerProfile, "publicPartnerProfile");
async function readPartnerProfile(env, partnerId) {
  const id = String(partnerId || "").trim();
  if (!id) return null;
  const profile = await env.KV_STATUS.get(partnerProfileKey(id), { type: "json" });
  if (!profile || typeof profile !== "object" || String(profile.partnerId || "").trim() !== id) return null;
  return profile;
}
__name(readPartnerProfile, "readPartnerProfile");
async function writePartnerProfile(env, profile) {
  await env.KV_STATUS.put(partnerProfileKey(profile.partnerId), JSON.stringify(profile));
}
__name(writePartnerProfile, "writePartnerProfile");
async function writePartnerSessionIndex(env, partnerId, sessionId) {
  const key = partnerSessionsByPartnerKey(partnerId);
  const raw = await env.KV_STATUS.get(key, "text");
  let sessions = [];
  try {
    sessions = raw ? JSON.parse(raw) : [];
  } catch {
    sessions = [];
  }
  if (!Array.isArray(sessions)) sessions = [];
  sessions = [
    sessionId,
    ...sessions.map((value) => String(value || "").trim()).filter((value) => value && value !== sessionId)
  ].slice(0, 10);
  await env.KV_STATUS.put(key, JSON.stringify(sessions), { expirationTtl: PARTNER_SESSION_TTL_SECONDS });
}
__name(writePartnerSessionIndex, "writePartnerSessionIndex");
async function writePartnerSession(env, sessionId, session) {
  await env.KV_STATUS.put(
    partnerSessionKey(sessionId),
    JSON.stringify(session),
    { expirationTtl: PARTNER_SESSION_TTL_SECONDS }
  );
  await writePartnerSessionIndex(env, session.partnerId, sessionId);
}
__name(writePartnerSession, "writePartnerSession");
async function resolvePartnerSession(req, env) {
  const sessionId = readPartnerSessionId(req);
  if (!sessionId) return null;
  const session = await env.KV_STATUS.get(partnerSessionKey(sessionId), { type: "json" });
  if (!session || typeof session !== "object" || !session.partnerId) return null;
  const expMs = Date.parse(String(session.expiresAt || ""));
  if (!Number.isFinite(expMs) || expMs <= Date.now()) {
    try {
      await env.KV_STATUS.delete(partnerSessionKey(sessionId));
    } catch {
    }
    return null;
  }
  const profile = await readPartnerProfile(env, String(session.partnerId || "").trim());
  if (!profile) return null;
  return { sessionId, session, profile };
}
__name(resolvePartnerSession, "resolvePartnerSession");
async function createPartnerSessionResponse(env, profile, status = 200) {
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  const expiresAt = new Date(Date.now() + PARTNER_SESSION_TTL_SECONDS * 1e3).toISOString();
  const sessionId = mintPartnerSessionId();
  await writePartnerSession(env, sessionId, {
    ver: 1,
    partnerId: profile.partnerId,
    createdAt: nowIso,
    expiresAt
  });
  return json(
    {
      ok: true,
      authenticated: true,
      partner: publicPartnerProfile(profile),
      launch: partnerLaunchState(env)
    },
    status,
    {
      ...partnerNoStoreHeaders(),
      "Set-Cookie": partnerSessionCookie(sessionId)
    }
  );
}
__name(createPartnerSessionResponse, "createPartnerSessionResponse");
async function handlePartnerStart(req, env) {
  if (!partnerRoutesEnabled(env)) return partnerDisabledResponse(env);
  const existing = await resolvePartnerSession(req, env);
  if (existing) {
    return await createPartnerSessionResponse(env, existing.profile);
  }
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  const profile = defaultPartnerProfile(mintPartnerId(), nowIso);
  await writePartnerProfile(env, profile);
  return await createPartnerSessionResponse(env, profile, 201);
}
__name(handlePartnerStart, "handlePartnerStart");
async function handlePartnerSessionRead(req, env, renew = false) {
  if (!partnerRoutesEnabled(env)) return partnerDisabledResponse(env);
  const existingSessionId = readPartnerSessionId(req);
  const existing = await resolvePartnerSession(req, env);
  if (!existing) {
    const headers = partnerNoStoreHeaders();
    if (existingSessionId) headers["Set-Cookie"] = expirePartnerSessionCookie();
    return json(
      {
        ok: false,
        authenticated: false,
        partner: null,
        launch: partnerLaunchState(env)
      },
      200,
      headers
    );
  }
  if (renew) {
    return await createPartnerSessionResponse(env, existing.profile);
  }
  return json(
    {
      ok: true,
      authenticated: true,
      partner: publicPartnerProfile(existing.profile),
      launch: partnerLaunchState(env)
    },
    200,
    partnerNoStoreHeaders()
  );
}
__name(handlePartnerSessionRead, "handlePartnerSessionRead");
async function handlePartnerLogout(req, env) {
  if (!partnerRoutesEnabled(env)) return partnerDisabledResponse(env);
  const sessionId = readPartnerSessionId(req);
  if (sessionId) {
    try {
      await env.KV_STATUS.delete(partnerSessionKey(sessionId));
    } catch {
    }
  }
  return json(
    { ok: true, authenticated: false },
    200,
    {
      ...partnerNoStoreHeaders(),
      "Set-Cookie": expirePartnerSessionCookie()
    }
  );
}
__name(handlePartnerLogout, "handlePartnerLogout");
var PARTNER_LEAD_RESERVATION_DAYS = 30;
var PARTNER_LEAD_INDEX_LIMIT = 200;
var PARTNER_LEAD_CONTEXT_LIMIT = 24;
function partnerLeadKey(leadId) {
  return `partner_lead:${leadId}`;
}
__name(partnerLeadKey, "partnerLeadKey");
function partnerLeadsByPartnerKey(partnerId) {
  return `partner_leads_by_partner:${partnerId}`;
}
__name(partnerLeadsByPartnerKey, "partnerLeadsByPartnerKey");
function partnerLeadByFingerprintKey(fingerprint) {
  return `partner_lead_by_fingerprint:${fingerprint}`;
}
__name(partnerLeadByFingerprintKey, "partnerLeadByFingerprintKey");
function mintPartnerLeadId() {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return `plead_${bytesToB64url(bytes)}`;
}
__name(mintPartnerLeadId, "mintPartnerLeadId");
function sanitizePartnerLeadString(value, maxLength = 240) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, Math.max(0, maxLength));
}
__name(sanitizePartnerLeadString, "sanitizePartnerLeadString");
function normalizePartnerLeadText(value, maxLength = 400) {
  return sanitizePartnerLeadString(value, maxLength).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}
__name(normalizePartnerLeadText, "normalizePartnerLeadText");
function normalizePartnerLeadPhone(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const cleaned = raw.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) {
    return `+${cleaned.slice(1).replace(/\+/g, "")}`.slice(0, 40);
  }
  return cleaned.replace(/\+/g, "").slice(0, 40);
}
__name(normalizePartnerLeadPhone, "normalizePartnerLeadPhone");
function normalizePartnerLeadWebsite(value) {
  let raw = sanitizePartnerLeadString(value, 220).toLowerCase();
  if (!raw) return "";
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;
  try {
    const u = new URL(raw);
    const host = String(u.hostname || "").replace(/^www\./, "").trim();
    const path = String(u.pathname || "").replace(/\/+$/, "");
    return `${host}${path && path !== "/" ? path : ""}`.slice(0, 220);
  } catch {
    return raw.replace(/^https?:\/\//i, "").replace(/^www\./, "").replace(/\/+$/, "").slice(0, 220);
  }
}
__name(normalizePartnerLeadWebsite, "normalizePartnerLeadWebsite");
function uniquePartnerLeadContexts(value) {
  const src = Array.isArray(value) ? value : String(value || "").split(",");
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (const item of src) {
    const v = sanitizePartnerLeadString(item, 80);
    if (!v || seen.has(v)) continue;
    seen.add(v);
    out.push(v);
    if (out.length >= PARTNER_LEAD_CONTEXT_LIMIT) break;
  }
  return out;
}
__name(uniquePartnerLeadContexts, "uniquePartnerLeadContexts");
function normalizePartnerLeadStatus(value) {
  const s = String(value || "").trim().toLowerCase();
  if (s === "reserved" || s === "converted" || s === "expired" || s === "archived" || s === "rejected") return s;
  return "";
}
__name(normalizePartnerLeadStatus, "normalizePartnerLeadStatus");
function partnerLeadIsOpen(lead) {
  const expMs = Date.parse(String(lead?.expiresAt || ""));
  return lead.status === "reserved" && Number.isFinite(expMs) && expMs > Date.now();
}
__name(partnerLeadIsOpen, "partnerLeadIsOpen");
function publicPartnerLead(lead) {
  return {
    leadId: lead.leadId,
    partnerId: lead.partnerId,
    status: lead.status,
    businessName: lead.businessName,
    website: lead.website,
    phone: lead.phone,
    address: lead.address,
    city: lead.city,
    country: lead.country,
    groupKey: lead.groupKey,
    subgroupKey: lead.subgroupKey,
    contexts: lead.contexts,
    draftULID: lead.draftULID,
    hasDraft: !!(lead.draftULID && lead.draftSessionId),
    locationULID: lead.locationULID,
    source: lead.source,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
    expiresAt: lead.expiresAt
  };
}
__name(publicPartnerLead, "publicPartnerLead");
async function buildPartnerLeadFingerprint(input) {
  const material = [
    normalizePartnerLeadText(input.businessName, 180),
    normalizePartnerLeadWebsite(input.website),
    normalizePartnerLeadPhone(input.phone),
    normalizePartnerLeadText([input.address, input.city, input.country].filter(Boolean).join(" "), 500)
  ].join("|");
  const enc = new TextEncoder();
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(material));
  return bytesToB64url(new Uint8Array(digest)).slice(0, 43);
}
__name(buildPartnerLeadFingerprint, "buildPartnerLeadFingerprint");
async function readPartnerLeadRecord(env, leadId) {
  const id = String(leadId || "").trim();
  if (!id) return null;
  const lead = await env.KV_STATUS.get(partnerLeadKey(id), { type: "json" });
  if (!lead || typeof lead !== "object" || String(lead.leadId || "").trim() !== id) return null;
  return lead;
}
__name(readPartnerLeadRecord, "readPartnerLeadRecord");
async function writePartnerLeadRecord(env, lead) {
  await env.KV_STATUS.put(partnerLeadKey(lead.leadId), JSON.stringify(lead));
}
__name(writePartnerLeadRecord, "writePartnerLeadRecord");
async function readPartnerLeadIndex(env, partnerId) {
  const raw = await env.KV_STATUS.get(partnerLeadsByPartnerKey(partnerId), "text");
  let ids = [];
  try {
    ids = raw ? JSON.parse(raw) : [];
  } catch {
    ids = [];
  }
  if (!Array.isArray(ids)) ids = [];
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (const id of ids) {
    const leadId = String(id || "").trim();
    if (!leadId || seen.has(leadId)) continue;
    seen.add(leadId);
    out.push(leadId);
    if (out.length >= PARTNER_LEAD_INDEX_LIMIT) break;
  }
  return out;
}
__name(readPartnerLeadIndex, "readPartnerLeadIndex");
async function writePartnerLeadIndex(env, partnerId, ids) {
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (const id of ids) {
    const leadId = String(id || "").trim();
    if (!leadId || seen.has(leadId)) continue;
    seen.add(leadId);
    out.push(leadId);
    if (out.length >= PARTNER_LEAD_INDEX_LIMIT) break;
  }
  await env.KV_STATUS.put(partnerLeadsByPartnerKey(partnerId), JSON.stringify(out));
}
__name(writePartnerLeadIndex, "writePartnerLeadIndex");
async function appendPartnerLeadIndex(env, partnerId, leadId) {
  const existing = await readPartnerLeadIndex(env, partnerId);
  await writePartnerLeadIndex(env, partnerId, [leadId, ...existing.filter((id) => id !== leadId)]);
}
__name(appendPartnerLeadIndex, "appendPartnerLeadIndex");
async function deletePartnerLeadFingerprintIfOwned(env, lead) {
  const fingerprint = String(lead?.fingerprint || "").trim();
  if (!fingerprint) return;
  const key = partnerLeadByFingerprintKey(fingerprint);
  const currentLeadId = await env.KV_STATUS.get(key, "text");
  if (String(currentLeadId || "").trim() === lead.leadId) {
    await env.KV_STATUS.delete(key);
  }
}
__name(deletePartnerLeadFingerprintIfOwned, "deletePartnerLeadFingerprintIfOwned");
async function expirePartnerLeadIfNeeded(env, lead, nowMs = Date.now()) {
  const expMs = Date.parse(String(lead?.expiresAt || ""));
  if (lead.status !== "reserved" || !Number.isFinite(expMs) || expMs > nowMs) {
    return lead;
  }
  const next = {
    ...lead,
    status: "expired",
    updatedAt: new Date(nowMs).toISOString()
  };
  await writePartnerLeadRecord(env, next);
  await deletePartnerLeadFingerprintIfOwned(env, next);
  return next;
}
__name(expirePartnerLeadIfNeeded, "expirePartnerLeadIfNeeded");
async function listPartnerLeadRecords(env, partnerId) {
  const ids = await readPartnerLeadIndex(env, partnerId);
  const out = [];
  for (const leadId of ids) {
    const lead = await readPartnerLeadRecord(env, leadId);
    if (!lead || lead.partnerId !== partnerId) continue;
    out.push(await expirePartnerLeadIfNeeded(env, lead));
  }
  return out;
}
__name(listPartnerLeadRecords, "listPartnerLeadRecords");
async function syncPartnerOpenLeadCount(env, profile, leads) {
  const openLeadCount = leads.filter(partnerLeadIsOpen).length;
  if (Number(profile.openLeadCount || 0) === openLeadCount) {
    return profile;
  }
  const next = {
    ...profile,
    openLeadCount,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  await writePartnerProfile(env, next);
  return next;
}
__name(syncPartnerOpenLeadCount, "syncPartnerOpenLeadCount");
async function requirePartnerSession(req, env) {
  if (!partnerRoutesEnabled(env)) return partnerDisabledResponse(env);
  const existingSessionId = readPartnerSessionId(req);
  const resolved = await resolvePartnerSession(req, env);
  if (!resolved) {
    const headers = partnerNoStoreHeaders();
    if (existingSessionId) headers["Set-Cookie"] = expirePartnerSessionCookie();
    return json(
      {
        error: {
          code: "partner_session_required",
          message: "Partner session required."
        },
        authenticated: false,
        partner: null,
        launch: partnerLaunchState(env)
      },
      401,
      headers
    );
  }
  return resolved;
}
__name(requirePartnerSession, "requirePartnerSession");
async function handlePartnerLeadList(req, env) {
  const auth = await requirePartnerSession(req, env);
  if (auth instanceof Response) return auth;
  const url = new URL(req.url);
  const statusFilter = normalizePartnerLeadStatus(url.searchParams.get("status"));
  let leads = await listPartnerLeadRecords(env, auth.profile.partnerId);
  const profile = await syncPartnerOpenLeadCount(env, auth.profile, leads);
  if (statusFilter) {
    leads = leads.filter((lead) => lead.status === statusFilter);
  }
  return json(
    {
      ok: true,
      partner: publicPartnerProfile(profile),
      items: leads.map(publicPartnerLead),
      total: leads.length,
      launch: partnerLaunchState(env)
    },
    200,
    partnerNoStoreHeaders()
  );
}
__name(handlePartnerLeadList, "handlePartnerLeadList");
async function handlePartnerLeadCreate(req, env) {
  const auth = await requirePartnerSession(req, env);
  if (auth instanceof Response) return auth;
  if (auth.profile.status === "suspended") {
    return json(
      {
        error: {
          code: "partner_suspended",
          message: "Partner is suspended."
        },
        partner: publicPartnerProfile(auth.profile)
      },
      403,
      partnerNoStoreHeaders()
    );
  }
  const body = await req.json().catch(() => ({}));
  const businessName = sanitizePartnerLeadString(body?.businessName || body?.name || body?.locationName, 180);
  const website = sanitizePartnerLeadString(body?.website || body?.officialWebsite || body?.url, 220);
  const phone = sanitizePartnerLeadString(body?.phone || body?.telephone, 80);
  const address = sanitizePartnerLeadString(body?.address || body?.streetAddress || body?.formattedAddress, 300);
  const city = sanitizePartnerLeadString(body?.city, 120);
  const country = sanitizePartnerLeadString(body?.country, 80);
  const groupKey = sanitizePartnerLeadString(body?.groupKey, 120);
  const subgroupKey = sanitizePartnerLeadString(body?.subgroupKey, 120);
  const contexts = uniquePartnerLeadContexts(body?.contexts);
  const hasLeadContactSignal = !!(normalizePartnerLeadWebsite(website) || normalizePartnerLeadPhone(phone) || normalizePartnerLeadText([address, city, country].filter(Boolean).join(" "), 500));
  if (!businessName || !hasLeadContactSignal) {
    return json(
      {
        error: {
          code: "invalid_partner_lead",
          message: "businessName and at least one of website, phone, or address are required."
        }
      },
      400,
      partnerNoStoreHeaders()
    );
  }
  let existingLeads = await listPartnerLeadRecords(env, auth.profile.partnerId);
  let profile = await syncPartnerOpenLeadCount(env, auth.profile, existingLeads);
  const leadCapacity = Math.max(0, Math.trunc(Number(profile.leadCapacity || 0)));
  if (profile.openLeadCount >= leadCapacity) {
    return json(
      {
        error: {
          code: "partner_lead_capacity_exceeded",
          message: "Partner lead capacity reached."
        },
        requiresReservationStake: true,
        partner: publicPartnerProfile(profile),
        launch: partnerLaunchState(env)
      },
      409,
      partnerNoStoreHeaders()
    );
  }
  const fingerprint = await buildPartnerLeadFingerprint({
    businessName,
    website,
    phone,
    address,
    city,
    country
  });
  const duplicateLeadId = await env.KV_STATUS.get(partnerLeadByFingerprintKey(fingerprint), "text");
  if (duplicateLeadId) {
    const duplicate = await readPartnerLeadRecord(env, duplicateLeadId);
    const currentDuplicate = duplicate ? await expirePartnerLeadIfNeeded(env, duplicate) : null;
    if (currentDuplicate && (partnerLeadIsOpen(currentDuplicate) || currentDuplicate.status === "converted")) {
      return json(
        {
          error: {
            code: "duplicate_partner_lead",
            message: "A matching Partner lead already exists."
          },
          duplicateLeadId: currentDuplicate.partnerId === profile.partnerId ? currentDuplicate.leadId : "",
          duplicateStatus: currentDuplicate.status
        },
        409,
        partnerNoStoreHeaders()
      );
    }
    await env.KV_STATUS.delete(partnerLeadByFingerprintKey(fingerprint));
  }
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const leadId = mintPartnerLeadId();
  const lead = {
    ver: 1,
    leadId,
    partnerId: profile.partnerId,
    status: "reserved",
    businessName,
    website,
    phone,
    address,
    city,
    country,
    groupKey,
    subgroupKey,
    contexts,
    fingerprint,
    draftULID: "",
    draftSessionId: "",
    locationULID: "",
    reservationStakePaymentIntentId: "",
    source: "partner_center",
    createdAt: nowIso,
    updatedAt: nowIso,
    expiresAt: new Date(nowMs + PARTNER_LEAD_RESERVATION_DAYS * 24 * 60 * 60 * 1e3).toISOString()
  };
  await writePartnerLeadRecord(env, lead);
  await env.KV_STATUS.put(partnerLeadByFingerprintKey(fingerprint), leadId);
  await appendPartnerLeadIndex(env, profile.partnerId, leadId);
  existingLeads = [lead, ...existingLeads];
  profile = await syncPartnerOpenLeadCount(env, profile, existingLeads);
  return json(
    {
      ok: true,
      lead: publicPartnerLead(lead),
      partner: publicPartnerProfile(profile),
      launch: partnerLaunchState(env)
    },
    201,
    partnerNoStoreHeaders()
  );
}
__name(handlePartnerLeadCreate, "handlePartnerLeadCreate");
async function handlePartnerLeadRead(req, env, leadId) {
  const auth = await requirePartnerSession(req, env);
  if (auth instanceof Response) return auth;
  const lead = await readPartnerLeadRecord(env, leadId);
  if (!lead || lead.partnerId !== auth.profile.partnerId) {
    return json(
      {
        error: {
          code: "partner_lead_not_found",
          message: "Partner lead not found."
        }
      },
      404,
      partnerNoStoreHeaders()
    );
  }
  const currentLead = await expirePartnerLeadIfNeeded(env, lead);
  const leads = await listPartnerLeadRecords(env, auth.profile.partnerId);
  const profile = await syncPartnerOpenLeadCount(env, auth.profile, leads);
  return json(
    {
      ok: true,
      lead: publicPartnerLead(currentLead),
      partner: publicPartnerProfile(profile),
      launch: partnerLaunchState(env)
    },
    200,
    partnerNoStoreHeaders()
  );
}
__name(handlePartnerLeadRead, "handlePartnerLeadRead");
async function handlePartnerLeadArchive(req, env, leadId) {
  const auth = await requirePartnerSession(req, env);
  if (auth instanceof Response) return auth;
  const lead = await readPartnerLeadRecord(env, leadId);
  if (!lead || lead.partnerId !== auth.profile.partnerId) {
    return json(
      {
        error: {
          code: "partner_lead_not_found",
          message: "Partner lead not found."
        }
      },
      404,
      partnerNoStoreHeaders()
    );
  }
  const currentLead = await expirePartnerLeadIfNeeded(env, lead);
  if (currentLead.status === "converted") {
    return json(
      {
        error: {
          code: "partner_lead_converted",
          message: "Converted Partner leads cannot be archived."
        },
        lead: publicPartnerLead(currentLead)
      },
      409,
      partnerNoStoreHeaders()
    );
  }
  const next = {
    ...currentLead,
    status: "archived",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  await writePartnerLeadRecord(env, next);
  await deletePartnerLeadFingerprintIfOwned(env, next);
  const leads = await listPartnerLeadRecords(env, auth.profile.partnerId);
  const profile = await syncPartnerOpenLeadCount(env, auth.profile, leads);
  return json(
    {
      ok: true,
      lead: publicPartnerLead(next),
      partner: publicPartnerProfile(profile),
      launch: partnerLaunchState(env)
    },
    200,
    partnerNoStoreHeaders()
  );
}
__name(handlePartnerLeadArchive, "handlePartnerLeadArchive");
var PARTNER_RESERVATION_STAKE_AMOUNT_CENTS = 100;
var PARTNER_RESERVATION_STAKE_CURRENCY = "eur";
var PARTNER_RESERVATION_CHECKOUT_TTL_SECONDS = 60 * 60 * 24;
function partnerLeadReservationKey(reservationId) {
  return `partner_lead_reservation:${reservationId}`;
}
__name(partnerLeadReservationKey, "partnerLeadReservationKey");
function partnerLeadReservationBySessionKey(checkoutSessionId) {
  return `partner_lead_reservation_by_session:${checkoutSessionId}`;
}
__name(partnerLeadReservationBySessionKey, "partnerLeadReservationBySessionKey");
function mintPartnerLeadReservationId() {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return `plres_${bytesToB64url(bytes)}`;
}
__name(mintPartnerLeadReservationId, "mintPartnerLeadReservationId");
function publicPartnerLeadReservation(reservation) {
  return {
    reservationId: reservation.reservationId,
    partnerId: reservation.partnerId,
    status: reservation.status,
    businessName: reservation.businessName,
    website: reservation.website,
    phone: reservation.phone,
    address: reservation.address,
    city: reservation.city,
    country: reservation.country,
    groupKey: reservation.groupKey,
    subgroupKey: reservation.subgroupKey,
    contexts: reservation.contexts,
    amountCents: reservation.amountCents,
    currency: reservation.currency,
    checkoutSessionId: reservation.checkoutSessionId,
    leadId: reservation.leadId,
    createdAt: reservation.createdAt,
    updatedAt: reservation.updatedAt,
    expiresAt: reservation.expiresAt
  };
}
__name(publicPartnerLeadReservation, "publicPartnerLeadReservation");
async function readPartnerLeadReservation(env, reservationId) {
  const id = String(reservationId || "").trim();
  if (!id) return null;
  const reservation = await env.KV_STATUS.get(partnerLeadReservationKey(id), { type: "json" });
  if (!reservation || typeof reservation !== "object" || String(reservation.reservationId || "").trim() !== id) return null;
  return reservation;
}
__name(readPartnerLeadReservation, "readPartnerLeadReservation");
async function writePartnerLeadReservation(env, reservation) {
  await env.KV_STATUS.put(
    partnerLeadReservationKey(reservation.reservationId),
    JSON.stringify(reservation),
    { expirationTtl: PARTNER_RESERVATION_CHECKOUT_TTL_SECONDS }
  );
  if (reservation.checkoutSessionId) {
    await env.KV_STATUS.put(
      partnerLeadReservationBySessionKey(reservation.checkoutSessionId),
      reservation.reservationId,
      { expirationTtl: PARTNER_RESERVATION_CHECKOUT_TTL_SECONDS }
    );
  }
}
__name(writePartnerLeadReservation, "writePartnerLeadReservation");
async function readPartnerLeadReservationBySession(env, checkoutSessionId) {
  const sid = String(checkoutSessionId || "").trim();
  if (!sid) return null;
  const reservationId = await env.KV_STATUS.get(partnerLeadReservationBySessionKey(sid), "text");
  return await readPartnerLeadReservation(env, String(reservationId || "").trim());
}
__name(readPartnerLeadReservationBySession, "readPartnerLeadReservationBySession");
function partnerLeadReservationPayloadFromBody(body) {
  return {
    businessName: sanitizePartnerLeadString(body?.businessName || body?.name || body?.locationName, 180),
    website: sanitizePartnerLeadString(body?.website || body?.officialWebsite || body?.url, 220),
    phone: sanitizePartnerLeadString(body?.phone || body?.telephone, 80),
    address: sanitizePartnerLeadString(body?.address || body?.streetAddress || body?.formattedAddress, 300),
    city: sanitizePartnerLeadString(body?.city, 120),
    country: sanitizePartnerLeadString(body?.country, 80),
    groupKey: sanitizePartnerLeadString(body?.groupKey, 120),
    subgroupKey: sanitizePartnerLeadString(body?.subgroupKey, 120),
    contexts: uniquePartnerLeadContexts(body?.contexts)
  };
}
__name(partnerLeadReservationPayloadFromBody, "partnerLeadReservationPayloadFromBody");
function partnerLeadReservationPayloadHasContactSignal(payload) {
  return !!(normalizePartnerLeadWebsite(payload.website) || normalizePartnerLeadPhone(payload.phone) || normalizePartnerLeadText([payload.address, payload.city, payload.country].filter(Boolean).join(" "), 500));
}
__name(partnerLeadReservationPayloadHasContactSignal, "partnerLeadReservationPayloadHasContactSignal");
async function finalizePaidPartnerLeadReservationFromSession(env, session) {
  const checkoutSessionId = String(session?.id || "").trim();
  const metadata = session?.metadata || {};
  const flow = String(metadata?.flow || "").trim();
  const reservationType = String(metadata?.reservationType || "").trim();
  const reservationId = String(metadata?.partnerLeadReservationId || "").trim();
  const partnerId = String(metadata?.partnerId || "").trim();
  if (flow !== "partner_lead_reservation" || reservationType !== "lead_stake") {
    throw new Error("not_partner_lead_reservation");
  }
  const paymentStatus = String(session?.payment_status || "").trim();
  const checkoutStatus = String(session?.status || "").trim();
  if (paymentStatus !== "paid" || checkoutStatus !== "complete") {
    throw new Error("partner_reservation_not_paid_complete");
  }
  const reservation = reservationId ? await readPartnerLeadReservation(env, reservationId) : await readPartnerLeadReservationBySession(env, checkoutSessionId);
  if (!reservation) {
    throw new Error("partner_reservation_not_found");
  }
  if (partnerId && reservation.partnerId !== partnerId) {
    throw new Error("partner_reservation_partner_mismatch");
  }
  if (reservation.leadId) {
    const existingLead = await readPartnerLeadRecord(env, reservation.leadId);
    if (existingLead) {
      return { reservation, lead: existingLead };
    }
  }
  const paymentIntentId = String(session?.payment_intent?.id || session?.payment_intent || "").trim();
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  const duplicateLeadId = await env.KV_STATUS.get(partnerLeadByFingerprintKey(reservation.fingerprint), "text");
  if (duplicateLeadId) {
    const duplicate = await readPartnerLeadRecord(env, duplicateLeadId);
    const currentDuplicate = duplicate ? await expirePartnerLeadIfNeeded(env, duplicate) : null;
    if (currentDuplicate && (partnerLeadIsOpen(currentDuplicate) || currentDuplicate.status === "converted")) {
      const voided = {
        ...reservation,
        status: "void",
        checkoutSessionId,
        paymentIntentId,
        updatedAt: nowIso
      };
      await writePartnerLeadReservation(env, voided);
      return { reservation: voided, lead: null };
    }
  }
  const leadId = mintPartnerLeadId();
  const lead = {
    ver: 1,
    leadId,
    partnerId: reservation.partnerId,
    status: "reserved",
    businessName: reservation.businessName,
    website: reservation.website,
    phone: reservation.phone,
    address: reservation.address,
    city: reservation.city,
    country: reservation.country,
    groupKey: reservation.groupKey,
    subgroupKey: reservation.subgroupKey,
    contexts: reservation.contexts,
    fingerprint: reservation.fingerprint,
    draftULID: "",
    locationULID: "",
    reservationStakePaymentIntentId: paymentIntentId,
    source: "partner_reservation_stake",
    createdAt: nowIso,
    updatedAt: nowIso,
    expiresAt: new Date(Date.now() + PARTNER_LEAD_RESERVATION_DAYS * 24 * 60 * 60 * 1e3).toISOString()
  };
  await writePartnerLeadRecord(env, lead);
  await env.KV_STATUS.put(partnerLeadByFingerprintKey(reservation.fingerprint), leadId);
  await appendPartnerLeadIndex(env, reservation.partnerId, leadId);
  const converted = {
    ...reservation,
    status: "converted_to_lead",
    checkoutSessionId,
    paymentIntentId,
    leadId,
    updatedAt: nowIso
  };
  await writePartnerLeadReservation(env, converted);
  const profile = await readPartnerProfile(env, reservation.partnerId);
  if (profile) {
    const leads = await listPartnerLeadRecords(env, reservation.partnerId);
    await syncPartnerOpenLeadCount(env, profile, leads);
  }
  return { reservation: converted, lead };
}
__name(finalizePaidPartnerLeadReservationFromSession, "finalizePaidPartnerLeadReservationFromSession");
async function handlePartnerReservationCheckoutCreate(req, env) {
  const auth = await requirePartnerSession(req, env);
  if (auth instanceof Response) return auth;
  if (auth.profile.status === "suspended") {
    return json(
      {
        error: {
          code: "partner_suspended",
          message: "Partner is suspended."
        },
        partner: publicPartnerProfile(auth.profile)
      },
      403,
      partnerNoStoreHeaders()
    );
  }
  const sk = String(env.STRIPE_SECRET_KEY || "").trim();
  if (!sk) {
    return json(
      {
        error: {
          code: "misconfigured",
          message: "STRIPE_SECRET_KEY not set"
        }
      },
      500,
      partnerNoStoreHeaders()
    );
  }
  const body = await req.json().catch(() => ({}));
  const payload = partnerLeadReservationPayloadFromBody(body);
  if (!payload.businessName || !partnerLeadReservationPayloadHasContactSignal(payload)) {
    return json(
      {
        error: {
          code: "invalid_partner_lead",
          message: "businessName and at least one of website, phone, or address are required."
        }
      },
      400,
      partnerNoStoreHeaders()
    );
  }
  const existingLeads = await listPartnerLeadRecords(env, auth.profile.partnerId);
  const profile = await syncPartnerOpenLeadCount(env, auth.profile, existingLeads);
  const leadCapacity = Math.max(0, Math.trunc(Number(profile.leadCapacity || 0)));
  if (profile.openLeadCount < leadCapacity) {
    return json(
      {
        error: {
          code: "partner_reservation_stake_not_required",
          message: "Partner still has free lead capacity. Create the lead directly."
        },
        partner: publicPartnerProfile(profile)
      },
      409,
      partnerNoStoreHeaders()
    );
  }
  const fingerprint = await buildPartnerLeadFingerprint(payload);
  const duplicateLeadId = await env.KV_STATUS.get(partnerLeadByFingerprintKey(fingerprint), "text");
  if (duplicateLeadId) {
    const duplicate = await readPartnerLeadRecord(env, duplicateLeadId);
    const currentDuplicate = duplicate ? await expirePartnerLeadIfNeeded(env, duplicate) : null;
    if (currentDuplicate && (partnerLeadIsOpen(currentDuplicate) || currentDuplicate.status === "converted")) {
      return json(
        {
          error: {
            code: "duplicate_partner_lead",
            message: "A matching Partner lead already exists."
          },
          duplicateLeadId: currentDuplicate.partnerId === profile.partnerId ? currentDuplicate.leadId : "",
          duplicateStatus: currentDuplicate.status
        },
        409,
        partnerNoStoreHeaders()
      );
    }
    await env.KV_STATUS.delete(partnerLeadByFingerprintKey(fingerprint));
  }
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const reservationId = mintPartnerLeadReservationId();
  const reservationDraft = {
    ver: 1,
    reservationId,
    partnerId: profile.partnerId,
    status: "draft",
    ...payload,
    fingerprint,
    amountCents: PARTNER_RESERVATION_STAKE_AMOUNT_CENTS,
    currency: PARTNER_RESERVATION_STAKE_CURRENCY.toUpperCase(),
    checkoutSessionId: "",
    paymentIntentId: "",
    leadId: "",
    createdAt: nowIso,
    updatedAt: nowIso,
    expiresAt: new Date(nowMs + PARTNER_RESERVATION_CHECKOUT_TTL_SECONDS * 1e3).toISOString()
  };
  await writePartnerLeadReservation(env, reservationDraft);
  const siteOrigin = req.headers.get("Origin") || "https://navigen.io";
  const successUrlObj = new URL("/", siteOrigin);
  successUrlObj.searchParams.set("flow", "partner_reservation");
  successUrlObj.searchParams.set("reservationId", reservationId);
  successUrlObj.searchParams.set("sid", "{CHECKOUT_SESSION_ID}");
  const successUrl = successUrlObj.toString().replace("%7BCHECKOUT_SESSION_ID%7D", "{CHECKOUT_SESSION_ID}");
  const cancelUrl = new URL("/", siteOrigin);
  cancelUrl.searchParams.set("flow", "partner_reservation");
  cancelUrl.searchParams.set("reservationId", reservationId);
  cancelUrl.searchParams.set("canceled", "1");
  const form = new URLSearchParams();
  form.set("mode", "payment");
  form.set("customer_creation", "if_required");
  form.set("billing_address_collection", "auto");
  form.set("success_url", successUrl);
  form.set("cancel_url", cancelUrl.toString());
  form.set("line_items[0][quantity]", "1");
  form.set("line_items[0][price_data][currency]", PARTNER_RESERVATION_STAKE_CURRENCY);
  form.set("line_items[0][price_data][unit_amount]", String(PARTNER_RESERVATION_STAKE_AMOUNT_CENTS));
  form.set("line_items[0][price_data][product_data][name]", "NaviGen Partner lead reservation stake");
  form.set("metadata[flow]", "partner_lead_reservation");
  form.set("metadata[reservationType]", "lead_stake");
  form.set("metadata[partnerId]", profile.partnerId);
  form.set("metadata[partnerLeadReservationId]", reservationId);
  form.set("payment_intent_data[metadata][flow]", "partner_lead_reservation");
  form.set("payment_intent_data[metadata][reservationType]", "lead_stake");
  form.set("payment_intent_data[metadata][partnerId]", profile.partnerId);
  form.set("payment_intent_data[metadata][partnerLeadReservationId]", reservationId);
  const stripeResp = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${sk}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: form.toString()
  });
  const stripeText = await stripeResp.text();
  let stripeOut = null;
  try {
    stripeOut = JSON.parse(stripeText);
  } catch {
    stripeOut = null;
  }
  if (!stripeResp.ok || !stripeOut?.id) {
    const voided = {
      ...reservationDraft,
      status: "void",
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await writePartnerLeadReservation(env, voided);
    return json(
      {
        error: {
          code: "stripe_error",
          message: String(stripeOut?.error?.message || "Stripe create session failed")
        }
      },
      502,
      partnerNoStoreHeaders()
    );
  }
  const reservation = {
    ...reservationDraft,
    status: "checkout_created",
    checkoutSessionId: String(stripeOut.id || "").trim(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  await writePartnerLeadReservation(env, reservation);
  return json(
    {
      ok: true,
      flow: "partner_lead_reservation",
      reservation: publicPartnerLeadReservation(reservation),
      sessionId: reservation.checkoutSessionId,
      url: String(stripeOut.url || ""),
      amountCents: reservation.amountCents,
      currency: reservation.currency,
      partner: publicPartnerProfile(profile),
      launch: partnerLaunchState(env)
    },
    200,
    partnerNoStoreHeaders()
  );
}
__name(handlePartnerReservationCheckoutCreate, "handlePartnerReservationCheckoutCreate");
async function handlePartnerReservationCheckoutReturn(req, env) {
  const auth = await requirePartnerSession(req, env);
  if (auth instanceof Response) return auth;
  const sk = String(env.STRIPE_SECRET_KEY || "").trim();
  if (!sk) {
    return json(
      {
        error: {
          code: "misconfigured",
          message: "STRIPE_SECRET_KEY not set"
        }
      },
      500,
      partnerNoStoreHeaders()
    );
  }
  const url = new URL(req.url);
  const checkoutSessionId = String(url.searchParams.get("session_id") || url.searchParams.get("sid") || "").trim();
  if (!checkoutSessionId) {
    return json(
      {
        error: {
          code: "missing_checkout_session",
          message: "session_id is required."
        }
      },
      400,
      partnerNoStoreHeaders()
    );
  }
  let session = null;
  try {
    session = await fetchStripeCheckoutSession(sk, checkoutSessionId);
  } catch (err) {
    return json(
      {
        error: {
          code: "stripe_error",
          message: String(err?.message || err || "Stripe session fetch failed")
        }
      },
      502,
      partnerNoStoreHeaders()
    );
  }
  const metadata = session?.metadata || {};
  if (String(metadata?.flow || "").trim() !== "partner_lead_reservation" || String(metadata?.reservationType || "").trim() !== "lead_stake") {
    return json(
      {
        error: {
          code: "invalid_partner_reservation_session",
          message: "Checkout session is not a Partner reservation stake session."
        }
      },
      400,
      partnerNoStoreHeaders()
    );
  }
  if (String(metadata?.partnerId || "").trim() !== auth.profile.partnerId) {
    return json(
      {
        error: {
          code: "partner_reservation_forbidden",
          message: "Reservation does not belong to this Partner."
        }
      },
      403,
      partnerNoStoreHeaders()
    );
  }
  let finalized = null;
  try {
    finalized = await finalizePaidPartnerLeadReservationFromSession(env, session);
  } catch (err) {
    return json(
      {
        error: {
          code: "partner_reservation_not_ready",
          message: String(err?.message || err || "Partner reservation is not ready.")
        }
      },
      409,
      partnerNoStoreHeaders()
    );
  }
  const profile = await readPartnerProfile(env, auth.profile.partnerId) || auth.profile;
  return json(
    {
      ok: true,
      reservation: publicPartnerLeadReservation(finalized.reservation),
      lead: finalized.lead ? publicPartnerLead(finalized.lead) : null,
      partner: publicPartnerProfile(profile),
      launch: partnerLaunchState(env)
    },
    200,
    partnerNoStoreHeaders()
  );
}
__name(handlePartnerReservationCheckoutReturn, "handlePartnerReservationCheckoutReturn");
function partnerLeadDraftBaseFromLead(lead) {
  return {
    name: lead.businessName,
    displayName: lead.businessName,
    address: lead.address,
    city: lead.city,
    country: lead.country,
    website: lead.website,
    officialWebsite: lead.website,
    phone: lead.phone,
    groupKey: lead.groupKey,
    subgroupKey: lead.subgroupKey,
    context: Array.isArray(lead.contexts) ? lead.contexts.join(";") : ""
  };
}
__name(partnerLeadDraftBaseFromLead, "partnerLeadDraftBaseFromLead");
function publicPartnerLeadDraft(draft, draftULID) {
  const src = draft && typeof draft === "object" ? draft : {};
  const out = {
    ...src,
    draftULID
  };
  delete out.draftSessionId;
  delete out.partnerId;
  delete out.partnerSessionId;
  return out;
}
__name(publicPartnerLeadDraft, "publicPartnerLeadDraft");
async function readPartnerOwnedLeadForDraft(req, env, leadId, opts = {}) {
  const auth = await requirePartnerSession(req, env);
  if (auth instanceof Response) return auth;
  const lead = await readPartnerLeadRecord(env, leadId);
  if (!lead || lead.partnerId !== auth.profile.partnerId) {
    return json(
      {
        error: {
          code: "partner_lead_not_found",
          message: "Partner lead not found."
        }
      },
      404,
      partnerNoStoreHeaders()
    );
  }
  const currentLead = await expirePartnerLeadIfNeeded(env, lead);
  if (opts.requireReserved && currentLead.status !== "reserved") {
    return json(
      {
        error: {
          code: "partner_lead_not_editable",
          message: "Only reserved Partner leads can prepare or update drafts."
        },
        lead: publicPartnerLead(currentLead)
      },
      409,
      partnerNoStoreHeaders()
    );
  }
  return { auth, lead: currentLead };
}
__name(readPartnerOwnedLeadForDraft, "readPartnerOwnedLeadForDraft");
async function buildPartnerDraftPatch(env, body, base = {}) {
  const rawDraft = body?.draft && typeof body.draft === "object" ? body.draft : body && typeof body === "object" ? body : {};
  let normalizedPatch;
  try {
    normalizedPatch = normalizeDraftPatch({ ...base, ...rawDraft });
  } catch (e) {
    const msg = String(e?.message || "");
    return json(
      {
        error: {
          code: "invalid_partner_draft",
          message: msg === "invalid_coordinates" ? "invalid coordinates" : msg || "invalid draft payload"
        }
      },
      400,
      partnerNoStoreHeaders()
    );
  }
  if (Object.prototype.hasOwnProperty.call(normalizedPatch, "tags")) {
    const tagValidation = await validateBusinessTagKeys(env, normalizedPatch.tags);
    if (!tagValidation.ok) {
      return json(
        {
          error: {
            code: "invalid_tags",
            message: "One or more tags are not in the published tag taxonomy.",
            unknown: tagValidation.unknown
          }
        },
        400,
        partnerNoStoreHeaders()
      );
    }
    normalizedPatch.tags = tagValidation.tags;
  }
  return normalizedPatch;
}
__name(buildPartnerDraftPatch, "buildPartnerDraftPatch");
async function handlePartnerLeadDraftCreate(req, env, leadId) {
  const resolved = await readPartnerOwnedLeadForDraft(req, env, leadId, { requireReserved: true });
  if (resolved instanceof Response) return resolved;
  const body = await req.json().catch(() => ({}));
  const lead = resolved.lead;
  const existingDraftULID = String(lead.draftULID || "").trim();
  const existingDraftSessionId = String(lead.draftSessionId || "").trim();
  if (existingDraftULID && existingDraftSessionId) {
    const existing = await readPrivateShellDraft(env, existingDraftULID, existingDraftSessionId);
    if (existing) {
      return json(
        {
          ok: true,
          created: false,
          lead: publicPartnerLead(lead),
          draft: publicPartnerLeadDraft(existing, existingDraftULID),
          launch: partnerLaunchState(env)
        },
        200,
        partnerNoStoreHeaders()
      );
    }
  }
  const base = partnerLeadDraftBaseFromLead(lead);
  const normalizedPatch = await buildPartnerDraftPatch(env, body, base);
  if (normalizedPatch instanceof Response) return normalizedPatch;
  const draftULID = mintDraftUlid();
  const draftSessionId = mintDraftSessionId();
  const draftKey = `override_draft:${draftULID}:${draftSessionId}`;
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  const draft = mergeDraftPatch({}, normalizedPatch);
  draft.updatedAt = nowIso;
  await env.KV_STATUS.put(draftKey, JSON.stringify(draft));
  const nextLead = {
    ...lead,
    draftULID,
    draftSessionId,
    updatedAt: nowIso
  };
  await writePartnerLeadRecord(env, nextLead);
  return json(
    {
      ok: true,
      created: true,
      lead: publicPartnerLead(nextLead),
      draft: publicPartnerLeadDraft(draft, draftULID),
      launch: partnerLaunchState(env)
    },
    201,
    partnerNoStoreHeaders()
  );
}
__name(handlePartnerLeadDraftCreate, "handlePartnerLeadDraftCreate");
async function handlePartnerLeadDraftRead(req, env, leadId) {
  const resolved = await readPartnerOwnedLeadForDraft(req, env, leadId);
  if (resolved instanceof Response) return resolved;
  const lead = resolved.lead;
  const draftULID = String(lead.draftULID || "").trim();
  const draftSessionId = String(lead.draftSessionId || "").trim();
  if (!ULID_RE.test(draftULID) || !draftSessionId) {
    return json(
      {
        error: {
          code: "partner_lead_draft_not_found",
          message: "Partner lead draft not found."
        },
        lead: publicPartnerLead(lead)
      },
      404,
      partnerNoStoreHeaders()
    );
  }
  const draft = await readPrivateShellDraft(env, draftULID, draftSessionId);
  if (!draft) {
    return json(
      {
        error: {
          code: "partner_lead_draft_not_found",
          message: "Partner lead draft not found."
        },
        lead: publicPartnerLead(lead)
      },
      404,
      partnerNoStoreHeaders()
    );
  }
  return json(
    {
      ok: true,
      lead: publicPartnerLead(lead),
      draft: publicPartnerLeadDraft(draft, draftULID),
      launch: partnerLaunchState(env)
    },
    200,
    partnerNoStoreHeaders()
  );
}
__name(handlePartnerLeadDraftRead, "handlePartnerLeadDraftRead");
async function handlePartnerLeadDraftUpdate(req, env, leadId) {
  const resolved = await readPartnerOwnedLeadForDraft(req, env, leadId, { requireReserved: true });
  if (resolved instanceof Response) return resolved;
  const body = await req.json().catch(() => ({}));
  const lead = resolved.lead;
  const draftULID = String(lead.draftULID || "").trim();
  const draftSessionId = String(lead.draftSessionId || "").trim();
  if (!ULID_RE.test(draftULID) || !draftSessionId) {
    return json(
      {
        error: {
          code: "partner_lead_draft_not_found",
          message: "Create the Partner lead draft before updating it."
        },
        lead: publicPartnerLead(lead)
      },
      404,
      partnerNoStoreHeaders()
    );
  }
  const draftKey = `override_draft:${draftULID}:${draftSessionId}`;
  const prev = await env.KV_STATUS.get(draftKey, { type: "json" });
  if (!prev || typeof prev !== "object") {
    return json(
      {
        error: {
          code: "partner_lead_draft_not_found",
          message: "Partner lead draft not found."
        },
        lead: publicPartnerLead(lead)
      },
      404,
      partnerNoStoreHeaders()
    );
  }
  const normalizedPatch = await buildPartnerDraftPatch(env, body);
  if (normalizedPatch instanceof Response) return normalizedPatch;
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  const draft = mergeDraftPatch(prev, normalizedPatch);
  draft.updatedAt = nowIso;
  await env.KV_STATUS.put(draftKey, JSON.stringify(draft));
  const nextLead = {
    ...lead,
    updatedAt: nowIso
  };
  await writePartnerLeadRecord(env, nextLead);
  return json(
    {
      ok: true,
      lead: publicPartnerLead(nextLead),
      draft: publicPartnerLeadDraft(draft, draftULID),
      launch: partnerLaunchState(env)
    },
    200,
    partnerNoStoreHeaders()
  );
}
__name(handlePartnerLeadDraftUpdate, "handlePartnerLeadDraftUpdate");
var PARTNER_HANDOFF_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 14;
function partnerHandoffKey(tokenHash) {
  return `partner_handoff:${tokenHash}`;
}
__name(partnerHandoffKey, "partnerHandoffKey");
function partnerHandoffsByLeadKey(leadId) {
  return `partner_handoffs_by_lead:${leadId}`;
}
__name(partnerHandoffsByLeadKey, "partnerHandoffsByLeadKey");
function mintPartnerHandoffId() {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return `phand_${bytesToB64url(bytes)}`;
}
__name(mintPartnerHandoffId, "mintPartnerHandoffId");
function mintPartnerHandoffToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return `ph_${bytesToB64url(bytes)}`;
}
__name(mintPartnerHandoffToken, "mintPartnerHandoffToken");
function isValidPartnerHandoffToken(token) {
  return /^ph_[A-Za-z0-9_-]{32,120}$/.test(String(token || "").trim());
}
__name(isValidPartnerHandoffToken, "isValidPartnerHandoffToken");
function publicPartnerHandoff(handoff) {
  return {
    handoffId: handoff.handoffId,
    partnerId: handoff.partnerId,
    leadId: handoff.leadId,
    draftULID: handoff.draftULID,
    status: handoff.status,
    createdAt: handoff.createdAt,
    updatedAt: handoff.updatedAt,
    expiresAt: handoff.expiresAt,
    viewedAt: handoff.viewedAt,
    acceptedAt: handoff.acceptedAt
  };
}
__name(publicPartnerHandoff, "publicPartnerHandoff");
async function partnerHandoffTokenHash(token) {
  return await sha256Hex(String(token || "").trim());
}
__name(partnerHandoffTokenHash, "partnerHandoffTokenHash");
async function readPartnerHandoffByToken(env, token) {
  const rawToken = String(token || "").trim();
  if (!isValidPartnerHandoffToken(rawToken)) return null;
  const tokenHash = await partnerHandoffTokenHash(rawToken);
  const handoff = await env.KV_STATUS.get(partnerHandoffKey(tokenHash), { type: "json" });
  if (!handoff || typeof handoff !== "object" || String(handoff.tokenHash || "") !== tokenHash) {
    return null;
  }
  return handoff;
}
__name(readPartnerHandoffByToken, "readPartnerHandoffByToken");
async function writePartnerHandoff(env, handoff) {
  await env.KV_STATUS.put(
    partnerHandoffKey(handoff.tokenHash),
    JSON.stringify(handoff),
    { expirationTtl: PARTNER_HANDOFF_TOKEN_TTL_SECONDS }
  );
}
__name(writePartnerHandoff, "writePartnerHandoff");
async function readPartnerHandoffIndex(env, leadId) {
  const raw = await env.KV_STATUS.get(partnerHandoffsByLeadKey(leadId), "text");
  let rows = [];
  try {
    rows = raw ? JSON.parse(raw) : [];
  } catch {
    rows = [];
  }
  if (!Array.isArray(rows)) rows = [];
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (const row of rows) {
    const tokenHash = String(row || "").trim();
    if (!tokenHash || seen.has(tokenHash)) continue;
    seen.add(tokenHash);
    out.push(tokenHash);
    if (out.length >= 20) break;
  }
  return out;
}
__name(readPartnerHandoffIndex, "readPartnerHandoffIndex");
async function appendPartnerHandoffIndex(env, leadId, tokenHash) {
  const current = await readPartnerHandoffIndex(env, leadId);
  const next = [
    tokenHash,
    ...current.filter((value) => value !== tokenHash)
  ].slice(0, 20);
  await env.KV_STATUS.put(
    partnerHandoffsByLeadKey(leadId),
    JSON.stringify(next),
    { expirationTtl: PARTNER_HANDOFF_TOKEN_TTL_SECONDS }
  );
}
__name(appendPartnerHandoffIndex, "appendPartnerHandoffIndex");
async function expirePartnerHandoffIfNeeded(env, handoff) {
  const expMs = Date.parse(String(handoff.expiresAt || ""));
  if (handoff.status === "expired" || handoff.status === "revoked" || handoff.status === "accepted") {
    return handoff;
  }
  if (Number.isFinite(expMs) && expMs > Date.now()) {
    return handoff;
  }
  const next = {
    ...handoff,
    status: "expired",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  await writePartnerHandoff(env, next);
  return next;
}
__name(expirePartnerHandoffIfNeeded, "expirePartnerHandoffIfNeeded");
async function buildPartnerHandoffPreview(env, handoff) {
  const currentHandoff = await expirePartnerHandoffIfNeeded(env, handoff);
  if (currentHandoff.status === "expired") {
    return json(
      {
        error: {
          code: "partner_handoff_expired",
          message: "Partner handoff token has expired."
        },
        handoff: publicPartnerHandoff(currentHandoff)
      },
      410,
      partnerNoStoreHeaders()
    );
  }
  if (currentHandoff.status === "revoked") {
    return json(
      {
        error: {
          code: "partner_handoff_revoked",
          message: "Partner handoff token has been revoked."
        },
        handoff: publicPartnerHandoff(currentHandoff)
      },
      410,
      partnerNoStoreHeaders()
    );
  }
  const lead = await readPartnerLeadRecord(env, currentHandoff.leadId);
  if (!lead || lead.partnerId !== currentHandoff.partnerId) {
    return json(
      {
        error: {
          code: "partner_handoff_lead_not_found",
          message: "Partner handoff lead not found."
        }
      },
      404,
      partnerNoStoreHeaders()
    );
  }
  const currentLead = await expirePartnerLeadIfNeeded(env, lead);
  if (currentLead.status !== "reserved") {
    return json(
      {
        error: {
          code: "partner_handoff_lead_not_available",
          message: "Partner handoff lead is no longer available."
        },
        lead: publicPartnerLead(currentLead),
        handoff: publicPartnerHandoff(currentHandoff)
      },
      409,
      partnerNoStoreHeaders()
    );
  }
  const draftULID = String(currentLead.draftULID || "").trim();
  const draftSessionId = String(currentLead.draftSessionId || "").trim();
  if (!ULID_RE.test(draftULID) || !draftSessionId || draftULID !== currentHandoff.draftULID) {
    return json(
      {
        error: {
          code: "partner_handoff_draft_not_found",
          message: "Partner handoff draft not found."
        },
        lead: publicPartnerLead(currentLead),
        handoff: publicPartnerHandoff(currentHandoff)
      },
      404,
      partnerNoStoreHeaders()
    );
  }
  const draft = await readPrivateShellDraft(env, draftULID, draftSessionId);
  if (!draft) {
    return json(
      {
        error: {
          code: "partner_handoff_draft_not_found",
          message: "Partner handoff draft not found."
        },
        lead: publicPartnerLead(currentLead),
        handoff: publicPartnerHandoff(currentHandoff)
      },
      404,
      partnerNoStoreHeaders()
    );
  }
  return {
    handoff: currentHandoff,
    lead: currentLead,
    draft: publicPartnerLeadDraft(draft, draftULID)
  };
}
__name(buildPartnerHandoffPreview, "buildPartnerHandoffPreview");
async function handlePartnerHandoffCreate(req, env, leadId) {
  const resolved = await readPartnerOwnedLeadForDraft(req, env, leadId, { requireReserved: true });
  if (resolved instanceof Response) return resolved;
  const lead = resolved.lead;
  const draftULID = String(lead.draftULID || "").trim();
  const draftSessionId = String(lead.draftSessionId || "").trim();
  if (!ULID_RE.test(draftULID) || !draftSessionId) {
    return json(
      {
        error: {
          code: "partner_lead_draft_required",
          message: "Create the Partner lead draft before creating a handoff token."
        },
        lead: publicPartnerLead(lead)
      },
      409,
      partnerNoStoreHeaders()
    );
  }
  const draft = await readPrivateShellDraft(env, draftULID, draftSessionId);
  if (!draft) {
    return json(
      {
        error: {
          code: "partner_lead_draft_not_found",
          message: "Partner lead draft not found."
        },
        lead: publicPartnerLead(lead)
      },
      404,
      partnerNoStoreHeaders()
    );
  }
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const token = mintPartnerHandoffToken();
  const tokenHash = await partnerHandoffTokenHash(token);
  const handoff = {
    ver: 1,
    handoffId: mintPartnerHandoffId(),
    tokenHash,
    tokenHint: token.slice(-8),
    partnerId: resolved.auth.profile.partnerId,
    leadId: lead.leadId,
    draftULID,
    status: "created",
    createdAt: nowIso,
    updatedAt: nowIso,
    expiresAt: new Date(nowMs + PARTNER_HANDOFF_TOKEN_TTL_SECONDS * 1e3).toISOString(),
    viewedAt: "",
    acceptedAt: "",
    acceptedEmail: ""
  };
  await writePartnerHandoff(env, handoff);
  await appendPartnerHandoffIndex(env, lead.leadId, tokenHash);
  const siteOrigin = req.headers.get("Origin") || "https://navigen.io";
  const handoffUrl = `${siteOrigin.replace(/\/+$/, "")}/partner/handoff/${encodeURIComponent(token)}`;
  return json(
    {
      ok: true,
      token,
      handoffUrl,
      handoff: publicPartnerHandoff(handoff),
      lead: publicPartnerLead(lead),
      draft: publicPartnerLeadDraft(draft, draftULID),
      launch: partnerLaunchState(env)
    },
    201,
    partnerNoStoreHeaders()
  );
}
__name(handlePartnerHandoffCreate, "handlePartnerHandoffCreate");
async function handlePartnerHandoffPreview(req, env, token) {
  if (!partnerRoutesEnabled(env)) return partnerDisabledResponse(env);
  const handoff = await readPartnerHandoffByToken(env, token);
  if (!handoff) {
    return json(
      {
        error: {
          code: "partner_handoff_not_found",
          message: "Partner handoff token not found."
        }
      },
      404,
      partnerNoStoreHeaders()
    );
  }
  const preview = await buildPartnerHandoffPreview(env, handoff);
  if (preview instanceof Response) return preview;
  let currentHandoff = preview.handoff;
  if (currentHandoff.status === "created") {
    currentHandoff = {
      ...currentHandoff,
      status: "viewed",
      viewedAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await writePartnerHandoff(env, currentHandoff);
  }
  return json(
    {
      ok: true,
      handoff: publicPartnerHandoff(currentHandoff),
      lead: publicPartnerLead(preview.lead),
      draft: preview.draft,
      launch: partnerLaunchState(env)
    },
    200,
    partnerNoStoreHeaders()
  );
}
__name(handlePartnerHandoffPreview, "handlePartnerHandoffPreview");
async function handlePartnerHandoffAccept(req, env, token) {
  if (!partnerRoutesEnabled(env)) return partnerDisabledResponse(env);
  const handoff = await readPartnerHandoffByToken(env, token);
  if (!handoff) {
    return json(
      {
        error: {
          code: "partner_handoff_not_found",
          message: "Partner handoff token not found."
        }
      },
      404,
      partnerNoStoreHeaders()
    );
  }
  const preview = await buildPartnerHandoffPreview(env, handoff);
  if (preview instanceof Response) return preview;
  const body = await req.json().catch(() => ({}));
  const accepted = body?.accepted === true || body?.acceptTerms === true || body?.boAccepted === true;
  if (!accepted) {
    return json(
      {
        error: {
          code: "partner_handoff_acceptance_required",
          message: "BO acceptance is required."
        },
        handoff: publicPartnerHandoff(preview.handoff)
      },
      400,
      partnerNoStoreHeaders()
    );
  }
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  const acceptedEmail = sanitizePartnerLeadString(body?.boEmail || body?.email || "", 180);
  const next = {
    ...preview.handoff,
    status: "accepted",
    acceptedAt: preview.handoff.acceptedAt || nowIso,
    acceptedEmail,
    updatedAt: nowIso
  };
  await writePartnerHandoff(env, next);
  return json(
    {
      ok: true,
      handoff: publicPartnerHandoff(next),
      lead: publicPartnerLead(preview.lead),
      draft: preview.draft,
      launch: partnerLaunchState(env)
    },
    200,
    partnerNoStoreHeaders()
  );
}
__name(handlePartnerHandoffAccept, "handlePartnerHandoffAccept");
async function markPartnerLeadConvertedAfterPlanReconciliation(env, session, reconciled, logTag) {
  try {
    const meta = session?.metadata && typeof session.metadata === "object" ? session.metadata : {};
    const initiationType = normalizeInitiationType(meta?.initiationType || reconciled?.plan?.initiationType);
    if (initiationType !== "partner_assisted") return;
    let selection = null;
    const selectionId = String(reconciled?.planSelectionId || meta?.planSelectionId || "").trim();
    if (selectionId) {
      selection = await env.KV_STATUS.get(planSelectionKey(selectionId), { type: "json" });
    }
    const partnerId = String(selection?.partnerId || meta?.partnerId || "").trim();
    const partnerLeadId = String(selection?.partnerLeadId || meta?.partnerLeadId || "").trim();
    if (!partnerId || !partnerLeadId) return;
    const lead = await readPartnerLeadRecord(env, partnerLeadId);
    if (!lead || lead.partnerId !== partnerId) return;
    if (lead.status !== "converted") {
      const nextLead = {
        ...lead,
        status: "converted",
        locationULID: String(reconciled?.primaryUlid || lead.locationULID || "").trim(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      await writePartnerLeadRecord(env, nextLead);
    }
    const profile = await readPartnerProfile(env, partnerId);
    if (profile) {
      const leads = await listPartnerLeadRecords(env, partnerId);
      await syncPartnerOpenLeadCount(env, profile, leads);
    }
  } catch (err) {
    console.error(`${logTag}: partner_lead_conversion_mark_failed`, {
      err: String(err?.message || err || ""),
      checkoutSessionId: String(session?.id || "").trim(),
      paymentIntentId: String(reconciled?.paymentIntentId || "").trim()
    });
  }
}
__name(markPartnerLeadConvertedAfterPlanReconciliation, "markPartnerLeadConvertedAfterPlanReconciliation");
function partnerPlanCheckoutBlockedResponse(env) {
  return json(
    {
      error: {
        code: "partner_public_launch_blocked",
        message: "Partner-assisted BO Plan payment is not publicly enabled."
      },
      launch: partnerLaunchState(env)
    },
    403,
    partnerNoStoreHeaders()
  );
}
__name(partnerPlanCheckoutBlockedResponse, "partnerPlanCheckoutBlockedResponse");
function partnerCheckoutSuccessUrl(siteOrigin, checkoutSessionPlaceholder) {
  const successUrlObj = new URL("/owner/stripe-exchange", siteOrigin);
  successUrlObj.searchParams.set("sid", checkoutSessionPlaceholder);
  const successUrl = successUrlObj.toString().replace("%7BCHECKOUT_SESSION_ID%7D", "{CHECKOUT_SESSION_ID}");
  return successUrl;
}
__name(partnerCheckoutSuccessUrl, "partnerCheckoutSuccessUrl");
function partnerCheckoutCancelUrl(siteOrigin, token) {
  const cancelUrl = new URL(`/partner/handoff/${encodeURIComponent(token)}`, siteOrigin);
  cancelUrl.searchParams.set("canceled", "1");
  return cancelUrl.toString();
}
__name(partnerCheckoutCancelUrl, "partnerCheckoutCancelUrl");
function partnerCampaignDraftFromCheckoutBody(body, draftULID, requestedPlan, planMode) {
  const src = body?.campaignDraft && typeof body.campaignDraft === "object" ? body.campaignDraft : body;
  const campaignKey = sanitizePartnerLeadString(src?.campaignKey || body?.campaignKey, 120);
  const startDate = sanitizePartnerLeadString(src?.startDate, 20);
  const endDate = sanitizePartnerLeadString(src?.endDate, 20);
  return {
    ...src,
    campaignKey,
    startDate,
    endDate,
    campaignScope: "single",
    selectedLocationULIDs: [],
    planCode: requestedPlan.code,
    planMode,
    campaignPreset: "promotion",
    locationID: draftULID,
    locationULID: draftULID,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
__name(partnerCampaignDraftFromCheckoutBody, "partnerCampaignDraftFromCheckoutBody");
async function handlePartnerHandoffPlanCheckout(req, env, token) {
  if (!partnerRoutesEnabled(env)) return partnerDisabledResponse(env);
  if (!partnerPublicLaunchAllowed(env)) {
    return partnerPlanCheckoutBlockedResponse(env);
  }
  const sk = String(env.STRIPE_SECRET_KEY || "").trim();
  if (!sk) {
    return json(
      {
        error: {
          code: "misconfigured",
          message: "STRIPE_SECRET_KEY not set"
        }
      },
      500,
      partnerNoStoreHeaders()
    );
  }
  const handoff = await readPartnerHandoffByToken(env, token);
  if (!handoff) {
    return json(
      {
        error: {
          code: "partner_handoff_not_found",
          message: "Partner handoff token not found."
        }
      },
      404,
      partnerNoStoreHeaders()
    );
  }
  const preview = await buildPartnerHandoffPreview(env, handoff);
  if (preview instanceof Response) return preview;
  if (preview.handoff.status !== "accepted") {
    return json(
      {
        error: {
          code: "partner_handoff_acceptance_required",
          message: "BO acceptance is required before Partner-assisted Plan checkout."
        },
        handoff: publicPartnerHandoff(preview.handoff)
      },
      409,
      partnerNoStoreHeaders()
    );
  }
  const body = await req.json().catch(() => ({}));
  const planCode = String(body?.planCode || "").trim().toLowerCase();
  const requestedPlan = planDefinitionForCode(planCode);
  const planMode = normalizePlanMode(body?.planMode, body?.campaignPreset);
  const requiresCampaignDraft = planMode === "campaign_with_promo_qr";
  if (!requestedPlan || !requestedPlan.allowedPlanModes.includes(planMode)) {
    return json(
      {
        error: {
          code: "invalid_partner_plan_checkout",
          message: "Valid planCode and planMode are required."
        }
      },
      400,
      partnerNoStoreHeaders()
    );
  }
  const draftULID = String(preview.lead.draftULID || "").trim();
  const draftSessionId = String(preview.lead.draftSessionId || "").trim();
  if (!ULID_RE.test(draftULID) || !draftSessionId) {
    return json(
      {
        error: {
          code: "partner_handoff_draft_not_found",
          message: "Partner handoff draft not found."
        },
        handoff: publicPartnerHandoff(preview.handoff),
        lead: publicPartnerLead(preview.lead)
      },
      404,
      partnerNoStoreHeaders()
    );
  }
  let campaignKey = "";
  if (requiresCampaignDraft) {
    const campaignDraft = partnerCampaignDraftFromCheckoutBody(body, draftULID, requestedPlan, planMode);
    campaignKey = String(campaignDraft?.campaignKey || "").trim();
    if (!campaignKey || !/^\d{4}-\d{2}-\d{2}$/.test(String(campaignDraft?.startDate || "")) || !/^\d{4}-\d{2}-\d{2}$/.test(String(campaignDraft?.endDate || ""))) {
      return json(
        {
          error: {
            code: "invalid_partner_campaign_draft",
            message: "Campaign with Promo QR checkout requires campaignKey, startDate, and endDate."
          }
        },
        400,
        partnerNoStoreHeaders()
      );
    }
    await env.KV_STATUS.put(`campaigns:draft:${draftULID}`, JSON.stringify(campaignDraft));
  }
  const selectionId = mintPlanSelectionId();
  const createdAt = /* @__PURE__ */ new Date();
  const selectionExpiresAt = new Date(createdAt.getTime() + PLAN_SELECTION_TTL_SECONDS * 1e3);
  const commissionPolicyVersion = String(preview.lead.partnerId ? (await readPartnerProfile(env, preview.lead.partnerId))?.commissionPolicyVersion || "partner-v1" : "partner-v1").trim() || "partner-v1";
  const planSelection = {
    ver: 1,
    selectionId,
    route: "brand-new-private-shell",
    locationIDs: [],
    coveredUlids: [draftULID],
    draftULID,
    draftSessionId,
    planCode: requestedPlan.code,
    priceId: requestedPlan.priceId,
    planMode,
    initiationType: "partner_assisted",
    campaignKey: requiresCampaignDraft ? campaignKey : "",
    navigenVersion: "partner-v1",
    createdAt: createdAt.toISOString(),
    expiresAt: selectionExpiresAt.toISOString(),
    deviceId: readDeviceId(req),
    source: "partner_handoff",
    partnerId: preview.lead.partnerId,
    partnerLeadId: preview.lead.leadId,
    partnerHandoffId: preview.handoff.handoffId,
    commissionPolicyVersion
  };
  await env.KV_STATUS.put(planSelectionKey(selectionId), JSON.stringify(planSelection), { expirationTtl: PLAN_SELECTION_TTL_SECONDS });
  const siteOrigin = req.headers.get("Origin") || "https://navigen.io";
  const successUrl = partnerCheckoutSuccessUrl(siteOrigin, "{CHECKOUT_SESSION_ID}");
  const cancelUrl = partnerCheckoutCancelUrl(siteOrigin, token);
  const form = new URLSearchParams();
  form.set("mode", "payment");
  form.set("customer_creation", "if_required");
  form.set("billing_address_collection", "auto");
  form.set("success_url", successUrl);
  form.set("cancel_url", cancelUrl);
  form.set("line_items[0][quantity]", "1");
  form.set("line_items[0][price]", requestedPlan.priceId);
  form.set("metadata[planSelectionId]", selectionId);
  form.set("metadata[planMode]", planMode);
  form.set("metadata[initiationType]", "partner_assisted");
  form.set("metadata[ownershipSource]", "plan");
  form.set("metadata[navigenVersion]", "partner-v1");
  form.set("metadata[draftULID]", draftULID);
  form.set("metadata[draftSessionId]", draftSessionId);
  form.set("metadata[partnerId]", preview.lead.partnerId);
  form.set("metadata[partnerLeadId]", preview.lead.leadId);
  form.set("metadata[partnerHandoffId]", preview.handoff.handoffId);
  form.set("metadata[commissionPolicyVersion]", commissionPolicyVersion);
  if (requiresCampaignDraft) form.set("metadata[campaignKey]", campaignKey);
  form.set("payment_intent_data[metadata][planSelectionId]", selectionId);
  form.set("payment_intent_data[metadata][planMode]", planMode);
  form.set("payment_intent_data[metadata][initiationType]", "partner_assisted");
  form.set("payment_intent_data[metadata][ownershipSource]", "plan");
  form.set("payment_intent_data[metadata][navigenVersion]", "partner-v1");
  form.set("payment_intent_data[metadata][draftULID]", draftULID);
  form.set("payment_intent_data[metadata][draftSessionId]", draftSessionId);
  form.set("payment_intent_data[metadata][partnerId]", preview.lead.partnerId);
  form.set("payment_intent_data[metadata][partnerLeadId]", preview.lead.leadId);
  form.set("payment_intent_data[metadata][partnerHandoffId]", preview.handoff.handoffId);
  form.set("payment_intent_data[metadata][commissionPolicyVersion]", commissionPolicyVersion);
  if (requiresCampaignDraft) form.set("payment_intent_data[metadata][campaignKey]", campaignKey);
  const stripeResp = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${sk}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: form.toString()
  });
  const stripeText = await stripeResp.text();
  let stripeOut = null;
  try {
    stripeOut = JSON.parse(stripeText);
  } catch {
    stripeOut = null;
  }
  if (!stripeResp.ok || !stripeOut?.id) {
    return json(
      {
        error: {
          code: "stripe_error",
          message: String(stripeOut?.error?.message || "Stripe create session failed")
        }
      },
      502,
      partnerNoStoreHeaders()
    );
  }
  return json(
    {
      ok: true,
      flow: "partner_assisted_plan_checkout",
      sessionId: String(stripeOut.id || ""),
      url: String(stripeOut.url || ""),
      planSelectionId: selectionId,
      handoff: publicPartnerHandoff(preview.handoff),
      lead: publicPartnerLead(preview.lead),
      launch: partnerLaunchState(env)
    },
    200,
    partnerNoStoreHeaders()
  );
}
__name(handlePartnerHandoffPlanCheckout, "handlePartnerHandoffPlanCheckout");
var PARTNER_COMMISSION_ELIGIBILITY_DAYS = 14;
var PARTNER_COMMISSION_INDEX_LIMIT = 500;
function partnerCommissionKey(commissionId) {
  return `partner_commission:${commissionId}`;
}
__name(partnerCommissionKey, "partnerCommissionKey");
function partnerCommissionByPaymentKey(paymentIntentId) {
  return `partner_commission_by_payment:${paymentIntentId}`;
}
__name(partnerCommissionByPaymentKey, "partnerCommissionByPaymentKey");
function partnerCommissionsByPartnerKey(partnerId) {
  return `partner_commissions_by_partner:${partnerId}`;
}
__name(partnerCommissionsByPartnerKey, "partnerCommissionsByPartnerKey");
function partnerCommissionsByLeadKey(partnerLeadId) {
  return `partner_commissions_by_lead:${partnerLeadId}`;
}
__name(partnerCommissionsByLeadKey, "partnerCommissionsByLeadKey");
function mintPartnerCommissionId() {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return `pc_${bytesToB64url(bytes)}`;
}
__name(mintPartnerCommissionId, "mintPartnerCommissionId");
function normalizePartnerCommissionStatus(value) {
  const s = String(value || "").trim().toLowerCase();
  if (s === "pending_requires_connect" || s === "pending" || s === "eligible" || s === "paid" || s === "void" || s === "adjusted") {
    return s;
  }
  return "";
}
__name(normalizePartnerCommissionStatus, "normalizePartnerCommissionStatus");
function partnerCommissionPolicyFor(tier, policyVersion) {
  const version = String(policyVersion || "partner-v1").trim() || "partner-v1";
  if (tier === "standard") {
    return {
      commissionPolicyVersion: version,
      activationBountyAmount: 40,
      activationBountyAmountCents: 4e3,
      renewalSharePercent: 20,
      renewalTailMonths: 5,
      totalCapAmount: 120,
      totalCapAmountCents: 12e3
    };
  }
  if (tier === "multi") {
    return {
      commissionPolicyVersion: version,
      activationBountyAmount: 90,
      activationBountyAmountCents: 9e3,
      renewalSharePercent: 20,
      renewalTailMonths: 5,
      totalCapAmount: 270,
      totalCapAmountCents: 27e3
    };
  }
  if (tier === "large") {
    return {
      commissionPolicyVersion: version,
      activationBountyAmount: 175,
      activationBountyAmountCents: 17500,
      renewalSharePercent: 15,
      renewalTailMonths: 5,
      totalCapAmount: 525,
      totalCapAmountCents: 52500
    };
  }
  return null;
}
__name(partnerCommissionPolicyFor, "partnerCommissionPolicyFor");
function publicPartnerCommission(commission) {
  return {
    commissionId: commission.commissionId,
    partnerId: commission.partnerId,
    partnerLeadId: commission.partnerLeadId,
    partnerHandoffId: commission.partnerHandoffId,
    planSelectionId: commission.planSelectionId,
    paymentIntentId: commission.paymentIntentId,
    checkoutSessionId: commission.checkoutSessionId,
    locationULID: commission.locationULID,
    planTier: commission.planTier,
    planMode: commission.planMode,
    grossAmount: commission.grossAmount,
    grossAmountCents: commission.grossAmountCents,
    currency: commission.currency,
    commissionPolicyVersion: commission.commissionPolicyVersion,
    commissionAmount: commission.commissionAmount,
    commissionAmountCents: commission.commissionAmountCents,
    renewalSharePercent: commission.renewalSharePercent,
    renewalTailMonths: commission.renewalTailMonths,
    totalCapAmount: commission.totalCapAmount,
    totalCapAmountCents: commission.totalCapAmountCents,
    status: commission.status,
    connectStatusAtCreation: commission.connectStatusAtCreation,
    source: commission.source,
    createdAt: commission.createdAt,
    updatedAt: commission.updatedAt,
    eligibleAt: commission.eligibleAt,
    paidAt: commission.paidAt,
    transferId: commission.transferId,
    adjustmentReason: commission.adjustmentReason
  };
}
__name(publicPartnerCommission, "publicPartnerCommission");
async function readPartnerCommission(env, commissionId) {
  const id = String(commissionId || "").trim();
  if (!id) return null;
  const commission = await env.KV_STATUS.get(partnerCommissionKey(id), { type: "json" });
  if (!commission || typeof commission !== "object" || String(commission.commissionId || "").trim() !== id) return null;
  return commission;
}
__name(readPartnerCommission, "readPartnerCommission");
async function writePartnerCommission(env, commission) {
  await env.KV_STATUS.put(partnerCommissionKey(commission.commissionId), JSON.stringify(commission));
  await env.KV_STATUS.put(partnerCommissionByPaymentKey(commission.paymentIntentId), commission.commissionId);
}
__name(writePartnerCommission, "writePartnerCommission");
async function readPartnerCommissionIndex(env, key) {
  const raw = await env.KV_STATUS.get(key, "text");
  let rows = [];
  try {
    rows = raw ? JSON.parse(raw) : [];
  } catch {
    rows = [];
  }
  if (!Array.isArray(rows)) rows = [];
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (const row of rows) {
    const id = String(row || "").trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= PARTNER_COMMISSION_INDEX_LIMIT) break;
  }
  return out;
}
__name(readPartnerCommissionIndex, "readPartnerCommissionIndex");
async function appendPartnerCommissionIndex(env, key, commissionId) {
  const current = await readPartnerCommissionIndex(env, key);
  const next = [
    commissionId,
    ...current.filter((value) => value !== commissionId)
  ].slice(0, PARTNER_COMMISSION_INDEX_LIMIT);
  await env.KV_STATUS.put(key, JSON.stringify(next));
}
__name(appendPartnerCommissionIndex, "appendPartnerCommissionIndex");
async function listPartnerCommissions(env, partnerId) {
  const ids = await readPartnerCommissionIndex(env, partnerCommissionsByPartnerKey(partnerId));
  const out = [];
  for (const commissionId of ids) {
    const commission = await readPartnerCommission(env, commissionId);
    if (!commission || commission.partnerId !== partnerId) continue;
    out.push(commission);
  }
  return out;
}
__name(listPartnerCommissions, "listPartnerCommissions");
async function ensurePartnerCommissionAfterPlanReconciliation(env, session, reconciled, logTag) {
  try {
    const meta = session?.metadata && typeof session.metadata === "object" ? session.metadata : {};
    const initiationType = normalizeInitiationType(meta?.initiationType || reconciled?.plan?.initiationType);
    if (initiationType !== "partner_assisted") return null;
    const paymentIntentId = String(
      reconciled?.paymentIntentId || session?.payment_intent?.id || session?.payment_intent || ""
    ).trim();
    if (!paymentIntentId) return null;
    const existingCommissionId = await env.KV_STATUS.get(partnerCommissionByPaymentKey(paymentIntentId), "text");
    if (existingCommissionId) {
      return await readPartnerCommission(env, existingCommissionId);
    }
    let selection = null;
    const selectionId = String(reconciled?.planSelectionId || meta?.planSelectionId || "").trim();
    if (selectionId) {
      selection = await env.KV_STATUS.get(planSelectionKey(selectionId), { type: "json" });
    }
    const allocation = reconciled?.allocation && typeof reconciled.allocation === "object" ? reconciled.allocation : {};
    const partnerId = String(selection?.partnerId || allocation?.partnerId || meta?.partnerId || "").trim();
    const partnerLeadId = String(selection?.partnerLeadId || allocation?.partnerLeadId || meta?.partnerLeadId || "").trim();
    const partnerHandoffId = String(selection?.partnerHandoffId || allocation?.partnerHandoffId || meta?.partnerHandoffId || "").trim();
    const commissionPolicyVersion = String(selection?.commissionPolicyVersion || allocation?.commissionPolicyVersion || meta?.commissionPolicyVersion || "partner-v1").trim() || "partner-v1";
    if (!partnerId || !partnerLeadId) return null;
    const profile = await readPartnerProfile(env, partnerId);
    if (!profile) return null;
    const lead = await readPartnerLeadRecord(env, partnerLeadId);
    if (!lead || lead.partnerId !== partnerId) return null;
    const tier = reconciled?.plan?.tier || "unknown";
    const policy = partnerCommissionPolicyFor(tier, commissionPolicyVersion);
    if (!policy || policy.activationBountyAmountCents <= 0) {
      return null;
    }
    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();
    const eligibleAt = new Date(nowMs + PARTNER_COMMISSION_ELIGIBILITY_DAYS * 24 * 60 * 60 * 1e3).toISOString();
    const grossAmount = Number(reconciled?.plan?.grossAmount || 0);
    const grossAmountCents = Math.max(0, Math.round(grossAmount * 100));
    const connectReady = profile.connectStatus === "complete" && !!String(profile.stripeConnectedAccountId || "").trim();
    const commissionId = mintPartnerCommissionId();
    const commission = {
      ver: 1,
      commissionId,
      partnerId,
      partnerLeadId,
      partnerHandoffId,
      planSelectionId: selectionId,
      paymentIntentId,
      checkoutSessionId: String(reconciled?.checkoutSessionId || session?.id || "").trim(),
      locationULID: String(reconciled?.primaryUlid || lead.locationULID || "").trim(),
      planTier: tier,
      planMode: reconciled?.plan?.planMode || "managed_presence",
      priceId: String(reconciled?.plan?.priceId || "").trim(),
      grossAmount,
      grossAmountCents,
      currency: String(reconciled?.plan?.currency || "EUR").trim().toUpperCase() || "EUR",
      commissionPolicyVersion: policy.commissionPolicyVersion,
      commissionAmount: policy.activationBountyAmount,
      commissionAmountCents: policy.activationBountyAmountCents,
      renewalSharePercent: policy.renewalSharePercent,
      renewalTailMonths: policy.renewalTailMonths,
      totalCapAmount: policy.totalCapAmount,
      totalCapAmountCents: policy.totalCapAmountCents,
      status: connectReady ? "pending" : "pending_requires_connect",
      stripeConnectedAccountId: String(profile.stripeConnectedAccountId || "").trim(),
      connectStatusAtCreation: profile.connectStatus,
      source: logTag || "plan_reconcile",
      createdAt: nowIso,
      updatedAt: nowIso,
      eligibleAt,
      paidAt: "",
      transferId: "",
      adjustmentReason: ""
    };
    await writePartnerCommission(env, commission);
    await appendPartnerCommissionIndex(env, partnerCommissionsByPartnerKey(partnerId), commissionId);
    await appendPartnerCommissionIndex(env, partnerCommissionsByLeadKey(partnerLeadId), commissionId);
    return commission;
  } catch (err) {
    console.error(`${logTag}: partner_commission_create_failed`, {
      err: String(err?.message || err || ""),
      checkoutSessionId: String(session?.id || "").trim(),
      paymentIntentId: String(reconciled?.paymentIntentId || "").trim()
    });
    return null;
  }
}
__name(ensurePartnerCommissionAfterPlanReconciliation, "ensurePartnerCommissionAfterPlanReconciliation");
async function handlePartnerCommissionList(req, env) {
  const auth = await requirePartnerSession(req, env);
  if (auth instanceof Response) return auth;
  const url = new URL(req.url);
  const statusFilter = normalizePartnerCommissionStatus(url.searchParams.get("status"));
  let commissions = await listPartnerCommissions(env, auth.profile.partnerId);
  if (statusFilter) {
    commissions = commissions.filter((commission) => commission.status === statusFilter);
  }
  return json(
    {
      ok: true,
      partner: publicPartnerProfile(auth.profile),
      items: commissions.map(publicPartnerCommission),
      total: commissions.length,
      launch: partnerLaunchState(env)
    },
    200,
    partnerNoStoreHeaders()
  );
}
__name(handlePartnerCommissionList, "handlePartnerCommissionList");
function adminNoStoreHeaders() {
  return { "cache-control": "no-store" };
}
__name(adminNoStoreHeaders, "adminNoStoreHeaders");
function adminAuthError(req, env) {
  if (isAdminPreseedAuthorized(req, env)) return null;
  return json(
    {
      error: {
        code: "forbidden",
        message: "admin authorization required"
      }
    },
    403,
    adminNoStoreHeaders()
  );
}
__name(adminAuthError, "adminAuthError");
function normalizeAdminPartnerStatus(value) {
  const s = String(value || "").trim().toLowerCase();
  if (s === "applicant" || s === "verified" || s === "trusted" || s === "regional_partner" || s === "suspended") return s;
  return "";
}
__name(normalizeAdminPartnerStatus, "normalizeAdminPartnerStatus");
function adminPartnerProfile(profile) {
  return {
    partnerId: profile.partnerId,
    status: profile.status,
    stripeConnectedAccountId: profile.stripeConnectedAccountId,
    connectStatus: profile.connectStatus,
    leadCapacity: profile.leadCapacity,
    freeLeadQuota: profile.freeLeadQuota,
    openLeadCount: profile.openLeadCount,
    commissionPolicyVersion: profile.commissionPolicyVersion,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt
  };
}
__name(adminPartnerProfile, "adminPartnerProfile");
async function listAdminPartnerProfiles(env, opts = {}) {
  const limit = Math.max(1, Math.min(100, Math.trunc(Number(opts.limit || 50) || 50)));
  const cursor = String(opts.cursor || "").trim() || void 0;
  const page = await env.KV_STATUS.list({
    prefix: "partner:",
    cursor,
    limit: Math.max(limit, 100)
  });
  const items = [];
  let scanned = 0;
  for (const key of page.keys) {
    scanned += 1;
    const partnerId = String(key.name || "").replace(/^partner:/, "").trim();
    if (!partnerId.startsWith("prt_")) continue;
    const profile = await readPartnerProfile(env, partnerId);
    if (!profile) continue;
    if (opts.status && profile.status !== opts.status) continue;
    items.push(profile);
    if (items.length >= limit) break;
  }
  return {
    items,
    cursor: String(page.cursor || ""),
    scanned
  };
}
__name(listAdminPartnerProfiles, "listAdminPartnerProfiles");
async function handleAdminPartnerList(req, env) {
  const authError = adminAuthError(req, env);
  if (authError) return authError;
  const url = new URL(req.url);
  const status = normalizeAdminPartnerStatus(url.searchParams.get("status"));
  const limit = Math.max(1, Math.min(100, Math.trunc(Number(url.searchParams.get("limit") || 50) || 50)));
  const cursor = String(url.searchParams.get("cursor") || "").trim();
  const result = await listAdminPartnerProfiles(env, { status, limit, cursor });
  return json(
    {
      ok: true,
      items: result.items.map(adminPartnerProfile),
      total: result.items.length,
      cursor: result.cursor,
      scanned: result.scanned
    },
    200,
    adminNoStoreHeaders()
  );
}
__name(handleAdminPartnerList, "handleAdminPartnerList");
async function handleAdminPartnerRead(req, env, partnerId) {
  const authError = adminAuthError(req, env);
  if (authError) return authError;
  const profile = await readPartnerProfile(env, partnerId);
  if (!profile) {
    return json(
      {
        error: {
          code: "admin_partner_not_found",
          message: "Partner not found."
        }
      },
      404,
      adminNoStoreHeaders()
    );
  }
  const leads = await listPartnerLeadRecords(env, profile.partnerId);
  const syncedProfile = await syncPartnerOpenLeadCount(env, profile, leads);
  const commissions = await listPartnerCommissions(env, profile.partnerId);
  return json(
    {
      ok: true,
      partner: adminPartnerProfile(syncedProfile),
      leads: leads.map(publicPartnerLead),
      commissions: commissions.map(publicPartnerCommission)
    },
    200,
    adminNoStoreHeaders()
  );
}
__name(handleAdminPartnerRead, "handleAdminPartnerRead");
async function handleAdminPartnerStatusUpdate(req, env, partnerId) {
  const authError = adminAuthError(req, env);
  if (authError) return authError;
  const profile = await readPartnerProfile(env, partnerId);
  if (!profile) {
    return json(
      {
        error: {
          code: "admin_partner_not_found",
          message: "Partner not found."
        }
      },
      404,
      adminNoStoreHeaders()
    );
  }
  const body = await req.json().catch(() => ({}));
  const status = normalizeAdminPartnerStatus(body?.status);
  if (!status) {
    return json(
      {
        error: {
          code: "invalid_partner_status",
          message: "Valid status is required."
        }
      },
      400,
      adminNoStoreHeaders()
    );
  }
  const next = {
    ...profile,
    status,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  await writePartnerProfile(env, next);
  return json(
    {
      ok: true,
      partner: adminPartnerProfile(next)
    },
    200,
    adminNoStoreHeaders()
  );
}
__name(handleAdminPartnerStatusUpdate, "handleAdminPartnerStatusUpdate");
async function handleAdminPartnerCapacityUpdate(req, env, partnerId) {
  const authError = adminAuthError(req, env);
  if (authError) return authError;
  const profile = await readPartnerProfile(env, partnerId);
  if (!profile) {
    return json(
      {
        error: {
          code: "admin_partner_not_found",
          message: "Partner not found."
        }
      },
      404,
      adminNoStoreHeaders()
    );
  }
  const body = await req.json().catch(() => ({}));
  const nextLeadCapacity = Math.max(0, Math.min(1e4, Math.trunc(Number(body?.leadCapacity ?? profile.leadCapacity) || 0)));
  const nextFreeLeadQuota = Math.max(0, Math.min(1e4, Math.trunc(Number(body?.freeLeadQuota ?? profile.freeLeadQuota) || 0)));
  const leads = await listPartnerLeadRecords(env, profile.partnerId);
  const openLeadCount = leads.filter(partnerLeadIsOpen).length;
  const next = {
    ...profile,
    leadCapacity: nextLeadCapacity,
    freeLeadQuota: nextFreeLeadQuota,
    openLeadCount,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  await writePartnerProfile(env, next);
  return json(
    {
      ok: true,
      partner: adminPartnerProfile(next)
    },
    200,
    adminNoStoreHeaders()
  );
}
__name(handleAdminPartnerCapacityUpdate, "handleAdminPartnerCapacityUpdate");
async function handleAdminPartnerRevokeAttribution(req, env, partnerId) {
  const authError = adminAuthError(req, env);
  if (authError) return authError;
  const profile = await readPartnerProfile(env, partnerId);
  if (!profile) {
    return json(
      {
        error: {
          code: "admin_partner_not_found",
          message: "Partner not found."
        }
      },
      404,
      adminNoStoreHeaders()
    );
  }
  const body = await req.json().catch(() => ({}));
  const partnerLeadId = sanitizePartnerLeadString(body?.partnerLeadId || body?.leadId, 100);
  const reason = sanitizePartnerLeadString(body?.reason || "admin_attribution_revoked", 300) || "admin_attribution_revoked";
  if (!partnerLeadId) {
    return json(
      {
        error: {
          code: "partner_lead_required",
          message: "partnerLeadId is required."
        }
      },
      400,
      adminNoStoreHeaders()
    );
  }
  const lead = await readPartnerLeadRecord(env, partnerLeadId);
  if (!lead || lead.partnerId !== profile.partnerId) {
    return json(
      {
        error: {
          code: "partner_lead_not_found",
          message: "Partner lead not found."
        }
      },
      404,
      adminNoStoreHeaders()
    );
  }
  let nextLead = lead;
  if (lead.status !== "converted") {
    nextLead = {
      ...lead,
      status: "rejected",
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await writePartnerLeadRecord(env, nextLead);
    await deletePartnerLeadFingerprintIfOwned(env, nextLead);
  }
  const commissionIds = await readPartnerCommissionIndex(env, partnerCommissionsByLeadKey(partnerLeadId));
  const changedCommissions = [];
  for (const commissionId of commissionIds) {
    const commission = await readPartnerCommission(env, commissionId);
    if (!commission || commission.partnerId !== profile.partnerId || commission.partnerLeadId !== partnerLeadId) continue;
    if (commission.status === "void" || commission.status === "adjusted") {
      changedCommissions.push(commission);
      continue;
    }
    const nextCommission = {
      ...commission,
      status: commission.status === "paid" ? "adjusted" : "void",
      adjustmentReason: reason,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await writePartnerCommission(env, nextCommission);
    changedCommissions.push(nextCommission);
  }
  const leads = await listPartnerLeadRecords(env, profile.partnerId);
  const syncedProfile = await syncPartnerOpenLeadCount(env, profile, leads);
  return json(
    {
      ok: true,
      partner: adminPartnerProfile(syncedProfile),
      lead: publicPartnerLead(nextLead),
      commissions: changedCommissions.map(publicPartnerCommission),
      reason
    },
    200,
    adminNoStoreHeaders()
  );
}
__name(handleAdminPartnerRevokeAttribution, "handleAdminPartnerRevokeAttribution");
async function handleAdminPartnerCommissionList(req, env) {
  const authError = adminAuthError(req, env);
  if (authError) return authError;
  const url = new URL(req.url);
  const partnerId = sanitizePartnerLeadString(url.searchParams.get("partnerId"), 100);
  const status = normalizePartnerCommissionStatus(url.searchParams.get("status"));
  const limit = Math.max(1, Math.min(100, Math.trunc(Number(url.searchParams.get("limit") || 50) || 50)));
  const cursor = String(url.searchParams.get("cursor") || "").trim() || void 0;
  let commissions = [];
  let nextCursor = "";
  if (partnerId) {
    commissions = await listPartnerCommissions(env, partnerId);
  } else {
    const page = await env.KV_STATUS.list({
      prefix: "partner_commission:",
      cursor,
      limit: Math.max(limit, 100)
    });
    nextCursor = String(page.cursor || "");
    for (const key of page.keys) {
      const commissionId = String(key.name || "").replace(/^partner_commission:/, "").trim();
      if (!commissionId.startsWith("pc_")) continue;
      const commission = await readPartnerCommission(env, commissionId);
      if (!commission) continue;
      commissions.push(commission);
      if (commissions.length >= limit) break;
    }
  }
  if (status) {
    commissions = commissions.filter((commission) => commission.status === status);
  }
  commissions = commissions.slice(0, limit);
  return json(
    {
      ok: true,
      items: commissions.map(publicPartnerCommission),
      total: commissions.length,
      cursor: nextCursor
    },
    200,
    adminNoStoreHeaders()
  );
}
__name(handleAdminPartnerCommissionList, "handleAdminPartnerCommissionList");
function normalizePartnerConnectCountry(value) {
  const raw = String(value || "").trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(raw)) return raw;
  return "HU";
}
__name(normalizePartnerConnectCountry, "normalizePartnerConnectCountry");
function normalizePartnerEmail(value) {
  const email = sanitizePartnerLeadString(value, 180);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}
__name(normalizePartnerEmail, "normalizePartnerEmail");
function partnerConnectReturnUrl(req, body, key) {
  const raw = sanitizePartnerLeadString(body?.[key], 600);
  if (raw) {
    try {
      const u = new URL(raw);
      if (u.protocol === "https:") return u.toString();
    } catch {
    }
  }
  const origin = req.headers.get("Origin") || "https://navigen.io";
  const url = new URL("/partner/center", origin);
  url.searchParams.set("connect", key === "returnUrl" ? "return" : "refresh");
  return url.toString();
}
__name(partnerConnectReturnUrl, "partnerConnectReturnUrl");
async function partnerStripeFormRequest(sk, path, form) {
  const resp = await fetch(`https://api.stripe.com${path}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${sk}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: form.toString()
  });
  const text = await resp.text();
  let out = null;
  try {
    out = JSON.parse(text);
  } catch {
    out = null;
  }
  if (!resp.ok) {
    throw new Error(String(out?.error?.message || `Stripe ${path} failed`));
  }
  return out || {};
}
__name(partnerStripeFormRequest, "partnerStripeFormRequest");
async function partnerStripeGetRequest(sk, path) {
  const resp = await fetch(`https://api.stripe.com${path}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${sk}`
    }
  });
  const text = await resp.text();
  let out = null;
  try {
    out = JSON.parse(text);
  } catch {
    out = null;
  }
  if (!resp.ok) {
    throw new Error(String(out?.error?.message || `Stripe ${path} failed`));
  }
  return out || {};
}
__name(partnerStripeGetRequest, "partnerStripeGetRequest");
function partnerConnectStatusFromStripeAccount(account) {
  if (!account || typeof account !== "object") return "not_started";
  const requirements = account.requirements || {};
  const currentDue = Array.isArray(requirements.currently_due) ? requirements.currently_due : [];
  const pastDue = Array.isArray(requirements.past_due) ? requirements.past_due : [];
  const disabledReason = String(requirements.disabled_reason || "").trim();
  const payoutsEnabled = account.payouts_enabled === true;
  if (payoutsEnabled && !disabledReason && currentDue.length === 0 && pastDue.length === 0) {
    return "complete";
  }
  if (disabledReason && String(account.details_submitted || "") === "true") {
    return "restricted";
  }
  return "pending";
}
__name(partnerConnectStatusFromStripeAccount, "partnerConnectStatusFromStripeAccount");
async function promotePartnerCommissionsAfterConnect(env, profile) {
  if (profile.connectStatus !== "complete") return;
  const commissions = await listPartnerCommissions(env, profile.partnerId);
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  for (const commission of commissions) {
    if (commission.status !== "pending_requires_connect") continue;
    const next = {
      ...commission,
      status: "pending",
      stripeConnectedAccountId: profile.stripeConnectedAccountId,
      connectStatusAtCreation: "complete",
      updatedAt: nowIso
    };
    await writePartnerCommission(env, next);
  }
}
__name(promotePartnerCommissionsAfterConnect, "promotePartnerCommissionsAfterConnect");
async function refreshPartnerConnectStatus(env, profile) {
  const sk = String(env.STRIPE_SECRET_KEY || "").trim();
  if (!sk) {
    throw new Error("STRIPE_SECRET_KEY not set");
  }
  const accountId = String(profile.stripeConnectedAccountId || "").trim();
  if (!accountId) {
    if (profile.connectStatus !== "not_started") {
      const next2 = {
        ...profile,
        connectStatus: "not_started",
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      await writePartnerProfile(env, next2);
      return { profile: next2, account: null };
    }
    return { profile, account: null };
  }
  const account = await partnerStripeGetRequest(sk, `/v1/accounts/${encodeURIComponent(accountId)}`);
  const connectStatus = partnerConnectStatusFromStripeAccount(account);
  const next = {
    ...profile,
    connectStatus,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  await writePartnerProfile(env, next);
  await promotePartnerCommissionsAfterConnect(env, next);
  return { profile: next, account };
}
__name(refreshPartnerConnectStatus, "refreshPartnerConnectStatus");
async function handlePartnerConnectStart(req, env) {
  const auth = await requirePartnerSession(req, env);
  if (auth instanceof Response) return auth;
  if (auth.profile.status === "suspended") {
    return json(
      {
        error: {
          code: "partner_suspended",
          message: "Partner is suspended."
        },
        partner: publicPartnerProfile(auth.profile)
      },
      403,
      partnerNoStoreHeaders()
    );
  }
  const sk = String(env.STRIPE_SECRET_KEY || "").trim();
  if (!sk) {
    return json(
      {
        error: {
          code: "misconfigured",
          message: "STRIPE_SECRET_KEY not set"
        }
      },
      500,
      partnerNoStoreHeaders()
    );
  }
  const body = await req.json().catch(() => ({}));
  const country = normalizePartnerConnectCountry(body?.country);
  const email = normalizePartnerEmail(body?.email);
  let profile = auth.profile;
  let accountId = String(profile.stripeConnectedAccountId || "").trim();
  if (!accountId) {
    const form = new URLSearchParams();
    form.set("type", "express");
    form.set("country", country);
    form.set("capabilities[transfers][requested]", "true");
    form.set("metadata[flow]", "partner_connect");
    form.set("metadata[partnerId]", profile.partnerId);
    if (email) form.set("email", email);
    let account = null;
    try {
      account = await partnerStripeFormRequest(sk, "/v1/accounts", form);
    } catch (err) {
      return json(
        {
          error: {
            code: "stripe_connect_account_error",
            message: String(err?.message || err || "Stripe Connect account creation failed.")
          }
        },
        502,
        partnerNoStoreHeaders()
      );
    }
    accountId = String(account?.id || "").trim();
    if (!accountId) {
      return json(
        {
          error: {
            code: "stripe_connect_account_error",
            message: "Stripe Connect account creation did not return an account id."
          }
        },
        502,
        partnerNoStoreHeaders()
      );
    }
    profile = {
      ...profile,
      stripeConnectedAccountId: accountId,
      connectStatus: "pending",
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await writePartnerProfile(env, profile);
  }
  const linkForm = new URLSearchParams();
  linkForm.set("account", accountId);
  linkForm.set("type", "account_onboarding");
  linkForm.set("return_url", partnerConnectReturnUrl(req, body, "returnUrl"));
  linkForm.set("refresh_url", partnerConnectReturnUrl(req, body, "refreshUrl"));
  let accountLink = null;
  try {
    accountLink = await partnerStripeFormRequest(sk, "/v1/account_links", linkForm);
  } catch (err) {
    return json(
      {
        error: {
          code: "stripe_connect_link_error",
          message: String(err?.message || err || "Stripe Connect account link creation failed.")
        },
        partner: publicPartnerProfile(profile)
      },
      502,
      partnerNoStoreHeaders()
    );
  }
  return json(
    {
      ok: true,
      flow: "partner_connect_onboarding",
      url: String(accountLink?.url || ""),
      expiresAt: accountLink?.expires_at || null,
      partner: publicPartnerProfile(profile),
      launch: partnerLaunchState(env)
    },
    200,
    partnerNoStoreHeaders()
  );
}
__name(handlePartnerConnectStart, "handlePartnerConnectStart");
async function handlePartnerConnectStatus(req, env) {
  const auth = await requirePartnerSession(req, env);
  if (auth instanceof Response) return auth;
  let result;
  try {
    result = await refreshPartnerConnectStatus(env, auth.profile);
  } catch (err) {
    return json(
      {
        error: {
          code: "stripe_connect_status_error",
          message: String(err?.message || err || "Stripe Connect status refresh failed.")
        },
        partner: publicPartnerProfile(auth.profile)
      },
      502,
      partnerNoStoreHeaders()
    );
  }
  const requirements = result.account?.requirements || {};
  return json(
    {
      ok: true,
      partner: publicPartnerProfile(result.profile),
      connect: {
        status: result.profile.connectStatus,
        hasAccount: !!String(result.profile.stripeConnectedAccountId || "").trim(),
        payoutsEnabled: result.account?.payouts_enabled === true,
        detailsSubmitted: result.account?.details_submitted === true,
        currentlyDue: Array.isArray(requirements.currently_due) ? requirements.currently_due : [],
        pastDue: Array.isArray(requirements.past_due) ? requirements.past_due : [],
        disabledReason: String(requirements.disabled_reason || "")
      },
      launch: partnerLaunchState(env)
    },
    200,
    partnerNoStoreHeaders()
  );
}
__name(handlePartnerConnectStatus, "handlePartnerConnectStatus");
async function handlePartnerConnectReturn(req, env) {
  return await handlePartnerConnectStatus(req, env);
}
__name(handlePartnerConnectReturn, "handlePartnerConnectReturn");
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
  const hasCoordInput = Object.prototype.hasOwnProperty.call(src, "coord") || Object.prototype.hasOwnProperty.call(src, "coordinates");
  const coord = normalizeDraftCoord(src.coord ?? src.coordinates);
  if (coord) out.coord = coord;
  else if (hasCoordInput) delete out.coord;
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
var GOOGLE_IMPORT_CACHE_TTL_SECONDS = 60 * 60 * 24 * 28;
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
  const plan = await currentPlanForUlid(env, target.ulid);
  if (!plan) {
    return json(
      { error: { code: "plan_inactive", message: "active Plan record required for this location" } },
      403,
      noStore
    );
  }
  return null;
}
__name(assertPaidDraftHydrationEntitlement, "assertPaidDraftHydrationEntitlement");
async function loadStructureBusinessCategoriesForValidation(env) {
  const [rawProjection, manifest] = await Promise.all([
    env.KV_STRUCTURE.get(STRUCTURE_BUSINESS_CATEGORIES_KEY, { type: "json" }),
    readStructureManifest(env)
  ]);
  if (!rawProjection || manifest.activeVersion === "unpublished") throw new Error("structure_catalog_unavailable");
  return sanitizeStructureBusinessCategoriesProjection(rawProjection, manifest);
}
__name(loadStructureBusinessCategoriesForValidation, "loadStructureBusinessCategoriesForValidation");
async function loadBusinessTaxonomyForValidation(env) {
  const [rawProjection, manifest] = await Promise.all([
    env.KV_CONTEXTS.get(CONTEXTS_BUSINESS_TAXONOMY_KEY, { type: "json" }),
    readContextsManifest(env)
  ]);
  if (!rawProjection || manifest.activeVersion === "unpublished") throw new Error("taxonomy_catalog_unavailable");
  return sanitizeBusinessTaxonomyProjection(rawProjection, manifest);
}
__name(loadBusinessTaxonomyForValidation, "loadBusinessTaxonomyForValidation");
function allowedSubgroupsByStructureProjection(projection) {
  const out = /* @__PURE__ */ new Map();
  for (const group of Array.isArray(projection?.groups) ? projection.groups : []) {
    const groupKey = structureString(group?.groupKey);
    if (!groupKey) continue;
    const set = out.get(groupKey) || /* @__PURE__ */ new Set();
    for (const subgroup of Array.isArray(group?.subgroups) ? group.subgroups : []) {
      const key = structureString(subgroup?.key);
      if (key) set.add(key);
    }
    out.set(groupKey, set);
  }
  return out;
}
__name(allowedSubgroupsByStructureProjection, "allowedSubgroupsByStructureProjection");
function allowedContextKeysFromBusinessTaxonomy(projection) {
  const out = /* @__PURE__ */ new Set();
  for (const row of Array.isArray(projection?.contexts) ? projection.contexts : []) {
    const key = taxonomyString(row?.key);
    if (key) out.add(key);
  }
  return out;
}
__name(allowedContextKeysFromBusinessTaxonomy, "allowedContextKeysFromBusinessTaxonomy");
function parseGeneratedContextKey(key) {
  const parts = String(key || "").trim().split(".").filter(Boolean);
  if (parts[0] !== "ctx") return null;
  const scope = parts[1];
  if (scope !== "country" && scope !== "city") return null;
  const countrySlug = parts[2] || "";
  const citySlug = scope === "city" ? parts[3] || "" : "";
  const groupPart = scope === "city" ? parts[4] || "" : parts[3] || "";
  const subgroupPart = scope === "city" ? parts[5] || "" : parts[4] || "";
  if (!/^[a-z0-9-]+$/.test(countrySlug)) return null;
  if (scope === "city" && !/^[a-z0-9-]+$/.test(citySlug)) return null;
  if (!/^group-[a-z0-9-]+$/.test(groupPart)) return null;
  if (!/^sub-[a-z0-9-]+$/.test(subgroupPart)) return null;
  return {
    scope,
    countrySlug,
    citySlug,
    groupKey: `group.${groupPart.slice("group-".length)}`,
    subgroupKey: `sub.${subgroupPart.slice("sub-".length)}`
  };
}
__name(parseGeneratedContextKey, "parseGeneratedContextKey");
function generatedContextAllowedCombos(profile) {
  const out = /* @__PURE__ */ new Set();
  const primaryGroup = String(profile?.groupKey || "").trim();
  const primarySubgroup = String(profile?.subgroupKey || "").trim();
  if (primaryGroup && primarySubgroup) {
    out.add(`${primaryGroup}\0${primarySubgroup}`);
  }
  for (const combo of Array.isArray(profile?.classificationCombos) ? profile.classificationCombos : []) {
    const groupKey = String(combo?.groupKey || "").trim();
    const subgroupKey = String(combo?.subgroupKey || "").trim();
    if (groupKey && subgroupKey) out.add(`${groupKey}\0${subgroupKey}`);
  }
  return out;
}
__name(generatedContextAllowedCombos, "generatedContextAllowedCombos");
function isGeneratedContextAllowedForProfile(key, profile) {
  const parsed = parseGeneratedContextKey(key);
  if (!parsed) return false;
  const allowedCombos = generatedContextAllowedCombos(profile);
  return allowedCombos.has(`${parsed.groupKey}\0${parsed.subgroupKey}`);
}
__name(isGeneratedContextAllowedForProfile, "isGeneratedContextAllowedForProfile");
async function validateClassificationSelection(env, profile) {
  const groupKey = String(profile?.groupKey || "").trim();
  const subgroupKey = String(profile?.subgroupKey || "").trim();
  const contextVals = splitContextMemberships(profile?.context);
  if (!groupKey && !subgroupKey && !contextVals.length) return null;
  if (!groupKey || !subgroupKey || !contextVals.length) return "classification_required";
  const [structure, taxonomy] = await Promise.all([
    loadStructureBusinessCategoriesForValidation(env),
    loadBusinessTaxonomyForValidation(env)
  ]);
  const subgroups = allowedSubgroupsByStructureProjection(structure);
  const groupSubs = subgroups.get(groupKey);
  if (!groupSubs) return "invalid_groupKey";
  if (!groupSubs.has(subgroupKey)) return "invalid_subgroupKey";
  const contexts = allowedContextKeysFromBusinessTaxonomy(taxonomy);
  for (const ctx of contextVals) {
    if (contexts.has(ctx)) continue;
    if (isGeneratedContextAllowedForProfile(ctx, profile)) continue;
    return "invalid_context";
  }
  return null;
}
__name(validateClassificationSelection, "validateClassificationSelection");
async function safeValidateClassificationSelection(env, profile, opts = {}) {
  try {
    return await validateClassificationSelection(env, profile);
  } catch (e) {
    const msg = String(e?.message || "").trim();
    if (msg === "taxonomy_catalog_unavailable" || msg === "structure_catalog_unavailable") {
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
    const planMode = normalizePlanMode(md?.planMode, md?.campaignPreset);
    const campaignKey = String(md?.campaignKey || "").trim();
    if (planMode !== "campaign_with_promo_qr" || !campaignKey) return "";
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
  let sess = null;
  let reconciled = null;
  try {
    sess = await fetchStripeCheckoutSession(sk, sid);
    reconciled = await reconcilePaidCheckoutSessionPlan(env, sk, sess, { logTag: "owner_stripe_exchange" });
    await markPartnerLeadConvertedAfterPlanReconciliation(env, sess, reconciled, "owner_stripe_exchange");
    await ensurePartnerCommissionAfterPlanReconciliation(env, sess, reconciled, "owner_stripe_exchange");
  } catch (e) {
    console.error("owner_stripe_exchange: plan_reconcile_failed", { sid, err: String(e?.message || e || "") });
    return new Response("Denied", { status: 403, headers: noStoreHeaders });
  }
  const ulid = String(reconciled.primaryUlid || "").trim();
  const expiresAt = new Date(String(reconciled.plan.expiresAt || ""));
  if (!ULID_RE.test(ulid) || Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
    return new Response("Denied", { status: 403, headers: noStoreHeaders });
  }
  const sidBytes = new Uint8Array(18);
  crypto.getRandomValues(sidBytes);
  const sessionId = bytesToB64url(sidBytes);
  const createdAt = /* @__PURE__ */ new Date();
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
  console.info("owner_exchange_success", { ulid, stripeSessionId: sess?.id, paymentIntentId: reconciled.paymentIntentId, sessionId });
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
  const sessionFlow = String(session?.metadata?.flow || "").trim();
  if (sessionFlow === "partner_lead_reservation") {
    try {
      await finalizePaidPartnerLeadReservationFromSession(env, session);
      return new Response("OK", { status: 200, headers: { "x-ng-verify": verifyMode || "" } });
    } catch (e) {
      console.error("stripe_webhook: partner_reservation_finalize_failed", {
        err: String(e?.message || e || ""),
        checkoutSessionId: String(session?.id || "").trim()
      });
      return new Response("Partner reservation finalization failed", { status: 400, headers: { "x-ng-verify": verifyMode || "" } });
    }
  }
  try {
    const reconciled = await reconcilePaidCheckoutSessionPlan(env, String(env.STRIPE_SECRET_KEY || "").trim(), session, { logTag: "stripe_webhook" });
    await markPartnerLeadConvertedAfterPlanReconciliation(env, session, reconciled, "stripe_webhook");
    await ensurePartnerCommissionAfterPlanReconciliation(env, session, reconciled, "stripe_webhook");
  } catch (e) {
    const msg = String(e?.message || e || "");
    if (msg === "ignored_no_plan_metadata") {
      return new Response("Ignored (no plan metadata)", { status: 200 });
    }
    console.error("stripe_webhook: plan_reconcile_failed", { err: msg, checkoutSessionId: String(session?.id || "").trim() });
    return new Response("Plan reconciliation failed", { status: 400, headers: { "x-ng-verify": verifyMode || "" } });
  }
  return new Response("OK", { status: 200, headers: { "x-ng-verify": verifyMode || "" } });
}
__name(handleStripeWebhook, "handleStripeWebhook");
async function createCampaignCheckoutSession(env, req, body, noStore2) {
  const sk = String(env.STRIPE_SECRET_KEY || "").trim();
  if (!sk) return json({ error: { code: "misconfigured", message: "STRIPE_SECRET_KEY not set" } }, 500, noStore2);
  const locationID = String(body?.locationID || "").trim();
  const draftULID = String(body?.draftULID || "").trim();
  const draftSessionId = String(body?.draftSessionId || "").trim();
  const campaignKey = String(body?.campaignKey || "").trim();
  const initiationType = normalizeInitiationType(body?.initiationType);
  const ownershipSource = String(body?.ownershipSource || "plan").trim();
  const navigenVersion = String(body?.navigenVersion || "").trim() || "phase5";
  const planCode = String(body?.planCode || "").trim().toLowerCase();
  const requestedPlan = planDefinitionForCode(planCode);
  const planMode = normalizePlanMode(body?.planMode, body?.campaignPreset);
  if (initiationType === "partner_assisted") {
    return json(
      { error: { code: "partner_assisted_route_required", message: "Partner-assisted checkout must use the Partner handoff path." } },
      403,
      noStore2
    );
  }
  const okInitiation = initiationType === "owner" || initiationType === "platform";
  const hasLocationRoute = !!locationID;
  const hasDraftRoute = !!draftULID || !!draftSessionId;
  const requiresCampaignDraft = planMode === "campaign_with_promo_qr";
  if (!hasLocationRoute && !hasDraftRoute || hasLocationRoute && hasDraftRoute || !okInitiation || !requestedPlan || requiresCampaignDraft && !campaignKey) {
    return json(
      { error: { code: "invalid_request", message: "exactly one target identity route (locationID OR draftULID + draftSessionId), valid planCode, planMode, and initiationType required; campaignKey required only for Campaign with Promo QR" } },
      400,
      noStore2
    );
  }
  if (requiresCampaignDraft && campaignKey === "campaign-30d") {
    return json(
      { error: { code: "invalid_request", message: "campaignKey must be the draft campaignKey (not 'campaign-30d')" } },
      400,
      noStore2
    );
  }
  if (locationID && /^[0-9A-HJKMNP-TV-Z]{26}$/i.test(locationID)) {
    return json({ error: { code: "invalid_request", message: "locationID must be a slug, not a ULID" } }, 400, noStore2);
  }
  const target = await resolveTargetIdentity(env, { locationID, draftULID, draftSessionId }, { validateDraft: hasDraftRoute }).catch(() => null);
  if (!target) {
    return json({ error: { code: "not_found", message: hasLocationRoute ? "unknown locationID" : "unknown private shell target" } }, 404, noStore2);
  }
  const ulid = target.ulid;
  let draft = null;
  if (requiresCampaignDraft) {
    const draftKey = `campaigns:draft:${ulid}`;
    draft = await env.KV_STATUS.get(draftKey, { type: "json" });
    if (!draft || String(draft?.campaignKey || "").trim() !== campaignKey) {
      return json({ error: { code: "invalid_state", message: "draft not found for the requested campaignKey" } }, 409, noStore2);
    }
  }
  const requestedScopeSource = requiresCampaignDraft ? draft : body;
  const scope = normCampaignScope(requestedScopeSource?.campaignScope);
  const eligibleLocations = await eligibleLocationsForRequest(req, env, ulid);
  const eligibleByUlid = new Map(eligibleLocations.map((x) => [x.ulid, x]));
  const eligibleUlids = eligibleLocations.map((x) => x.ulid);
  if (scope !== "single" && requestedPlan.maxPublishedLocations <= 1) {
    return json(buildPlanUpgradeErrorBody(requestedPlan, scope, 2), 409, noStore2);
  }
  let includedUlids = [ulid];
  if (scope === "selected") {
    includedUlids = Array.from(new Set((Array.isArray(requestedScopeSource?.selectedLocationULIDs) ? requestedScopeSource.selectedLocationULIDs : []).map((x) => String(x || "").trim()).filter(Boolean)));
    includedUlids = includedUlids.filter((id) => eligibleByUlid.has(id));
    if (!includedUlids.length) {
      return json({ error: { code: "invalid_state", message: "selected scope has no eligible locations" } }, 409, noStore2);
    }
  } else if (scope === "all") {
    includedUlids = eligibleUlids.length ? eligibleUlids : [ulid];
  }
  includedUlids = uniqueTrimmedStrings(includedUlids).filter((id) => ULID_RE.test(id));
  if (!includedUlids.length) {
    return json({ error: { code: "invalid_state", message: "no covered locations resolved for Plan selection" } }, 409, noStore2);
  }
  if (requestedPlan.maxPublishedLocations > 0 && includedUlids.length > requestedPlan.maxPublishedLocations) {
    return json(buildPlanUpgradeErrorBody(requestedPlan, scope, includedUlids.length), 409, noStore2);
  }
  const selectionId = mintPlanSelectionId();
  const createdAt = /* @__PURE__ */ new Date();
  const selectionExpiresAt = new Date(createdAt.getTime() + PLAN_SELECTION_TTL_SECONDS * 1e3);
  const deviceId = readDeviceId(req);
  const includedLocationIDs = target.route === "existing-location" ? includedUlids.map((id) => String(eligibleByUlid.get(id)?.slug || (id === ulid ? target.locationID : "")).trim()).filter(Boolean) : [];
  const planSelection = {
    ver: 1,
    selectionId,
    route: target.route,
    locationIDs: includedLocationIDs,
    coveredUlids: includedUlids,
    draftULID: target.route === "brand-new-private-shell" ? target.draftULID : "",
    draftSessionId: target.route === "brand-new-private-shell" ? target.draftSessionId : "",
    planCode: requestedPlan.code,
    priceId: requestedPlan.priceId,
    planMode,
    initiationType,
    campaignKey: requiresCampaignDraft ? campaignKey : "",
    navigenVersion,
    createdAt: createdAt.toISOString(),
    expiresAt: selectionExpiresAt.toISOString(),
    deviceId,
    source: "checkout"
  };
  await env.KV_STATUS.put(planSelectionKey(selectionId), JSON.stringify(planSelection), { expirationTtl: PLAN_SELECTION_TTL_SECONDS });
  const siteOrigin = req.headers.get("Origin") || "https://navigen.io";
  const successUrlObj = new URL("/", siteOrigin);
  successUrlObj.searchParams.set("flow", planMode === "campaign_with_promo_qr" ? "campaign" : "plan");
  if (target.route === "existing-location") {
    successUrlObj.searchParams.set("locationID", target.locationID);
  } else {
    successUrlObj.searchParams.set("draftULID", target.draftULID);
    successUrlObj.searchParams.set("draftSessionId", target.draftSessionId);
  }
  successUrlObj.searchParams.set("sid", "{CHECKOUT_SESSION_ID}");
  const successUrl = successUrlObj.toString().replace("%7BCHECKOUT_SESSION_ID%7D", "{CHECKOUT_SESSION_ID}");
  const cancelUrl = new URL("/", siteOrigin);
  cancelUrl.searchParams.set("flow", planMode === "campaign_with_promo_qr" ? "campaign" : "plan");
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
  form.set("metadata[planSelectionId]", selectionId);
  form.set("metadata[planMode]", planMode);
  form.set("metadata[initiationType]", initiationType);
  form.set("metadata[ownershipSource]", ownershipSource);
  form.set("metadata[navigenVersion]", navigenVersion);
  if (requiresCampaignDraft) form.set("metadata[campaignKey]", campaignKey);
  if (target.route === "existing-location") {
    form.set("metadata[locationID]", target.locationID);
  } else {
    form.set("metadata[draftULID]", target.draftULID);
    form.set("metadata[draftSessionId]", target.draftSessionId);
  }
  form.set("payment_intent_data[metadata][planSelectionId]", selectionId);
  form.set("payment_intent_data[metadata][planMode]", planMode);
  form.set("payment_intent_data[metadata][initiationType]", initiationType);
  form.set("payment_intent_data[metadata][ownershipSource]", ownershipSource);
  form.set("payment_intent_data[metadata][navigenVersion]", navigenVersion);
  if (requiresCampaignDraft) form.set("payment_intent_data[metadata][campaignKey]", campaignKey);
  if (target.route === "existing-location") {
    form.set("payment_intent_data[metadata][locationID]", target.locationID);
  } else {
    form.set("payment_intent_data[metadata][draftULID]", target.draftULID);
    form.set("payment_intent_data[metadata][draftSessionId]", target.draftSessionId);
  }
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
    return json({ error: { code: "stripe_error", message: String(out?.error?.message || "Stripe create session failed") } }, 502, noStore2);
  }
  return json({ sessionId: out.id, url: String(out.url || ""), planSelectionId: selectionId }, 200, noStore2);
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
var MEDIA_MAX_ACTIVE_IMAGES = 3;
var MEDIA_MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
var MEDIA_RESERVATION_TTL_MS = 30 * 60 * 1e3;
var MEDIA_VARIANT_NAMES = ["thumb", "card", "lpm", "gallery"];
var MEDIA_ALLOWED_MIME_TYPES = /* @__PURE__ */ new Set(["image/jpeg", "image/png", "image/webp"]);
function mediaError(code, message, status = 400, extra = {}) {
  return json({ error: { code, message, ...extra } }, status, { "cache-control": "no-store" });
}
__name(mediaError, "mediaError");
function normalizeMediaTargetType(value) {
  const s = String(value || "").trim().toLowerCase();
  return s === "draft" || s === "location" ? s : "";
}
__name(normalizeMediaTargetType, "normalizeMediaTargetType");
function mediaManifestKey(targetType, targetId) {
  return `media:${targetType}:${targetId}`;
}
__name(mediaManifestKey, "mediaManifestKey");
function mintMediaToken(prefix) {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return `${prefix}_${bytesToB64url(bytes)}`;
}
__name(mintMediaToken, "mintMediaToken");
function mediaEmptyManifest(targetType, targetId) {
  return {
    version: 1,
    targetType,
    targetId,
    coverImageId: "",
    images: [],
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
__name(mediaEmptyManifest, "mediaEmptyManifest");
function normalizeMediaStatus(value) {
  const s = String(value || "").trim();
  if (s === "reserved" || s === "uploaded" || s === "active" || s === "deleted" || s === "expired" || s === "deletePending") return s;
  return "reserved";
}
__name(normalizeMediaStatus, "normalizeMediaStatus");
function normalizeMediaImageRecord(raw) {
  const mediaId = String(raw?.mediaId || "").trim();
  const uploadSessionId = String(raw?.uploadSessionId || "").trim();
  if (!mediaId || !uploadSessionId) return null;
  const variants = raw?.variants && typeof raw.variants === "object" ? raw.variants : {};
  const normalizedVariants = {};
  for (const name of MEDIA_VARIANT_NAMES) {
    const url = String(variants?.[name] || "").trim();
    if (url) normalizedVariants[name] = url;
  }
  return {
    mediaId,
    cfImageId: String(raw?.cfImageId || "").trim(),
    uploadSessionId,
    status: normalizeMediaStatus(raw?.status),
    slot: Math.max(1, Math.min(MEDIA_MAX_ACTIVE_IMAGES, Math.floor(Number(raw?.slot || 0) || 0) || 1)),
    createdAt: String(raw?.createdAt || (/* @__PURE__ */ new Date()).toISOString()).trim(),
    updatedAt: String(raw?.updatedAt || raw?.createdAt || (/* @__PURE__ */ new Date()).toISOString()).trim(),
    expiresAt: String(raw?.expiresAt || "").trim(),
    createdBy: String(raw?.createdBy || "").trim(),
    mimeType: String(raw?.mimeType || "").trim().toLowerCase(),
    sizeBytes: Math.max(0, Math.floor(Number(raw?.sizeBytes || 0) || 0)),
    filename: String(raw?.filename || "").trim().slice(0, 160),
    variants: normalizedVariants
  };
}
__name(normalizeMediaImageRecord, "normalizeMediaImageRecord");
function normalizeMediaManifest(raw, targetType, targetId) {
  const base = mediaEmptyManifest(targetType, targetId);
  const images = Array.isArray(raw?.images) ? raw.images.map(normalizeMediaImageRecord).filter(Boolean) : [];
  images.sort((a, b) => {
    if (a.slot !== b.slot) return a.slot - b.slot;
    return a.createdAt.localeCompare(b.createdAt);
  });
  const activeCover = images.find((img) => img.status === "active");
  return {
    ...base,
    coverImageId: String(activeCover?.mediaId || ""),
    images,
    updatedAt: String(raw?.updatedAt || (/* @__PURE__ */ new Date()).toISOString()).trim()
  };
}
__name(normalizeMediaManifest, "normalizeMediaManifest");
function mediaCapacityStatus(status, expiresAt, nowMs) {
  if (status === "active" || status === "uploaded") return true;
  if (status !== "reserved") return false;
  const expMs = Date.parse(String(expiresAt || ""));
  return Number.isFinite(expMs) && expMs > nowMs;
}
__name(mediaCapacityStatus, "mediaCapacityStatus");
function mediaManifestForClient(raw, includeReserved) {
  const nowMs = Date.now();
  const manifest = normalizeMediaManifest(raw, raw.targetType, raw.targetId);
  const images = manifest.images.filter((img) => {
    if (img.status === "active") return true;
    if (!includeReserved) return false;
    if (img.status === "uploaded") return true;
    if (img.status !== "reserved") return false;
    const expMs = Date.parse(String(img.expiresAt || ""));
    return Number.isFinite(expMs) && expMs > nowMs;
  });
  images.sort((a, b) => {
    if (a.slot !== b.slot) return a.slot - b.slot;
    return a.createdAt.localeCompare(b.createdAt);
  });
  const activeImages = images.filter((img) => img.status === "active");
  return {
    ...manifest,
    coverImageId: String(activeImages[0]?.mediaId || ""),
    images,
    activeCount: activeImages.length,
    maxActiveImages: MEDIA_MAX_ACTIVE_IMAGES
  };
}
__name(mediaManifestForClient, "mediaManifestForClient");
function validateMediaUploadMetadata(body) {
  const file = body?.file && typeof body.file === "object" ? body.file : {};
  const mimeType = String(body?.mimeType || body?.contentType || file?.mimeType || file?.type || "").trim().toLowerCase();
  const sizeBytes = Math.floor(Number(body?.sizeBytes ?? body?.fileSize ?? file?.size ?? 0));
  const filename = String(body?.filename || body?.fileName || file?.name || "upload").trim().slice(0, 160) || "upload";
  const animated = body?.animated === true || body?.hasAnimation === true || file?.animated === true || file?.hasAnimation === true;
  if (!MEDIA_ALLOWED_MIME_TYPES.has(mimeType)) {
    return { ok: false, response: mediaError("unsupported_mime", "Only JPEG, PNG, and WebP image uploads are supported.", 415) };
  }
  if (animated) {
    return { ok: false, response: mediaError("animated_unsupported", "Animated images are not supported for location media.", 415) };
  }
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return { ok: false, response: mediaError("invalid_size", "A positive normalized image size is required.", 400) };
  }
  if (sizeBytes > MEDIA_MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      response: mediaError("too_large", "Normalized image must be 10 MB or smaller before upload.", 413, {
        maxBytes: MEDIA_MAX_UPLOAD_BYTES
      })
    };
  }
  return { ok: true, upload: { mimeType, sizeBytes, filename } };
}
__name(validateMediaUploadMetadata, "validateMediaUploadMetadata");
function extractMediaTargetInput(body) {
  const target = body?.target && typeof body.target === "object" ? body.target : body;
  return {
    targetType: normalizeMediaTargetType(target?.targetType || body?.targetType),
    targetId: String(target?.targetId || body?.targetId || body?.draftULID || "").trim(),
    draftSessionId: String(target?.draftSessionId || body?.draftSessionId || "").trim()
  };
}
__name(extractMediaTargetInput, "extractMediaTargetInput");
async function resolveMediaWriteTarget(req, env, body) {
  const input = extractMediaTargetInput(body);
  if (!input.targetType) {
    return { ok: false, response: mediaError("invalid_target", "targetType must be draft or location.", 400) };
  }
  if (input.targetType === "draft") {
    if (!input.targetId) {
      if (input.draftSessionId) {
        return { ok: false, response: mediaError("invalid_target", "draftSessionId cannot be supplied without draft targetId.", 400) };
      }
      const draftULID = mintDraftUlid();
      const draftSessionId = mintDraftSessionId();
      const nowIso = (/* @__PURE__ */ new Date()).toISOString();
      await env.KV_STATUS.put(
        `override_draft:${draftULID}:${draftSessionId}`,
        JSON.stringify({ createdAt: nowIso, updatedAt: nowIso, mediaUploadDraft: true })
      );
      return {
        ok: true,
        target: {
          targetType: "draft",
          targetId: draftULID,
          draftULID,
          draftSessionId,
          createdDraft: true,
          actor: "draft_session"
        }
      };
    }
    if (!ULID_RE.test(input.targetId) || !input.draftSessionId) {
      return { ok: false, response: mediaError("invalid_target", "draft targetId and draftSessionId are required.", 400) };
    }
    const draft = await readPrivateShellDraft(env, input.targetId, input.draftSessionId);
    if (!draft) {
      return { ok: false, response: mediaError("forbidden", "Draft media access is not allowed for this session.", 403) };
    }
    return {
      ok: true,
      target: {
        targetType: "draft",
        targetId: input.targetId,
        draftULID: input.targetId,
        draftSessionId: input.draftSessionId,
        createdDraft: false,
        actor: "draft_session"
      }
    };
  }
  if (!input.targetId) {
    return { ok: false, response: mediaError("invalid_target", "location targetId is required.", 400) };
  }
  const targetId = ULID_RE.test(input.targetId) ? input.targetId : String(await resolveUid(input.targetId, env) || "").trim();
  if (!ULID_RE.test(targetId)) {
    return { ok: false, response: mediaError("invalid_target", "location targetId must resolve to a known ULID.", 400) };
  }
  const auth = await requireOwnerSession(req, env);
  if (auth instanceof Response) {
    return { ok: false, response: mediaError("unauthorized", "Owner session is required for location media uploads.", auth.status || 401) };
  }
  if (String(auth.ulid || "").trim() !== targetId) {
    return { ok: false, response: mediaError("forbidden", "Owner session is not authorized for this location.", 403) };
  }
  const entitlement = await readPlanEntitlementForUlid(env, targetId);
  if (!entitlement.planEntitled) {
    return { ok: false, response: mediaError("plan_required", "Active Plan coverage is required for location media uploads.", 403) };
  }
  return {
    ok: true,
    target: {
      targetType: "location",
      targetId,
      draftULID: "",
      draftSessionId: "",
      createdDraft: false,
      actor: `owner:${targetId}`
    }
  };
}
__name(resolveMediaWriteTarget, "resolveMediaWriteTarget");
function buildCloudflareImageVariantUrls(env, cfImageId) {
  const hash = String(env.CF_IMAGES_ACCOUNT_HASH || "").trim();
  if (!hash) throw new Error("cf_images_account_hash_missing");
  const id = encodeURIComponent(cfImageId);
  return {
    thumb: `https://imagedelivery.net/${hash}/${id}/thumb`,
    card: `https://imagedelivery.net/${hash}/${id}/card`,
    lpm: `https://imagedelivery.net/${hash}/${id}/lpm`,
    gallery: `https://imagedelivery.net/${hash}/${id}/gallery`
  };
}
__name(buildCloudflareImageVariantUrls, "buildCloudflareImageVariantUrls");
async function createCloudflareDirectUpload(env, target, upload, reservation) {
  const accountId = String(env.CF_IMAGES_ACCOUNT_ID || "").trim();
  const token = String(env.CF_IMAGES_API_TOKEN || "").trim();
  const accountHash = String(env.CF_IMAGES_ACCOUNT_HASH || "").trim();
  if (!accountId || !token) {
    throw new Error("cf_images_config_missing");
  }
  if (!accountHash) {
    throw new Error("cf_images_account_hash_missing");
  }
  const form = new FormData();
  form.set("metadata", JSON.stringify({
    source: "navigen-img-v1",
    targetType: target.targetType,
    targetId: target.targetId,
    mediaId: String(reservation?.mediaId || ""),
    uploadSessionId: String(reservation?.uploadSessionId || ""),
    mimeType: upload.mimeType,
    sizeBytes: upload.sizeBytes
  }));
  const cfRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/images/v2/direct_upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form
  });
  const payload = await cfRes.json().catch(() => null);
  if (!cfRes.ok || !payload?.success) {
    const message = String(payload?.errors?.[0]?.message || payload?.error || "Cloudflare Images direct upload request failed.").trim();
    throw new Error(`cf_images_direct_upload_failed:${message}`);
  }
  const cfImageId = String(payload?.result?.id || "").trim();
  const uploadURL = String(payload?.result?.uploadURL || "").trim();
  if (!cfImageId || !uploadURL) {
    throw new Error("cf_images_direct_upload_incomplete");
  }
  return {
    cfImageId,
    uploadURL,
    variants: buildCloudflareImageVariantUrls(env, cfImageId)
  };
}
__name(createCloudflareDirectUpload, "createCloudflareDirectUpload");
async function readCloudflareImageUploadState(env, cfImageId) {
  const accountId = String(env.CF_IMAGES_ACCOUNT_ID || "").trim();
  const token = String(env.CF_IMAGES_API_TOKEN || "").trim();
  const imageId = String(cfImageId || "").trim();
  if (!accountId || !token) {
    return {
      ok: false,
      status: 503,
      code: "cf_images_config_missing",
      message: "Cloudflare Images configuration is missing."
    };
  }
  if (!imageId) {
    return {
      ok: false,
      status: 400,
      code: "invalid_cf_image_id",
      message: "Cloudflare image id is required."
    };
  }
  const cfRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/images/v1/${encodeURIComponent(imageId)}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` }
  });
  const payload = await cfRes.json().catch(() => null);
  if (!cfRes.ok || !payload?.success) {
    return {
      ok: false,
      status: cfRes.status >= 400 ? cfRes.status : 502,
      code: "cf_images_status_failed",
      message: String(payload?.errors?.[0]?.message || "Cloudflare Images upload status could not be verified.")
    };
  }
  const result = payload?.result && typeof payload.result === "object" ? payload.result : {};
  if (String(result?.id || "").trim() !== imageId) {
    return {
      ok: false,
      status: 502,
      code: "cf_images_status_mismatch",
      message: "Cloudflare Images returned an unexpected image record."
    };
  }
  return {
    ok: true,
    uploaded: result?.draft !== true && Boolean(String(result?.uploaded || "").trim())
  };
}
__name(readCloudflareImageUploadState, "readCloudflareImageUploadState");
async function deleteCloudflareImage(env, cfImageId) {
  const accountId = String(env.CF_IMAGES_ACCOUNT_ID || "").trim();
  const token = String(env.CF_IMAGES_API_TOKEN || "").trim();
  const imageId = String(cfImageId || "").trim();
  if (!accountId || !token) {
    return {
      ok: false,
      code: "cf_images_config_missing",
      message: "Cloudflare Images configuration is missing."
    };
  }
  if (!imageId) {
    return {
      ok: true
    };
  }
  const cfRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/images/v1/${encodeURIComponent(imageId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (cfRes.status === 404) {
    return { ok: true };
  }
  const payload = await cfRes.json().catch(() => null);
  if (!cfRes.ok || payload?.success === false) {
    return {
      ok: false,
      code: "cf_images_delete_failed",
      message: String(payload?.errors?.[0]?.message || "Cloudflare Images delete failed.")
    };
  }
  return { ok: true };
}
__name(deleteCloudflareImage, "deleteCloudflareImage");
async function mediaTargetDoFetch(env, targetType, targetId, body) {
  const id = env.DO_MEDIA_TARGET.idFromName(mediaManifestKey(targetType, targetId));
  const stub = env.DO_MEDIA_TARGET.get(id);
  const res = await stub.fetch("https://media-target.internal/", {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({ targetType, targetId, ...body })
  });
  const payload = await res.json().catch(() => null);
  return { status: res.status, payload };
}
__name(mediaTargetDoFetch, "mediaTargetDoFetch");
async function cancelMediaReservation(env, target, uploadSessionId) {
  try {
    await mediaTargetDoFetch(env, target.targetType, target.targetId, {
      op: "cancel-reservation",
      uploadSessionId
    });
  } catch {
  }
}
__name(cancelMediaReservation, "cancelMediaReservation");
async function handleMediaDirectUpload(req, env) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return mediaError("invalid_request", "valid JSON body required", 400);
  }
  const uploadCheck = validateMediaUploadMetadata(body);
  if ("response" in uploadCheck) return uploadCheck.response;
  const targetCheck = await resolveMediaWriteTarget(req, env, body);
  if ("response" in targetCheck) return targetCheck.response;
  const target = targetCheck.target;
  const reserve = await mediaTargetDoFetch(env, target.targetType, target.targetId, {
    op: "reserve",
    actor: target.actor,
    upload: uploadCheck.upload
  });
  if (!reserve.payload?.ok) {
    return mediaError(
      String(reserve.payload?.reason || "media_reservation_failed"),
      String(reserve.payload?.message || "Media upload reservation failed."),
      reserve.status || 409,
      {
        maxActiveImages: MEDIA_MAX_ACTIVE_IMAGES,
        manifest: reserve.payload?.manifest || mediaEmptyManifest(target.targetType, target.targetId)
      }
    );
  }
  const uploadSessionId = String(reserve.payload?.reservation?.uploadSessionId || "").trim();
  if (!uploadSessionId) {
    return mediaError("media_reservation_incomplete", "Media upload reservation did not return a session id.", 500);
  }
  let cf;
  try {
    cf = await createCloudflareDirectUpload(env, target, uploadCheck.upload, reserve.payload.reservation);
  } catch (e) {
    await cancelMediaReservation(env, target, uploadSessionId);
    const raw = String(e?.message || "").trim();
    const code = raw.startsWith("cf_images_direct_upload_failed") ? "cf_images_direct_upload_failed" : raw || "cf_images_direct_upload_failed";
    return mediaError(code, raw || "Cloudflare Images direct upload could not be created.", code === "cf_images_config_missing" || code === "cf_images_account_hash_missing" ? 503 : 502);
  }
  const attached = await mediaTargetDoFetch(env, target.targetType, target.targetId, {
    op: "attach-cloudflare-id",
    uploadSessionId,
    cfImageId: cf.cfImageId,
    variants: cf.variants
  });
  if (!attached.payload?.ok) {
    await cancelMediaReservation(env, target, uploadSessionId);
    return mediaError(
      String(attached.payload?.reason || "media_reservation_attach_failed"),
      String(attached.payload?.message || "Cloudflare image id could not be attached to the media reservation."),
      attached.status || 409
    );
  }
  return json(
    {
      ok: true,
      targetType: target.targetType,
      targetId: target.targetId,
      draftULID: target.draftULID,
      draftSessionId: target.draftSessionId,
      createdDraft: target.createdDraft,
      mediaId: String(reserve.payload?.reservation?.mediaId || ""),
      uploadSessionId,
      cfImageId: cf.cfImageId,
      uploadURL: cf.uploadURL,
      variants: cf.variants,
      manifest: mediaManifestForClient(attached.payload.manifest, true)
    },
    200,
    { "cache-control": "no-store" }
  );
}
__name(handleMediaDirectUpload, "handleMediaDirectUpload");
async function resolveExistingMediaWriteTarget(req, env, body) {
  const input = extractMediaTargetInput(body);
  if (!input.targetType) {
    return { ok: false, response: mediaError("invalid_target", "targetType must be draft or location.", 400) };
  }
  if (!input.targetId) {
    return { ok: false, response: mediaError("invalid_target", "Existing media mutation requires targetId.", 400) };
  }
  return await resolveMediaWriteTarget(req, env, body);
}
__name(resolveExistingMediaWriteTarget, "resolveExistingMediaWriteTarget");
async function handleMediaComplete(req, env) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return mediaError("invalid_request", "valid JSON body required", 400);
  }
  const uploadSessionId = String(body?.uploadSessionId || "").trim();
  const cfImageId = String(body?.cfImageId || "").trim();
  if (!uploadSessionId || !cfImageId) {
    return mediaError("invalid_upload_session", "uploadSessionId and cfImageId are required.", 400);
  }
  const targetCheck = await resolveExistingMediaWriteTarget(req, env, body);
  if ("response" in targetCheck) return targetCheck.response;
  const target = targetCheck.target;
  const inspected = await mediaTargetDoFetch(env, target.targetType, target.targetId, {
    op: "inspect-complete",
    uploadSessionId,
    cfImageId
  });
  if (!inspected.payload?.ok) {
    return mediaError(
      String(inspected.payload?.reason || "media_complete_failed"),
      String(inspected.payload?.message || "Media upload completion failed."),
      inspected.status || 409
    );
  }
  const uploadState = await readCloudflareImageUploadState(env, cfImageId);
  if (!uploadState.ok) {
    return mediaError(uploadState.code, uploadState.message, uploadState.status);
  }
  if (!uploadState.uploaded) {
    return mediaError("upload_not_finished", "Cloudflare Images has not received the uploaded image yet.", 409);
  }
  const completed = await mediaTargetDoFetch(env, target.targetType, target.targetId, {
    op: "complete",
    uploadSessionId,
    cfImageId,
    providerUploaded: true
  });
  if (!completed.payload?.ok) {
    return mediaError(
      String(completed.payload?.reason || "media_complete_failed"),
      String(completed.payload?.message || "Media upload completion failed."),
      completed.status || 409
    );
  }
  return json(
    {
      ok: true,
      targetType: target.targetType,
      targetId: target.targetId,
      mediaId: String(completed.payload?.mediaId || ""),
      manifest: mediaManifestForClient(completed.payload.manifest, true)
    },
    200,
    { "cache-control": "no-store" }
  );
}
__name(handleMediaComplete, "handleMediaComplete");
async function handleMediaDelete(req, env) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return mediaError("invalid_request", "valid JSON body required", 400);
  }
  const mediaId = String(body?.mediaId || "").trim();
  if (!mediaId) {
    return mediaError("invalid_media", "mediaId is required.", 400);
  }
  const targetCheck = await resolveExistingMediaWriteTarget(req, env, body);
  if ("response" in targetCheck) return targetCheck.response;
  const target = targetCheck.target;
  const deleted = await mediaTargetDoFetch(env, target.targetType, target.targetId, {
    op: "delete",
    mediaId
  });
  if (!deleted.payload?.ok) {
    return mediaError(
      String(deleted.payload?.reason || "media_delete_failed"),
      String(deleted.payload?.message || "Media delete failed."),
      deleted.status || 409
    );
  }
  const deletedImage = deleted.payload?.image && typeof deleted.payload.image === "object" ? deleted.payload.image : {};
  const cfImageId = String(deletedImage?.cfImageId || "").trim();
  let manifest = deleted.payload.manifest;
  let deletePending = false;
  let providerDelete = { attempted: Boolean(cfImageId), ok: true };
  if (cfImageId) {
    const providerResult = await deleteCloudflareImage(env, cfImageId);
    providerDelete = {
      attempted: true,
      ok: providerResult.ok,
      code: providerResult.ok ? "" : providerResult.code
    };
    if (!providerResult.ok) {
      deletePending = true;
      const pending = await mediaTargetDoFetch(env, target.targetType, target.targetId, {
        op: "mark-delete-pending",
        mediaId,
        cfImageId,
        reason: providerResult.code
      });
      if (pending.payload?.ok) {
        manifest = pending.payload.manifest;
      }
    }
  }
  return json(
    {
      ok: true,
      targetType: target.targetType,
      targetId: target.targetId,
      mediaId,
      deletePending,
      providerDelete,
      manifest: mediaManifestForClient(manifest, true)
    },
    200,
    { "cache-control": "no-store" }
  );
}
__name(handleMediaDelete, "handleMediaDelete");
async function handleMediaReorder(req, env) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return mediaError("invalid_request", "valid JSON body required", 400);
  }
  const rawOrder = Array.isArray(body?.mediaIds) ? body.mediaIds : Array.isArray(body?.order) ? body.order : [];
  const mediaIds = rawOrder.map((id) => String(id || "").trim()).filter(Boolean);
  const uniqueCount = new Set(mediaIds).size;
  if (!mediaIds.length || uniqueCount !== mediaIds.length) {
    return mediaError("invalid_order", "mediaIds must contain each active media id exactly once.", 400);
  }
  const targetCheck = await resolveExistingMediaWriteTarget(req, env, body);
  if ("response" in targetCheck) return targetCheck.response;
  const target = targetCheck.target;
  const reordered = await mediaTargetDoFetch(env, target.targetType, target.targetId, {
    op: "reorder",
    mediaIds
  });
  if (!reordered.payload?.ok) {
    return mediaError(
      String(reordered.payload?.reason || "media_reorder_failed"),
      String(reordered.payload?.message || "Media reorder failed."),
      reordered.status || 409
    );
  }
  return json(
    {
      ok: true,
      targetType: target.targetType,
      targetId: target.targetId,
      manifest: mediaManifestForClient(reordered.payload.manifest, true)
    },
    200,
    { "cache-control": "no-store" }
  );
}
__name(handleMediaReorder, "handleMediaReorder");
async function handleMediaAbandonDraft(req, env) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return mediaError("invalid_request", "valid JSON body required", 400);
  }
  const input = extractMediaTargetInput(body);
  if (input.targetType !== "draft") {
    return mediaError("invalid_target", "Only draft media can be abandoned.", 400);
  }
  const targetCheck = await resolveExistingMediaWriteTarget(req, env, body);
  if ("response" in targetCheck) return targetCheck.response;
  const target = targetCheck.target;
  if (target.targetType !== "draft") {
    return mediaError("invalid_target", "Only draft media can be abandoned.", 400);
  }
  const abandoned = await mediaTargetDoFetch(env, target.targetType, target.targetId, {
    op: "abandon-draft",
    reason: String(body?.reason || "cancel").trim().slice(0, 80)
  });
  if (!abandoned.payload?.ok) {
    return mediaError(
      String(abandoned.payload?.reason || "media_abandon_failed"),
      String(abandoned.payload?.message || "Draft media cleanup failed."),
      abandoned.status || 409
    );
  }
  const images = Array.isArray(abandoned.payload?.images) ? abandoned.payload.images : [];
  let manifest = abandoned.payload.manifest;
  let providerDeletedCount = 0;
  let deletePendingCount = 0;
  for (const image of images) {
    const mediaId = String(image?.mediaId || "").trim();
    const cfImageId = String(image?.cfImageId || "").trim();
    if (!mediaId || !cfImageId) continue;
    const providerResult = await deleteCloudflareImage(env, cfImageId);
    if (providerResult.ok) {
      providerDeletedCount += 1;
      continue;
    }
    deletePendingCount += 1;
    const pending = await mediaTargetDoFetch(env, target.targetType, target.targetId, {
      op: "mark-delete-pending",
      mediaId,
      cfImageId,
      reason: providerResult.code
    });
    if (pending.payload?.ok) {
      manifest = pending.payload.manifest;
    }
  }
  return json(
    {
      ok: true,
      targetType: target.targetType,
      targetId: target.targetId,
      deletedCount: images.length,
      providerDeletedCount,
      deletePendingCount,
      manifest: mediaManifestForClient(manifest, true)
    },
    200,
    { "cache-control": "no-store" }
  );
}
__name(handleMediaAbandonDraft, "handleMediaAbandonDraft");
async function handleMediaManifestRead(req, env) {
  const url = new URL(req.url);
  const targetType = normalizeMediaTargetType(url.searchParams.get("targetType"));
  const rawTargetId = String(url.searchParams.get("targetId") || "").trim();
  if (!targetType || !rawTargetId) {
    return mediaError("invalid_target", "targetType and targetId are required.", 400);
  }
  let targetId = rawTargetId;
  let includeReserved = false;
  if (targetType === "draft") {
    const draftSessionId = String(url.searchParams.get("draftSessionId") || "").trim();
    const admin = isAdminPreseedAuthorized(req, env);
    if (!ULID_RE.test(targetId) || !draftSessionId && !admin) {
      return mediaError("forbidden", "Draft media manifest access requires the draft session.", 403);
    }
    if (!admin) {
      const draft = await readPrivateShellDraft(env, targetId, draftSessionId);
      if (!draft) return mediaError("forbidden", "Draft media manifest access is not allowed for this session.", 403);
    }
    includeReserved = true;
  } else {
    targetId = ULID_RE.test(rawTargetId) ? rawTargetId : String(await resolveUid(rawTargetId, env) || "").trim();
    if (!ULID_RE.test(targetId)) {
      return mediaError("not_found", "Published location target was not found.", 404);
    }
    const published = await readPublishedEffectiveProfileByUlid(targetId, env);
    if (!published) {
      return mediaError("not_found", "Published location target was not found.", 404);
    }
  }
  const raw = await env.KV_MEDIA.get(mediaManifestKey(targetType, targetId), { type: "json" });
  const manifest = normalizeMediaManifest(raw || {}, targetType, targetId);
  return json(
    {
      ok: true,
      manifest: mediaManifestForClient(manifest, includeReserved)
    },
    200,
    { "cache-control": "no-store" }
  );
}
__name(handleMediaManifestRead, "handleMediaManifestRead");
var MediaTargetDO = class {
  static {
    __name(this, "MediaTargetDO");
  }
  state;
  env;
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }
  async readState(targetType, targetId) {
    const hit = await this.state.storage.get("manifest");
    return normalizeMediaManifest(hit || {}, targetType, targetId);
  }
  expireReservations(manifest, nowMs) {
    let changed = false;
    for (const img of manifest.images) {
      if (img.status !== "reserved") continue;
      const expMs = Date.parse(String(img.expiresAt || ""));
      if (!Number.isFinite(expMs) || expMs > nowMs) continue;
      img.status = "expired";
      img.updatedAt = new Date(nowMs).toISOString();
      changed = true;
    }
    return changed;
  }
  compactActiveSlots(manifest) {
    const activeImages = manifest.images.filter((img) => img.status === "active").sort((a, b) => {
      if (a.slot !== b.slot) return a.slot - b.slot;
      return a.createdAt.localeCompare(b.createdAt);
    });
    activeImages.forEach((img, index) => {
      img.slot = index + 1;
    });
  }
  async writeState(manifest) {
    const normalized = normalizeMediaManifest({ ...manifest, updatedAt: (/* @__PURE__ */ new Date()).toISOString() }, manifest.targetType, manifest.targetId);
    await this.state.storage.put("manifest", normalized);
    await this.env.KV_MEDIA.put(mediaManifestKey(normalized.targetType, normalized.targetId), JSON.stringify(normalized));
    return normalized;
  }
  async fetch(req) {
    const body = await doReadJson(req);
    const op = String(body?.op || "snapshot").trim().toLowerCase();
    const targetType = normalizeMediaTargetType(body?.targetType);
    const targetId = String(body?.targetId || "").trim();
    if (!targetType || !DO_ULID_RE.test(targetId)) return doError("invalid_target", 400);
    const nowMs = Date.now();
    let manifest = await this.readState(targetType, targetId);
    const expired = this.expireReservations(manifest, nowMs);
    if (expired) manifest = await this.writeState(manifest);
    if (op === "snapshot") {
      return doJson({ ok: true, manifest });
    }
    if (op === "reserve") {
      const upload = body?.upload && typeof body.upload === "object" ? body.upload : {};
      const mimeType = String(upload?.mimeType || "").trim().toLowerCase();
      const sizeBytes = Math.floor(Number(upload?.sizeBytes || 0) || 0);
      const filename = String(upload?.filename || "upload").trim().slice(0, 160) || "upload";
      if (!MEDIA_ALLOWED_MIME_TYPES.has(mimeType)) return doError("unsupported_mime", 415);
      if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) return doError("invalid_size", 400);
      if (sizeBytes > MEDIA_MAX_UPLOAD_BYTES) return doError("too_large", 413, { maxBytes: MEDIA_MAX_UPLOAD_BYTES });
      const capacityCount = manifest.images.filter((img) => mediaCapacityStatus(img.status, img.expiresAt, nowMs)).length;
      if (capacityCount >= MEDIA_MAX_ACTIVE_IMAGES) {
        return doError("too_many_images", 409, {
          message: "Delete an image before uploading another.",
          maxActiveImages: MEDIA_MAX_ACTIVE_IMAGES,
          manifest
        });
      }
      const nowIso = new Date(nowMs).toISOString();
      const image = {
        mediaId: mintMediaToken("ngm"),
        cfImageId: "",
        uploadSessionId: mintMediaToken("ngu"),
        status: "reserved",
        slot: capacityCount + 1,
        createdAt: nowIso,
        updatedAt: nowIso,
        expiresAt: new Date(nowMs + MEDIA_RESERVATION_TTL_MS).toISOString(),
        createdBy: String(body?.actor || "").trim().slice(0, 120),
        mimeType,
        sizeBytes,
        filename,
        variants: {}
      };
      manifest.images.push(image);
      manifest = await this.writeState(manifest);
      return doJson({ ok: true, reservation: image, manifest });
    }
    if (op === "attach-cloudflare-id") {
      const uploadSessionId = String(body?.uploadSessionId || "").trim();
      const cfImageId = String(body?.cfImageId || "").trim();
      const variants = body?.variants && typeof body.variants === "object" ? body.variants : {};
      if (!uploadSessionId || !cfImageId) return doError("invalid_upload_session", 400);
      const image = manifest.images.find((img) => img.uploadSessionId === uploadSessionId);
      if (!image || image.status !== "reserved") return doError("unknown_upload_session", 404);
      if (!mediaCapacityStatus(image.status, image.expiresAt, nowMs)) return doError("reservation_expired", 409);
      if (image.cfImageId && image.cfImageId !== cfImageId) return doError("cf_image_mismatch", 409);
      const normalizedVariants = {};
      for (const name of MEDIA_VARIANT_NAMES) {
        const variantUrl = String(variants?.[name] || "").trim();
        if (variantUrl) normalizedVariants[name] = variantUrl;
      }
      image.cfImageId = cfImageId;
      image.variants = normalizedVariants;
      image.updatedAt = new Date(nowMs).toISOString();
      manifest = await this.writeState(manifest);
      return doJson({ ok: true, manifest });
    }
    if (op === "inspect-complete") {
      const uploadSessionId = String(body?.uploadSessionId || "").trim();
      const cfImageId = String(body?.cfImageId || "").trim();
      if (!uploadSessionId || !cfImageId) return doError("invalid_upload_session", 400);
      const image = manifest.images.find((img) => img.uploadSessionId === uploadSessionId);
      if (!image) return doError("unknown_upload_session", 404);
      if (image.cfImageId !== cfImageId) return doError("cf_image_mismatch", 409);
      if (image.status === "expired" || image.status === "deleted" || image.status === "deletePending") {
        return doError("invalid_media_status", 409, { status: image.status });
      }
      if (image.status !== "active") {
        const expMs = Date.parse(String(image.expiresAt || ""));
        if (!Number.isFinite(expMs) || expMs <= nowMs) {
          image.status = "expired";
          image.updatedAt = new Date(nowMs).toISOString();
          manifest = await this.writeState(manifest);
          return doError("reservation_expired", 409, { manifest });
        }
      }
      const capacityCount = manifest.images.filter((img) => {
        if (img.mediaId === image.mediaId) return false;
        return mediaCapacityStatus(img.status, img.expiresAt, nowMs);
      }).length;
      if (capacityCount >= MEDIA_MAX_ACTIVE_IMAGES) {
        return doError("too_many_images", 409, {
          message: "Delete an image before completing another upload.",
          maxActiveImages: MEDIA_MAX_ACTIVE_IMAGES,
          manifest
        });
      }
      return doJson({ ok: true, image, manifest });
    }
    if (op === "complete") {
      const uploadSessionId = String(body?.uploadSessionId || "").trim();
      const cfImageId = String(body?.cfImageId || "").trim();
      const providerUploaded = body?.providerUploaded === true;
      if (!uploadSessionId || !cfImageId) return doError("invalid_upload_session", 400);
      const image = manifest.images.find((img) => img.uploadSessionId === uploadSessionId);
      if (!image) return doError("unknown_upload_session", 404);
      if (image.cfImageId !== cfImageId) return doError("cf_image_mismatch", 409);
      if (image.status === "active") {
        this.compactActiveSlots(manifest);
        manifest = await this.writeState(manifest);
        return doJson({ ok: true, mediaId: image.mediaId, manifest });
      }
      if (image.status !== "reserved" && image.status !== "uploaded") {
        return doError("invalid_media_status", 409, { status: image.status });
      }
      const expMs = Date.parse(String(image.expiresAt || ""));
      if (!Number.isFinite(expMs) || expMs <= nowMs) {
        image.status = "expired";
        image.updatedAt = new Date(nowMs).toISOString();
        manifest = await this.writeState(manifest);
        return doError("reservation_expired", 409, { manifest });
      }
      if (!providerUploaded) {
        return doError("upload_not_finished", 409);
      }
      const capacityCount = manifest.images.filter((img) => {
        if (img.mediaId === image.mediaId) return false;
        return mediaCapacityStatus(img.status, img.expiresAt, nowMs);
      }).length;
      if (capacityCount >= MEDIA_MAX_ACTIVE_IMAGES) {
        return doError("too_many_images", 409, {
          message: "Delete an image before completing another upload.",
          maxActiveImages: MEDIA_MAX_ACTIVE_IMAGES,
          manifest
        });
      }
      image.status = "active";
      image.updatedAt = new Date(nowMs).toISOString();
      this.compactActiveSlots(manifest);
      manifest = await this.writeState(manifest);
      return doJson({ ok: true, mediaId: image.mediaId, manifest });
    }
    if (op === "delete") {
      const mediaId = String(body?.mediaId || "").trim();
      if (!mediaId) return doError("invalid_media", 400);
      const image = manifest.images.find((img) => img.mediaId === mediaId);
      if (!image) return doError("media_not_found", 404);
      if (image.status !== "deleted") {
        image.status = "deleted";
        image.updatedAt = new Date(nowMs).toISOString();
        this.compactActiveSlots(manifest);
        manifest = await this.writeState(manifest);
      }
      return doJson({ ok: true, image, manifest });
    }
    if (op === "mark-delete-pending") {
      const mediaId = String(body?.mediaId || "").trim();
      const cfImageId = String(body?.cfImageId || "").trim();
      if (!mediaId) return doError("invalid_media", 400);
      const image = manifest.images.find((img) => img.mediaId === mediaId);
      if (!image) return doError("media_not_found", 404);
      if (!cfImageId || image.cfImageId === cfImageId) {
        image.status = "deletePending";
        image.updatedAt = new Date(nowMs).toISOString();
        this.compactActiveSlots(manifest);
        manifest = await this.writeState(manifest);
      }
      return doJson({ ok: true, image, manifest });
    }
    if (op === "reorder") {
      const mediaIds = Array.isArray(body?.mediaIds) ? body.mediaIds.map((id) => String(id || "").trim()).filter(Boolean) : [];
      if (!mediaIds.length || new Set(mediaIds).size !== mediaIds.length) {
        return doError("invalid_order", 400);
      }
      const activeImages = manifest.images.filter((img) => img.status === "active");
      const activeIds = new Set(activeImages.map((img) => img.mediaId));
      if (mediaIds.length !== activeImages.length) {
        return doError("invalid_order", 409, {
          message: "Reorder must include each active media id exactly once.",
          activeCount: activeImages.length
        });
      }
      for (const mediaId of mediaIds) {
        if (!activeIds.has(mediaId)) {
          return doError("unknown_media_id", 400, { mediaId });
        }
      }
      for (const image of activeImages) {
        image.slot = mediaIds.indexOf(image.mediaId) + 1;
        image.updatedAt = new Date(nowMs).toISOString();
      }
      this.compactActiveSlots(manifest);
      manifest = await this.writeState(manifest);
      return doJson({ ok: true, manifest });
    }
    if (op === "abandon-draft") {
      if (targetType !== "draft") return doError("invalid_target", 400);
      const imagesToDelete = manifest.images.filter((img) => img.status !== "deleted");
      if (!imagesToDelete.length) {
        return doJson({ ok: true, images: [], manifest });
      }
      for (const image of imagesToDelete) {
        image.status = "deleted";
        image.updatedAt = new Date(nowMs).toISOString();
      }
      this.compactActiveSlots(manifest);
      manifest = await this.writeState(manifest);
      return doJson({ ok: true, images: imagesToDelete, manifest });
    }
    if (op === "replace-manifest") {
      const incoming = normalizeMediaManifest(body?.manifest || {}, targetType, targetId);
      incoming.targetType = targetType;
      incoming.targetId = targetId;
      incoming.images = incoming.images.filter((img) => img.status === "active").slice(0, MEDIA_MAX_ACTIVE_IMAGES).map((img, index) => ({
        ...img,
        status: "active",
        slot: index + 1,
        expiresAt: "",
        updatedAt: new Date(nowMs).toISOString()
      }));
      incoming.coverImageId = incoming.images[0]?.mediaId || "";
      manifest = await this.writeState(incoming);
      return doJson({ ok: true, manifest });
    }
    if (op === "cancel-reservation") {
      const uploadSessionId = String(body?.uploadSessionId || "").trim();
      const image = manifest.images.find((img) => img.uploadSessionId === uploadSessionId && img.status === "reserved");
      if (image) {
        image.status = "expired";
        image.updatedAt = new Date(nowMs).toISOString();
        manifest = await this.writeState(manifest);
      }
      return doJson({ ok: true, manifest });
    }
    return doError("unsupported_op", 400, { op });
  }
};
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
      if (normPath === "/api/contexts/business-taxonomy" && req.method === "GET") {
        return await handleBusinessTaxonomyRead(env);
      }
      if (normPath === "/api/structure/business-categories" && req.method === "GET") {
        return await handleStructureBusinessCategoriesRead(env);
      }
      if (normPath === "/api/structure/business-tags" && req.method === "GET") {
        return await handleStructureBusinessTagsRead(env);
      }
      if (normPath === "/api/admin/structure/manifest" && req.method === "GET") {
        if (!isAdminPreseedAuthorized(req, env)) {
          return json(
            { error: { code: "forbidden", message: "admin authorization required" } },
            403,
            { "cache-control": "no-store" }
          );
        }
        return await handleStructureManifestRead(env);
      }
      if (normPath === "/api/admin/structure/publish" && req.method === "POST") {
        if (!isAdminPreseedAuthorized(req, env)) {
          return json(
            { error: { code: "forbidden", message: "admin authorization required" } },
            403,
            { "cache-control": "no-store" }
          );
        }
        return await handleStructurePublish(req, env);
      }
      if (normPath === "/api/admin/structure/publish-tags" && req.method === "POST") {
        if (!isAdminPreseedAuthorized(req, env)) {
          return json(
            { error: { code: "forbidden", message: "admin authorization required" } },
            403,
            { "cache-control": "no-store" }
          );
        }
        return await handleStructureTagsPublish(req, env);
      }
      if (normPath === "/api/admin/structure/activate-version" && req.method === "POST") {
        if (!isAdminPreseedAuthorized(req, env)) {
          return json(
            { error: { code: "forbidden", message: "admin authorization required" } },
            403,
            { "cache-control": "no-store" }
          );
        }
        return await handleStructureActivateVersion(req, env);
      }
      if (normPath === "/api/admin/contexts/manifest" && req.method === "GET") {
        if (!isAdminPreseedAuthorized(req, env)) {
          return json(
            { error: { code: "forbidden", message: "admin authorization required" } },
            403,
            { "cache-control": "no-store" }
          );
        }
        return await handleContextsManifestRead(env);
      }
      if (normPath === "/api/admin/contexts/publish" && req.method === "POST") {
        if (!isAdminPreseedAuthorized(req, env)) {
          return json(
            { error: { code: "forbidden", message: "admin authorization required" } },
            403,
            { "cache-control": "no-store" }
          );
        }
        return await handleContextsPublish(req, env);
      }
      if (normPath === "/api/admin/contexts/activate-version" && req.method === "POST") {
        if (!isAdminPreseedAuthorized(req, env)) {
          return json(
            { error: { code: "forbidden", message: "admin authorization required" } },
            403,
            { "cache-control": "no-store" }
          );
        }
        return await handleContextsActivateVersion(req, env);
      }
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
      if (normPath === "/api/partner/start" && req.method === "POST") {
        return await handlePartnerStart(req, env);
      }
      if (normPath === "/api/partner/session" && req.method === "GET") {
        return await handlePartnerSessionRead(req, env);
      }
      if (normPath === "/api/partner/session/restore" && req.method === "POST") {
        return await handlePartnerSessionRead(req, env, true);
      }
      if (normPath === "/api/partner/session/logout" && req.method === "POST") {
        return await handlePartnerLogout(req, env);
      }
      if (normPath === "/api/partner/leads" && req.method === "GET") {
        return await handlePartnerLeadList(req, env);
      }
      if (normPath === "/api/partner/leads" && req.method === "POST") {
        return await handlePartnerLeadCreate(req, env);
      }
      const partnerLeadArchiveMatch = normPath.match(/^\/api\/partner\/leads\/([^/]+)\/archive$/);
      if (partnerLeadArchiveMatch && req.method === "POST") {
        return await handlePartnerLeadArchive(req, env, decodeURIComponent(partnerLeadArchiveMatch[1] || ""));
      }
      const partnerLeadDetailMatch = normPath.match(/^\/api\/partner\/leads\/([^/]+)$/);
      if (partnerLeadDetailMatch && req.method === "GET") {
        return await handlePartnerLeadRead(req, env, decodeURIComponent(partnerLeadDetailMatch[1] || ""));
      }
      if (normPath === "/api/partner/reservation-checkout" && req.method === "POST") {
        return await handlePartnerReservationCheckoutCreate(req, env);
      }
      if (normPath === "/api/partner/reservation-checkout/return" && req.method === "GET") {
        return await handlePartnerReservationCheckoutReturn(req, env);
      }
      const partnerLeadDraftUpdateMatch = normPath.match(/^\/api\/partner\/leads\/([^/]+)\/draft\/update$/);
      if (partnerLeadDraftUpdateMatch && req.method === "POST") {
        return await handlePartnerLeadDraftUpdate(req, env, decodeURIComponent(partnerLeadDraftUpdateMatch[1] || ""));
      }
      const partnerLeadDraftMatch = normPath.match(/^\/api\/partner\/leads\/([^/]+)\/draft$/);
      if (partnerLeadDraftMatch && req.method === "POST") {
        return await handlePartnerLeadDraftCreate(req, env, decodeURIComponent(partnerLeadDraftMatch[1] || ""));
      }
      if (partnerLeadDraftMatch && req.method === "GET") {
        return await handlePartnerLeadDraftRead(req, env, decodeURIComponent(partnerLeadDraftMatch[1] || ""));
      }
      const partnerHandoffCreateMatch = normPath.match(/^\/api\/partner\/handoff\/([^/]+)\/create$/);
      if (partnerHandoffCreateMatch && req.method === "POST") {
        return await handlePartnerHandoffCreate(req, env, decodeURIComponent(partnerHandoffCreateMatch[1] || ""));
      }
      const partnerHandoffAcceptMatch = normPath.match(/^\/api\/partner\/handoff\/([^/]+)\/accept$/);
      if (partnerHandoffAcceptMatch && req.method === "POST") {
        return await handlePartnerHandoffAccept(req, env, decodeURIComponent(partnerHandoffAcceptMatch[1] || ""));
      }
      const partnerHandoffPreviewMatch = normPath.match(/^\/api\/partner\/handoff\/([^/]+)$/);
      if (partnerHandoffPreviewMatch && req.method === "GET") {
        return await handlePartnerHandoffPreview(req, env, decodeURIComponent(partnerHandoffPreviewMatch[1] || ""));
      }
      const partnerHandoffPlanCheckoutMatch = normPath.match(/^\/api\/partner\/handoff\/([^/]+)\/plan-checkout$/);
      if (partnerHandoffPlanCheckoutMatch && req.method === "POST") {
        return await handlePartnerHandoffPlanCheckout(req, env, decodeURIComponent(partnerHandoffPlanCheckoutMatch[1] || ""));
      }
      if (normPath === "/api/partner/commissions" && req.method === "GET") {
        return await handlePartnerCommissionList(req, env);
      }
      if (normPath === "/api/admin/partners" && req.method === "GET") {
        return await handleAdminPartnerList(req, env);
      }
      if (normPath === "/api/admin/partner-commissions" && req.method === "GET") {
        return await handleAdminPartnerCommissionList(req, env);
      }
      const adminPartnerStatusMatch = normPath.match(/^\/api\/admin\/partners\/([^/]+)\/status$/);
      if (adminPartnerStatusMatch && req.method === "POST") {
        return await handleAdminPartnerStatusUpdate(req, env, decodeURIComponent(adminPartnerStatusMatch[1] || ""));
      }
      const adminPartnerCapacityMatch = normPath.match(/^\/api\/admin\/partners\/([^/]+)\/capacity$/);
      if (adminPartnerCapacityMatch && req.method === "POST") {
        return await handleAdminPartnerCapacityUpdate(req, env, decodeURIComponent(adminPartnerCapacityMatch[1] || ""));
      }
      const adminPartnerRevokeMatch = normPath.match(/^\/api\/admin\/partners\/([^/]+)\/revoke-attribution$/);
      if (adminPartnerRevokeMatch && req.method === "POST") {
        return await handleAdminPartnerRevokeAttribution(req, env, decodeURIComponent(adminPartnerRevokeMatch[1] || ""));
      }
      const adminPartnerDetailMatch = normPath.match(/^\/api\/admin\/partners\/([^/]+)$/);
      if (adminPartnerDetailMatch && req.method === "GET") {
        return await handleAdminPartnerRead(req, env, decodeURIComponent(adminPartnerDetailMatch[1] || ""));
      }
      if (normPath === "/api/partner/connect/start" && req.method === "POST") {
        return await handlePartnerConnectStart(req, env);
      }
      if (normPath === "/api/partner/connect/status" && req.method === "GET") {
        return await handlePartnerConnectStatus(req, env);
      }
      if (normPath === "/api/partner/connect/return" && req.method === "GET") {
        return await handlePartnerConnectReturn(req, env);
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
        const planMode = normalizePlanMode(body?.planMode, body?.campaignPreset);
        const campaignPreset = planMode === "managed_presence" ? "visibility" : "promotion";
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
          planMode,
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
        const noStore2 = { "cache-control": "no-store", "Referrer-Policy": "no-referrer" };
        const body = await req.json().catch(() => ({}));
        const locationSlug = String(body?.locationID || "").trim();
        const draftULID = String(body?.draftULID || "").trim();
        const draftSessionId = String(body?.draftSessionId || "").trim();
        const draftIn = body?.draft && typeof body.draft === "object" ? body.draft : {};
        const planMode = normalizePlanMode(body?.planMode, body?.campaignPreset);
        const requiresCampaignDraft = planMode === "campaign_with_promo_qr";
        const target = await resolveTargetIdentity(
          env,
          { locationID: locationSlug, draftULID, draftSessionId },
          { validateDraft: !!draftULID || !!draftSessionId }
        ).catch(() => null);
        if (!target) {
          return json(
            { error: { code: "invalid_request", message: "valid locationID or draftULID + draftSessionId required" } },
            400,
            noStore2
          );
        }
        let campaignKey = "";
        let startDate = "";
        let endDate = "";
        if (requiresCampaignDraft) {
          campaignKey = String(draftIn?.campaignKey || "").trim();
          startDate = String(draftIn?.startDate || "").trim();
          endDate = String(draftIn?.endDate || "").trim();
          if (!campaignKey) return json({ error: { code: "invalid_request", message: "draft.campaignKey required for Campaign with Promo QR" } }, 400, noStore2);
          if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
            return json({ error: { code: "invalid_request", message: "draft.startDate/endDate must be YYYY-MM-DD for Campaign with Promo QR" } }, 400, noStore2);
          }
          const draft = {
            ...draftIn,
            locationID: target.ulid,
            campaignKey,
            startDate,
            endDate,
            planMode,
            status: "Draft",
            updatedAt: (/* @__PURE__ */ new Date()).toISOString()
          };
          await env.KV_STATUS.put(`campaigns:draft:${target.ulid}`, JSON.stringify(draft));
        }
        const selectedLocationULIDs = Array.isArray(body?.selectedLocationULIDs) ? Array.from(new Set(body.selectedLocationULIDs.map((x) => String(x || "").trim()).filter(Boolean))) : [];
        const stripeReq = {
          initiationType: "public",
          ownershipSource: "plan",
          navigenVersion: "phase5",
          planCode: body?.planCode,
          planMode,
          campaignScope: normCampaignScope(body?.campaignScope),
          selectedLocationULIDs
        };
        if (requiresCampaignDraft) {
          stripeReq.campaignKey = campaignKey;
        }
        if (target.route === "existing-location") {
          stripeReq.locationID = locationSlug;
        } else {
          stripeReq.draftULID = target.draftULID;
          stripeReq.draftSessionId = target.draftSessionId;
        }
        return await createCampaignCheckoutSession(env, req, stripeReq, noStore2);
      }
      if (normPath === "/api/owner/campaigns/checkout" && req.method === "POST") {
        const noStore2 = { "cache-control": "no-store", "Referrer-Policy": "no-referrer" };
        const sess = await requireOwnerSession(req, env);
        if (sess instanceof Response) return sess;
        const ulid = String(sess.ulid || "").trim();
        const body = await req.json().catch(() => ({}));
        const locationSlug = String(body?.locationID || "").trim();
        const planMode = normalizePlanMode(body?.planMode, body?.campaignPreset);
        const requiresCampaignDraft = planMode === "campaign_with_promo_qr";
        if (!locationSlug) {
          return json({ error: { code: "invalid_request", message: "locationID (slug) required" } }, 400, noStore2);
        }
        if (/^[0-9A-HJKMNP-TV-Z]{26}$/i.test(locationSlug)) {
          return json({ error: { code: "invalid_request", message: "locationID must be a slug, not a ULID" } }, 400, noStore2);
        }
        const resolved = await resolveUid(locationSlug, env).catch(() => null);
        if (!resolved || String(resolved).trim() !== ulid) {
          return new Response("Denied", { status: 401, headers: noStore2 });
        }
        let campaignKey = "";
        let campaignScope = normCampaignScope(body?.campaignScope);
        let selectedLocationULIDs = Array.isArray(body?.selectedLocationULIDs) ? Array.from(new Set(body.selectedLocationULIDs.map((x) => String(x || "").trim()).filter(Boolean))) : [];
        if (requiresCampaignDraft) {
          const draftKey = `campaigns:draft:${ulid}`;
          const draft = await env.KV_STATUS.get(draftKey, { type: "json" });
          campaignKey = String(draft?.campaignKey || "").trim();
          if (!campaignKey) {
            return json({ error: { code: "invalid_request", message: "no draft Campaign with Promo QR found for this location" } }, 400, noStore2);
          }
          campaignScope = normCampaignScope(draft?.campaignScope);
          selectedLocationULIDs = Array.isArray(draft?.selectedLocationULIDs) ? Array.from(new Set(draft.selectedLocationULIDs.map((x) => String(x || "").trim()).filter(Boolean))) : [];
        }
        const stripeReq = {
          locationID: locationSlug,
          initiationType: "owner",
          ownershipSource: "plan",
          navigenVersion: "phase5",
          planCode: body?.planCode,
          planMode,
          campaignScope,
          selectedLocationULIDs
        };
        if (requiresCampaignDraft) {
          stripeReq.campaignKey = campaignKey;
        }
        return await createCampaignCheckoutSession(env, req, stripeReq, { "cache-control": "no-store" });
      }
      if (normPath === "/api/owner/campaigns/promote" && req.method === "POST") {
        const noStore2 = { "cache-control": "no-store", "Referrer-Policy": "no-referrer" };
        const sess = await requireOwnerSession(req, env);
        if (sess instanceof Response) return sess;
        const ulid = String(sess.ulid || "").trim();
        const body = await req.json().catch(() => ({}));
        const cs = String(body?.sessionId || "").trim();
        if (!/^cs_(live|test)_/i.test(cs)) {
          return json({ error: { code: "invalid_request", message: "sessionId (cs_...) required" } }, 400, noStore2);
        }
        const sk = String(env.STRIPE_SECRET_KEY || "").trim();
        if (!sk) return json({ error: { code: "misconfigured", message: "STRIPE_SECRET_KEY not set" } }, 500, noStore2);
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
          return json({ error: { code: "stripe_error", message: String(out?.error?.message || "Stripe session fetch failed") } }, 502, noStore2);
        }
        const status = String(out?.status || "").toLowerCase();
        const payStatus = String(out?.payment_status || "").toLowerCase();
        if (status !== "complete" || payStatus !== "paid") {
          return json({ error: { code: "not_paid", message: "checkout not complete/paid" } }, 409, noStore2);
        }
        const pi = out?.payment_intent;
        const meta = pi && pi.metadata ? pi.metadata : out.metadata || {};
        const locationSlug = String(meta?.locationID || "").trim();
        const campaignKey = String(meta?.campaignKey || "").trim();
        if (!locationSlug || !campaignKey) {
          return json({ error: { code: "invalid_state", message: "missing metadata.locationID/campaignKey" } }, 500, noStore2);
        }
        const resolved = await resolveUid(locationSlug, env).catch(() => null);
        if (!resolved || String(resolved).trim() !== ulid) {
          return new Response("Denied", { status: 401, headers: noStore2 });
        }
        const draftKey = `campaigns:draft:${ulid}`;
        const draft = await env.KV_STATUS.get(draftKey, { type: "json" });
        if (!draft) {
          return json({ error: { code: "not_found", message: "draft not found" } }, 404, noStore2);
        }
        if (String(draft?.campaignKey || "").trim() !== campaignKey) {
          return json({ error: { code: "invalid_state", message: "draft campaignKey mismatch" } }, 409, noStore2);
        }
        const paidPriceId = await fetchStripeCheckoutLineItemPriceId(sk, cs).catch(() => "");
        const paidPlan = paidPriceId ? PRICE_ID_TO_PLAN[paidPriceId] : null;
        if (!paidPlan) {
          return json({ error: { code: "invalid_state", message: "paid checkout session has no recognized Plan tier" } }, 409, noStore2);
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
          return json(promoted.body, promoted.status, noStore2);
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
        const noStore2 = { "cache-control": "no-store", "Referrer-Policy": "no-referrer" };
        const sess = await requireOwnerSession(req, env);
        if (sess instanceof Response) return sess;
        const ulid = String(sess.ulid || "").trim();
        const body = await req.json().catch(() => ({}));
        const campaignKey = String(body?.campaignKey || "").trim();
        const campaignGroupKey = String(body?.campaignGroupKey || "").trim();
        const action = String(body?.action || "suspend").trim().toLowerCase();
        if (!campaignKey && !campaignGroupKey) {
          return json({ error: { code: "invalid_request", message: "campaignKey or campaignGroupKey required" } }, 400, noStore2);
        }
        if (action !== "suspend" && action !== "resume") {
          return json({ error: { code: "invalid_request", message: "action must be suspend|resume" } }, 400, noStore2);
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
          return json({ ok: true, ulid, campaignGroupKey, action, affected }, 200, noStore2);
        }
        const changed = await applyToRows(ulid);
        if (!changed) {
          return json({ error: { code: "not_found", message: "campaign not found for this location" } }, 404, noStore2);
        }
        return json({ ok: true, ulid, campaignKey, action }, 200, noStore2);
      }
      if (normPath === "/api/owner/campaigns/suspend-selected" && req.method === "POST") {
        const noStore2 = { "cache-control": "no-store", "Referrer-Policy": "no-referrer" };
        const sess = await requireOwnerSession(req, env);
        if (sess instanceof Response) return sess;
        const currentUlid = String(sess.ulid || "").trim();
        const body = await req.json().catch(() => ({}));
        const campaignGroupKey = String(body?.campaignGroupKey || "").trim();
        const action = String(body?.action || "").trim().toLowerCase();
        const rawUlids = Array.isArray(body?.ulids) ? body.ulids : [];
        if (!campaignGroupKey) {
          return json({ error: { code: "invalid_request", message: "campaignGroupKey required" } }, 400, noStore2);
        }
        if (action !== "suspend" && action !== "resume") {
          return json({ error: { code: "invalid_request", message: "action must be suspend|resume" } }, 400, noStore2);
        }
        const eligible = await eligibleLocationsForRequest(req, env, currentUlid);
        const eligibleSet = new Set(eligible.map((x) => String(x.ulid || "").trim()));
        const targetUlids = Array.from(new Set(rawUlids.map((x) => String(x || "").trim()).filter(Boolean))).filter((id) => eligibleSet.has(id));
        if (!targetUlids.length) {
          return json({ error: { code: "invalid_request", message: "no eligible selected locations" } }, 400, noStore2);
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
          noStore2
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
        const normalizeRestoreId = /* @__PURE__ */ __name((value) => String(value || "").trim().replace(/^["'<]+/, "").replace(/[>"']+$/, ""), "normalizeRestoreId");
        const pi = normalizeRestoreId(
          u.searchParams.get("pi") || u.searchParams.get("payment_intent") || u.searchParams.get("paymentIntent") || u.searchParams.get("payment_intent_id")
        );
        const sidParam = normalizeRestoreId(
          u.searchParams.get("sid") || u.searchParams.get("session_id") || u.searchParams.get("sessionId") || u.searchParams.get("checkout_session") || u.searchParams.get("checkoutSession")
        );
        const nextRaw = String(u.searchParams.get("next") || "").trim();
        const noStoreHeaders = { "cache-control": "no-store", "Referrer-Policy": "no-referrer" };
        const jsonMode = u.searchParams.get("json") === "1" || /\bapplication\/json\b/i.test(String(req.headers.get("Accept") || ""));
        const restoreByPi = /^pi_/i.test(pi);
        const restoreBySid = /^cs_/i.test(sidParam);
        if (!restoreByPi && !restoreBySid) {
          if (jsonMode) {
            return json(
              {
                error: {
                  code: "invalid_restore_id",
                  message: "Use pi=<PaymentIntent ID> or sid=<Checkout Session ID>.",
                  received: {
                    piLength: pi.length,
                    piPrefix: pi.slice(0, 3),
                    sidLength: sidParam.length,
                    sidPrefix: sidParam.slice(0, 3),
                    params: Array.from(u.searchParams.keys()).sort()
                  }
                }
              },
              400,
              noStoreHeaders
            );
          }
          return new Response("Denied", { status: 400, headers: noStoreHeaders });
        }
        const isSafeNext = /* @__PURE__ */ __name((p) => p.startsWith("/") && !p.startsWith("//") && !p.includes("://") && !p.includes("\\"), "isSafeNext");
        const next = nextRaw && isSafeNext(nextRaw) ? nextRaw : "";
        let redirectHint = "";
        const sk = String(env.STRIPE_SECRET_KEY || "").trim();
        if (!sk) return new Response("Misconfigured", { status: 500, headers: noStoreHeaders });
        let sess = null;
        let ulid = "";
        let locationID = "";
        let exclusiveUntil = /* @__PURE__ */ new Date(0);
        try {
          sess = restoreBySid ? await fetchStripeCheckoutSession(sk, sidParam) : await fetchStripeCheckoutSessionByPaymentIntent(sk, pi);
          const reconciled = await reconcilePaidCheckoutSessionPlan(env, sk, sess, { logTag: "owner_restore" });
          await markPartnerLeadConvertedAfterPlanReconciliation(env, sess, reconciled, "owner_restore");
          await ensurePartnerCommissionAfterPlanReconciliation(env, sess, reconciled, "owner_restore");
          ulid = String(reconciled.primaryUlid || "").trim();
          locationID = String(reconciled.locationID || "").trim();
          exclusiveUntil = new Date(String(reconciled.plan.expiresAt || ""));
        } catch (e) {
          const err = String(e?.message || e || "");
          console.error("owner_restore: plan_reconcile_failed", { pi, sid: sidParam, err });
          if (jsonMode) {
            return json(
              {
                error: {
                  code: "restore_reconcile_failed",
                  message: err,
                  pi: restoreByPi ? pi : "",
                  sid: restoreBySid ? sidParam : ""
                }
              },
              403,
              noStoreHeaders
            );
          }
          return new Response("Denied", { status: 403, headers: noStoreHeaders });
        }
        if (!ULID_RE.test(ulid) || Number.isNaN(exclusiveUntil.getTime()) || exclusiveUntil.getTime() <= Date.now()) {
          if (jsonMode) {
            return json(
              {
                error: {
                  code: "restore_inactive_entitlement",
                  message: "Restore did not resolve an active owner entitlement.",
                  ulid,
                  locationID,
                  expiresAt: Number.isNaN(exclusiveUntil.getTime()) ? "" : exclusiveUntil.toISOString()
                }
              },
              403,
              noStoreHeaders
            );
          }
          return new Response("Denied", { status: 403, headers: noStoreHeaders });
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
        console.info("owner_restore_success", { ulid, locationID, pi, sid: sidParam, sessionId });
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
      if (normPath === "/api/profile/update" && req.method === "POST") {
        return await handleProfileUpdate(req, env);
      }
      if (normPath === "/api/media/direct-upload" && req.method === "POST") {
        return await handleMediaDirectUpload(req, env);
      }
      if (normPath === "/api/media/complete" && req.method === "POST") {
        return await handleMediaComplete(req, env);
      }
      if (normPath === "/api/media/abandon-draft" && req.method === "POST") {
        return await handleMediaAbandonDraft(req, env);
      }
      if (normPath === "/api/media/manifest" && req.method === "GET") {
        return await handleMediaManifestRead(req, env);
      }
      if (normPath === "/api/media/delete" && req.method === "POST") {
        return await handleMediaDelete(req, env);
      }
      if (normPath === "/api/media/reorder" && req.method === "POST") {
        return await handleMediaReorder(req, env);
      }
      if (normPath === "/api/location/google-import/autocomplete" && req.method === "POST") {
        return await handleGoogleImportAutocomplete(req, env);
      }
      if (normPath === "/api/location/draft" && req.method === "GET") {
        return await handleLocationDraftRead(req, env);
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
          const rowPlanMode = normalizePlanMode(r?.planMode, r?.campaignPreset);
          if (rowPlanMode !== "campaign_with_promo_qr") return false;
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
          const rowPlanMode = normalizePlanMode(r?.planMode, r?.campaignPreset);
          if (rowPlanMode !== "campaign_with_promo_qr") return false;
          const sMs = parseYmdUtcMs(String(r?.startDate || ""));
          const eMs = parseYmdUtcMs(String(r?.endDate || ""));
          if (!Number.isFinite(sMs) || !Number.isFinite(eMs)) return false;
          if (nowMs < sMs) return false;
          if (nowMs > eMs + 24 * 60 * 60 * 1e3 - 1) return false;
          return true;
        }, "isActiveRow");
        const actives = rows.filter(isActiveRow);
        if (!actives.length) {
          return json({ error: { code: "campaign_with_promo_qr_required", message: "Active Campaign with Promo QR required." } }, 403);
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
            { error: { code: "campaign_with_promo_qr_required", message: "Active Campaign with Promo QR required." } },
            403
          );
        }
        const activeRowPlanMode = normalizePlanMode(activeRow?.planMode, activeRow?.campaignPreset);
        if (activeRowPlanMode !== "campaign_with_promo_qr") {
          return json(
            { error: { code: "campaign_with_promo_qr_required", message: "Campaign with Promo QR is required for promotion QR." } },
            403,
            { "cache-control": "no-store" }
          );
        }
        const chosenKey = String(activeRow.campaignKey || "").trim();
        if (!chosenKey) {
          return json(
            { error: { code: "campaign_with_promo_qr_required", message: "Active Campaign with Promo QR required." } },
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
          const plan = await readPlanEntitlementForUlid(env, loc);
          if (!plan.planEntitled) {
            return await finish("inactive", tokenCampaignKey);
          }
          const rawRows = await env.KV_STATUS.get(campaignsByUlidKey(loc), { type: "json" });
          const rows = Array.isArray(rawRows) ? rawRows : [];
          const nowMs = Date.now();
          const tokenCampaignIsActive = rows.some((r) => {
            if (!r || String(r.locationID || "").trim() !== loc) return false;
            const st = String(r?.statusOverride || r?.status || "").trim().toLowerCase();
            if (st !== "active") return false;
            const rowPlanMode = normalizePlanMode(r?.planMode, r?.campaignPreset);
            if (rowPlanMode !== "campaign_with_promo_qr") return false;
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
        const noStore2 = { "cache-control": "no-store" };
        const body = await req.json().catch(() => null);
        return await createCampaignCheckoutSession(env, req, body, noStore2);
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
              ulid,
              payload: await buildPublicListPayloadWithManifestMedia(env, rec),
              rank,
              idx
            });
          }
          ranked.sort((a, b) => {
            if (b.rank !== a.rank) return b.rank - a.rank;
            return a.idx - b.idx;
          });
          const totalApprox = ranked.length;
          const popularLimit = totalApprox > 0 ? Math.min(5, Math.max(1, Math.ceil(totalApprox * 0.15))) : 0;
          const popularComputedAt = (/* @__PURE__ */ new Date()).toISOString();
          const popularContextKey = contextKey;
          const popularByUlid = /* @__PURE__ */ new Map();
          [...ranked].sort((a, b) => a.idx - b.idx).slice(0, popularLimit).forEach((x, i) => {
            popularByUlid.set(x.ulid, {
              rank: i + 1,
              score: 0,
              reason: totalApprox === 1 ? "single_candidate" : "seed_order_fallback",
              computedAt: popularComputedAt,
              contextKey: popularContextKey
            });
          });
          const items = ranked.slice(start, start + limit).map((x) => {
            const popularMeta = popularByUlid.get(x.ulid);
            return {
              ...x.payload,
              popular: !!popularMeta,
              popularRank: popularMeta?.rank || 0,
              popularScore: popularMeta?.score || 0,
              popularReason: popularMeta?.reason || "",
              popularContextKey: popularMeta?.contextKey || popularContextKey,
              popularComputedAt: popularMeta?.computedAt || popularComputedAt,
              popularSignals: popularMeta ? {
                lpmOpen: 0,
                official: 0,
                map: 0,
                share: 0,
                save: 0,
                distinctActors: 0
              } : void 0
            };
          });
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
          await buildPublicProfilePayloadWithManifestMedia(env, rec),
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
          await buildPublicItemPayloadWithManifestMedia(env, rec),
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
function publicMediaFallback(media) {
  const src = media && typeof media === "object" ? media : {};
  const rawImages = Array.isArray(src.images) ? src.images : [];
  return {
    ...src,
    cover: String(src.cover || "").trim(),
    images: rawImages.map((v) => String(typeof v === "string" ? v : v?.src || "").trim()).filter(Boolean)
  };
}
__name(publicMediaFallback, "publicMediaFallback");
function publicMediaVariantUrl(image, preferred) {
  const variants = image?.variants && typeof image.variants === "object" ? image.variants : {};
  const preferredUrl = String(variants?.[preferred] || "").trim();
  if (preferredUrl) return preferredUrl;
  for (const name of ["gallery", "lpm", "card", "thumb"]) {
    const url = String(variants?.[name] || "").trim();
    if (url) return url;
  }
  return "";
}
__name(publicMediaVariantUrl, "publicMediaVariantUrl");
async function publicLocationMediaProjection(env, ulid, fallbackMedia) {
  const fallback = publicMediaFallback(fallbackMedia);
  const id = String(ulid || "").trim();
  if (!ULID_RE.test(id)) {
    return { media: fallback, manifest: null, manifestHit: false };
  }
  const raw = await env.KV_MEDIA.get(mediaManifestKey("location", id), { type: "json" });
  if (!raw) {
    return { media: fallback, manifest: null, manifestHit: false };
  }
  const manifest = normalizeMediaManifest(raw, "location", id);
  const clientManifest = mediaManifestForClient(manifest, false);
  const activeImages = Array.isArray(clientManifest.images) ? clientManifest.images.filter((img) => String(img?.status || "") === "active") : [];
  if (!activeImages.length) {
    return { media: fallback, manifest: clientManifest, manifestHit: false };
  }
  const cover = publicMediaVariantUrl(activeImages[0], "lpm") || fallback.cover;
  const images = activeImages.slice(1).map((img) => publicMediaVariantUrl(img, "gallery")).filter(Boolean);
  return {
    media: {
      ...fallback,
      cover,
      images,
      source: "media_manifest"
    },
    manifest: clientManifest,
    manifestHit: true
  };
}
__name(publicLocationMediaProjection, "publicLocationMediaProjection");
async function buildPublicProfilePayloadWithManifestMedia(env, rec) {
  const payload = buildPublicProfilePayload(rec);
  const projection = await publicLocationMediaProjection(env, rec.ulid, payload.media || rec.effective?.media || {});
  return {
    ...payload,
    media: projection.media,
    ...projection.manifest ? { mediaManifest: projection.manifest } : {}
  };
}
__name(buildPublicProfilePayloadWithManifestMedia, "buildPublicProfilePayloadWithManifestMedia");
async function buildPublicItemPayloadWithManifestMedia(env, rec) {
  const payload = buildPublicItemPayload(rec);
  const projection = await publicLocationMediaProjection(env, rec.ulid, payload.media || rec.effective?.media || {});
  return {
    ...payload,
    media: projection.media,
    ...projection.manifest ? { mediaManifest: projection.manifest } : {}
  };
}
__name(buildPublicItemPayloadWithManifestMedia, "buildPublicItemPayloadWithManifestMedia");
async function buildPublicListPayloadWithManifestMedia(env, rec) {
  const payload = buildPublicListPayload(rec);
  const projection = await publicLocationMediaProjection(env, rec.ulid, payload.media || rec.effective?.media || {});
  return {
    ...payload,
    media: projection.media,
    ...projection.manifest ? { mediaManifest: projection.manifest } : {}
  };
}
__name(buildPublicListPayloadWithManifestMedia, "buildPublicListPayloadWithManifestMedia");
function buildPublicProfilePayload(rec) {
  const effective = rec?.effective && typeof rec.effective === "object" ? rec.effective : {};
  return {
    ...effective,
    id: rec.ulid,
    ID: rec.ulid,
    locationUID: rec.ulid,
    locationID: rec.locationID,
    contexts: profileContextMemberships(effective),
    coord: effective.navigationCoord || effective.coord || effective["Coordinate Compound"] || "",
    identityCoord: effective.coord || effective["Coordinate Compound"] || "",
    navigationCoord: effective.navigationCoord || "",
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
    contexts: profileContextMemberships(effective),
    locationName: effective.locationName || effective.name,
    media: effective.media || {},
    coord: effective.navigationCoord || effective.coord || effective["Coordinate Compound"] || "",
    identityCoord: effective.coord || effective["Coordinate Compound"] || "",
    navigationCoord: effective.navigationCoord || "",
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
    contexts: profileContextMemberships(effective),
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
    contexts: profileContextMemberships(effective),
    coord: effective?.navigationCoord || effective?.coord || effective?.["Coordinate Compound"] || "",
    identityCoord: effective?.coord || effective?.["Coordinate Compound"] || "",
    navigationCoord: effective?.navigationCoord || "",
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
    ...await buildPublicListPayloadWithManifestMedia(env, rec),
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
async function handleLocationDraftRead(req, env) {
  const noStore2 = { "cache-control": "no-store" };
  const url = new URL(req.url);
  const draftULID = String(url.searchParams.get("draftULID") || "").trim();
  const draftSessionId = String(url.searchParams.get("draftSessionId") || "").trim();
  if (!ULID_RE.test(draftULID) || !draftSessionId) {
    return json(
      { error: { code: "invalid_request", message: "draftULID and draftSessionId required" } },
      400,
      noStore2
    );
  }
  const draft = await readPrivateShellDraft(env, draftULID, draftSessionId);
  if (!draft) {
    return json(
      { error: { code: "not_found", message: "draft not found" } },
      404,
      noStore2
    );
  }
  return json(
    {
      ok: true,
      draftULID,
      draftSessionId,
      draft: {
        ...draft && typeof draft === "object" ? draft : {},
        draftULID,
        draftSessionId
      }
    },
    200,
    noStore2
  );
}
__name(handleLocationDraftRead, "handleLocationDraftRead");
async function handleLocationDraft(req, env) {
  const noStore2 = { "cache-control": "no-store" };
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return json(
      { error: { code: "invalid_request", message: "valid JSON body required" } },
      400,
      noStore2
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
      noStore2
    );
  }
  if (googlePlaceId && !isValidGooglePlaceId(googlePlaceId)) {
    return json(
      { error: { code: "invalid_request", message: "invalid googlePlaceId" } },
      400,
      noStore2
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
        noStore2
      );
    }
    return json(
      { error: { code: "invalid_request", message: msg || "invalid draft payload" } },
      400,
      noStore2
    );
  }
  if (Object.prototype.hasOwnProperty.call(normalizedPatch, "tags")) {
    const tagValidation = await validateBusinessTagKeys(env, normalizedPatch.tags);
    if (!tagValidation.ok) {
      return json(
        {
          error: {
            code: "invalid_tags",
            message: "One or more tags are not in the published tag taxonomy.",
            unknown: tagValidation.unknown
          }
        },
        400,
        noStore2
      );
    }
    normalizedPatch.tags = tagValidation.tags;
  }
  if (locationID) {
    const ulid = await resolveUid(locationID, env);
    if (!ulid) {
      return json(
        { error: { code: "not_found", message: "unknown locationID" } },
        404,
        noStore2
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
        noStore2
      );
    }
    nextDraft2.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    await env.KV_STATUS.put(key2, JSON.stringify(nextDraft2));
    return json(
      { ok: true, locationID, draftSessionId },
      200,
      noStore2
    );
  }
  if (draftULID) {
    if (!ULID_RE.test(draftULID) || !draftSessionId) {
      return json(
        { error: { code: "invalid_request", message: "draftULID and draftSessionId required" } },
        400,
        noStore2
      );
    }
    const key2 = `override_draft:${draftULID}:${draftSessionId}`;
    const prev = await env.KV_STATUS.get(key2, { type: "json" });
    if (!prev) {
      return json(
        { error: { code: "not_found", message: "draft not found" } },
        404,
        noStore2
      );
    }
    const nextDraft2 = mergeDraftPatch(prev, normalizedPatch);
    const classificationError2 = null;
    if (classificationError2) {
      return json(
        { error: { code: "invalid_request", message: classificationError2 } },
        400,
        noStore2
      );
    }
    nextDraft2.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    await env.KV_STATUS.put(key2, JSON.stringify(nextDraft2));
    return json(
      { ok: true, draftULID, draftSessionId },
      200,
      noStore2
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
  const draftResponseHeaders = deviceSetCookie ? { ...noStore2, "Set-Cookie": deviceSetCookie } : noStore2;
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
            noStore2
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
      noStore2
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
  const noStore2 = { "cache-control": "no-store" };
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return json(
      { error: { code: "invalid_request", message: "valid JSON body required" } },
      400,
      noStore2
    );
  }
  const draftULID = String(body?.draftULID || "").trim();
  const draftSessionId = String(body?.draftSessionId || "").trim();
  const googlePlaceId = String(body?.googlePlaceId || body?.place_id || "").trim();
  if (!ULID_RE.test(draftULID) || !draftSessionId) {
    return json(
      { error: { code: "invalid_request", message: "draftULID and draftSessionId required" } },
      400,
      noStore2
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
    noStore2
  );
}
__name(handleLocationDraftDelete, "handleLocationDraftDelete");
async function handleGoogleImportAutocomplete(req, env) {
  const noStore2 = { "cache-control": "no-store" };
  const apiKey = googlePlacesApiKey(env);
  if (!apiKey) {
    return json(
      { error: { code: "google_places_key_missing", message: "Google Places server key is not configured." } },
      503,
      noStore2
    );
  }
  const body = await req.json().catch(() => null);
  const input = String(body?.input || "").trim();
  const languageCode = String(body?.languageCode || "en").trim().slice(0, 12) || "en";
  if (input.length < 3) {
    return json(
      { ok: true, predictions: [] },
      200,
      noStore2
    );
  }
  if (input.length > 160) {
    return json(
      { error: { code: "invalid_request", message: "Search input is too long." } },
      400,
      noStore2
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
      noStore2
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
    noStore2
  );
}
__name(handleGoogleImportAutocomplete, "handleGoogleImportAutocomplete");
async function handleUpfrontGoogleImportHydrate(req, env, body, googlePlaceId) {
  const noStore2 = { "cache-control": "no-store" };
  if (!isValidGooglePlaceId(googlePlaceId)) {
    return json(
      { error: { code: "invalid_request", message: "invalid googlePlaceId" } },
      400,
      noStore2
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
      noStore2
    );
  }
  let deviceId = readDeviceId(req);
  let deviceSetCookie = "";
  if (!deviceId) {
    const minted = mintDeviceId();
    deviceId = minted.dev;
    deviceSetCookie = minted.cookie;
  }
  const responseHeaders = deviceSetCookie ? { ...noStore2, "Set-Cookie": deviceSetCookie } : noStore2;
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
  const noStore2 = { "cache-control": "no-store" };
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return json(
      { error: { code: "invalid_request", message: "valid JSON body required" } },
      400,
      noStore2
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
      noStore2
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
      noStore2
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
    noStore2
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
  if (Array.isArray(raw)) return uniqueTrimmedStrings(raw);
  return uniqueTrimmedStrings(String(raw || "").split(/[;,]/));
}
__name(splitContextMemberships, "splitContextMemberships");
function profileContextMemberships(profile) {
  const src = profile && typeof profile === "object" ? profile : {};
  return uniqueTrimmedStrings([
    ...splitContextMemberships(src.context),
    ...splitContextMemberships(src.contexts)
  ]);
}
__name(profileContextMemberships, "profileContextMemberships");
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
  const prevContexts = profileContextMemberships(args.prevProfile);
  const nextContexts = profileContextMemberships(args.nextProfile);
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
async function promoteDraftMediaManifestToPublishedLocation(env, draftULID, locationULID) {
  const draftId = String(draftULID || "").trim();
  const locationId = String(locationULID || "").trim();
  if (!ULID_RE.test(draftId) || !ULID_RE.test(locationId)) {
    return { ok: false, promotedCount: 0 };
  }
  const raw = await env.KV_MEDIA.get(mediaManifestKey("draft", draftId), { type: "json" });
  if (!raw) {
    return { ok: true, promotedCount: 0 };
  }
  const draftManifest = normalizeMediaManifest(raw, "draft", draftId);
  const activeImages = draftManifest.images.filter((img) => img.status === "active").sort((a, b) => {
    if (a.slot !== b.slot) return a.slot - b.slot;
    return a.createdAt.localeCompare(b.createdAt);
  }).slice(0, MEDIA_MAX_ACTIVE_IMAGES);
  if (!activeImages.length) {
    return { ok: true, promotedCount: 0 };
  }
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  const locationManifest = {
    version: 1,
    targetType: "location",
    targetId: locationId,
    coverImageId: activeImages[0]?.mediaId || "",
    images: activeImages.map((img, index) => ({
      ...img,
      status: "active",
      slot: index + 1,
      expiresAt: "",
      updatedAt: nowIso
    })),
    updatedAt: nowIso
  };
  const promoted = await mediaTargetDoFetch(env, "location", locationId, {
    op: "replace-manifest",
    manifest: locationManifest
  });
  return {
    ok: promoted.payload?.ok === true,
    promotedCount: activeImages.length
  };
}
__name(promoteDraftMediaManifestToPublishedLocation, "promoteDraftMediaManifestToPublishedLocation");
function ownerProfileEditError(code, message, status = 400, extra = {}) {
  return json(
    { error: { code, message, ...extra } },
    status,
    { "cache-control": "no-store" }
  );
}
__name(ownerProfileEditError, "ownerProfileEditError");
function ownerEditIsObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
__name(ownerEditIsObject, "ownerEditIsObject");
function ownerEditString(value, maxLen) {
  return String(value ?? "").trim().slice(0, maxLen);
}
__name(ownerEditString, "ownerEditString");
function ownerEditHasOwn(source, key) {
  return Object.prototype.hasOwnProperty.call(source, key);
}
__name(ownerEditHasOwn, "ownerEditHasOwn");
function ownerEditPatchSource(body) {
  const direct = body?.patch ?? body?.updates ?? body?.profileUpdate;
  if (ownerEditIsObject(direct)) return direct;
  const out = {};
  for (const key of ["description", "descriptions", "contactInformation", "links", "openingHours"]) {
    if (ownerEditIsObject(body) && ownerEditHasOwn(body, key)) out[key] = body[key];
  }
  return out;
}
__name(ownerEditPatchSource, "ownerEditPatchSource");
function collectOwnerEditLockedFields(value, prefix = "") {
  if (!ownerEditIsObject(value) && !Array.isArray(value)) return [];
  const locked = /* @__PURE__ */ new Set([
    "id",
    "ID",
    "ulid",
    "locationUID",
    "locationID",
    "alias",
    "slug",
    "locationName",
    "listedName",
    "name",
    "address",
    "listedAddress",
    "city",
    "country",
    "countryCode",
    "postalCode",
    "adminArea",
    "coord",
    "coordinates",
    "lat",
    "lng",
    "latitude",
    "longitude",
    "sectorKey",
    "groupKey",
    "subgroupKey",
    "context",
    "contexts",
    "tags",
    "rating",
    "ratings",
    "googleRating",
    "popular",
    "ranking",
    "rank",
    "pricing",
    "finance",
    "plan",
    "planRecord",
    "campaign",
    "campaigns",
    "campaignHistory",
    "campaignStats",
    "qr",
    "redeem",
    "redemptions",
    "stats",
    "analytics",
    "media",
    "mediaManifest",
    "sources",
    "provenance",
    "qa",
    "diagnostics"
  ]);
  const out = [];
  const entries = Array.isArray(value) ? value.map((v, index) => [String(index), v]) : Object.entries(value);
  for (const [key, child] of entries) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (locked.has(key)) out.push(path);
    out.push(...collectOwnerEditLockedFields(child, path));
  }
  return Array.from(new Set(out));
}
__name(collectOwnerEditLockedFields, "collectOwnerEditLockedFields");
function ownerEditValidateUrl(value, field) {
  if (!value) return null;
  try {
    const u = new URL(value);
    if (u.protocol === "http:" || u.protocol === "https:") return null;
  } catch {
  }
  return {
    ok: false,
    code: "invalid_url",
    message: `${field} must be a valid http(s) URL.`,
    fields: [field]
  };
}
__name(ownerEditValidateUrl, "ownerEditValidateUrl");
function ownerEditValidateEmail(value) {
  if (!value) return null;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return null;
  return {
    ok: false,
    code: "invalid_email",
    message: "contactInformation.email must be a valid email address.",
    fields: ["contactInformation.email"]
  };
}
__name(ownerEditValidateEmail, "ownerEditValidateEmail");
function ownerEditDescriptionKeyAllowed(key) {
  return /^[a-z]{2,10}$/i.test(key) || key === "default";
}
__name(ownerEditDescriptionKeyAllowed, "ownerEditDescriptionKeyAllowed");
function ownerEditAllowedDirectLinkKey(key) {
  return (/* @__PURE__ */ new Set([
    "website",
    "official",
    "facebook",
    "instagram",
    "tiktok",
    "youtube",
    "spotify",
    "linkedin",
    "x",
    "twitter",
    "whatsapp",
    "telegram",
    "messenger"
  ])).has(key);
}
__name(ownerEditAllowedDirectLinkKey, "ownerEditAllowedDirectLinkKey");
function ownerEditAllowedSocialLinkKey(key) {
  return (/* @__PURE__ */ new Set([
    "facebook",
    "instagram",
    "tiktok",
    "youtube",
    "spotify",
    "linkedin",
    "x",
    "twitter",
    "whatsapp",
    "telegram",
    "messenger"
  ])).has(key);
}
__name(ownerEditAllowedSocialLinkKey, "ownerEditAllowedSocialLinkKey");
function buildOwnerProfileUpdatePatch(body) {
  const source = ownerEditPatchSource(body);
  if (!ownerEditIsObject(source)) {
    return {
      ok: false,
      code: "invalid_patch",
      message: "patch must be an object."
    };
  }
  const lockedFields = collectOwnerEditLockedFields(source);
  if (lockedFields.length) {
    return {
      ok: false,
      code: "locked_field",
      message: "One or more fields are not owner-editable.",
      fields: lockedFields
    };
  }
  const allowedTop = /* @__PURE__ */ new Set(["description", "descriptions", "contactInformation", "links", "openingHours", "navigationCoord"]);
  const unknownTop = Object.keys(source).filter((key) => !allowedTop.has(key));
  if (unknownTop.length) {
    return {
      ok: false,
      code: "unknown_field",
      message: "One or more fields are not supported by OWN-EDIT v1.",
      fields: unknownTop
    };
  }
  const patch = {};
  const changedFields = [];
  if (ownerEditHasOwn(source, "description")) {
    const value = ownerEditString(source.description, 5e3);
    patch.descriptions = { ...patch.descriptions || {}, en: value };
    changedFields.push("descriptions.en");
  }
  if (ownerEditHasOwn(source, "descriptions")) {
    const descriptions = source.descriptions;
    if (typeof descriptions === "string") {
      patch.descriptions = { ...patch.descriptions || {}, en: ownerEditString(descriptions, 5e3) };
      changedFields.push("descriptions.en");
    } else if (ownerEditIsObject(descriptions)) {
      const out = { ...patch.descriptions || {} };
      for (const [key, value] of Object.entries(descriptions)) {
        if (!ownerEditDescriptionKeyAllowed(key)) {
          return {
            ok: false,
            code: "invalid_description_key",
            message: "Description language keys must be short language codes.",
            fields: [`descriptions.${key}`]
          };
        }
        out[key] = ownerEditString(value, 5e3);
        changedFields.push(`descriptions.${key}`);
      }
      patch.descriptions = out;
    } else {
      return {
        ok: false,
        code: "invalid_descriptions",
        message: "descriptions must be a string or object.",
        fields: ["descriptions"]
      };
    }
  }
  if (ownerEditHasOwn(source, "contactInformation")) {
    if (!ownerEditIsObject(source.contactInformation)) {
      return {
        ok: false,
        code: "invalid_contact",
        message: "contactInformation must be an object.",
        fields: ["contactInformation"]
      };
    }
    const allowedContact = /* @__PURE__ */ new Set(["phone", "email", "website", "whatsapp", "telegram", "messenger"]);
    const unknownContact = Object.keys(source.contactInformation).filter((key) => !allowedContact.has(key));
    if (unknownContact.length) {
      return {
        ok: false,
        code: "unknown_contact_field",
        message: "One or more contact fields are not owner-editable.",
        fields: unknownContact.map((key) => `contactInformation.${key}`)
      };
    }
    const out = {};
    for (const key of allowedContact) {
      if (!ownerEditHasOwn(source.contactInformation, key)) continue;
      const value = ownerEditString(source.contactInformation[key], key === "email" || key === "phone" ? 160 : 500);
      if (key === "email") {
        const badEmail = ownerEditValidateEmail(value);
        if (badEmail) return badEmail;
      }
      if (key === "website") {
        const badUrl = ownerEditValidateUrl(value, "contactInformation.website");
        if (badUrl) return badUrl;
      }
      out[key] = value;
      changedFields.push(`contactInformation.${key}`);
    }
    if (Object.keys(out).length) {
      patch.contactInformation = out;
    }
  }
  if (ownerEditHasOwn(source, "links")) {
    if (!ownerEditIsObject(source.links)) {
      return {
        ok: false,
        code: "invalid_links",
        message: "links must be an object.",
        fields: ["links"]
      };
    }
    const out = {};
    for (const [key, value] of Object.entries(source.links)) {
      if (key === "social") {
        if (!ownerEditIsObject(value)) {
          return {
            ok: false,
            code: "invalid_social_links",
            message: "links.social must be an object.",
            fields: ["links.social"]
          };
        }
        const socialOut = {};
        for (const [socialKey, socialValue] of Object.entries(value)) {
          if (!ownerEditAllowedSocialLinkKey(socialKey)) {
            return {
              ok: false,
              code: "unknown_social_link",
              message: "One or more social links are not supported by OWN-EDIT v1.",
              fields: [`links.social.${socialKey}`]
            };
          }
          const clean2 = ownerEditString(socialValue, 500);
          const badUrl2 = ownerEditValidateUrl(clean2, `links.social.${socialKey}`);
          if (badUrl2) return badUrl2;
          socialOut[socialKey] = clean2;
          changedFields.push(`links.social.${socialKey}`);
        }
        out.social = socialOut;
        continue;
      }
      if (!ownerEditAllowedDirectLinkKey(key)) {
        return {
          ok: false,
          code: "unknown_link",
          message: "One or more links are not supported by OWN-EDIT v1.",
          fields: [`links.${key}`]
        };
      }
      const clean = ownerEditString(value, 500);
      const badUrl = ownerEditValidateUrl(clean, `links.${key}`);
      if (badUrl) return badUrl;
      out[key] = clean;
      changedFields.push(`links.${key}`);
    }
    if (Object.keys(out).length) {
      patch.links = out;
    }
  }
  if (ownerEditHasOwn(source, "openingHours")) {
    const hours = source.openingHours;
    if (!ownerEditIsObject(hours) && !Array.isArray(hours) && typeof hours !== "string") {
      return {
        ok: false,
        code: "invalid_opening_hours",
        message: "openingHours must be a string, array, or object.",
        fields: ["openingHours"]
      };
    }
    const encoded = JSON.stringify(hours);
    if (encoded.length > 6e3) {
      return {
        ok: false,
        code: "opening_hours_too_large",
        message: "openingHours payload is too large.",
        fields: ["openingHours"]
      };
    }
    patch.openingHours = hours;
    changedFields.push("openingHours");
  }
  if (ownerEditHasOwn(source, "navigationCoord")) {
    const rawNavigationCoord = source.navigationCoord;
    const hasNavigationValue = rawNavigationCoord !== null && rawNavigationCoord !== void 0 && String(rawNavigationCoord).trim() !== "";
    if (hasNavigationValue) {
      let navigationCoord;
      try {
        navigationCoord = normalizeDraftCoord(rawNavigationCoord);
      } catch {
        navigationCoord = void 0;
      }
      if (!navigationCoord) {
        return {
          ok: false,
          code: "invalid_navigation_coord",
          message: "navigationCoord must be a valid latitude, longitude pair.",
          fields: ["navigationCoord"]
        };
      }
      patch.navigationCoord = navigationCoord;
      changedFields.push("navigationCoord");
    }
  }
  const uniqueChanged = Array.from(new Set(changedFields));
  if (!uniqueChanged.length) {
    return {
      ok: false,
      code: "no_editable_fields",
      message: "No editable profile fields were provided."
    };
  }
  return {
    ok: true,
    patch,
    changedFields: uniqueChanged
  };
}
__name(buildOwnerProfileUpdatePatch, "buildOwnerProfileUpdatePatch");
function extractOwnerProfileUpdateTarget(body) {
  const target = ownerEditIsObject(body?.target) ? body.target : {};
  return String(
    target.targetId || target.ulid || target.locationID || body?.targetId || body?.ulid || body?.locationID || ""
  ).trim();
}
__name(extractOwnerProfileUpdateTarget, "extractOwnerProfileUpdateTarget");
async function resolveOwnerProfileUpdateAccess(req, env, body) {
  const rawTarget = extractOwnerProfileUpdateTarget(body);
  if (!rawTarget) {
    return {
      ok: false,
      response: ownerProfileEditError("invalid_target", "targetId, ulid, or locationID is required.", 400)
    };
  }
  const resolved = await resolveUid(rawTarget, env) || rawTarget;
  const ulid = ULID_RE.test(resolved) ? resolved : "";
  if (!ulid) {
    return {
      ok: false,
      response: ownerProfileEditError("invalid_target", "Target must resolve to a published location ULID.", 400)
    };
  }
  const published = await readPublishedEffectiveProfileByUlid(ulid, env);
  if (!published) {
    return {
      ok: false,
      response: ownerProfileEditError("not_found", "Published location was not found.", 404)
    };
  }
  const auth = await requireOwnerSession(req, env);
  if (auth instanceof Response) {
    return {
      ok: false,
      response: ownerProfileEditError("unauthorized", "Owner session is required.", auth.status || 401)
    };
  }
  const ownerUlid = String(auth.ulid || "").trim();
  if (ownerUlid !== ulid) {
    return {
      ok: false,
      response: ownerProfileEditError(
        "owner_session_mismatch",
        "Owner session does not match profile update target.",
        403,
        { ownerUlid, targetUlid: ulid }
      )
    };
  }
  const entitlement = await readPlanEntitlementForUlid(env, ulid);
  if (!entitlement.planEntitled) {
    return {
      ok: false,
      response: ownerProfileEditError(
        "plan_required",
        "Active Plan coverage is required to edit this public profile.",
        403,
        { reason: entitlement.reason }
      )
    };
  }
  return {
    ok: true,
    ulid,
    locationID: published.locationID,
    effective: published.effective,
    entitlement
  };
}
__name(resolveOwnerProfileUpdateAccess, "resolveOwnerProfileUpdateAccess");
async function handleProfileUpdate(req, env) {
  const noStore2 = { "cache-control": "no-store" };
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return ownerProfileEditError("invalid_request", "valid JSON body required", 400);
  }
  const patchCheck = buildOwnerProfileUpdatePatch(body);
  if (!patchCheck.ok) {
    return ownerProfileEditError(
      patchCheck.code,
      patchCheck.message,
      patchCheck.code === "locked_field" ? 403 : 400,
      patchCheck.fields ? { fields: patchCheck.fields } : {}
    );
  }
  const access = await resolveOwnerProfileUpdateAccess(req, env, body);
  if (!access.ok) return access.response;
  const base = await env.KV_STATUS.get(`profile_base:${access.ulid}`, { type: "json" });
  if (!base || typeof base !== "object") {
    return ownerProfileEditError("not_found", "Published profile base was not found.", 404);
  }
  const currentOverride = await env.KV_STATUS.get(`override:${access.ulid}`, { type: "json" }) || {};
  const nextOverride = deepMergeProfile(currentOverride || {}, patchCheck.patch);
  const nextEffective = deepMergeProfile(base, nextOverride);
  const nowIso = doNowIso();
  await env.KV_STATUS.put(`override:${access.ulid}`, JSON.stringify(nextOverride));
  await env.KV_STATUS.put(
    `override_log:${access.ulid}:${Date.now()}`,
    JSON.stringify({
      ts: nowIso,
      source: "OWN_EDIT_V1",
      ulid: access.ulid,
      locationID: access.locationID,
      changedFields: patchCheck.changedFields,
      patch: patchCheck.patch,
      plan: {
        paymentIntentId: access.entitlement.paymentIntentId,
        tier: access.entitlement.tier,
        exclusiveUntil: access.entitlement.exclusiveUntil
      }
    })
  );
  let indexSynced = false;
  try {
    await syncPublishedDoIndex(env, {
      ulid: access.ulid,
      slug: access.locationID,
      prevProfile: access.effective,
      nextProfile: nextEffective,
      visibilityState: "promoted"
    });
    indexSynced = true;
  } catch (e) {
    console.error("owner_profile_update_index_sync_failed", {
      ulid: access.ulid,
      locationID: access.locationID,
      err: String(e?.message || e || "")
    });
  }
  return json(
    {
      ok: true,
      ulid: access.ulid,
      locationID: access.locationID,
      changedFields: patchCheck.changedFields,
      indexSynced,
      profile: buildPublicItemPayload({
        ulid: access.ulid,
        locationID: access.locationID,
        effective: nextEffective
      })
    },
    200,
    noStore2
  );
}
__name(handleProfileUpdate, "handleProfileUpdate");
async function handleLocationPublish(req, env) {
  const noStore2 = { "cache-control": "no-store" };
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return json(
      { error: { code: "invalid_request", message: "valid JSON body required" } },
      400,
      noStore2
    );
  }
  const locationID = String(body?.locationID || "").trim();
  const draftULID = String(body?.draftULID || "").trim();
  const sourceDraftActorKey = String(body?.sourceDraftActorKey || body?.draftSessionId || "").trim();
  if (!sourceDraftActorKey) {
    return json(
      { error: { code: "invalid_request", message: "draftSessionId required" } },
      400,
      noStore2
    );
  }
  const target = locationID ? await resolveTargetIdentity(env, { locationID }, {}) : await resolveTargetIdentity(env, { draftULID, draftSessionId: sourceDraftActorKey }, { validateDraft: true });
  if (!target) {
    return json(
      { error: { code: "not_found", message: "publish target not found" } },
      404,
      noStore2
    );
  }
  const auth = await requireOwnerSession(req, env);
  if (auth instanceof Response) return auth;
  if (String(auth.ulid || "").trim() !== target.ulid) {
    return json(
      {
        error: {
          code: "owner_session_mismatch",
          message: "Owner session does not match publish target.",
          ownerUlid: String(auth.ulid || "").trim(),
          targetUlid: target.ulid
        }
      },
      403,
      noStore2
    );
  }
  const ownKey = `ownership:${target.ulid}`;
  const ownership = await env.KV_STATUS.get(ownKey, { type: "json" });
  const exclusiveUntilIso = String(ownership?.exclusiveUntil || "").trim();
  const exclusiveUntil = exclusiveUntilIso ? new Date(exclusiveUntilIso) : null;
  if (!exclusiveUntil || Number.isNaN(exclusiveUntil.getTime()) || exclusiveUntil.getTime() <= Date.now()) {
    return json(
      { error: { code: "ownership_inactive", message: "active ownership required" } },
      403,
      noStore2
    );
  }
  const paymentIntentId = String(ownership?.lastEventId || "").trim();
  if (!paymentIntentId) {
    return json(
      { error: { code: "plan_missing", message: "ownership has no plan anchor" } },
      403,
      noStore2
    );
  }
  const plan = await env.KV_STATUS.get(`plan:${paymentIntentId}`, { type: "json" });
  const planExpIso = String(plan?.expiresAt || "").trim();
  const planExp = planExpIso ? new Date(planExpIso) : null;
  if (!plan || !planExp || Number.isNaN(planExp.getTime()) || planExp.getTime() <= Date.now()) {
    return json(
      { error: { code: "plan_inactive", message: "active plan required" } },
      403,
      noStore2
    );
  }
  if (planExp.toISOString() !== exclusiveUntil.toISOString()) {
    return json(
      { error: { code: "plan_invariant_failed", message: "plan/ownership expiry mismatch" } },
      403,
      noStore2
    );
  }
  const draftKey = `override_draft:${target.ulid}:${sourceDraftActorKey}`;
  let draft = await env.KV_STATUS.get(draftKey, { type: "json" });
  if (!draft) {
    return json(
      { error: { code: "not_found", message: "draft not found" } },
      404,
      noStore2
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
  const classificationError = await safeValidateClassificationSelection(env, candidate, { failClosedOnCatalogError: true });
  if (classificationError) {
    return json(
      { error: { code: "validation_failed", message: classificationError } },
      403,
      noStore2
    );
  }
  const validationError = validatePublishCandidate(candidate);
  if (validationError) {
    return json(
      { error: { code: "validation_failed", message: validationError } },
      403,
      noStore2
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
        noStore2
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
            const existingAlloc = await env.KV_STATUS.get(planAllocKey(paymentIntentId), { type: "json" });
            const allocBase = existingAlloc && typeof existingAlloc === "object" ? existingAlloc : {};
            const allocUlids = uniqueTrimmedStrings(Array.isArray(allocBase?.ulids) ? allocBase.ulids : []);
            if (!allocUlids.includes(target.ulid)) allocUlids.push(target.ulid);
            await env.KV_STATUS.put(
              planAllocKey(paymentIntentId),
              JSON.stringify({
                ...allocBase,
                ulids: allocUlids,
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
    try {
      const mediaPromotion = await promoteDraftMediaManifestToPublishedLocation(env, target.ulid, target.ulid);
      if (!mediaPromotion.ok) {
        console.error("publish_media_manifest_promotion_failed", {
          ulid: target.ulid,
          locationID: slug,
          promotedCount: mediaPromotion.promotedCount
        });
      }
    } catch (e) {
      console.error("publish_media_manifest_promotion_failed", {
        ulid: target.ulid,
        locationID: slug,
        err: String(e?.message || e || "")
      });
    }
    return json(
      { ok: true, locationID: slug },
      200,
      noStore2
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
        noStore2
      );
    }
    return json(
      { error: { code: "publish_failed", message: String(e?.message || "publish failed") } },
      500,
      noStore2
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
    const rowPlanMode = normalizePlanMode(row?.planMode, row?.campaignPreset);
    if (rowPlanMode !== "campaign_with_promo_qr") return false;
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
      planGrossAmount: plan.grossAmount,
      planCurrency: plan.currency,
      planMode: plan.planMode,
      planMaxPublishedLocations: plan.maxPublishedLocations,
      planMaxConcurrentPromoQrCampaignsPerLocation: plan.maxConcurrentPromoQrCampaignsPerLocation,
      planActiveDurationDays: plan.activeDurationDays,
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
var STRUCTURE_ACTIVE_KEY = "structure:active";
var STRUCTURE_VERSION_PREFIX = "structure:version:";
var STRUCTURE_MANIFEST_KEY = "structure:manifest";
var STRUCTURE_BUSINESS_CATEGORIES_KEY = "structure:business-categories";
var STRUCTURE_BUSINESS_TAGS_KEY = "business-tags:v1";
var STRUCTURE_BUSINESS_TAGS_MANIFEST_KEY = "business-tags:manifest";
var STRUCTURE_GROUP_KEY_RE = /^group\.[a-z0-9][a-z0-9-]*$/i;
var STRUCTURE_SUBGROUP_KEY_RE = /^(sub|group)\.[a-z0-9][a-z0-9-]*$/i;
var STRUCTURE_TAG_GROUP_KEY_RE = /^tagGroup\.[a-z0-9][a-z0-9-]*$/i;
var STRUCTURE_TAG_KEY_RE = /^tag\.[a-z0-9][a-z0-9-]*$/i;
var STRUCTURE_VERSION_RE = /^\d{4}-?\d{2}-?\d{2}T\d{6}Z-[a-f0-9]{6,64}$/i;
function emptyStructureManifest() {
  return {
    activeVersion: "unpublished",
    publishedAt: "",
    publishedBy: "",
    source: "",
    checksum: "",
    count: 0
  };
}
__name(emptyStructureManifest, "emptyStructureManifest");
function structureString(value) {
  return String(value || "").trim();
}
__name(structureString, "structureString");
function structureStringArray(value) {
  const vals = Array.isArray(value) ? value : String(value || "").split(";");
  return uniqueTrimmedStrings(vals);
}
__name(structureStringArray, "structureStringArray");
function structureOrder(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
__name(structureOrder, "structureOrder");
function structureInputRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return null;
  if (Array.isArray(payload.rows)) return payload.rows;
  if (Array.isArray(payload.groups)) return payload.groups;
  if (Array.isArray(payload.structure)) return payload.structure;
  return null;
}
__name(structureInputRows, "structureInputRows");
function sanitizeStructureManifest(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return emptyStructureManifest();
  return {
    activeVersion: structureString(raw.activeVersion) || "unpublished",
    publishedAt: structureString(raw.publishedAt),
    publishedBy: structureString(raw.publishedBy),
    source: structureString(raw.source),
    checksum: structureString(raw.checksum),
    count: Number.isFinite(Number(raw.count)) ? Number(raw.count) : 0
  };
}
__name(sanitizeStructureManifest, "sanitizeStructureManifest");
function sanitizeStructureBusinessCategoriesProjection(raw, manifest) {
  const src = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const groups = Array.isArray(src.groups) ? src.groups.map((group) => {
    const groupKey = structureString(group?.groupKey);
    if (!STRUCTURE_GROUP_KEY_RE.test(groupKey)) return null;
    const subgroups = (Array.isArray(group?.subgroups) ? group.subgroups : []).map((subgroup) => {
      const key = structureString(subgroup?.key);
      if (!STRUCTURE_SUBGROUP_KEY_RE.test(key)) return null;
      return {
        key,
        name: structureString(subgroup?.name) || key,
        order: structureOrder(subgroup?.order, 0),
        keywords: structureStringArray(subgroup?.keywords)
      };
    }).filter(Boolean);
    return {
      groupKey,
      groupName: structureString(group?.groupName) || groupKey,
      order: structureOrder(group?.order, 0),
      groupKeywords: structureStringArray(group?.groupKeywords),
      fallbackSubgroupKey: structureString(group?.fallbackSubgroupKey),
      subgroups
    };
  }).filter(Boolean) : [];
  return {
    version: structureString(src.version) || manifest.activeVersion || "unpublished",
    publishedAt: structureString(src.publishedAt) || manifest.publishedAt || "",
    groups
  };
}
__name(sanitizeStructureBusinessCategoriesProjection, "sanitizeStructureBusinessCategoriesProjection");
async function readStructureManifest(env) {
  const raw = await env.KV_STRUCTURE.get(STRUCTURE_MANIFEST_KEY, { type: "json" });
  return sanitizeStructureManifest(raw);
}
__name(readStructureManifest, "readStructureManifest");
async function handleStructureBusinessCategoriesRead(env) {
  const [rawProjection, manifest] = await Promise.all([
    env.KV_STRUCTURE.get(STRUCTURE_BUSINESS_CATEGORIES_KEY, { type: "json" }),
    readStructureManifest(env)
  ]);
  return json(
    sanitizeStructureBusinessCategoriesProjection(rawProjection, manifest),
    200,
    { "cache-control": "no-store" }
  );
}
__name(handleStructureBusinessCategoriesRead, "handleStructureBusinessCategoriesRead");
function structureTagInputGroups(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return null;
  if (Array.isArray(payload.tagGroups)) return payload.tagGroups;
  if (Array.isArray(payload.groups)) return payload.groups;
  if (Array.isArray(payload.tags)) {
    return [{
      tagGroupKey: "tagGroup.general",
      tagGroupName: "General",
      tags: payload.tags
    }];
  }
  return null;
}
__name(structureTagInputGroups, "structureTagInputGroups");
function sanitizeStructureBusinessTagsProjection(raw) {
  const src = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const tagGroups = Array.isArray(src.tagGroups) ? src.tagGroups.map((group) => {
    const tagGroupKey = structureString(group?.tagGroupKey || group?.key);
    if (!STRUCTURE_TAG_GROUP_KEY_RE.test(tagGroupKey)) return null;
    const tags = (Array.isArray(group?.tags) ? group.tags : []).map((tag) => {
      const key = structureString(tag?.key);
      if (!STRUCTURE_TAG_KEY_RE.test(key)) return null;
      return {
        key,
        name: structureString(tag?.name || tag?.label) || key,
        order: structureOrder(tag?.order ?? tag?.sortOrder, 0),
        keywords: structureStringArray(tag?.keywords)
      };
    }).filter(Boolean);
    return {
      tagGroupKey,
      tagGroupName: structureString(group?.tagGroupName || group?.name || group?.label) || tagGroupKey,
      order: structureOrder(group?.order ?? group?.sortOrder, 0),
      keywords: structureStringArray(group?.keywords),
      tags
    };
  }).filter(Boolean) : [];
  return {
    version: structureString(src.version) || "v1",
    publishedAt: structureString(src.publishedAt),
    tagGroups
  };
}
__name(sanitizeStructureBusinessTagsProjection, "sanitizeStructureBusinessTagsProjection");
function prepareBusinessTagsPayload(payload) {
  const inputGroups = structureTagInputGroups(payload);
  if (!inputGroups) return { tagGroups: [], errors: ["tags payload must contain tagGroups array"] };
  const errors = [];
  const tagGroups = [];
  const seenGroups = /* @__PURE__ */ new Set();
  const seenTags = /* @__PURE__ */ new Set();
  inputGroups.forEach((group, index) => {
    const rowId = `tag group ${index + 1}`;
    if (!group || typeof group !== "object" || Array.isArray(group)) {
      errors.push(`${rowId}: tag group must be an object`);
      return;
    }
    const tagGroupKey = structureString(group.tagGroupKey || group.key);
    if (!STRUCTURE_TAG_GROUP_KEY_RE.test(tagGroupKey)) {
      errors.push(`${rowId}: invalid tagGroupKey "${tagGroupKey}"`);
      return;
    }
    if (seenGroups.has(tagGroupKey)) errors.push(`${rowId}: duplicate tagGroupKey "${tagGroupKey}"`);
    seenGroups.add(tagGroupKey);
    const tagGroupName = structureString(group.tagGroupName || group.name || group.label);
    if (!tagGroupName) errors.push(`${rowId}: tagGroupName is required`);
    const tagRows = Array.isArray(group.tags) ? group.tags : [];
    if (!tagRows.length) errors.push(`${rowId}: tags must contain at least one tag`);
    const tags = tagRows.map((tag, tagIndex) => {
      const tagId = `${rowId} tag ${tagIndex + 1}`;
      const key = structureString(tag?.key);
      const name = structureString(tag?.name || tag?.label);
      if (!STRUCTURE_TAG_KEY_RE.test(key)) errors.push(`${tagId}: invalid key "${key}"`);
      if (!name) errors.push(`${tagId}: name is required`);
      if (seenTags.has(key)) errors.push(`${tagId}: duplicate tag key "${key}"`);
      seenTags.add(key);
      return {
        key,
        name: name || key,
        keywords: structureStringArray(tag?.keywords),
        order: structureOrder(tag?.order ?? tag?.sortOrder, (tagIndex + 1) * 10)
      };
    });
    tagGroups.push({
      tagGroupKey,
      tagGroupName: tagGroupName || tagGroupKey,
      order: structureOrder(group.order ?? group.sortOrder, (index + 1) * 10),
      keywords: structureStringArray(group.keywords),
      tags
    });
  });
  if (!tagGroups.length) errors.push("tags payload must contain at least one tag group");
  return { tagGroups, errors };
}
__name(prepareBusinessTagsPayload, "prepareBusinessTagsPayload");
function deriveBusinessTagsProjection(prepared) {
  return {
    version: "v1",
    publishedAt: doNowIso(),
    tagGroups: prepared.tagGroups.slice().sort((a, b) => a.order - b.order || a.tagGroupKey.localeCompare(b.tagGroupKey)).map((group) => ({
      tagGroupKey: group.tagGroupKey,
      tagGroupName: group.tagGroupName,
      order: group.order,
      keywords: group.keywords,
      tags: group.tags.slice().sort((a, b) => a.order - b.order || a.key.localeCompare(b.key)).map((tag) => ({
        key: tag.key,
        name: tag.name,
        order: tag.order,
        keywords: tag.keywords
      }))
    }))
  };
}
__name(deriveBusinessTagsProjection, "deriveBusinessTagsProjection");
async function handleStructureBusinessTagsRead(env) {
  const rawProjection = await env.KV_STRUCTURE.get(STRUCTURE_BUSINESS_TAGS_KEY, { type: "json" });
  return json(
    sanitizeStructureBusinessTagsProjection(rawProjection),
    200,
    { "cache-control": "no-store" }
  );
}
__name(handleStructureBusinessTagsRead, "handleStructureBusinessTagsRead");
async function handleStructureTagsPublish(req, env) {
  const parsed = await parseTaxonomyJsonBody(req);
  if (parsed.ok === false) return parsed.response;
  const prepared = prepareBusinessTagsPayload(parsed.payload);
  if (prepared.errors.length) {
    return json(
      { error: { code: "validation_failed", message: "tags validation failed", details: prepared.errors } },
      400,
      { "cache-control": "no-store" }
    );
  }
  const projection = sanitizeStructureBusinessTagsProjection(deriveBusinessTagsProjection(prepared));
  const manifest = {
    activeVersion: "business-tags:v1",
    publishedAt: doNowIso(),
    publishedBy: "admin",
    source: structureString(parsed.payload?.source || parsed.payload?.metadata?.source) || "repo-tags-json",
    count: prepared.tagGroups.reduce((sum, group) => sum + group.tags.length, 0)
  };
  await env.KV_STRUCTURE.put(STRUCTURE_BUSINESS_TAGS_KEY, JSON.stringify(projection));
  await env.KV_STRUCTURE.put(STRUCTURE_BUSINESS_TAGS_MANIFEST_KEY, JSON.stringify(manifest));
  return json(
    {
      ok: true,
      key: STRUCTURE_BUSINESS_TAGS_KEY,
      manifest,
      tagGroupCount: prepared.tagGroups.length,
      tagCount: manifest.count
    },
    200,
    { "cache-control": "no-store" }
  );
}
__name(handleStructureTagsPublish, "handleStructureTagsPublish");
async function readBusinessTagKeySet(env) {
  const rawProjection = await env.KV_STRUCTURE.get(STRUCTURE_BUSINESS_TAGS_KEY, { type: "json" });
  const projection = sanitizeStructureBusinessTagsProjection(rawProjection);
  const keys = /* @__PURE__ */ new Set();
  for (const group of Array.isArray(projection.tagGroups) ? projection.tagGroups : []) {
    for (const tag of Array.isArray(group?.tags) ? group.tags : []) {
      const key = structureString(tag?.key);
      if (STRUCTURE_TAG_KEY_RE.test(key)) keys.add(key);
    }
  }
  return keys;
}
__name(readBusinessTagKeySet, "readBusinessTagKeySet");
async function validateBusinessTagKeys(env, rawTags) {
  if (rawTags === void 0 || rawTags === null) return { ok: true, tags: [] };
  const tags = Array.isArray(rawTags) ? uniqueTrimmedStrings(rawTags) : uniqueTrimmedStrings(String(rawTags || "").split(/[;,]/));
  if (!tags.length) return { ok: true, tags: [] };
  const allowed = await readBusinessTagKeySet(env);
  const unknown = tags.filter((key) => !allowed.has(key));
  if (unknown.length) return { ok: false, unknown };
  return { ok: true, tags };
}
__name(validateBusinessTagKeys, "validateBusinessTagKeys");
async function handleStructureManifestRead(env) {
  return json(await readStructureManifest(env), 200, { "cache-control": "no-store" });
}
__name(handleStructureManifestRead, "handleStructureManifestRead");
function prepareStructurePayload(payload) {
  const inputRows = structureInputRows(payload);
  if (!inputRows) return { rows: [], errors: ["structure payload must be an array or contain rows/groups/structure array"] };
  const errors = [];
  const rows = [];
  const seenGroups = /* @__PURE__ */ new Set();
  inputRows.forEach((row, index) => {
    const rowId = `row ${index + 1}`;
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      errors.push(`${rowId}: row must be an object`);
      return;
    }
    const groupKey = structureString(row.groupKey);
    if (!STRUCTURE_GROUP_KEY_RE.test(groupKey)) {
      errors.push(`${rowId}: invalid groupKey "${groupKey}"`);
      return;
    }
    if (seenGroups.has(groupKey)) errors.push(`${rowId}: duplicate groupKey "${groupKey}"`);
    seenGroups.add(groupKey);
    const groupName = structureString(row.groupName || row.label || row.name);
    if (!groupName) errors.push(`${rowId}: groupName is required`);
    const subgroupRows = Array.isArray(row.subgroups) ? row.subgroups : [];
    if (!subgroupRows.length) errors.push(`${rowId}: subgroups must contain at least one subgroup`);
    const seenSubgroupsInGroup = /* @__PURE__ */ new Set();
    const subgroups = subgroupRows.map((subgroup, subgroupIndex) => {
      const subgroupId = `${rowId} subgroup ${subgroupIndex + 1}`;
      const key = structureString(subgroup?.key);
      const name = structureString(subgroup?.name || subgroup?.label);
      if (!STRUCTURE_SUBGROUP_KEY_RE.test(key)) errors.push(`${subgroupId}: invalid key "${key}"`);
      if (!name) errors.push(`${subgroupId}: name is required`);
      if (seenSubgroupsInGroup.has(key)) errors.push(`${subgroupId}: duplicate subgroup key "${key}" inside "${groupKey}"`);
      seenSubgroupsInGroup.add(key);
      return {
        key,
        name: name || key,
        keywords: structureStringArray(subgroup?.keywords),
        order: structureOrder(subgroup?.order ?? subgroup?.sortOrder, (subgroupIndex + 1) * 10)
      };
    });
    const fallbackSubgroupKey = structureString(row.fallbackSubgroupKey);
    if (fallbackSubgroupKey && !seenSubgroupsInGroup.has(fallbackSubgroupKey)) {
      errors.push(`${rowId}: fallbackSubgroupKey "${fallbackSubgroupKey}" is not a subgroup in "${groupKey}"`);
    }
    rows.push({
      groupKey,
      groupName: groupName || groupKey,
      groupKeywords: structureStringArray(row.groupKeywords || row.keywords),
      fallbackSubgroupKey,
      order: structureOrder(row.order ?? row.sortOrder, (index + 1) * 10),
      subgroups
    });
  });
  if (!rows.length) errors.push("structure must contain at least one group");
  return { rows, errors };
}
__name(prepareStructurePayload, "prepareStructurePayload");
function deriveStructureBusinessCategoriesProjection(rows, manifest) {
  return {
    version: manifest.activeVersion,
    publishedAt: manifest.publishedAt,
    groups: rows.slice().sort((a, b) => a.order - b.order || a.groupKey.localeCompare(b.groupKey)).map((group) => ({
      groupKey: group.groupKey,
      groupName: group.groupName,
      order: group.order,
      groupKeywords: group.groupKeywords,
      fallbackSubgroupKey: group.fallbackSubgroupKey,
      subgroups: group.subgroups.slice().sort((a, b) => a.order - b.order || a.key.localeCompare(b.key)).map((subgroup) => ({
        key: subgroup.key,
        name: subgroup.name,
        order: subgroup.order,
        keywords: subgroup.keywords
      }))
    }))
  };
}
__name(deriveStructureBusinessCategoriesProjection, "deriveStructureBusinessCategoriesProjection");
async function writePreparedStructureVersion(env, prepared, manifest, opts = {}) {
  const activePayload = { version: manifest.activeVersion, publishedAt: manifest.publishedAt, source: manifest.source, rows: prepared.rows };
  const projection = sanitizeStructureBusinessCategoriesProjection(deriveStructureBusinessCategoriesProjection(prepared.rows, manifest), manifest);
  const versionPayload = { manifest, rows: prepared.rows };
  if (opts.persistVersion !== false) {
    await env.KV_STRUCTURE.put(`${STRUCTURE_VERSION_PREFIX}${manifest.activeVersion}`, JSON.stringify(versionPayload));
  }
  await env.KV_STRUCTURE.put(STRUCTURE_ACTIVE_KEY, JSON.stringify(activePayload));
  await env.KV_STRUCTURE.put(STRUCTURE_BUSINESS_CATEGORIES_KEY, JSON.stringify(projection));
  await env.KV_STRUCTURE.put(STRUCTURE_MANIFEST_KEY, JSON.stringify(manifest));
}
__name(writePreparedStructureVersion, "writePreparedStructureVersion");
async function handleStructurePublish(req, env) {
  const parsed = await parseTaxonomyJsonBody(req);
  if (parsed.ok === false) return parsed.response;
  const prepared = prepareStructurePayload(parsed.payload);
  if (prepared.errors.length) {
    return json({ error: { code: "validation_failed", message: "structure validation failed", details: prepared.errors } }, 400, { "cache-control": "no-store" });
  }
  const checksum = await taxonomyChecksumHex(stableTaxonomyJson({ rows: prepared.rows }));
  const now = /* @__PURE__ */ new Date();
  const manifest = {
    activeVersion: `${taxonomyVersionStamp(now)}-${checksum.slice(0, 6)}`,
    publishedAt: now.toISOString(),
    publishedBy: readAdminPublisher(req),
    source: structureString(parsed.payload?.source || parsed.payload?.metadata?.source) || "structure-json-export",
    checksum,
    count: prepared.rows.length
  };
  await writePreparedStructureVersion(env, prepared, manifest);
  return json(manifest, 200, { "cache-control": "no-store" });
}
__name(handleStructurePublish, "handleStructurePublish");
async function handleStructureActivateVersion(req, env) {
  const parsed = await parseTaxonomyJsonBody(req);
  if (parsed.ok === false) return parsed.response;
  const versionId = structureString(parsed.payload?.versionId);
  if (!versionId || !STRUCTURE_VERSION_RE.test(versionId)) {
    return json({ error: { code: "invalid_version", message: "versionId is required" } }, 400, { "cache-control": "no-store" });
  }
  const versionRecord = await env.KV_STRUCTURE.get(`${STRUCTURE_VERSION_PREFIX}${versionId}`, { type: "json" });
  if (!versionRecord) {
    return json({ error: { code: "not_found", message: "structure version not found" } }, 404, { "cache-control": "no-store" });
  }
  const prepared = prepareStructurePayload({ rows: versionRecord.rows });
  if (prepared.errors.length) {
    return json({ error: { code: "validation_failed", message: "stored structure version is invalid", details: prepared.errors } }, 409, { "cache-control": "no-store" });
  }
  const now = /* @__PURE__ */ new Date();
  const checksum = structureString(versionRecord?.manifest?.checksum) || await taxonomyChecksumHex(stableTaxonomyJson({ rows: prepared.rows }));
  const manifest = {
    activeVersion: versionId,
    publishedAt: now.toISOString(),
    publishedBy: readAdminPublisher(req),
    source: structureString(versionRecord?.manifest?.source) || "activate-version",
    checksum,
    count: prepared.rows.length
  };
  await writePreparedStructureVersion(env, prepared, manifest, { persistVersion: false });
  return json(manifest, 200, { "cache-control": "no-store" });
}
__name(handleStructureActivateVersion, "handleStructureActivateVersion");
var CONTEXTS_ACTIVE_KEY = "contexts:active";
var CONTEXTS_VERSION_PREFIX = "contexts:version:";
var CONTEXTS_MANIFEST_KEY = "contexts:manifest";
var CONTEXTS_ALIASES_KEY = "contexts:aliases";
var CONTEXTS_BUSINESS_TAXONOMY_KEY = "contexts:business-taxonomy";
var CONTEXT_TAXONOMY_KEY_RE = /^[a-z0-9][a-z0-9-]*(?:\/[a-z0-9][a-z0-9-]*)*$/;
function emptyContextsManifest() {
  return {
    activeVersion: "unpublished",
    publishedAt: "",
    publishedBy: "",
    source: "",
    checksum: "",
    count: 0
  };
}
__name(emptyContextsManifest, "emptyContextsManifest");
function taxonomyString(value) {
  return String(value || "").trim();
}
__name(taxonomyString, "taxonomyString");
function taxonomyLabel(value, fallback = "") {
  if (typeof value === "string") return value.trim() || fallback;
  if (value && typeof value === "object") {
    const obj = value;
    const picked = taxonomyString(obj.en || obj.hu || Object.values(obj)[0]);
    return picked || fallback;
  }
  return fallback;
}
__name(taxonomyLabel, "taxonomyLabel");
function taxonomyOrder(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}
__name(taxonomyOrder, "taxonomyOrder");
function taxonomyStringArray(value) {
  const vals = Array.isArray(value) ? value : String(value || "").split(";");
  return uniqueTrimmedStrings(vals);
}
__name(taxonomyStringArray, "taxonomyStringArray");
function isExplicitTaxonomyFalse(value) {
  return value === false || String(value || "").trim().toLowerCase() === "false";
}
__name(isExplicitTaxonomyFalse, "isExplicitTaxonomyFalse");
function isValidTaxonomyKey(value) {
  return CONTEXT_TAXONOMY_KEY_RE.test(value);
}
__name(isValidTaxonomyKey, "isValidTaxonomyKey");
function sanitizeBusinessTaxonomyContextRow(row) {
  if (!row || typeof row !== "object" || Array.isArray(row)) return null;
  if (isExplicitTaxonomyFalse(row.boSelectable) || isExplicitTaxonomyFalse(row.publicContext) || isExplicitTaxonomyFalse(row.published)) return null;
  const key = taxonomyString(row.key);
  if (!key || !isValidTaxonomyKey(key)) return null;
  const out = {
    key,
    label: taxonomyLabel(row.label, key),
    order: taxonomyOrder(row.order)
  };
  const groupKey = taxonomyString(row.groupKey);
  if (groupKey && isValidTaxonomyKey(groupKey)) out.groupKey = groupKey;
  const subgroupKey = taxonomyString(row.subgroupKey);
  if (subgroupKey && isValidTaxonomyKey(subgroupKey)) out.subgroupKey = subgroupKey;
  const pageKey = taxonomyString(row.pageKey);
  if (pageKey) out.pageKey = pageKey;
  const defaultView = taxonomyString(row.defaultView);
  if (defaultView) out.defaultView = defaultView;
  const subgroupMode = taxonomyString(row.subgroupMode);
  if (subgroupMode) out.subgroupMode = subgroupMode;
  const viewOptions = taxonomyString(row.viewOptions);
  if (viewOptions) out.viewOptions = viewOptions;
  const keywords = taxonomyStringArray(row.keywords);
  if (keywords.length) out.keywords = keywords;
  return out;
}
__name(sanitizeBusinessTaxonomyContextRow, "sanitizeBusinessTaxonomyContextRow");
function taxonomySlugLabel(value) {
  return taxonomyString(value).split("-").filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}
__name(taxonomySlugLabel, "taxonomySlugLabel");
function businessTaxonomyLocationKeyFromContextKey(key) {
  const parts = taxonomyString(key).split("/").filter(Boolean);
  if (parts.length < 2) return null;
  const countryKey = parts[1] || "";
  const cityKey = parts[2] || "";
  if (!countryKey) return null;
  const countryLabel = taxonomySlugLabel(countryKey);
  const cityLabel = cityKey ? taxonomySlugLabel(cityKey) : "";
  const locationKey = cityKey ? `${countryKey}/${cityKey}` : countryKey;
  return {
    key: locationKey,
    countryKey,
    countryLabel,
    cityKey,
    cityLabel,
    label: cityLabel ? `${countryLabel} \xB7 ${cityLabel}` : countryLabel
  };
}
__name(businessTaxonomyLocationKeyFromContextKey, "businessTaxonomyLocationKeyFromContextKey");
function businessTaxonomyLocationsFromContexts(contexts) {
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (const row of Array.isArray(contexts) ? contexts : []) {
    const loc = businessTaxonomyLocationKeyFromContextKey(taxonomyString(row?.key));
    if (!loc || seen.has(loc.key)) continue;
    seen.add(loc.key);
    out.push(loc);
  }
  return out.sort((a, b) => taxonomyString(a.label).localeCompare(taxonomyString(b.label), void 0, { sensitivity: "base" }));
}
__name(businessTaxonomyLocationsFromContexts, "businessTaxonomyLocationsFromContexts");
function sanitizeBusinessTaxonomyLocationRow(row) {
  if (!row || typeof row !== "object" || Array.isArray(row)) return null;
  const key = taxonomyString(row.key);
  const countryKey = taxonomyString(row.countryKey);
  const cityKey = taxonomyString(row.cityKey);
  if (!key || !countryKey || !isValidTaxonomyKey(key) || !isValidTaxonomyKey(countryKey)) return null;
  if (cityKey && !isValidTaxonomyKey(cityKey)) return null;
  const countryLabel = taxonomyLabel(row.countryLabel, taxonomySlugLabel(countryKey));
  const cityLabel = cityKey ? taxonomyLabel(row.cityLabel, taxonomySlugLabel(cityKey)) : "";
  const label = taxonomyLabel(row.label, cityLabel ? `${countryLabel} \xB7 ${cityLabel}` : countryLabel);
  return { key, countryKey, countryLabel, cityKey, cityLabel, label };
}
__name(sanitizeBusinessTaxonomyLocationRow, "sanitizeBusinessTaxonomyLocationRow");
function sanitizeContextsManifest(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return emptyContextsManifest();
  return {
    activeVersion: taxonomyString(raw.activeVersion) || "unpublished",
    publishedAt: taxonomyString(raw.publishedAt),
    publishedBy: taxonomyString(raw.publishedBy),
    source: taxonomyString(raw.source),
    checksum: taxonomyString(raw.checksum),
    count: Number.isFinite(Number(raw.count)) ? Number(raw.count) : 0
  };
}
__name(sanitizeContextsManifest, "sanitizeContextsManifest");
function sanitizeBusinessTaxonomyProjection(raw, manifest) {
  const src = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const contexts = Array.isArray(src.contexts) ? src.contexts.map(sanitizeBusinessTaxonomyContextRow).filter(Boolean) : [];
  const locations = Array.isArray(src.locations) ? src.locations.map(sanitizeBusinessTaxonomyLocationRow).filter(Boolean) : businessTaxonomyLocationsFromContexts(contexts);
  return {
    version: taxonomyString(src.version) || manifest.activeVersion || "unpublished",
    publishedAt: taxonomyString(src.publishedAt) || manifest.publishedAt || "",
    groups: [],
    contexts,
    locations
  };
}
__name(sanitizeBusinessTaxonomyProjection, "sanitizeBusinessTaxonomyProjection");
async function readContextsManifest(env) {
  const raw = await env.KV_CONTEXTS.get(CONTEXTS_MANIFEST_KEY, { type: "json" });
  return sanitizeContextsManifest(raw);
}
__name(readContextsManifest, "readContextsManifest");
async function handleBusinessTaxonomyRead(env) {
  const [rawProjection, manifest] = await Promise.all([
    env.KV_CONTEXTS.get(CONTEXTS_BUSINESS_TAXONOMY_KEY, { type: "json" }),
    readContextsManifest(env)
  ]);
  return json(
    sanitizeBusinessTaxonomyProjection(rawProjection, manifest),
    200,
    { "cache-control": "no-store" }
  );
}
__name(handleBusinessTaxonomyRead, "handleBusinessTaxonomyRead");
async function handleContextsManifestRead(env) {
  return json(await readContextsManifest(env), 200, { "cache-control": "no-store" });
}
__name(handleContextsManifestRead, "handleContextsManifestRead");
var CONTEXT_TAXONOMY_VERSION_RE = /^\d{4}-?\d{2}-?\d{2}T\d{6}Z-[a-f0-9]{6,64}$/i;
function parseTaxonomyBoolean(value, fallback) {
  if (value === void 0 || value === null || value === "") return { value: fallback, ok: true };
  if (typeof value === "boolean") return { value, ok: true };
  const s = String(value || "").trim().toLowerCase();
  if (["true", "yes", "y", "1"].includes(s)) return { value: true, ok: true };
  if (["false", "no", "n", "0"].includes(s)) return { value: false, ok: true };
  return { value: fallback, ok: false };
}
__name(parseTaxonomyBoolean, "parseTaxonomyBoolean");
function taxonomyInputRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return null;
  if (Array.isArray(payload.rows)) return payload.rows;
  if (Array.isArray(payload.taxonomy)) return payload.taxonomy;
  if (Array.isArray(payload.contexts)) return payload.contexts;
  return null;
}
__name(taxonomyInputRows, "taxonomyInputRows");
function derivedParentKey(key) {
  const idx = key.lastIndexOf("/");
  return idx > 0 ? key.slice(0, idx) : "";
}
__name(derivedParentKey, "derivedParentKey");
function firstContextSegment(key) {
  return taxonomyString(key).split("/")[0] || "";
}
__name(firstContextSegment, "firstContextSegment");
function taxonomyLabelsObject(raw, errors, rowId) {
  const out = {};
  if (raw === void 0 || raw === null || raw === "") return out;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    errors.push(`${rowId}: labels/titles must be an object when provided`);
    return out;
  }
  for (const [langRaw, labelRaw] of Object.entries(raw)) {
    const lang = taxonomyString(langRaw).toLowerCase();
    const label = taxonomyString(labelRaw);
    if (!/^[a-z]{2,8}(?:-[a-z0-9]{2,8})?$/i.test(lang)) errors.push(`${rowId}: invalid label language "${langRaw}"`);
    else if (!label) errors.push(`${rowId}: empty label for language "${lang}"`);
    else out[lang] = label;
  }
  return out;
}
__name(taxonomyLabelsObject, "taxonomyLabelsObject");
function isPublicTaxonomyRow(row) {
  return row.published && row.boSelectable && row.publicContext;
}
__name(isPublicTaxonomyRow, "isPublicTaxonomyRow");
function prepareContextTaxonomyPayload(payload) {
  const inputRows = taxonomyInputRows(payload);
  if (!inputRows) return { rows: [], aliases: {}, errors: ["taxonomy payload must be an array or contain rows/taxonomy/contexts array"] };
  const errors = [];
  const rows = [];
  const seenKeys = /* @__PURE__ */ new Set();
  inputRows.forEach((row, index) => {
    const rowId = `row ${index + 1}`;
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      errors.push(`${rowId}: row must be an object`);
      return;
    }
    const key = taxonomyString(row.key);
    if (!key || !isValidTaxonomyKey(key)) {
      errors.push(`${rowId}: invalid key`);
      return;
    }
    if (seenKeys.has(key)) errors.push(`${rowId}: duplicate key "${key}"`);
    seenKeys.add(key);
    const inferredParent = derivedParentKey(key);
    const parentKey = taxonomyString(row.parentKey) || inferredParent;
    if (parentKey && !isValidTaxonomyKey(parentKey)) errors.push(`${rowId}: invalid parentKey "${parentKey}"`);
    if (row.parentKey && inferredParent && taxonomyString(row.parentKey) !== inferredParent) {
      errors.push(`${rowId}: parentKey must be "${inferredParent}" for key "${key}"`);
    }
    const groupKey = taxonomyString(row.groupKey) || firstContextSegment(key);
    const subgroupKey = taxonomyString(row.subgroupKey) || key;
    if (!groupKey || !isValidTaxonomyKey(groupKey)) errors.push(`${rowId}: invalid groupKey "${groupKey}"`);
    if (!subgroupKey || !isValidTaxonomyKey(subgroupKey)) errors.push(`${rowId}: invalid subgroupKey "${subgroupKey}"`);
    if (groupKey && subgroupKey && subgroupKey !== groupKey && !subgroupKey.startsWith(`${groupKey}/`)) {
      errors.push(`${rowId}: subgroupKey "${subgroupKey}" is not under groupKey "${groupKey}"`);
    }
    const labels = taxonomyLabelsObject(row.labels ?? row.localizedLabels ?? row.titles, errors, rowId);
    const label = taxonomyLabel(row.label, "") || taxonomyString(labels.en) || taxonomyString(Object.values(labels)[0]) || taxonomyLabel(row.title, "") || key;
    const order = Number(row.order ?? row.sortOrder ?? row.displayOrder ?? (index + 1) * 10);
    if (!Number.isFinite(order)) errors.push(`${rowId}: order must be numeric`);
    const boSelectable = parseTaxonomyBoolean(row.boSelectable, true);
    const publicContext = parseTaxonomyBoolean(row.publicContext, true);
    const publishedFlag = parseTaxonomyBoolean(row.published ?? row.isPublished, true);
    const unpublishedFlag = parseTaxonomyBoolean(row.unpublished, false);
    if (!boSelectable.ok) errors.push(`${rowId}: boSelectable must be boolean`);
    if (!publicContext.ok) errors.push(`${rowId}: publicContext must be boolean`);
    if (!publishedFlag.ok) errors.push(`${rowId}: published must be boolean when provided`);
    if (!unpublishedFlag.ok) errors.push(`${rowId}: unpublished must be boolean when provided`);
    const status = taxonomyString(row.status).toLowerCase();
    const statusPublished = ["draft", "unpublished", "disabled", "archived"].includes(status) ? false : publishedFlag.value;
    rows.push({
      key,
      label,
      labels,
      parentKey,
      groupKey,
      subgroupKey,
      boSelectable: boSelectable.value,
      publicContext: publicContext.value,
      published: unpublishedFlag.value ? false : statusPublished,
      order: Number.isFinite(order) ? order : (index + 1) * 10,
      keywords: taxonomyStringArray(row.keywords),
      aliases: taxonomyStringArray(row.aliases),
      pageKey: taxonomyString(row.pageKey),
      defaultView: taxonomyString(row.defaultView),
      subgroupMode: taxonomyString(row.subgroupMode),
      viewOptions: taxonomyString(row.viewOptions)
    });
  });
  const byKey = /* @__PURE__ */ new Map();
  for (const row of rows) byKey.set(row.key, row);
  const aliases = {};
  const seenAliases = /* @__PURE__ */ new Map();
  const seenGroupSubgroups = /* @__PURE__ */ new Map();
  let publicRowCount = 0;
  for (const row of rows) {
    if (row.parentKey && !byKey.has(row.parentKey)) errors.push(`${row.key}: parentKey "${row.parentKey}" does not exist`);
    if (!byKey.has(row.groupKey)) errors.push(`${row.key}: groupKey "${row.groupKey}" does not exist`);
    if (!byKey.has(row.subgroupKey)) errors.push(`${row.key}: subgroupKey "${row.subgroupKey}" does not exist`);
    if (isPublicTaxonomyRow(row)) {
      publicRowCount += 1;
      const groupRow = byKey.get(row.groupKey);
      const subgroupRow = byKey.get(row.subgroupKey);
      if (!groupRow || !isPublicTaxonomyRow(groupRow)) errors.push(`${row.key}: public row uses non-public groupKey "${row.groupKey}"`);
      if (!subgroupRow || !isPublicTaxonomyRow(subgroupRow)) errors.push(`${row.key}: public row uses non-public subgroupKey "${row.subgroupKey}"`);
      const combo = `${row.groupKey}\0${row.subgroupKey}`;
      const previous = seenGroupSubgroups.get(combo);
      if (previous && previous !== row.key) errors.push(`${row.key}: duplicate group/subgroup combination already used by "${previous}"`);
      else seenGroupSubgroups.set(combo, row.key);
    }
    for (const alias of row.aliases) {
      const normalizedAlias = alias.toLowerCase();
      const previous = seenAliases.get(normalizedAlias);
      if (previous && previous !== row.key) errors.push(`${row.key}: duplicate alias "${alias}" already used by "${previous}"`);
      else {
        seenAliases.set(normalizedAlias, row.key);
        aliases[alias] = row.key;
      }
    }
  }
  if (!publicRowCount) errors.push("taxonomy must contain at least one published BO-selectable public context");
  return { rows, aliases, errors };
}
__name(prepareContextTaxonomyPayload, "prepareContextTaxonomyPayload");
function taxonomyTitleFromKey(key) {
  const tail = taxonomyString(key).split("/").filter(Boolean).pop() || key;
  return tail.split("-").filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}
__name(taxonomyTitleFromKey, "taxonomyTitleFromKey");
function contextChainForSubgroup(subgroupKey, publicKeys) {
  const parts = taxonomyString(subgroupKey).split("/").filter(Boolean);
  const chain = [];
  for (let i = 0; i < parts.length; i++) {
    const candidate = parts.slice(0, i + 1).join("/");
    if (publicKeys.has(candidate)) chain.push(candidate);
  }
  return uniqueTrimmedStrings(chain);
}
__name(contextChainForSubgroup, "contextChainForSubgroup");
function deriveBusinessTaxonomyProjection(rows, manifest) {
  const publicRows = rows.filter(isPublicTaxonomyRow).sort((a, b) => a.order - b.order || a.key.localeCompare(b.key));
  const byKey = new Map(publicRows.map((row) => [row.key, row]));
  const publicKeys = new Set(publicRows.map((row) => row.key));
  const groupMap = /* @__PURE__ */ new Map();
  for (const row of publicRows) {
    const groupRow = byKey.get(row.groupKey);
    const groupLabel = groupRow?.label || taxonomyTitleFromKey(row.groupKey);
    const groupOrder = Number.isFinite(groupRow?.order) ? Number(groupRow?.order) : row.order;
    let group = groupMap.get(row.groupKey);
    if (!group) {
      group = { key: row.groupKey, label: groupLabel, order: groupOrder, subgroups: /* @__PURE__ */ new Map() };
      groupMap.set(row.groupKey, group);
    }
    const subgroupRow = byKey.get(row.subgroupKey);
    if (!group.subgroups.has(row.subgroupKey)) {
      group.subgroups.set(row.subgroupKey, {
        key: row.subgroupKey,
        label: subgroupRow?.label || row.label || `${group.label} \xB7 ${taxonomyTitleFromKey(row.subgroupKey)}`,
        order: Number.isFinite(subgroupRow?.order) ? Number(subgroupRow?.order) : row.order,
        contexts: contextChainForSubgroup(row.subgroupKey, publicKeys)
      });
    }
  }
  return {
    version: manifest.activeVersion,
    publishedAt: manifest.publishedAt,
    groups: Array.from(groupMap.values()).sort((a, b) => a.order - b.order || a.key.localeCompare(b.key)).map((group) => ({
      key: group.key,
      label: group.label,
      order: group.order,
      subgroups: Array.from(group.subgroups.values()).sort((a, b) => a.order - b.order || a.key.localeCompare(b.key))
    })),
    contexts: publicRows.map((row) => {
      const out = { key: row.key, label: row.label, groupKey: row.groupKey, subgroupKey: row.subgroupKey, order: row.order };
      if (row.pageKey) out.pageKey = row.pageKey;
      if (row.defaultView) out.defaultView = row.defaultView;
      if (row.subgroupMode) out.subgroupMode = row.subgroupMode;
      if (row.viewOptions) out.viewOptions = row.viewOptions;
      if (row.keywords.length) out.keywords = row.keywords;
      return out;
    })
  };
}
__name(deriveBusinessTaxonomyProjection, "deriveBusinessTaxonomyProjection");
function stableTaxonomyJson(value) {
  if (value === null || typeof value !== "object") {
    const scalar = JSON.stringify(value);
    return typeof scalar === "string" ? scalar : "null";
  }
  if (Array.isArray(value)) return `[${value.map(stableTaxonomyJson).join(",")}]`;
  const obj = value;
  return `{${Object.keys(obj).sort().map((key) => `${JSON.stringify(key)}:${stableTaxonomyJson(obj[key])}`).join(",")}}`;
}
__name(stableTaxonomyJson, "stableTaxonomyJson");
async function taxonomyChecksumHex(text) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(taxonomyChecksumHex, "taxonomyChecksumHex");
function taxonomyVersionStamp(date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}
__name(taxonomyVersionStamp, "taxonomyVersionStamp");
function readAdminPublisher(req) {
  return taxonomyString(req.headers.get("X-NG-Admin") || req.headers.get("X-Admin-User")) || "admin";
}
__name(readAdminPublisher, "readAdminPublisher");
async function parseTaxonomyJsonBody(req) {
  try {
    return { ok: true, payload: await req.json() };
  } catch {
    return {
      ok: false,
      response: json({ error: { code: "invalid_json", message: "request body must be valid JSON" } }, 400, { "cache-control": "no-store" })
    };
  }
}
__name(parseTaxonomyJsonBody, "parseTaxonomyJsonBody");
async function writePreparedTaxonomyVersion(env, prepared, manifest, opts = {}) {
  const activePayload = { version: manifest.activeVersion, publishedAt: manifest.publishedAt, source: manifest.source, rows: prepared.rows };
  const projection = sanitizeBusinessTaxonomyProjection(deriveBusinessTaxonomyProjection(prepared.rows, manifest), manifest);
  const versionPayload = { manifest, rows: prepared.rows };
  if (opts.persistVersion !== false) {
    await env.KV_CONTEXTS.put(`${CONTEXTS_VERSION_PREFIX}${manifest.activeVersion}`, JSON.stringify(versionPayload));
  }
  await env.KV_CONTEXTS.put(CONTEXTS_ACTIVE_KEY, JSON.stringify(activePayload));
  await env.KV_CONTEXTS.put(CONTEXTS_ALIASES_KEY, JSON.stringify(prepared.aliases));
  await env.KV_CONTEXTS.put(CONTEXTS_BUSINESS_TAXONOMY_KEY, JSON.stringify(projection));
  await env.KV_CONTEXTS.put(CONTEXTS_MANIFEST_KEY, JSON.stringify(manifest));
}
__name(writePreparedTaxonomyVersion, "writePreparedTaxonomyVersion");
async function handleContextsPublish(req, env) {
  const parsed = await parseTaxonomyJsonBody(req);
  if (parsed.ok === false) return parsed.response;
  const prepared = prepareContextTaxonomyPayload(parsed.payload);
  if (prepared.errors.length) {
    return json({ error: { code: "validation_failed", message: "taxonomy validation failed", details: prepared.errors } }, 400, { "cache-control": "no-store" });
  }
  const checksum = await taxonomyChecksumHex(stableTaxonomyJson({ rows: prepared.rows }));
  const now = /* @__PURE__ */ new Date();
  const manifest = {
    activeVersion: `${taxonomyVersionStamp(now)}-${checksum.slice(0, 6)}`,
    publishedAt: now.toISOString(),
    publishedBy: readAdminPublisher(req),
    source: taxonomyString(parsed.payload?.source || parsed.payload?.metadata?.source) || "google-sheets-export",
    checksum,
    count: prepared.rows.length
  };
  await writePreparedTaxonomyVersion(env, prepared, manifest);
  return json(manifest, 200, { "cache-control": "no-store" });
}
__name(handleContextsPublish, "handleContextsPublish");
async function handleContextsActivateVersion(req, env) {
  const parsed = await parseTaxonomyJsonBody(req);
  if (parsed.ok === false) return parsed.response;
  const versionId = taxonomyString(parsed.payload?.versionId);
  if (!versionId || !CONTEXT_TAXONOMY_VERSION_RE.test(versionId)) {
    return json({ error: { code: "invalid_version", message: "versionId is required" } }, 400, { "cache-control": "no-store" });
  }
  const versionRecord = await env.KV_CONTEXTS.get(`${CONTEXTS_VERSION_PREFIX}${versionId}`, { type: "json" });
  if (!versionRecord) {
    return json({ error: { code: "not_found", message: "taxonomy version not found" } }, 404, { "cache-control": "no-store" });
  }
  const prepared = prepareContextTaxonomyPayload({ rows: versionRecord.rows });
  if (prepared.errors.length) {
    return json({ error: { code: "validation_failed", message: "stored taxonomy version is invalid", details: prepared.errors } }, 409, { "cache-control": "no-store" });
  }
  const now = /* @__PURE__ */ new Date();
  const checksum = taxonomyString(versionRecord?.manifest?.checksum) || await taxonomyChecksumHex(stableTaxonomyJson({ rows: prepared.rows }));
  const manifest = {
    activeVersion: versionId,
    publishedAt: now.toISOString(),
    publishedBy: readAdminPublisher(req),
    source: taxonomyString(versionRecord?.manifest?.source) || "activate-version",
    checksum,
    count: prepared.rows.length
  };
  await writePreparedTaxonomyVersion(env, prepared, manifest, { persistVersion: false });
  return json(manifest, 200, { "cache-control": "no-store" });
}
__name(handleContextsActivateVersion, "handleContextsActivateVersion");
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
    const id = String(ulid || "").trim();
    if (!ULID_RE.test(id)) return null;
    const own = await env.KV_STATUS.get(`ownership:${id}`, { type: "json" });
    const ownershipExpIso = String(own?.exclusiveUntil || "").trim();
    const ownershipExp = ownershipExpIso ? new Date(ownershipExpIso) : null;
    if (!ownershipExp || Number.isNaN(ownershipExp.getTime()) || ownershipExp.getTime() <= nowMs) return null;
    const paymentIntentId = String(own?.lastEventId || "").trim();
    if (!paymentIntentId || !/^pi_/i.test(paymentIntentId)) return null;
    const planRaw = await env.KV_STATUS.get(`plan:${paymentIntentId}`, { type: "json" });
    const plan = normalizePersistedPlanRecord(planRaw, ownershipExp.toISOString());
    if (!plan) return null;
    const planExp = new Date(plan.expiresAt);
    if (!planExp || Number.isNaN(planExp.getTime()) || planExp.getTime() <= nowMs) return null;
    if (planExp.getTime() !== ownershipExp.getTime()) return null;
    const alloc = await env.KV_STATUS.get(planAllocKey(paymentIntentId), { type: "json" });
    if (alloc && typeof alloc === "object") {
      const ulids = uniqueTrimmedStrings(Array.isArray(alloc?.ulids) ? alloc.ulids : Array.isArray(alloc?.coveredUlids) ? alloc.coveredUlids : []);
      if (ulids.length && !ulids.includes(id)) return null;
    }
    return plan;
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
    grossAmount: 0,
    currency: "",
    maxPublishedLocations: 0,
    maxConcurrentPromoQrCampaignsPerLocation: 0,
    activeDurationDays: 0,
    planMode: "managed_presence",
    planExpiresAt: "",
    reason
  }), "empty");
  const id = String(ulid || "").trim();
  if (!ULID_RE.test(id)) return empty("invalid_ulid");
  const ownership = await env.KV_STATUS.get(`ownership:${id}`, { type: "json" });
  const exclusiveUntilIso = String(ownership?.exclusiveUntil || "").trim();
  const exclusiveUntil = exclusiveUntilIso ? new Date(exclusiveUntilIso) : null;
  const statusRaw = await env.KV_STATUS.get(statusKey(id), { type: "json" });
  const suppressedState = String(statusRaw?.status || statusRaw?.state || "").trim().toLowerCase();
  const lpmNotSuppressed = statusRaw?.suppressed !== true && statusRaw?.isSuppressed !== true && suppressedState !== "suppressed";
  if (!exclusiveUntil || Number.isNaN(exclusiveUntil.getTime())) {
    return { ...empty("no_active_plan"), lpmNotSuppressed };
  }
  if (exclusiveUntil.getTime() <= nowMs) {
    return {
      ...empty("public_record_mode"),
      lpmNotSuppressed,
      exclusiveUntil: exclusiveUntil.toISOString(),
      paymentIntentId: String(ownership?.lastEventId || "").trim()
    };
  }
  const paymentIntentId = String(ownership?.lastEventId || "").trim();
  if (!paymentIntentId || !/^pi_/i.test(paymentIntentId)) {
    return {
      ...empty("missing_plan_payment_intent"),
      lpmNotSuppressed,
      exclusiveUntil: exclusiveUntil.toISOString(),
      paymentIntentId
    };
  }
  const plan = await currentPlanForUlid(env, id, nowMs);
  if (!plan) {
    return {
      ...empty("plan_record_missing_or_inactive"),
      lpmNotSuppressed,
      exclusiveUntil: exclusiveUntil.toISOString(),
      paymentIntentId
    };
  }
  return {
    planEntitled: true,
    activePaidPlan: true,
    publicRecordMode: false,
    externallyIndexable: lpmNotSuppressed,
    lpmNotSuppressed,
    ownedNow: true,
    visibilityState: "promoted",
    exclusiveUntil: exclusiveUntil.toISOString(),
    courtesyUntil: "",
    paymentIntentId,
    priceId: plan.priceId,
    tier: plan.tier,
    grossAmount: plan.grossAmount,
    currency: plan.currency,
    maxPublishedLocations: plan.maxPublishedLocations,
    maxConcurrentPromoQrCampaignsPerLocation: plan.maxConcurrentPromoQrCampaignsPerLocation,
    activeDurationDays: plan.activeDurationDays,
    planMode: plan.planMode,
    planExpiresAt: plan.expiresAt,
    reason: "active_plan"
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
  const planMode = normalizePlanMode(draft?.planMode, campaignPreset);
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
      planMode,
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
      draft: { ...draft, planMode },
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
      const fastPlanMode = normalizePlanMode(fast?.planMode, fast?.campaignPreset);
      if (entitled && fastPlanMode === "campaign_with_promo_qr" && campaignKey2 && /^\d{4}-\d{2}-\d{2}$/.test(endDate2)) {
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
    const rowPlanMode = normalizePlanMode(row?.planMode, row?.campaignPreset);
    if (rowPlanMode !== "campaign_with_promo_qr") continue;
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

// .wrangler/tmp/bundle-L2zxPy/middleware-insertion-facade.js
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

// .wrangler/tmp/bundle-L2zxPy/middleware-loader.entry.ts
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
  MediaTargetDO,
  PlanAllocDO,
  SearchShardDO,
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
