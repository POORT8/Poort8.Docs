import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const indexHtml = await readFile(
  new URL('../index.html', import.meta.url),
  'utf8',
);

function loadCodeRenderer() {
  const match = indexHtml.match(
    /code: (function\(token\) \{[\s\S]*?\r?\n          \})\r?\n        \}/,
  );

  assert.ok(match, 'Docsify code renderer must use the v5 token signature');
  const mermaidCalls = [];
  const context = vm.createContext({
    mermaid: {
      render(id, text) {
        mermaidCalls.push({ id, text });
        return `<svg>${text}</svg>`;
      },
    },
    num: 0,
  });

  return {
    mermaidCalls,
    renderCode: vm.runInContext(`(${match[1]})`, context),
  };
}

test('loads the pinned Docsify v5 core assets', () => {
  assert.match(
    indexHtml,
    /https:\/\/cdn\.jsdelivr\.net\/npm\/docsify@5\.0\.0\/dist\/themes\/core\.min\.css/,
  );
  assert.match(
    indexHtml,
    /https:\/\/cdn\.jsdelivr\.net\/npm\/docsify@5\.0\.0\/dist\/docsify\.min\.js/,
  );
  assert.doesNotMatch(indexHtml, /docsify@4/);
  assert.match(
    indexHtml,
    /https:\/\/cdn\.jsdelivr\.net\/npm\/mermaid@9\.3\.0\/dist\/mermaid\.min\.js/,
  );
  assert.doesNotMatch(indexHtml, /mermaid\.min\.css/);
});

test('uses v5 defaults for optional behavior', () => {
  assert.match(indexHtml, /<body>/);
  assert.doesNotMatch(indexHtml, /sidebar-chevron/);
  assert.doesNotMatch(indexHtml, /core-dark\.min\.css/);
  assert.doesNotMatch(indexHtml, /addons\/vue\.min\.css/);
  assert.doesNotMatch(indexHtml, /\bauto2top:/);
  assert.doesNotMatch(indexHtml, /\bsubMaxLevel:/);
  assert.doesNotMatch(indexHtml, /\brepo:/);
});

test('preserves required navigation behavior', () => {
  assert.match(indexHtml, /name: 'Poort8 Docs'/);
  assert.match(indexHtml, /loadSidebar: true/);
  assert.match(indexHtml, /relativePath: true/);
  assert.match(
    indexHtml,
    /if \(!document\.querySelector\('likec4-view'\)\) return;/,
  );
});

test('renders Mermaid and LikeC4 tokens with the Docsify v5 API', () => {
  const { mermaidCalls, renderCode } = loadCodeRenderer();
  const context = {
    origin: {
      code: token => `fallback:${token.text}`,
    },
  };

  assert.equal(
    renderCode.call(context, { text: 'flowchart LR; A-->B', lang: 'mermaid' }),
    '<div class="mermaid"><svg>flowchart LR; A-->B</svg></div>',
  );
  assert.deepEqual(mermaidCalls, [
    { id: 'mermaid-svg-0', text: 'flowchart LR; A-->B' },
  ]);
  assert.equal(
    renderCode.call(context, {
      text: '// view: overview\nview overview {}',
      lang: 'likec4',
    }),
    '<likec4-view class="likec4-embed" view-id="overview" dynamic-variant="sequence"></likec4-view>',
  );
  assert.equal(
    renderCode.call(context, { text: 'const answer = 42;', lang: 'js' }),
    'fallback:const answer = 42;',
  );
});
