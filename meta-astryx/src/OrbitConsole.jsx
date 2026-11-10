import { useState } from 'react';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Tab, TabList } from '@astryxdesign/core/TabList';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Theme } from '@astryxdesign/core/theme';
import { ChevronRight, Crosshair, Orbit, Radio, Satellite, ScanLine, SlidersHorizontal } from 'lucide-react';

const missions = [
  { id: 'ORB-01', name: 'Polaris', goal: '地表観測', status: '観測中', tone: 'green', symbol: Satellite, altitude: '550 km', station: 'つくば', detail: '沿岸部の雲量と地表の変化を観測しています。取得した画像は次の地上局通過時に送信します。' },
  { id: 'ORB-02', name: 'Lumen', goal: '信号中継', status: '待機中', tone: 'neutral', symbol: Radio, altitude: '620 km', station: '沖縄', detail: '次の地上局との交信に備え、信号中継システムを待機させています。' },
  { id: 'ORB-03', name: 'Meridian', goal: '軌道調整', status: '要確認', tone: 'orange', symbol: ScanLine, altitude: '480 km', station: '内之浦', detail: '予定の軌道からずれが検出されました。次の通過までに調整値を確認します。' },
];

const activity = [
  { time: '09:42', mission: 'Polaris', text: '地表観測を開始' },
  { time: '09:18', mission: 'Meridian', text: '軌道のずれを検出' },
  { time: '08:56', mission: 'Lumen', text: '待機モードに切り替え' },
];

function OrbitDiagram() {
  return (
    <svg className="orbit-diagram" viewBox="0 0 720 570" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <pattern id="orbit-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="currentColor" opacity=".27" />
        </pattern>
        <linearGradient id="orbit-arc" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#fff" stopOpacity=".9" />
          <stop offset="1" stopColor="#254bd0" stopOpacity=".32" />
        </linearGradient>
      </defs>
      <rect width="720" height="570" fill="url(#orbit-grid)" />
      <g fill="none" stroke="url(#orbit-arc)">
        <ellipse cx="353" cy="285" rx="322" ry="157" transform="rotate(-35 353 285)" />
        <ellipse cx="353" cy="285" rx="350" ry="190" transform="rotate(-35 353 285)" />
        <ellipse cx="353" cy="285" rx="384" ry="225" transform="rotate(-35 353 285)" />
        <path d="M0 285h720M353 0v570" strokeDasharray="5 7" opacity=".75" />
      </g>
      <g fill="#294bd5">
        <circle cx="596" cy="88" r="5" />
        <circle cx="119" cy="474" r="5" />
        <circle cx="596" cy="88" r="10" fill="none" stroke="#294bd5" opacity=".5" />
      </g>
    </svg>
  );
}

export default function OrbitConsole({ theme, mode }) {
  const [tab, setTab] = useState('missions');
  const [query, setQuery] = useState('');
  const [mission, setMission] = useState(null);
  const search = query.trim().toLowerCase();
  const results = missions.filter(({ id, name, goal, status }) =>
    [id, name, goal, status].some((text) => text.toLowerCase().includes(search)),
  );
  const closeDetails = () => setMission(null);

  return (
    <figure className="orbit-stage" id="orbit-demo" tabIndex={-1} aria-label="衛星管制の操作デモ">
      <OrbitDiagram />
      <div className="stage-label" aria-hidden="true"><Crosshair size={15} /> ORBIT / 01</div>
      <div className="console-frame">
        <Theme theme={theme} mode={mode}>
          <section className="console" aria-labelledby="console-title">
            <header className="console-chrome">
              <span className="console-brand"><Orbit size={18} aria-hidden="true" /> Orbit</span>
              <span className="console-online"><i /> シミュレーション</span>
            </header>
            <div className="console-body">
              <div className="console-heading">
                <div>
                  <p>地上局ワークスペース</p>
                  <h2 id="console-title" lang="en">Mission control</h2>
                </div>
                <IconButton label="テーマ設定へ" tooltip="テーマ設定へ" size="sm" href="#themes" icon={<Icon icon={SlidersHorizontal} />} />
              </div>
              <TabList value={tab} onChange={setTab} size="sm" role="tablist" hasDivider>
                <Tab value="missions" label="ミッション" panelId="missions-panel" />
                <Tab value="activity" label="通信ログ" panelId="activity-panel" />
              </TabList>
              <div id="missions-panel" role="tabpanel" aria-label="ミッション" hidden={tab !== 'missions'}>
                <div className="mission-search">
                  <TextInput label="ミッションを検索" isLabelHidden type="search" value={query} onChange={setQuery}
                    placeholder="ミッションを検索…" size="sm" width="100%" startIcon="search" hasClear enterKeyHint="search" />
                </div>
                <p className="sr-only" role="status">{results.length} 件のミッション</p>
                {results.length ? (
                  <ul className="mission-list">
                    {results.map((item) => (
                      <li key={item.id}>
                        <button className="mission-row" type="button" onClick={() => setMission(item)}>
                          <span className={`mission-symbol mission-symbol--${item.tone}`}><item.symbol size={17} aria-hidden="true" /></span>
                          <span className="mission-name"><strong>{item.name}</strong><small>{item.id} / {item.goal}</small></span>
                          <Badge variant={item.tone} label={item.status} />
                          <ChevronRight className="mission-arrow" size={15} aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : <p className="mission-empty">該当するミッションはありません。</p>}
              </div>
              <div id="activity-panel" role="tabpanel" aria-label="通信ログ" tabIndex={0} hidden={tab !== 'activity'}>
                <ul className="activity-list">
                  {activity.map(({ time, mission: name, text }) => (
                    <li key={time}>
                      <time>{time}</time>
                      <span><strong>{name}</strong><small>{text}</small></span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
          <Dialog isOpen={mission !== null} onOpenChange={closeDetails} aria-label={mission?.name} width={420}>
            {mission && (
              <>
                <DialogHeader title={mission.name} subtitle={`${mission.id} / ${mission.goal}`} onOpenChange={closeDetails} />
                <div className="mission-detail">
                  <Badge variant={mission.tone} label={mission.status} />
                  <p>{mission.detail}</p>
                  <dl>
                    <div><dt>軌道高度</dt><dd>{mission.altitude}</dd></div>
                    <div><dt>地上局</dt><dd>{mission.station}</dd></div>
                  </dl>
                  <Button label="閉じる" onClick={closeDetails} />
                </div>
              </>
            )}
          </Dialog>
        </Theme>
      </div>
      <figcaption className="stage-caption"><span><i /> 操作できるデモ</span><span lang="en">Fig. 01 / Mission control</span></figcaption>
    </figure>
  );
}
