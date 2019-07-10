
/**
 * Class to tokenize a WKT string.
 */
var Lexer = function Lexer(wkt) {

  /**
   * @type {string}
   */
  this.wkt = wkt;

  /**
   * @type {number}
   * @private
   */
  this.index_ = -1;
};

/**
 * @param {string} c Character.
 * @return {boolean} Whether the character is alphabetic.
 * @private
 */
Lexer.prototype.isAlpha_ = function isAlpha_(c) {
  return c >= 'a' && c <= 'z' || c >= 'A' && c <= 'Z';
};

/**
 * @param {string} c Character.
 * @param {boolean=} opt_decimal Whether the string number
 *   contains a dot, i.e. is a decimal number.
 * @return {boolean} Whether the character is numeric.
 * @private
 */
Lexer.prototype.isNumeric_ = function isNumeric_(c, opt_decimal) {
  var decimal = opt_decimal !== undefined ? opt_decimal : false;
  return c >= '0' && c <= '9' || c == '.' && !decimal;
};

/**
 * @param {string} c Character.
 * @return {boolean} Whether the character is whitespace.
 * @private
 */
Lexer.prototype.isWhiteSpace_ = function isWhiteSpace_(c) {
  return c == ' ' || c == '\t' || c == '\r' || c == '\n';
};

/**
 * @return {string} Next string character.
 * @private
 */
Lexer.prototype.nextChar_ = function nextChar_() {
  return this.wkt.charAt(++this.index_);
};

/**
 * Fetch and return the next token.
 * @return {!Token} Next string token.
 */
Lexer.prototype.nextToken = function nextToken() {
  var c = this.nextChar_();
  var position = this.index_;
  /** @type {number|string} */
  var value = c;
  var type;

  if (c == '(') {
    type = 2;
  } else if (c == ',') {
    type = 5;
  } else if (c == ')') {
    type = 3;
  } else if (this.isNumeric_(c) || c == '-') {
    type = 4;
    value = this.readNumber_();
  } else if (this.isAlpha_(c)) {
    type = 1;
    value = this.readText_();
  } else if (this.isWhiteSpace_(c)) {
    return this.nextToken();
  } else if (c === '') {
    type = 6;
  } else {
    throw new Error('Unexpected character: ' + c);
  }

  return { position: position, value: value, type: type };
};

/**
 * @return {number} Numeric token value.
 * @private
 */
Lexer.prototype.readNumber_ = function readNumber_() {
  var c;
  var index = this.index_;
  var decimal = false;
  var scientificNotation = false;
  do {
    if (c == '.') {
      decimal = true;
    } else if (c == 'e' || c == 'E') {
      scientificNotation = true;
    }
    c = this.nextChar_();
  } while (
    this.isNumeric_(c, decimal) ||
    // if we haven't detected a scientific number before, 'e' or 'E'
    // hint that we should continue to read
    !scientificNotation && (c == 'e' || c == 'E') ||
    // once we know that we have a scientific number, both '-' and '+'
    // are allowed
    scientificNotation && (c == '-' || c == '+')
  );
  return parseFloat(this.wkt.substring(index, this.index_--));
};

/**
 * @return {string} String token value.
 * @private
 */
Lexer.prototype.readText_ = function readText_() {
  var c;
  var index = this.index_;
  do {
    c = this.nextChar_();
  } while (this.isAlpha_(c));
  return this.wkt.substring(index, this.index_--).toUpperCase();
};

export default Lexer
