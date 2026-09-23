import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { MatchResultForm } from '../../components/admin/MatchResultForm';
import { Button } from '../../components/ui/button';

export default function MatchResultPage() {
  const { matchId } = useParams();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [categoryId, setCategoryId] = useState<number | null>(null);

  function onUnauthorized() {
    logout();
    navigate('/admin/login');
  }

  return (
    <div className="flex flex-col gap-4">
      <Button type="button" variant="link" className="h-auto self-start px-0" onClick={() => navigate(-1)}>
        ← Torna indietro
      </Button>

      <MatchResultForm matchId={Number(matchId)} onUnauthorized={onUnauthorized} onCategoryLoaded={setCategoryId} />

      {categoryId !== null && (
        <Button variant="link" className="h-auto self-start px-0" asChild>
          <Link to={`/admin/categorie/${categoryId}`}>← Torna alla categoria</Link>
        </Button>
      )}
    </div>
  );
}
