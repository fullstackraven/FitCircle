import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';
import { storageSources, type StorageSource } from '../../client/src/lib/storage-registry';

export interface Access { file: string; line: number; owner: string; mechanism: StorageSource['mechanism']; operation: string; expression: string; keys: string[] }
export interface Boundary { file: string; owner: string; expression: string; operations: string[]; reason: string; count: number }
const unwrap = (n: ts.Expression): ts.Expression => ts.isParenthesizedExpression(n) || ts.isAsExpression(n) || ts.isNonNullExpression(n) ? unwrap(n.expression) : n;
const method = (n: ts.Expression) => ts.isPropertyAccessExpression(n) ? { receiver: n.expression, name: n.name.text } : ts.isElementAccessExpression(n) && ts.isStringLiteral(n.argumentExpression) ? { receiver: n.expression, name: n.argumentExpression.text } : undefined;
const compact = (text: string) => text.replace(/\s+/g, '');

export function discoverStorage(program: ts.Program, files: string[], root: string): { accesses: Access[]; errors: string[] } {
  const checker = program.getTypeChecker();
  const accesses: Access[] = [], errors: string[] = [];
  const alias = (symbol: ts.Symbol | undefined) => symbol && (symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol);
  const assignments = new Map<ts.Symbol, ts.Expression[]>();
  for (const file of files) {
    const source = program.getSourceFile(file); if (!source) continue;
    const visit = (n: ts.Node) => {
      if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
        const symbol = alias(checker.getSymbolAtLocation(n.left));
        if (symbol) assignments.set(symbol, [...assignments.get(symbol) ?? [], n.right]);
      }
      ts.forEachChild(n, visit);
    }; visit(source);
  }
  function initializers(n: ts.Node): ts.Expression[] {
    const symbol = alias(checker.getSymbolAtLocation(ts.isPropertyAccessExpression(n) ? n.name : n));
    if (!symbol) return [];
    const result = [...assignments.get(symbol) ?? []];
    for (const declaration of symbol.declarations ?? []) {
      if ('initializer' in declaration && declaration.initializer) result.push(declaration.initializer as ts.Expression);
      if (ts.isVariableDeclaration(declaration) && ts.isVariableDeclarationList(declaration.parent) && ts.isForOfStatement(declaration.parent.parent)) result.push(declaration.parent.parent.expression);
    }
    return result;
  }
  function values(node: ts.Expression | undefined, depth = 0): string[] {
    if (!node || depth > 16) return ['*'];
    const n = unwrap(node);
    if (ts.isStringLiteralLike(n)) return [n.text];
    const join = (a: string[], b: string[]) => [...new Set(a.flatMap(x => b.map(y => x + y)))].slice(0, 200);
    if (ts.isTemplateExpression(n)) return n.templateSpans.reduce((out, span) => join(join(out, values(span.expression, depth + 1)), [span.literal.text]), [n.head.text]);
    if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.PlusToken) return join(values(n.left, depth + 1), values(n.right, depth + 1));
    if (ts.isConditionalExpression(n)) return [...new Set([...values(n.whenTrue, depth + 1), ...values(n.whenFalse, depth + 1)])];
    if (ts.isArrayLiteralExpression(n)) return n.elements.flatMap(e => values(e as ts.Expression, depth + 1));
    if (ts.isObjectLiteralExpression(n)) return n.properties.flatMap(p => ts.isPropertyAssignment(p) ? values(p.initializer, depth + 1) : ['*']);
    if (ts.isElementAccessExpression(n)) {
      // Finite maps are deliberately over-approximated: every possible stored
      // value must be registered, even if only one branch executes today.
      return values(n.expression, depth + 1);
    }
    const declarations = initializers(n);
    return declarations.length ? [...new Set(declarations.flatMap(value => values(value, depth + 1)))] : ['*'];
  }
  function database(n: ts.Expression, depth = 0): string[] {
    if (depth > 16) return ['*'];
    if (ts.isCallExpression(n)) {
      const m = method(n.expression);
      if (m?.name === 'open') return values(n.arguments[0]);
      if (m?.name === 'transaction') return database(m.receiver, depth + 1);
    }
    if (ts.isPropertyAccessExpression(n) && n.name.text === 'result') return database(n.expression, depth + 1);
    const declarations = initializers(n);
    return declarations.length ? [...new Set(declarations.flatMap(value => database(value, depth + 1)))] : ['*'];
  }
  function storageKind(n: ts.Expression, depth = 0): 'localStorage' | 'sessionStorage' {
    if (depth < 8 && (n.getText().includes('sessionStorage') || initializers(n).some(value => storageKind(value, depth + 1) === 'sessionStorage'))) return 'sessionStorage';
    return 'localStorage';
  }
  function owner(n: ts.Node) {
    for (let p: ts.Node | undefined = n; p; p = p.parent) {
      if (ts.isFunctionDeclaration(p) && p.name) return p.name.text;
      if (ts.isMethodDeclaration(p)) return p.name.getText();
      if ((ts.isArrowFunction(p) || ts.isFunctionExpression(p)) && ts.isVariableDeclaration(p.parent)) return p.parent.name.getText();
    }
    return '<module>';
  }
  for (const file of files) {
    const source = program.getSourceFile(file); if (!source) continue;
    const fileName = path.relative(root, file).split(path.sep).join('/');
    const fail = (n: ts.Node, message: string) => errors.push(`${fileName}:${source.getLineAndCharacterOfPosition(n.getStart()).line + 1}: ${message}`);
    const record = (n: ts.Node, mechanism: Access['mechanism'], operation: string, key: ts.Expression | undefined, keys = values(key)) => accesses.push({ file: fileName, line: source.getLineAndCharacterOfPosition(n.getStart()).line + 1, owner: owner(n), mechanism, operation, expression: key ? compact(key.getText()) : '*', keys });
    const visit = (n: ts.Node) => {
      if (ts.isVariableDeclaration(n) && ts.isObjectBindingPattern(n.name) && n.initializer && checker.typeToString(checker.getTypeAtLocation(n.initializer)) === 'Storage') fail(n, 'Destructured Storage methods require explicit audit support');
      if (ts.isImportDeclaration(n) && ts.isStringLiteral(n.moduleSpecifier) && ['dexie', 'localforage', 'idb', 'idb-keyval'].includes(n.moduleSpecifier.text)) fail(n, 'Unreviewed persistence wrapper; add explicit audit support');
      if ((ts.isPropertyAccessExpression(n) && n.name.text === 'cookie' || ts.isElementAccessExpression(n) && ts.isStringLiteral(n.argumentExpression) && n.argumentExpression.text === 'cookie') && checker.typeToString(checker.getTypeAtLocation(n.expression)) === 'Document') fail(n, 'Unregistered cookie persistence');
      if (ts.isCallExpression(n)) {
        const m = method(n.expression);
        const receiverType = m ? checker.typeToString(checker.getTypeAtLocation(m.receiver)) : '';
        const symbol = alias(checker.getSymbolAtLocation(n.expression));
        if (symbol?.name === 'createStorageHook') record(n, 'localStorage', 'createStorageHook', n.arguments[0]);
        if (m && (receiverType === 'Storage' || ['localStorage', 'sessionStorage', 'window.localStorage', 'window.sessionStorage', 'globalThis.localStorage', 'globalThis.sessionStorage'].includes(m.receiver.getText()))) {
          if (['getItem', 'setItem', 'removeItem'].includes(m.name)) record(n, storageKind(m.receiver), m.name, n.arguments[0]);
          else if (m.name === 'clear') fail(n, 'Unbounded Storage.clear() is not a registered source operation');
          else if (!['key'].includes(m.name)) fail(n, `Unsupported Storage operation: ${m.name}`);
        }
        if (m && (receiverType === 'IDBFactory' || m.receiver.getText() === 'indexedDB') && m.name === 'open') record(n, 'IndexedDB', 'open', n.arguments[0]);
        if (m && ['IDBDatabase', 'IDBTransaction'].includes(receiverType) && ['createObjectStore', 'transaction', 'objectStore', 'deleteObjectStore'].includes(m.name)) {
          const stores = values(n.arguments[0]);
          record(n, 'IndexedDB', m.name, n.arguments[0], database(m.receiver).flatMap(db => stores.map(store => db + '/' + store)));
        }
        if (m && (receiverType === 'CacheStorage' || m.receiver.getText() === 'caches') && m.name === 'open') record(n, 'CacheStorage', 'open', n.arguments[0]);
        if ((m && ['getDirectory', 'getFileHandle', 'getDirectoryHandle', 'deleteDatabase'].includes(m.name)) || n.expression.getText() === 'openDatabase') fail(n, 'Unreviewed filesystem/database persistence API');
      }
      // Named property access can bypass getItem/setItem. Audit it as a key;
      // escaping a storage method (bind/call/destructure) must be reviewed.
      if (ts.isPropertyAccessExpression(n) || ts.isElementAccessExpression(n)) {
        const type = checker.typeToString(checker.getTypeAtLocation(n.expression));
        if (type === 'Storage') {
          const key = ts.isPropertyAccessExpression(n) ? n.name.text : ts.isStringLiteral(n.argumentExpression) ? n.argumentExpression.text : undefined;
          if (key && ['getItem','setItem','removeItem','key','clear'].includes(key)) {
            if (!ts.isCallExpression(n.parent) || n.parent.expression !== n) fail(n, 'Storage method escapes direct call analysis');
          } else if (key !== 'length') record(n, storageKind(n.expression), 'property', ts.isElementAccessExpression(n) ? n.argumentExpression : undefined, key ? [key] : ['*']);
        }
      }
      ts.forEachChild(n, visit);
    }; visit(source);
  }
  return { accesses, errors };
}

