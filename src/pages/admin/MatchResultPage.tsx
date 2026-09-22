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
import { useAuth } from '../../auth/AuthContext';

interface SubMatchForm {
  homePlayer1Id: number | '';
  homePlayer2Id: number | '';
  awayPlayer1Id: number | '';
  awayPlayer2Id: number | '';
  sets: SetScoreRequest[];
}

function emptySubMatch(): SubMatchForm {
  return {
    homePlayer1Id: '',
    homePlayer2Id: '',
    awayPlayer1Id: '',
    awayPlayer2Id: '',
    sets: [{ setNumber: 1, homeGames: 0, awayGames: 0 }],
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
              sets: sm.sets.map((s) => ({ setNumber: s.setNumber, homeGames: s.homeGames, awayGames: s.awayGames })),
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

  function addSet(subIndex: number) {
    setSubMatches((prev) =>
      prev.map((sm, i) =>
        i === subIndex
          ? { ...sm, sets: [...sm.sets, { setNumber: sm.sets.length + 1, homeGames: 0, awayGames: 0 }] }
          : sm,
      ),
    );
  }

  function removeSet(subIndex: number, setIndex: number) {
    setSubMatches((prev) =>
      prev.map((sm, i) =>
        i === subIndex
          ? {
              ...sm,
              sets: sm.sets
                .filter((_, j) => j !== setIndex)
                .map((s, j) => ({ ...s, setNumber: j + 1 })),
            }
          : sm,
      ),
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSavedMessage(null);

    const parsed: SubMatchRequest[] = [];
    for (const sm of subMatches) {
      if (
        sm.homePlayer1Id === '' ||
        sm.homePlayer2Id === '' ||
        sm.awayPlayer1Id === '' ||
        sm.awayPlayer2Id === ''
      ) {
        setError('Seleziona tutti i giocatori per ogni sotto-partita.');
        return;
      }
      parsed.push({
        homePlayer1Id: sm.homePlayer1Id,
        homePlayer2Id: sm.homePlayer2Id,
        awayPlayer1Id: sm.awayPlayer1Id,
        awayPlayer2Id: sm.awayPlayer2Id,
        sets: sm.sets,
      });
    }

    setSubmitting(true);
    try {
      const body: MatchResultRequest = { subMatches: parsed, resultType };
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
          <fieldset key={subIndex} className="admin-card">
            <legend>Sotto-partita {subIndex + 1}</legend>

            <div className="result-form__pairs">
              <div>
                <label>
                  Casa - Giocatore 1
                  <select
                    value={sm.homePlayer1Id}
                    onChange={(e) => updateSubMatch(subIndex, { homePlayer1Id: Number(e.target.value) })}
                    required
                  >
                    <option value="" disabled>
                      Seleziona
                    </option>
                    {homeTeam.players.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Casa - Giocatore 2
                  <select
                    value={sm.homePlayer2Id}
                    onChange={(e) => updateSubMatch(subIndex, { homePlayer2Id: Number(e.target.value) })}
                    required
                  >
                    <option value="" disabled>
                      Seleziona
                    </option>
                    {homeTeam.players.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div>
                <label>
                  Ospite - Giocatore 1
                  <select
                    value={sm.awayPlayer1Id}
                    onChange={(e) => updateSubMatch(subIndex, { awayPlayer1Id: Number(e.target.value) })}
                    required
                  >
                    <option value="" disabled>
                      Seleziona
                    </option>
                    {awayTeam.players.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Ospite - Giocatore 2
                  <select
                    value={sm.awayPlayer2Id}
                    onChange={(e) => updateSubMatch(subIndex, { awayPlayer2Id: Number(e.target.value) })}
                    required
                  >
                    <option value="" disabled>
                      Seleziona
                    </option>
                    {awayTeam.players.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="set-scores">
              {sm.sets.map((set, setIndex) => (
                <div key={setIndex} className="set-scores__row">
                  <span>Set {set.setNumber}</span>
                  <input
                    type="number"
                    min={0}
                    value={set.homeGames}
                    onChange={(e) => updateSet(subIndex, setIndex, { homeGames: Number(e.target.value) })}
                  />
                  <span>-</span>
                  <input
                    type="number"
                    min={0}
                    value={set.awayGames}
                    onChange={(e) => updateSet(subIndex, setIndex, { awayGames: Number(e.target.value) })}
                  />
                  {sm.sets.length > 1 && (
                    <button type="button" className="link-button link-button--danger" onClick={() => removeSet(subIndex, setIndex)}>
                      rimuovi
                    </button>
                  )}
                </div>
              ))}
              <button type="button" className="btn btn--small btn--ghost" onClick={() => addSet(subIndex)}>
                + Aggiungi set
              </button>
            </div>
          </fieldset>
        ))}

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

        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {match.status === 'PLAYED' ? 'Aggiorna risultato' : 'Salva risultato'}
        </button>
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
