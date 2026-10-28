import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

export interface ControlDeclaration {
  file: string; line: number; tag: string; className: string; geometry: string;
}

/** Inspect every shipped TSX control, including JSX behind conditional branches. */
export function auditPillControls() {
  const root = process.cwd();
  const config = ts.readConfigFile('tsconfig.json', ts.sys.readFile);
  const options = ts.parseJsonConfigFileContent(config.config, ts.sys, root).options;
  const visited = new Set<string>();
  const controls: ControlDeclaration[] = [];
  const errors: string[] = [];
  function visit(file: string) {
    if (visited.has(file) || !fs.existsSync(file)) return;
    visited.add(file);
    const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const relative = path.relative(root,file);
    function resolve(name: string) {
      const target = ts.resolveModuleName(name,file,options,ts.sys).resolvedModule?.resolvedFileName;
      if (target?.startsWith(path.join(root,'client')+path.sep)) visit(target);
    }
    function walk(node: ts.Node) {
      if ((ts.isImportDeclaration(node)||ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) resolve(node.moduleSpecifier.text);
      if (ts.isCallExpression(node) && node.expression.kind===ts.SyntaxKind.ImportKeyword && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) resolve(node.arguments[0].text);
      if (ts.isJsxOpeningElement(node)||ts.isJsxSelfClosingElement(node)) {
        const tag=node.tagName.getText(source);
        if (['button','select','Button','SelectTrigger','CollapsibleTrigger'].includes(tag)) {
          const attr=(name:string)=>{const prop=node.attributes.properties.find(p=>ts.isJsxAttribute(p)&&p.name.getText(source)===name) as ts.JsxAttribute|undefined;return prop?.initializer?.getText(source)||'';};
          const cls=attr('className');
          const delegated=node.attributes.properties.some(p=>ts.isJsxAttribute(p)&&p.name.getText(source)==='asChild');
          const protectedFood=relative==='client/src/pages/food-tracker.tsx'&&/"(?:Scan Barcode|Create Custom Food)"/.test(attr('aria-label'));
          const exception=attr('data-control-geometry')||(/"(?:checkbox|switch)"/.test(attr('role'))||cls.includes('settings-toggle')?'native selection control':cls.includes('dock-tab')?'approved dock':protectedFood?'protected food action':'');
          const geometry=exception|| (delegated?'delegated child':['button','select'].includes(tag)?'fc-pill':'shared primitive');
          const line=source.getLineAndCharacterOfPosition(node.getStart(source)).line+1;
          controls.push({file:relative,line,tag,className:cls,geometry});
          if (!exception&&!delegated) {
            if (['button','select'].includes(tag)&&!cls.includes('fc-pill')) errors.push(`${relative}:${line}: native action missing fc-pill`);
            if (/\brounded(?:-(?:none|sm|md|lg|xl|2xl|3xl|\[[^\]]+\]))?(?=\s|["'`]|$)/.test(cls)) errors.push(`${relative}:${line}: conflicting partial-radius utility`);
          }
        }
      }
      ts.forEachChild(node,walk);
    }
    walk(source);
  }
  visit(path.join(root,'client/src/main.tsx'));
  for (const [file,selector] of [['client/index.html','#fitcircle-recover'],['client/public/viewport-test/test.css','button:not(.dock-tab)']]) {
    const text=fs.readFileSync(file,'utf8');
    if (!text.includes(`${selector} {`) || !text.includes('var(--radius-pill,9999px)')) errors.push(`${file}: static recovery/diagnostic action missing pill fallback`);
  }
  return {controls,errors,sourceCount:visited.size};
}