export function checkCoverage(accesses: Access[], sources: StorageSource[] = storageSources, boundaries: Boundary[] = []): string[] {
  const errors: string[] = [], uses = new Map<Boundary, number>();
  for (const source of sources) if (!source.reason.trim()) errors.push(`Missing rationale for ${source.key}`);
  for (const access of accesses) {
    const boundary = boundaries.find(b => b.file === access.file && b.owner === access.owner && b.expression === access.expression && b.operations.includes(access.operation));
    if (boundary) { uses.set(boundary, (uses.get(boundary) ?? 0) + 1); continue; }
    for (const key of access.keys) {
      const source = sources.find(s => s.mechanism === access.mechanism && (s.key === key || s.dynamic === key || s.pattern?.test(key) || (access.mechanism === 'IndexedDB' && access.operation === 'open' && s.key.split('/')[0] === key) || (access.mechanism === 'CacheStorage' && s.key === 'fitcircle-pages-*' && key === '__CACHE_NAME__')));
      if (!source) errors.push(`${access.file}:${access.line} ${access.operation}(${access.expression}): unregistered ${access.mechanism} source ${key}`);
    }
  }
  for (const boundary of boundaries) if (!boundary.reason.trim() || uses.get(boundary) !== boundary.count) errors.push(`Review dynamic boundary ${boundary.file}/${boundary.owner}/${boundary.expression}: expected ${boundary.count}, found ${uses.get(boundary) ?? 0}`);
  return errors;
}

export function applicationProgram(root = process.cwd()) {
  const walk = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : /\.(?:[cm]?[jt]s|[jt]sx)$/.test(e.name) ? [path.join(dir, e.name)] : []);
  const inline = new Map<string, string>();
  const walkHTML = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walkHTML(file);
      else if (entry.name.endsWith('.html')) {
        const scripts = [...fs.readFileSync(file, 'utf8').matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
        inline.set(file + '.inline.js', scripts.join('\n'));
      }
    }
  };
  walkHTML(path.join(root, 'client'));
  const files = [...walk(path.join(root, 'client')), ...['scripts/sw-template.js', 'scripts/export-legacy-backup.js'].map(f => path.join(root, f)), ...inline.keys()];
  const config = ts.readConfigFile(path.join(root, 'tsconfig.json'), ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
  const options = { ...parsed.options, allowJs: true, checkJs: false };
  const host = ts.createCompilerHost(options);
  const read = host.readFile.bind(host);
  host.readFile = file => inline.get(file) ?? read(file);
  const program = ts.createProgram(files, options, host);
  return { program, files, root };
}
