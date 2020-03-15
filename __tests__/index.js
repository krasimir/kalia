const fs = require('fs');
const analyzeAST = require('../out/utils/analyzeAst').default;

function testAnalysis(file, line, expectation) {
  const code = fs.readFileSync(`${__dirname}/../demo/${file}`).toString('utf8');
  console.log(analyzeAST(code, line))
}

testAnalysis('react.ts', 24);