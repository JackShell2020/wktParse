import TokenType from './tokenType.js'
/**
 * Class to parse the tokens from the WKT string.
 */
var Parser = function Parser(lexer) {

  /**
   * @type {Lexer}
   * @private
   */
  this.lexer_ = lexer;

  /**
   * @type {Token}
   * @private
   */
  this.token_;

  /**
   * @type {GeometryLayout}
   * @private
   */
  this.layout_ = 'XY';
};

/**
 * Fetch the next token form the lexer and replace the active token.
 * @private
 */
Parser.prototype.consume_ = function consume_() {
  this.token_ = this.lexer_.nextToken();
};

/**
 * Tests if the given type matches the type of the current token.
 * @param {TokenType} type Token type.
 * @return {boolean} Whether the token matches the given type.
 */
Parser.prototype.isTokenType = function isTokenType(type) {
  var isMatch = this.token_.type == type;
  return isMatch;
};

/**
 * If the given type matches the current token, consume it.
 * @param {TokenType} type Token type.
 * @return {boolean} Whether the token matches the given type.
 */
Parser.prototype.match = function match(type) {
  var isMatch = this.isTokenType(type);
  if (isMatch) {
    this.consume_();
  }
  return isMatch;
};

/**
 * Try to parse the tokens provided by the lexer.
 * @return {import("../geom/Geometry.js").default} The geometry.
 */
Parser.prototype.parse = function parse() {
  this.consume_();
  var geometry = this.parseGeometry_();
  return geometry;
};

/**
 * Try to parse the dimensional info.
 * @return {GeometryLayout} The layout.
 * @private
 */
Parser.prototype.parseGeometryLayout_ = function parseGeometryLayout_() {
  var layout = 'XY';
  var dimToken = this.token_;
  if (this.isTokenType(TokenType.TEXT)) {
    var dimInfo = dimToken.value;
    if (dimInfo === Z) {
      layout = 'XYZ';
    } else if (dimInfo === M) {
      layout = 'XYM';
    } else if (dimInfo === ZM) {
      layout = 'XYZM';
    }
    if (layout !== 'XY') {
      this.consume_();
    }
  }
  return layout;
};

/**
 * @return {!Array<import("../geom/Geometry.js").default>} A collection of geometries.
 * @private
 */
Parser.prototype.parseGeometryCollectionText_ = function parseGeometryCollectionText_() {
  if (this.match(TokenType.LEFT_PAREN)) {
    var geometries = [];
    do {
      geometries.push(this.parseGeometry_());
    } while (this.match(TokenType.COMMA));
    if (this.match(TokenType.RIGHT_PAREN)) {
      return geometries;
    }
  } else if (this.isEmptyGeometry_()) {
    return [];
  }
  throw new Error(this.formatErrorMessage_());
};

/**
 * @return {Array<number>} All values in a point.
 * @private
 */
Parser.prototype.parsePointText_ = function parsePointText_() {
  if (this.match(TokenType.LEFT_PAREN)) {
    var coordinates = this.parsePoint_();
    if (this.match(TokenType.RIGHT_PAREN)) {
      return coordinates;
    }
  } else if (this.isEmptyGeometry_()) {
    return null;
  }
  throw new Error(this.formatErrorMessage_());
};

/**
 * @return {!Array<!Array<number>>} All points in a linestring.
 * @private
 */
Parser.prototype.parseLineStringText_ = function parseLineStringText_() {
  if (this.match(TokenType.LEFT_PAREN)) {
    var coordinates = this.parsePointList_();
    if (this.match(TokenType.RIGHT_PAREN)) {
      return coordinates;
    }
  } else if (this.isEmptyGeometry_()) {
    return [];
  }
  throw new Error(this.formatErrorMessage_());
};

/**
 * @return {!Array<!Array<!Array<number>>>} All points in a polygon.
 * @private
 */
Parser.prototype.parsePolygonText_ = function parsePolygonText_() {
  if (this.match(TokenType.LEFT_PAREN)) {
    var coordinates = this.parseLineStringTextList_();
    if (this.match(TokenType.RIGHT_PAREN)) {
      return coordinates;
    }
  } else if (this.isEmptyGeometry_()) {
    return [];
  }
  throw new Error(this.formatErrorMessage_());
};

/**
 * @return {!Array<!Array<number>>} All points in a multipoint.
 * @private
 */
Parser.prototype.parseMultiPointText_ = function parseMultiPointText_() {
  if (this.match(TokenType.LEFT_PAREN)) {
    var coordinates;
    if (this.token_.type == TokenType.LEFT_PAREN) {
      coordinates = this.parsePointTextList_();
    } else {
      coordinates = this.parsePointList_();
    }
    if (this.match(TokenType.RIGHT_PAREN)) {
      return coordinates;
    }
  } else if (this.isEmptyGeometry_()) {
    return [];
  }
  throw new Error(this.formatErrorMessage_());
};

/**
 * @return {!Array<!Array<!Array<number>>>} All linestring points
 *                                        in a multilinestring.
 * @private
 */
