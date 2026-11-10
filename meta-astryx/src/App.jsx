import { useState } from 'react';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { Switch } from '@astryxdesign/core/Switch';
import { Tab, TabList } from '@astryxdesign/core/TabList';
import { Theme } from '@astryxdesign/core/theme';
import { matchaTheme } from '@astryxdesign/theme-matcha/built';
import { neutralTheme } from '@astryxdesign/theme-neutral/built';
import {
  ArrowDown, ArrowRight, ArrowUpRight, AudioLines, BookOpen, Check, CodeXml, Copy,
  GitFork, Moon, Orbit, Palette, RadioTower, SquareTerminal, Sun, Terminal,
} from 'lucide-react';
import OrbitConsole from './OrbitConsole.jsx';

const DOCS = 'https://astryx.atmeta.com/';
const REPO = 'https://github.com/meta/astryx';

const themes = {
  neutral: { label: 'Neutral', value: neutralTheme },
  matcha: { label: 'Matcha', value: matchaTheme },
};

const commands = [
  {
    id: 'components', label: '部品を調べる', command: 'npm run astryx -- component Button',
    heading: '実装前に、使う部品の仕様を読む。',
    description: 'Button の使い方、選べるスタイル、アクセシビリティの注意点を確認できます。',
    output: ['# Button', 'variant   primary | secondary | ghost | destructive', 'size      sm | md | lg'],
  },
  {
    id: 'templates', label: 'ひな型を探す', command: 'npm run astryx -- template --list --type page',
    heading: '目的に合う画面構成を探す。',
    description: '設定画面や検索付きの一覧など、作りたい画面に近いひな型を一覧できます。',
    output: ['Page Templates', '', 'dashboard        Analytics Dashboard', 'table-page       Searchable Table', 'settings-sidebar Settings Panels'],
  },
  {
    id: 'json', label: 'JSON で読む', command: 'npm run astryx -- component Button --json',
    heading: '部品の仕様を、機械で読める形式で受け取る。',
    description: '決まった形の JSON を返すので、エージェントは必要な項目を取り出して使えます。',
    output: ['{', '  "apiVersion": 1,', '  "type": "component.detail",', '  "package": "@astryxdesign/core"', '}'],
  },
];

function Brand() {
  return (
    <a className="brand" href="#top" aria-label="Astryx Lab トップ">
      <img width="34" height="34" src="/mark.svg" alt="" />
      <span>Astryx<span className="brand-lab">Lab</span></span>
    </a>
  );
}

function ThemeStudio({ selected, onTheme, mode, onMode }) {
  const [notifications, setNotifications] = useState(true);

  return (
    <section className="theme-section shell" id="themes" aria-labelledby="themes-title">
      <div className="section-index"><span>02</span> Theme studio</div>
      <div className="studio-layout">
        <div className="studio-text">
          <h2 id="themes-title">テーマで、<br />表情を変える。</h2>
          <p>同じ部品のまま、色や文字、余白をまとめて切り替えられます。ここで選んだテーマは、上のミッション画面にも反映されます。</p>
          <div className="theme-controls">
            <fieldset>
              <legend>カラーテーマ</legend>
              <SegmentedControl label="カラーテーマ" size="md" value={selected} onChange={onTheme}>
                {Object.entries(themes).map(([id, { label }]) => (
                  <SegmentedControlItem key={id} value={id} label={label} icon={<span className={`swatch swatch--${id}`} aria-hidden="true" />} />
                ))}
              </SegmentedControl>
            </fieldset>
            <fieldset>
              <legend>表示モード</legend>
              <SegmentedControl label="表示モード" size="md" value={mode} onChange={onMode}>
                <SegmentedControlItem value="light" label="ライト" icon={<Icon icon={Sun} />} />
                <SegmentedControlItem value="dark" label="ダーク" icon={<Icon icon={Moon} />} />
              </SegmentedControl>
            </fieldset>
          </div>
        </div>
        <div className={`studio-stage studio-stage--${selected}`} data-mode={mode}>
          <div className="studio-grid" aria-hidden="true" />
          <Theme theme={themes[selected].value} mode={mode}>
            <section className="telemetry" aria-labelledby="telemetry-title">
              <header>
                <span className="telemetry-icon"><RadioTower size={21} aria-hidden="true" /></span>
                <div><p>Orbit / 通信設定</p><h3 id="telemetry-title">地上局リンク</h3></div>
                <Badge variant="green" label="接続中" />
              </header>
              <div className="signal">
                <div><span>信号強度</span><strong>84<span>%</span></strong></div>
                <ProgressBar label="信号強度" isLabelHidden value={84} />
              </div>
              <div className="telemetry-setting">
                <Switch label="通信ログの通知" description={notifications ? '新しい通信を通知します' : '通知を停止しています'}
                  value={notifications} onChange={setNotifications} labelPosition="start" labelSpacing="spread" width="100%" />
              </div>
            </section>
          </Theme>
          <span className="studio-caption"><Palette size={14} aria-hidden="true" /> {themes[selected].label} / {mode === 'light' ? 'Light' : 'Dark'}</span>
        </div>
      </div>
    </section>
  );
}

