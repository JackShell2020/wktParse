import Lexer from './lexer.js'
import Parser from './parser.js'

export default function(wkt) {
  var lexer = new Lexer(wkt);
  var parser = new Parser(lexer);
  return parser.parse();
}