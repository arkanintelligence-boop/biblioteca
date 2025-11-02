import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { ImageUpload } from '@/components/ImageUpload';
import { NewPostButton } from '@/components/NewPostButton';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, PostComunidade, Comentario } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Heart, MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

type PostComAutor = PostComunidade & {
  usuario: {
    id: string;
    nome_exibicao: string | null;
    foto_perfil_url: string | null;
    cargo: string | null;
  };
  curtidas: Array<{ usuario_id: string }>;
};

type ComentarioComAutor = Comentario & {
  usuario: {
    nome_exibicao: string | null;
    foto_perfil_url: string | null;
  };
};

const Comunidade = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [posts, setPosts] = useState<PostComAutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [conteudo, setConteudo] = useState('');
  const [imagemUrl, setImagemUrl] = useState<string | null>(null);
  const [comentariosVisiveis, setComentariosVisiveis] = useState<Record<string, boolean>>({});
  const [comentarios, setComentarios] = useState<Record<string, ComentarioComAutor[]>>({});
  const [novoComentario, setNovoComentario] = useState<Record<string, string>>({});
  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

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
      .from('posts_comunidade')
      .select(`
        *,
        usuario:usuarios(id, nome_exibicao, foto_perfil_url, cargo),
        curtidas(usuario_id)
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

  const criarPost = async () => {
    if (!user || !conteudo.trim()) return;

    const { error } = await supabase
      .from('posts_comunidade')
      .insert({
        usuario_id: user.id,
        conteudo: conteudo,
        imagem_url: imagemUrl
      });

    if (error) {
      toast({
        title: 'Erro ao criar post',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({ title: 'Post criado!' });
      setConteudo('');
      setImagemUrl(null);
      loadPosts();
    }
  };

  const toggleCurtida = async (postId: string, jaCurtiu: boolean) => {
    if (!user) return;

    if (jaCurtiu) {
      await supabase
        .from('curtidas')
        .delete()
        .eq('usuario_id', user.id)
        .eq('post_id', postId);
    } else {
      await supabase
        .from('curtidas')
        .insert({ usuario_id: user.id, post_id: postId });
    }
    loadPosts();
  };

  const loadComentarios = async (postId: string) => {
    const { data } = await supabase
      .from('comentarios')
      .select(`
        *,
        usuario:usuarios(nome_exibicao, foto_perfil_url)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (data) {
      setComentarios(prev => ({ ...prev, [postId]: data as ComentarioComAutor[] }));
    }
  };

  const toggleComentarios = (postId: string) => {
    const novoEstado = !comentariosVisiveis[postId];
    setComentariosVisiveis(prev => ({ ...prev, [postId]: novoEstado }));
    
    if (novoEstado && !comentarios[postId]) {
      loadComentarios(postId);
    }
  };

  const adicionarComentario = async (postId: string) => {
    if (!user || !novoComentario[postId]?.trim()) return;

    const { error } = await supabase
      .from('comentarios')
      .insert({
        usuario_id: user.id,
        post_id: postId,
        conteudo: novoComentario[postId]
      });

    if (error) {
      toast({
        title: 'Erro ao comentar',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      setNovoComentario(prev => ({ ...prev, [postId]: '' }));
      loadComentarios(postId);
      loadPosts();
    }
  };

  const tempoAtras = (data: string) => {
    const segundos = Math.floor((new Date().getTime() - new Date(data).getTime()) / 1000);
    if (segundos < 60) return 'agora';
    if (segundos < 3600) return `${Math.floor(segundos / 60)}m`;
    if (segundos < 86400) return `${Math.floor(segundos / 3600)}h`;
    return `${Math.floor(segundos / 86400)}d`;
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
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-6">👥 Comunidade</h1>

            {/* Criar Post */}
            <div className="bg-[#1A1A1A] rounded-lg p-4 sm:p-6 mb-6">
              <div className="flex gap-3 items-start">
                <img
                  src={user?.foto_perfil_url || 'https://via.placeholder.com/40'}
                  alt="Você"
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex-shrink-0"
                />
                
                <div className="flex-1 min-w-0">
                  <textarea 
                    value={conteudo}
                    onChange={e => setConteudo(e.target.value)}
                    placeholder="No que você está pensando?"
                    className="w-full bg-[#0A0A0A] text-white rounded-lg px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={3}
                  />
                  
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-4">
                    <ImageUpload onImageUploaded={setImagemUrl} />
                    
                    <button
                      onClick={criarPost}
                      disabled={!conteudo.trim()}
                      className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                    >
                      Publicar
                    </button>
                  </div>
                </div>
              </div>
            </div>

        {/* Lista de Posts */}
        <div className="space-y-4">
          {posts.map((post) => {
            const jaCurtiu = post.curtidas.some(c => c.usuario_id === user?.id);
            const totalCurtidas = post.curtidas.length;
            
            return (
              <div key={post.id} className="bg-card rounded-lg p-4 border border-border">
                {/* Autor */}
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={post.usuario?.foto_perfil_url || 'https://via.placeholder.com/40'}
                    alt={post.usuario?.nome_exibicao || 'Usuário'}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="font-semibold text-foreground">
                      {post.usuario?.nome_exibicao || 'Anônimo'}
                    </p>
                    <p className="text-sm text-muted-foreground">{tempoAtras(post.created_at)}</p>
                  </div>
                </div>

                {/* Conteúdo */}
                <div className="mb-3">
                  <p className="text-foreground whitespace-pre-wrap break-words">
                    {expandedPosts[post.id] || post.conteudo.length <= 400
                      ? post.conteudo
                      : post.conteudo.slice(0, 400) + '...'}
                  </p>
                  {post.conteudo.length > 400 && (
                    <button
                      onClick={() => setExpandedPosts(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                      className="text-purple-500 hover:text-purple-400 text-sm font-medium mt-2 transition-colors underline"
                    >
                      {expandedPosts[post.id] ? 'Ver menos' : 'Ver mais'}
                    </button>
                  )}
                </div>

                {/* Imagem */}
                {post.imagem_url && (
                  <img
                    src={post.imagem_url}
                    alt="Post"
                    className="w-full rounded-lg mb-3 max-h-96 object-cover max-w-full"
                  />
                )}

                {/* Ações */}
                <div className="flex items-center gap-6 text-muted-foreground border-t border-border pt-3">
                  <button
                    onClick={() => toggleCurtida(post.id, jaCurtiu)}
                    className={`flex items-center gap-2 transition-colors ${
                      jaCurtiu ? 'text-red-500' : 'hover:text-red-400'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${jaCurtiu ? 'fill-current' : ''}`} />
                    <span>{totalCurtidas}</span>
                  </button>
                  <button
                    onClick={() => toggleComentarios(post.id)}
                    className="flex items-center gap-2 hover:text-purple-400 transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>{post.total_comentarios || 0}</span>
                  </button>
                </div>

                {/* Comentários */}
                {comentariosVisiveis[post.id] && (
                  <div className="mt-4 border-t border-border pt-4 space-y-3">
                    {comentarios[post.id]?.map((comentario) => {
                      const isCommentExpanded = expandedComments[comentario.id];
                      const shouldTruncateComment = comentario.conteudo.length > 200;
                      
                      return (
                        <div key={comentario.id} className="flex gap-2">
                          <img
                            src={comentario.usuario?.foto_perfil_url || 'https://via.placeholder.com/32'}
                            alt={comentario.usuario?.nome_exibicao || 'Usuário'}
                            className="w-8 h-8 rounded-full flex-shrink-0"
                          />
                          <div className="flex-1 bg-muted rounded-lg p-2 min-w-0">
                            <p className="text-sm font-semibold text-foreground">
                              {comentario.usuario?.nome_exibicao || 'Anônimo'}
                            </p>
                            <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                              {isCommentExpanded || !shouldTruncateComment
                                ? comentario.conteudo
                                : comentario.conteudo.slice(0, 200) + '...'}
                            </p>
                            {shouldTruncateComment && (
                              <button
                                onClick={() => setExpandedComments(prev => ({ ...prev, [comentario.id]: !prev[comentario.id] }))}
                                className="text-purple-500 hover:text-purple-400 text-xs font-medium mt-1 transition-colors underline"
                              >
                                {isCommentExpanded ? 'Ver menos' : 'Ver mais'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Adicionar Comentário */}
                    <div className="flex gap-2">
                      <img
                        src={user?.foto_perfil_url || 'https://via.placeholder.com/32'}
                        alt="Você"
                        className="w-8 h-8 rounded-full"
                      />
                      <Input
                        placeholder="Escreva um comentário..."
                        className="flex-1"
                        value={novoComentario[post.id] || ''}
                        onChange={(e) =>
                          setNovoComentario(prev => ({ ...prev, [post.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            adicionarComentario(post.id);
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {posts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Seja o primeiro a publicar algo!</p>
          </div>
        )}
          </div>
        </div>
        <NewPostButton />
        <BottomNav />
      </div>
    </>
  );
};

export default Comunidade;