function AgentGuide() {
  const [active, setActive] = useState(commands[0].id);
  const [copyFeedback, setCopyFeedback] = useState(null);
  const example = commands.find(({ id }) => id === active);
  const copyStatus = copyFeedback?.id === active ? copyFeedback.message : '';

  async function copyCommand() {
    try {
      await navigator.clipboard.writeText(example.command);
      setCopyFeedback({ id: example.id, message: 'コピーしました' });
    } catch {
      setCopyFeedback({ id: example.id, message: 'コピーできませんでした。コマンドを選択してコピーしてください。' });
    }
  }

  return (
    <section className="agent-section" id="agents" aria-labelledby="agents-title">
      <div className="shell agent-layout">
        <div className="agent-text">
          <div className="section-index"><span>03</span> Agent workflow</div>
          <h2 id="agents-title">エージェントも、<br />同じ仕様を読む。</h2>
          <p>Astryx の CLI では、プロジェクトに入っている版のコンポーネント仕様や画面のひな型を調べられます。このサイトも、その CLI で部品の使い方を確認して組み立てました。</p>
          <a className="text-link" href={REPO + '#getting-started'}>CLI の導入手順 <ArrowUpRight size={16} aria-hidden="true" /></a>
        </div>
        <div className="agent-workbench">
          <TabList value={active} onChange={(id) => { setActive(id); setCopyFeedback(null); }} role="tablist" size="sm">
            {commands.map(({ id, label }) => <Tab key={id} value={id} label={label} panelId={`command-${id}`} />)}
          </TabList>
          {commands.map(({ id, label }) => (
            <div key={id} id={`command-${id}`} role="tabpanel" aria-label={label} hidden={id !== active}>
              {id === active && (
                <>
                  <div className="command-caption"><h3>{example.heading}</h3><p>{example.description}</p></div>
                  <div className="terminal">
                    <div className="terminal-bar"><span><Terminal size={15} aria-hidden="true" /> Terminal</span><span>meta-astryx</span></div>
                    <div className="terminal-command">
                      <code><span aria-hidden="true">$ </span>{example.command}</code>
                      <IconButton className="copy-button" label="コマンドをコピー" tooltip="コマンドをコピー" onClick={copyCommand}
                        icon={<Icon icon={copyStatus === 'コピーしました' ? Check : Copy} size="sm" />} />
                    </div>
                    <pre aria-label="出力例"><code>{example.output.join('\n')}</code></pre>
                    <div className="terminal-foot"><span>出力例</span><span role="status">{copyStatus}</span></div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function App() {
  const [selected, setSelected] = useState('neutral');
  const [mode, setMode] = useState('light');

  return (
    <>
      <a className="skip-link" href="#main">本文へ移動</a>
      <header className="site-header" id="top">
        <div className="shell header-inner">
          <Brand />
          <nav aria-label="サイト内メニュー">
            <a href="#demo">デモ</a>
            <a href="#themes">テーマ</a>
            <a href="#agents">エージェント</a>
          </nav>
          <Button className="repo-button" href={REPO} label="GitHub" size="sm" variant="secondary" endContent={<Icon icon={ArrowUpRight} />} />
        </div>
      </header>

      <main id="main" tabIndex={-1}>
        <section className="hero shell" id="demo" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="section-index"><span>01</span> Interactive demo</div>
            <h1 id="hero-title" lang="en">Build with<br /><em>Astryx.</em></h1>
            <p className="hero-lead">人とエージェントが、同じ部品でつくる。</p>
            <p className="hero-description">Meta のオープンソースのデザインシステム、Astryx。架空の衛星管制画面で、React コンポーネントとテーマを試せます。</p>
            <div className="hero-actions">
              <Button className="brand-button" href="#orbit-demo" variant="primary" size="lg" label="デモを試す" endContent={<Icon icon={ArrowDown} />} />
              <a className="text-link" href={DOCS}>公式ドキュメント <ArrowUpRight size={16} aria-hidden="true" /></a>
            </div>
          </div>
          <OrbitConsole theme={themes[selected].value} mode={mode} />
        </section>

        <div className="section-rail shell" aria-label="体験できること">
          <a href="#orbit-demo"><Orbit aria-hidden="true" /><span><strong>実際に動く UI</strong><small>検索・タブ・ダイアログ</small></span><ArrowRight className="rail-arrow" aria-hidden="true" /></a>
          <a href="#themes"><AudioLines aria-hidden="true" /><span><strong>切り替えられるテーマ</strong><small>Neutral・Matcha / ライト・ダーク</small></span><ArrowRight className="rail-arrow" aria-hidden="true" /></a>
          <a href="#agents"><SquareTerminal aria-hidden="true" /><span><strong>エージェント向け CLI</strong><small>部品の仕様・ひな型・JSON</small></span><ArrowRight className="rail-arrow" aria-hidden="true" /></a>
        </div>

        <ThemeStudio selected={selected} onTheme={setSelected} mode={mode} onMode={setMode} />
        <AgentGuide />

        <section className="closing shell" aria-labelledby="closing-title">
          <span className="closing-icon" aria-hidden="true"><CodeXml size={28} /></span>
          <div><h2 id="closing-title">自分のプロジェクトで試す。</h2><p>コンポーネント一覧や導入手順は、Astryx の公式サイトへ。</p></div>
          <Button className="brand-button" href={DOCS} label="Astryx 公式サイト" variant="primary" size="lg" endContent={<Icon icon={ArrowUpRight} />} />
        </section>
      </main>

      <footer className="site-footer">
        <div className="shell footer-inner">
          <Brand />
          <p>Astryx を使った非公式のデモサイトです。</p>
          <div className="footer-links">
            <a href={DOCS}><BookOpen size={16} aria-hidden="true" /> ドキュメント</a>
            <a href={REPO}><GitFork size={16} aria-hidden="true" /> GitHub</a>
          </div>
        </div>
      </footer>
    </>
  );
}
