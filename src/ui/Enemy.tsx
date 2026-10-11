/** Feindkachel und Feind-Großansicht. */
import type { ReactNode } from 'react';
import { enemyDef } from '../engine/data';
import { WUT_AFTER } from '../engine/rules';
import type { EnemyInst } from '../engine/types';
import { displayName, EffectLine, TYPE_LABEL } from './format';
import { Sym, TypeJewel } from './icons';
import { usePress } from './press';

export function EnemyTile({
  enemy,
  isBoss,
  canAttack,
  onTap,
  onLong,
  hitThisTurn,
  spark,
}: {
  enemy: EnemyInst;
  isBoss: boolean;
  canAttack: boolean;
  onTap: () => void;
  onLong: () => void;
  hitThisTurn: boolean;
  spark?: boolean;
}) {
  const def = enemyDef(enemy.id);
  const press = usePress(onTap, onLong);
  const rem = enemy.hp - enemy.dmg;
  const pct = Math.max(0, Math.min(100, (rem / enemy.hp) * 100));
  const wut = enemy.age >= WUT_AFTER;
  return (
    <button
      type="button"
      className={`tile enemy-tile ${isBoss ? 'boss' : ''} ${canAttack ? 'targetable' : ''} ${wut ? 'wut' : ''} ${spark ? 'spark' : ''}`}
      aria-label={`${def.name}, ${rem} von ${enemy.hp} Leben${def.weakness ? `, Schwäche ${TYPE_LABEL[def.weakness]}` : ''}. ${def.abilityText}`}
      data-tut={`enemy:${def.id}`}
      data-enemy={enemy.uid}
      {...press}
    >
      <span className="et-head">
        <span className="et-name" lang="de">{displayName(def.id, def.name)}</span>
        {def.weakness && (
          <span className="et-weak" title={`Schwäche: ${TYPE_LABEL[def.weakness]}`} data-tut={`weakness:${def.id}`}>
            <TypeJewel type={def.weakness} size={18} />
          </span>
        )}
      </span>
      <span className="hpbar" aria-hidden>
        <span className="hpbar-fill" style={{ width: `${pct}%` }} />
        <span className="hpbar-text">
          {rem} / {enemy.hp}
        </span>
      </span>
      <span className="et-foot">
        <EffectLine effects={def.abilities} size={14} className="et-fx" />
        <span className="wut-dots" aria-label={`${Math.min(enemy.age, WUT_AFTER)} von ${WUT_AFTER} Zügen bis Wut`}>
          {[0, 1, 2].map((i) => (
            <span key={i} className={`dot ${enemy.age > i ? 'on' : ''}`} />
          ))}
          {wut && <Sym kind="wut" size={12} />}
        </span>
      </span>
      {hitThisTurn && enemy.act >= 2 && <span className="et-hit" title="In diesem Zug getroffen: keine Regeneration">⚔</span>}
    </button>
  );
}

export function EnemyView({ enemy, isBoss, children }: { enemy: EnemyInst; isBoss: boolean; children?: ReactNode }) {
  const def = enemyDef(enemy.id);
  const rem = enemy.hp - enemy.dmg;
  return (
    <div className="cardview-wrap">
      <div className="cardview enemy-view">
        <div className="cv-frame">
          <div className="cv-top">
            <span className="ev-act">{isBoss ? 'Endgegner' : `Akt ${['', 'I', 'II', 'III'][enemy.act]}`}</span>
            {def.weakness && (
              <span className="ev-weak">
                Schwäche <TypeJewel type={def.weakness} size={22} /> {TYPE_LABEL[def.weakness]}
              </span>
            )}
          </div>
          <div className="cv-art enemy-art" aria-hidden>
            <span>{isBoss ? '☍' : '☠'}</span>
          </div>
          <div className="cv-name">{def.name}</div>
          <div className="cv-fx">
            <span className="ev-hp">
              <Sym kind="life" size={20} color="var(--feind)" /> {rem} / {enemy.hp}
            </span>
          </div>
          <div className="cv-text">
            <p><strong>Jeden Zug:</strong> {def.abilityText}.</p>
            <p><strong>Belohnung:</strong> {def.rewardText}.</p>
            {enemy.act >= 2 && <p><strong>Regeneration 2</strong>, wenn er in diesem Zug keinen Schaden bekam.</p>}
            <p>
              <strong>Wut:</strong> {enemy.age >= WUT_AFTER ? 'aktiv, +1 Schaden.' : `in ${WUT_AFTER - enemy.age + 1} Zügen.`}
            </p>
          </div>
        </div>
      </div>
      {children && <div className="cv-actions">{children}</div>}
    </div>
  );
}
