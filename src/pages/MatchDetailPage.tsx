import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiGet } from '../api/client';
import type { MatchDetailResponse, PlayerResponse } from '../api/types';
import { resultTypeLabel, teamLabel } from '../lib/format';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';

function pairLabel(p1: PlayerResponse | null, p2: PlayerResponse | null): string {
  const names = [p1?.name, p2?.name].filter(Boolean);
  return names.length > 0 ? names.join(' / ') : '—';
}

export default function MatchDetailPage() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState<MatchDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setMatch(null);
    setError(null);
    apiGet<MatchDetailResponse>(`/api/public/matches/${matchId}`)
      .then((data) => {
        if (!cancelled) setMatch(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [matchId]);

  if (error) {
    return <div className="py-12 text-center text-destructive">Errore nel caricamento: {error}</div>;
  }
  if (!match) {
    return <div className="py-12 text-center text-muted-foreground">Caricamento...</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <Button type="button" variant="link" className="self-start px-0" onClick={() => navigate(-1)}>
        ← Torna indietro
      </Button>

      <h2 className="text-center text-xl font-semibold">
        {teamLabel(match.homeTeamName)} <span className="text-sm text-muted-foreground">vs</span>{' '}
        {teamLabel(match.awayTeamName)}
      </h2>
      {match.status === 'PLAYED' && (
        <p className="text-center text-muted-foreground">{resultTypeLabel(match.resultType)}</p>
      )}

      {match.subMatches.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">Nessun risultato inserito.</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">#</TableHead>
              <TableHead>Coppia casa</TableHead>
              <TableHead>Coppia ospite</TableHead>
              <TableHead>Set</TableHead>
              <TableHead className="text-center">Esito</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {match.subMatches.map((sub) => (
              <TableRow key={sub.id}>
                <TableCell className="text-center">{sub.ordine}</TableCell>
                <TableCell>{pairLabel(sub.homePlayer1, sub.homePlayer2)}</TableCell>
                <TableCell>{pairLabel(sub.awayPlayer1, sub.awayPlayer2)}</TableCell>
                <TableCell>{sub.sets.map((s) => `${s.homeGames}-${s.awayGames}`).join(', ')}</TableCell>
                <TableCell className="text-center">
                  {sub.setsWonBy === 'PARITA' ? 'Parità' : sub.setsWonBy === 'HOME' ? 'Casa' : 'Ospite'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