Parser.prototype.parseMultiLineStringText_ = function parseMultiLineStringText_() {
  if (this.match(TokenType.LEFT_PAREN)) {
    var coordinates = this.parseLineStringTextList_();
    if (this.match(TokenType.RIGHT_PAREN)) {
      return coordinates;
    }
  } else if (this.isEmptyGeometry_()) {
    return [];
  }
  throw new Error(this.formatErrorMessage_());
};

/**
 * @return {!Array<!Array<!Array<!Array<number>>>>} All polygon points in a multipolygon.
 * @private
 */
Parser.prototype.parseMultiPolygonText_ = function parseMultiPolygonText_() {
  if (this.match(TokenType.LEFT_PAREN)) {
    var coordinates = this.parsePolygonTextList_();
    if (this.match(TokenType.RIGHT_PAREN)) {
      return coordinates;
    }
  } else if (this.isEmptyGeometry_()) {
    return [];
  }
  throw new Error(this.formatErrorMessage_());
};

/**
 * @return {!Array<number>} A point.
 * @private
 */
Parser.prototype.parsePoint_ = function parsePoint_() {
  var coordinates = [];
  var dimensions = this.layout_.length;
  for (var i = 0; i < dimensions; ++i) {
    var token = this.token_;
    if (this.match(TokenType.NUMBER)) {
      coordinates.push(/** @type {number} */(token.value));
    } else {
      break;
    }
  }
  if (coordinates.length == dimensions) {
    return coordinates;
  }
  throw new Error(this.formatErrorMessage_());
};

/**
 * @return {!Array<!Array<number>>} An array of points.
 * @private
 */
Parser.prototype.parsePointList_ = function parsePointList_() {
  var coordinates = [this.parsePoint_()];
  while (this.match(TokenType.COMMA)) {
    coordinates.push(this.parsePoint_());
  }
  return coordinates;
};

/**
 * @return {!Array<!Array<number>>} An array of points.
 * @private
 */
Parser.prototype.parsePointTextList_ = function parsePointTextList_() {
  var coordinates = [this.parsePointText_()];
  while (this.match(TokenType.COMMA)) {
    coordinates.push(this.parsePointText_());
  }
  return coordinates;
};

/**
 * @return {!Array<!Array<!Array<number>>>} An array of points.
 * @private
 */
Parser.prototype.parseLineStringTextList_ = function parseLineStringTextList_() {
  var coordinates = [this.parseLineStringText_()];
  while (this.match(TokenType.COMMA)) {
    coordinates.push(this.parseLineStringText_());
  }
  return coordinates;
};

/**
 * @return {!Array<!Array<!Array<!Array<number>>>>} An array of points.
 * @private
 */
Parser.prototype.parsePolygonTextList_ = function parsePolygonTextList_() {
  var coordinates = [this.parsePolygonText_()];
  while (this.match(TokenType.COMMA)) {
    coordinates.push(this.parsePolygonText_());
  }
  return coordinates;
};

/**
 * @return {boolean} Whether the token implies an empty geometry.
 * @private
 */
Parser.prototype.isEmptyGeometry_ = function isEmptyGeometry_() {
  var isEmpty = this.isTokenType(TokenType.TEXT) &&
    this.token_.value == EMPTY;
  if (isEmpty) {
    this.consume_();
  }
  return isEmpty;
};

/**
 * Create an error message for an unexpected token error.
 * @return {string} Error message.
 * @private
 */
Parser.prototype.formatErrorMessage_ = function formatErrorMessage_() {
  return 'Unexpected `' + this.token_.value + '` at position ' +
    this.token_.position + ' in `' + this.lexer_.wkt + '`';
};

/**
 * @return {!import("../geom/Geometry.js").default} The geometry.
 * @private
 */
Parser.prototype.parseGeometry_ = function parseGeometry_() {
  var token = this.token_;
  if (this.match(TokenType.TEXT)) {
    var geomType = token.value;
    this.layout_ = this.parseGeometryLayout_();
    if (geomType == 'GEOMETRYCOLLECTION') {
      var geometries = this.parseGeometryCollectionText_();
      return geometries;
    } else {
      var coordinates;
      switch (geomType) {
        case 'POINT': {
          coordinates = this.parsePointText_();
          break;
        }
        case 'LINESTRING': {
          coordinates = this.parseLineStringText_();
          break;
        }
        case 'POLYGON': {
          coordinates = this.parsePolygonText_();
          break;
        }
        case 'MULTIPOINT': {
          coordinates = this.parseMultiPointText_();
          break;
        }
        case 'MULTILINESTRING': {
          coordinates = this.parseMultiLineStringText_();
          break;
        }
        case 'MULTIPOLYGON': {
          coordinates = this.parseMultiPolygonText_();
          break;
        }
        default: {
          throw new Error('WKTParser: Invalid geometry type: ' + geomType);
        }
      }

      if (!coordinates) {
        coordinates = [];
      }
      return {
        coordinates: coordinates,
        geomType: geomType
      }
    }
  }
  throw new Error(this.formatErrorMessage_());
}

export default Parser
