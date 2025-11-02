import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { NewPostButton } from '@/components/NewPostButton';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, PostFeed } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

type PostComAutor = PostFeed & {
  usuario: {
    nome_exibicao: string | null;
    foto_perfil_url: string | null;
    cargo: string | null;
  };
};

const Feed = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [posts, setPosts] = useState<PostComAutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    loadPosts();
  }, [user, navigate]);

  const loadPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('posts_feed')
      .select(`
        *,
        usuario:usuarios(nome_exibicao, foto_perfil_url, cargo)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Erro ao carregar posts',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      setPosts(data as PostComAutor[]);
    }
    setLoading(false);
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getBadgeColor = (tipo: string) => {
    switch (tipo) {
      case 'noticia': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'postagens': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'aviso': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'atualizacao': return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
  };

  const getBadgeEmoji = (tipo: string) => {
    switch (tipo) {
      case 'aviso': return '⚠️';
      case 'atualizacao': return '🔄';
      case 'postagens': return '👁️‍🗨️';
      case 'noticia': return '👁️‍🗨️'; // Compatibilidade com posts antigos
      default: return '';
    }
  };

  const getBadgeLabel = (tipo: string) => {
    // Normalizar tipo antigo para novo
    if (tipo === 'noticia') return 'Postagens';
    return tipo.charAt(0).toUpperCase() + tipo.slice(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#0A0A0A] pb-20 lg:pb-8">
        <Navbar />
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-white">📰 Feed Oculto</h1>
            </div>

        <div className="space-y-4">
          {posts.map((post) => {
            const isExpanded = expandedPosts[post.id];
            const shouldTruncate = post.conteudo.length > 400;
            const displayContent = isExpanded || !shouldTruncate 
              ? post.conteudo 
              : post.conteudo.slice(0, 400) + '...';

            return (
              <div key={post.id} className="bg-card rounded-lg p-6 border border-border">
                <span className={`inline-block px-3 py-1 rounded-full text-sm ${getBadgeColor(post.tipo)}`}>
                  {getBadgeEmoji(post.tipo)} {getBadgeLabel(post.tipo)}
                </span>

                {post.imagem_url && (
                  <img
                    src={post.imagem_url}
                    alt={post.titulo}
                    className="w-full h-48 object-cover rounded-lg mt-4 max-w-full"
                  />
                )}

                <h2 className="text-2xl font-bold text-foreground mt-4 overflow-hidden text-ellipsis line-clamp-2 break-words">
                  {post.titulo}
                </h2>
                
                <p className="text-muted-foreground mt-2 whitespace-pre-wrap break-words">
                  {displayContent}
                </p>

                {shouldTruncate && (
                  <button
                    onClick={() => setExpandedPosts(prev => ({ ...prev, [post.id]: !isExpanded }))}
                    className="text-purple-500 hover:text-purple-400 text-sm font-medium mt-2 transition-colors underline"
                  >
                    {isExpanded ? 'Ver menos' : 'Ver mais'}
                  </button>
                )}

                <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <img
                      src={post.usuario?.foto_perfil_url || 'https://via.placeholder.com/32'}
                      alt={post.usuario?.nome_exibicao || 'Usuário'}
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <p className="text-foreground">{post.usuario?.nome_exibicao || 'Anônimo'}</p>
                      <p className="text-xs">{post.usuario?.cargo || 'Membro'}</p>
                    </div>
                  </div>
                  <span>{formatarData(post.created_at)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {posts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhuma notícia publicada ainda.</p>
          </div>
        )}
          </div>
        </div>
        <NewPostButton onPostCreated={loadPosts} />
        <BottomNav />
      </div>
    </>
  );
};

export default Feed;
