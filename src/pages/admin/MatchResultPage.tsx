import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
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
import { GradientBorder } from '../../components/GradientBorder';
import { Button } from '../../components/ui/button';
import { cn } from '@/lib/utils';

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

const playerSelectClass =
  'border-none bg-transparent p-0 text-xs font-medium text-muted-foreground uppercase outline-none';
const scoreInputClass =
  'w-8 border-none bg-transparent p-0 text-center text-2xl font-bold text-foreground outline-none';

export default function MatchResultPage() {
  const { matchId } = useParams();
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [match, setMatch] = useState<MatchDetailResponse | null>(null);
  const [category, setCategory] = useState<CategoryResponse | null>(null);
  const [homeTeam, setHomeTeam] = useState<TeamResponse | null>(null);
  const [awayTeam, setAwayTeam] = useState<TeamResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [subMatches, setSubMatches] = useState<SubMatchForm[]>([]);
  const [resultType, setResultType] = useState<MatchResultType>('WIN_HOME');
  const [submitting, setSubmitting] = useState(false);

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
    setSubMatches(Array.from({ length: category.subMatchesCount }, emptySubMatch));
    setResultType('WIN_HOME');
  }

  const isSingle = category?.subMatchesCount === 1;
  const singleResult = isSingle && subMatches[0] ? determineSingleResult(subMatches[0].sets) : null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const parsed: SubMatchRequest[] = [];
    let finalResultType: MatchResultType;

    if (isSingle) {
      const sm = subMatches[0];
      if (sm.homePlayer1Id === '' || sm.homePlayer2Id === '' || sm.awayPlayer1Id === '' || sm.awayPlayer2Id === '') {
        toast.error('Seleziona tutti i giocatori.');
        return;
      }
      const determined = determineSingleResult(sm.sets);
      if (!determined.resultType) {
        toast.error(determined.error ?? 'Risultato non valido.');
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
          toast.error('Seleziona tutti i giocatori per ogni sotto-partita.');
          return;
        }
        const active = activeSets(sm.sets);
        if (active.length === 0) {
          toast.error('Inserisci almeno un set per ogni sotto-partita.');
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
      toast.success('Risultato salvato.');
    } catch (err) {
      toast.error(adminErrorMessage(err, onUnauthorized));
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError) {
    return <div className="py-12 text-center text-destructive">Errore: {loadError}</div>;
  }
  if (!match || !category) {
    return <div className="py-12 text-center text-muted-foreground">Caricamento...</div>;
  }

  if (match.homeTeamId === null || match.awayTeamId === null || !homeTeam || !awayTeam) {
    return (
      <div className="flex flex-col gap-4">
        <Button type="button" variant="link" className="h-auto self-start px-0" onClick={() => navigate(-1)}>
          ← Torna indietro
        </Button>
        <p className="py-12 text-center text-muted-foreground">
          Questo match del tabellone non è ancora giocabile: una delle due squadre non è stata determinata
          (in attesa del risultato di un turno precedente).
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Button type="button" variant="link" className="h-auto self-start px-0" onClick={() => navigate(-1)}>
        ← Torna indietro
      </Button>
      <h2 className="text-center text-xl font-semibold">
        {teamLabel(match.homeTeamName)} <span className="text-sm text-muted-foreground">vs</span>{' '}
        {teamLabel(match.awayTeamName)}
      </h2>
      {match.status === 'PLAYED' && (
        <p className="text-center text-muted-foreground">Risultato attuale: {resultTypeLabel(match.resultType)}</p>
      )}

      <form className="flex flex-col items-start gap-4" onSubmit={handleSubmit}>
        {subMatches.map((sm, subIndex) => (
          <div key={subIndex} className="flex w-full flex-col gap-2.5">
            {!isSingle && (
              <div className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                Sotto-partita {subIndex + 1}
              </div>
            )}
            <GradientBorder className="rounded-2xl">
              <div className="overflow-hidden rounded-2xl bg-card text-card-foreground">
                <div className="flex flex-wrap items-center justify-between gap-4 px-4.5 py-3.5">
                  <div className="flex min-w-0 items-center gap-4">
                    <span className="truncate text-sm font-bold uppercase">{match.homeTeamName}</span>
                    <div className="flex flex-col gap-0.5">
                      <select
                        className={playerSelectClass}
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
                        className={playerSelectClass}
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
                  <div className="flex shrink-0 gap-5">
                    {sm.sets.map((set, setIndex) => (
                      <input
                        key={setIndex}
                        className={scoreInputClass}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={set.homeGames}
                        onChange={(e) => updateSet(subIndex, setIndex, { homeGames: sanitizeGames(e.target.value) })}
                      />
                    ))}
                  </div>
                </div>

                <div className="h-px bg-border" />

                <div className="flex flex-wrap items-center justify-between gap-4 px-4.5 py-3.5">
                  <div className="flex min-w-0 items-center gap-4">
                    <span className="truncate text-sm font-bold uppercase">{match.awayTeamName}</span>
                    <div className="flex flex-col gap-0.5">
                      <select
                        className={playerSelectClass}
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
                        className={playerSelectClass}
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
                  <div className="flex shrink-0 gap-5">
                    {sm.sets.map((set, setIndex) => (
                      <input
                        key={setIndex}
                        className={scoreInputClass}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={set.awayGames}
                        onChange={(e) => updateSet(subIndex, setIndex, { awayGames: sanitizeGames(e.target.value) })}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </GradientBorder>
          </div>
        ))}

        {isSingle ? (
          <p className={cn('text-sm', singleResult?.resultType ? 'font-medium text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground')}>
            {singleResult?.resultType
              ? `Esito: ${resultTypeLabel(singleResult.resultType)} (${
                  singleResult.resultType === 'WIN_HOME' || singleResult.resultType === 'WIN_AWAY' ? '3' : '2'
                } punti)`
              : (singleResult?.error ?? 'Inserisci i punteggi dei set.')}
          </p>
        ) : (
          <GradientBorder className="w-full">
            <fieldset className="w-full rounded-xl bg-card p-4 text-card-foreground">
              <legend className="px-1 text-sm font-medium">Esito finale</legend>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="resultType"
                    className="accent-primary"
                    checked={resultType === 'WIN_HOME'}
                    onChange={() => setResultType('WIN_HOME')}
                  />
                  Vittoria {match.homeTeamName}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="resultType"
                    className="accent-primary"
                    checked={resultType === 'WIN_HOME_TB'}
                    onChange={() => setResultType('WIN_HOME_TB')}
                  />
                  Vittoria {match.homeTeamName} al tie-break
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="resultType"
                    className="accent-primary"
                    checked={resultType === 'WIN_AWAY'}
                    onChange={() => setResultType('WIN_AWAY')}
                  />
                  Vittoria {match.awayTeamName}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="resultType"
                    className="accent-primary"
                    checked={resultType === 'WIN_AWAY_TB'}
                    onChange={() => setResultType('WIN_AWAY_TB')}
                  />
                  Vittoria {match.awayTeamName} al tie-break
                </label>
              </div>
            </fieldset>
          </GradientBorder>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={submitting}>
            {match.status === 'PLAYED' ? 'Aggiorna risultato' : 'Salva risultato'}
          </Button>
          <Button type="button" variant="destructive" disabled={submitting} onClick={handleResetResult}>
            Reset risultato
          </Button>
        </div>
      </form>

      {match.suggestedWinner && (
        <p className="text-sm text-muted-foreground">
          Esito suggerito dal conteggio sotto-partite:{' '}
          {match.suggestedWinner === 'PARITA' ? 'Parità' : match.suggestedWinner === 'HOME' ? match.homeTeamName : match.awayTeamName}
        </p>
      )}
      <Button variant="link" className="h-auto self-start px-0" asChild>
        <Link to={`/admin/categorie/${category.id}`}>← Torna alla categoria</Link>
      </Button>
    </div>
  );
}
