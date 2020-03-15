import * as BabelParser from '@babel/parser';
import { visit } from 'ast-types';

const plugins = [
  "jsx",
  "typescript",
  "asyncGenerators",
  "bigInt",
  "classProperties",
  "classPrivateProperties",
  "classPrivateMethods",
  ['decorators', { decoratorsBeforeExport: false }],
  "doExpressions",
  "dynamicImport",
  "exportDefaultFrom",
  "exportNamespaceFrom",
  "functionBind",
  "functionSent",
  "importMeta",
  "logicalAssignment",
  "nullishCoalescingOperator",
  "numericSeparator",
  "objectRestSpread",
  "optionalCatchBinding",
  "optionalChaining",
  "partialApplication",
  ["pipelineOperator", { proposal: 'minimal' }],
  "throwExpressions",
  "topLevelAwait",
];

const babelParserOptions = {
	allowImportExportEverywhere: true,
  allowAwaitOutsideFunction: true,
  plugins: plugins as BabelParser.ParserPlugin[],
  decoratorsBeforeExport: true  
}
const VALID_BREADCRUMBS_NODES = {
  ClassMethod: {
    parse: node => {
      return node.key.name;
    }
  },
  ClassDeclaration: {
    parse: node => {
      return node.id.name;
    }
  },
  VariableDeclarator: {
    parse: node => {
      return node.id.name;
    }
  },
  FunctionDeclaration: {
    parse: node => {
      return node.id.name;
    }
  }
}

function extractBreadcrumbsNodes(path): string[] {
  let chain = [];
  (function up(p) {
    chain.push(p);
    if (p.parentPath) {
      up(p.parentPath);
    }
  })(path);
  chain = chain.reduce((res, pathItem) => {
    if (pathItem && Object.keys(VALID_BREADCRUMBS_NODES).includes(pathItem.value.type)) {
      res.push(VALID_BREADCRUMBS_NODES[pathItem.value.type].parse(pathItem.value))
    }
    return res;
  }, []);
  return chain;
}

export function analyzeAST(text: string, line: number) {
  try {
    const ast = BabelParser.parse(text, babelParserOptions);
    let breadcrumbs = [];

    visit(ast, {
      visitNode(path) {
        const { start, end } = path.value.loc;
        if (line >= start.line && line <= end.line) {
          // console.log('\n', path.value);
          breadcrumbs = extractBreadcrumbsNodes(path).reverse();
        }
        this.traverse(path);
      },
    });
    return {
      breadcrumbs
    }
  } catch(err) {
    console.log('Error parsing to ast');
    console.log(err);
    return {};
  }
}