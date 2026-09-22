import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiGet, apiPost } from '../../api/client';
import type {
  CategoryResponse,
  MatchDetailResponse,
  MatchResultRequest,
  MatchResultType,
  SetScoreRequest,
  SubMatchRequest,
  TeamResponse,
} from '../../api/types';
import { resultTypeLabel, teamLabel } from '../../lib/format';
import { adminErrorMessage } from '../../lib/adminError';
import { activeSets, determineSingleResult, emptySets, padSets } from '../../lib/setScoring';
import { useAuth } from '../../auth/AuthContext';

interface SubMatchForm {
  homePlayer1Id: number | '';
  homePlayer2Id: number | '';
  awayPlayer1Id: number | '';
  awayPlayer2Id: number | '';
  sets: SetScoreRequest[];
}

function sanitizeGames(raw: string): number {
  const digits = raw.replace(/\D/g, '');
  return digits === '' ? 0 : Number(digits);
}

function emptySubMatch(): SubMatchForm {
  return {
    homePlayer1Id: '',
    homePlayer2Id: '',
    awayPlayer1Id: '',
    awayPlayer2Id: '',
    sets: emptySets(),
  };
}

export default function MatchResultPage() {
  const { matchId } = useParams();
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [match, setMatch] = useState<MatchDetailResponse | null>(null);
  const [category, setCategory] = useState<CategoryResponse | null>(null);
  const [homeTeam, setHomeTeam] = useState<TeamResponse | null>(null);
  const [awayTeam, setAwayTeam] = useState<TeamResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [subMatches, setSubMatches] = useState<SubMatchForm[]>([]);
  const [resultType, setResultType] = useState<MatchResultType>('WIN_HOME');
  const [submitting, setSubmitting] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  function onUnauthorized() {
    logout();
    navigate('/admin/login');
  }

  const load = useCallback(() => {
    apiGet<MatchDetailResponse>(`/api/public/matches/${matchId}`)
      .then(async (m) => {
        setMatch(m);
        const cat = await apiGet<CategoryResponse>(`/api/public/categories/${m.categoryId}`);
        setCategory(cat);
        if (m.homeTeamId !== null && m.awayTeamId !== null) {
          const [home, away] = await Promise.all([
            apiGet<TeamResponse>(`/api/public/teams/${m.homeTeamId}`),
            apiGet<TeamResponse>(`/api/public/teams/${m.awayTeamId}`),
          ]);
          setHomeTeam(home);
          setAwayTeam(away);
        }

        if (m.subMatches.length > 0) {
          setSubMatches(
            m.subMatches.map((sm) => ({
              homePlayer1Id: sm.homePlayer1?.id ?? '',
              homePlayer2Id: sm.homePlayer2?.id ?? '',
              awayPlayer1Id: sm.awayPlayer1?.id ?? '',
              awayPlayer2Id: sm.awayPlayer2?.id ?? '',
              sets: padSets(sm.sets.map((s) => ({ setNumber: s.setNumber, homeGames: s.homeGames, awayGames: s.awayGames }))),
            })),
          );
          if (m.resultType) setResultType(m.resultType);
        } else {
          setSubMatches(Array.from({ length: cat.subMatchesCount }, emptySubMatch));
        }
      })
      .catch((err: unknown) => setLoadError(adminErrorMessage(err, onUnauthorized)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  useEffect(() => {
    load();
  }, [load]);

  function updateSubMatch(index: number, patch: Partial<SubMatchForm>) {
    setSubMatches((prev) => prev.map((sm, i) => (i === index ? { ...sm, ...patch } : sm)));
  }

  function updateSet(subIndex: number, setIndex: number, patch: Partial<SetScoreRequest>) {
    setSubMatches((prev) =>
      prev.map((sm, i) =>
        i === subIndex
          ? { ...sm, sets: sm.sets.map((s, j) => (j === setIndex ? { ...s, ...patch } : s)) }
          : sm,
      ),
    );
  }

  function handleResetResult() {
    if (!category) return;
    setError(null);
    setSavedMessage(null);
    setSubMatches(Array.from({ length: category.subMatchesCount }, emptySubMatch));
    setResultType('WIN_HOME');
  }

  const isSingle = category?.subMatchesCount === 1;
  const singleResult = isSingle && subMatches[0] ? determineSingleResult(subMatches[0].sets) : null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSavedMessage(null);

    const parsed: SubMatchRequest[] = [];
    let finalResultType: MatchResultType;

    if (isSingle) {
      const sm = subMatches[0];
      if (sm.homePlayer1Id === '' || sm.homePlayer2Id === '' || sm.awayPlayer1Id === '' || sm.awayPlayer2Id === '') {
        setError('Seleziona tutti i giocatori.');
        return;
      }
      const determined = determineSingleResult(sm.sets);
      if (!determined.resultType) {
        setError(determined.error ?? 'Risultato non valido.');
        return;
      }
      finalResultType = determined.resultType;
      parsed.push({
        homePlayer1Id: sm.homePlayer1Id,
        homePlayer2Id: sm.homePlayer2Id,
        awayPlayer1Id: sm.awayPlayer1Id,
        awayPlayer2Id: sm.awayPlayer2Id,
        sets: determined.usedSets.map((s, i) => ({ setNumber: i + 1, homeGames: s.homeGames, awayGames: s.awayGames })),
      });
    } else {
      finalResultType = resultType;
      for (const sm of subMatches) {
        if (sm.homePlayer1Id === '' || sm.homePlayer2Id === '' || sm.awayPlayer1Id === '' || sm.awayPlayer2Id === '') {
          setError('Seleziona tutti i giocatori per ogni sotto-partita.');
          return;
        }
        const active = activeSets(sm.sets);
        if (active.length === 0) {
          setError('Inserisci almeno un set per ogni sotto-partita.');
          return;
        }
        parsed.push({
          homePlayer1Id: sm.homePlayer1Id,
          homePlayer2Id: sm.homePlayer2Id,
          awayPlayer1Id: sm.awayPlayer1Id,
          awayPlayer2Id: sm.awayPlayer2Id,
          sets: active.map((s, i) => ({ setNumber: i + 1, homeGames: s.homeGames, awayGames: s.awayGames })),
        });
      }
    }

    setSubmitting(true);
    try {
      const body: MatchResultRequest = { subMatches: parsed, resultType: finalResultType };
      const updated = await apiPost<MatchDetailResponse>(`/api/admin/matches/${matchId}/result`, body, token);
      setMatch(updated);
      setSavedMessage('Risultato salvato.');
    } catch (err) {
      setError(adminErrorMessage(err, onUnauthorized));
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError) {
    return <div className="page-message page-message--error">Errore: {loadError}</div>;
  }
  if (!match || !category) {
    return <div className="page-message">Caricamento...</div>;
  }

  if (match.homeTeamId === null || match.awayTeamId === null || !homeTeam || !awayTeam) {
    return (
      <div className="admin-page">
        <button type="button" className="link-button" onClick={() => navigate(-1)}>
          ← Torna indietro
        </button>
        <p className="page-message">
          Questo match del tabellone non è ancora giocabile: una delle due squadre non è stata determinata
          (in attesa del risultato di un turno precedente).
        </p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <button type="button" className="link-button" onClick={() => navigate(-1)}>
        ← Torna indietro
      </button>
      <h2>
        {teamLabel(match.homeTeamName)} <span className="match-row__vs">vs</span> {teamLabel(match.awayTeamName)}
      </h2>
      {match.status === 'PLAYED' && (
        <p className="admin-page__meta">Risultato attuale: {resultTypeLabel(match.resultType)}</p>
      )}

      {error && <p className="form-error">{error}</p>}
      {savedMessage && <p className="form-success">{savedMessage}</p>}

      <form className="result-form" onSubmit={handleSubmit}>
        {subMatches.map((sm, subIndex) => (
          <div key={subIndex} className="match-card">
            {!isSingle && <div className="match-card__title">Sotto-partita {subIndex + 1}</div>}
            <div className="match-card__box">
              <div className="match-card__row">
                <div className="match-card__team-info">
                  <span className="match-card__team-name">{match.homeTeamName}</span>
                  <div className="match-card__players">
                    <select
                      value={sm.homePlayer1Id}
                      onChange={(e) => updateSubMatch(subIndex, { homePlayer1Id: Number(e.target.value) })}
                      required
                    >
                      <option value="" disabled>
                        Giocatore 1
                      </option>
                      {homeTeam.players.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={sm.homePlayer2Id}
                      onChange={(e) => updateSubMatch(subIndex, { homePlayer2Id: Number(e.target.value) })}
                      required
                    >
                      <option value="" disabled>
                        Giocatore 2
                      </option>
                      {homeTeam.players.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="match-card__scores">
                  {sm.sets.map((set, setIndex) => (
                    <input
                      key={setIndex}
                      className="match-card__score-input"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={set.homeGames}
                      onChange={(e) =>
                        updateSet(subIndex, setIndex, { homeGames: sanitizeGames(e.target.value) })
                      }
                    />
                  ))}
                </div>
              </div>

              <div className="match-card__divider" />

              <div className="match-card__row">
                <div className="match-card__team-info">
                  <span className="match-card__team-name">{match.awayTeamName}</span>
                  <div className="match-card__players">
                    <select
                      value={sm.awayPlayer1Id}
                      onChange={(e) => updateSubMatch(subIndex, { awayPlayer1Id: Number(e.target.value) })}
                      required
                    >
                      <option value="" disabled>
                        Giocatore 1
                      </option>
                      {awayTeam.players.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={sm.awayPlayer2Id}
                      onChange={(e) => updateSubMatch(subIndex, { awayPlayer2Id: Number(e.target.value) })}
                      required
                    >
                      <option value="" disabled>
                        Giocatore 2
                      </option>
                      {awayTeam.players.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="match-card__scores">
                  {sm.sets.map((set, setIndex) => (
                    <input
                      key={setIndex}
                      className="match-card__score-input"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={set.awayGames}
                      onChange={(e) =>
                        updateSet(subIndex, setIndex, { awayGames: sanitizeGames(e.target.value) })
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}

        {isSingle ? (
          <p className={singleResult?.resultType ? 'form-success' : 'admin-page__meta'}>
            {singleResult?.resultType
              ? `Esito: ${resultTypeLabel(singleResult.resultType)} (${
                  singleResult.resultType === 'WIN_HOME' || singleResult.resultType === 'WIN_AWAY' ? '3' : '2'
                } punti)`
              : (singleResult?.error ?? 'Inserisci i punteggi dei set.')}
          </p>
        ) : (
          <fieldset className="admin-card">
            <legend>Esito finale</legend>
            <label>
              <input
                type="radio"
                name="resultType"
                checked={resultType === 'WIN_HOME'}
                onChange={() => setResultType('WIN_HOME')}
              />
              Vittoria {match.homeTeamName}
            </label>
            <label>
              <input
                type="radio"
                name="resultType"
                checked={resultType === 'WIN_HOME_TB'}
                onChange={() => setResultType('WIN_HOME_TB')}
              />
              Vittoria {match.homeTeamName} al tie-break
            </label>
            <label>
              <input
                type="radio"
                name="resultType"
                checked={resultType === 'WIN_AWAY'}
                onChange={() => setResultType('WIN_AWAY')}
              />
              Vittoria {match.awayTeamName}
            </label>
            <label>
              <input
                type="radio"
                name="resultType"
                checked={resultType === 'WIN_AWAY_TB'}
                onChange={() => setResultType('WIN_AWAY_TB')}
              />
              Vittoria {match.awayTeamName} al tie-break
            </label>
          </fieldset>
        )}

        <div className="admin-actions">
          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {match.status === 'PLAYED' ? 'Aggiorna risultato' : 'Salva risultato'}
          </button>
          <button type="button" className="btn btn--danger" disabled={submitting} onClick={handleResetResult}>
            Reset risultato
          </button>
        </div>
      </form>

      {match.suggestedWinner && (
        <p className="admin-page__meta">
          Esito suggerito dal conteggio sotto-partite: {match.suggestedWinner === 'PARITA' ? 'Parità' : match.suggestedWinner === 'HOME' ? match.homeTeamName : match.awayTeamName}
        </p>
      )}
      <Link to={`/admin/categorie/${category.id}`} className="link-button">
        ← Torna alla categoria
      </Link>
    </div>
  );
}
